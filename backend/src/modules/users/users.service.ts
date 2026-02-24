import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { user, apiKey, tokenBalance, subscription } from '../../db/schema';
import { BILLING_TIERS } from '../billing/billing.constants';
import { UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../../auth/auth.config';

@Injectable()
export class UsersService {
  constructor(private drizzle: DrizzleService) { }

  get db() {
    return this.drizzle.db;
  }

  async findById(id: string) {
    const result = await this.db.query.user.findFirst({
      where: eq(user.id, id),
      with: {
        tokenBalance: true,
        subscriptions: {
          where: eq(subscription.status, 'ACTIVE'),
          orderBy: (s, { desc }) => [desc(s.createdAt)],
          limit: 1,
        },
      },
    });
    return result;
  }

  async findByEmail(email: string) {
    const result = await this.db.query.user.findFirst({
      where: eq(user.email, email),
    });
    return result;
  }

  async update(id: string, data: UpdateUserDto) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const [updated] = await this.db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();

    return updated;
  }

  async updatePreferences(id: string, preferences: Record<string, unknown>) {
    const [updated] = await this.db
      .update(user)
      .set({
        preferences,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();

    return updated;
  }

  async getApiKeys(userId: string) {
    const keys = await this.db.query.apiKey.findMany({
      where: eq(apiKey.userId, userId),
      columns: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return keys;
  }

  async createApiKey(userId: string, name: string) {
    const rawKey = `cam_${uuidv4().replace(/-/g, '')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 12);

    await this.db.insert(apiKey).values({
      userId,
      name,
      keyHash,
      keyPrefix,
    });

    // Return the raw key only once
    return { key: rawKey, prefix: keyPrefix };
  }

  async revokeApiKey(userId: string, keyId: string) {
    const key = await this.db.query.apiKey.findFirst({
      where: eq(apiKey.id, keyId),
    });

    if (!key || key.userId !== userId) {
      throw new NotFoundException('API key not found');
    }

    await this.db.delete(apiKey).where(eq(apiKey.id, keyId));
    return { message: 'API key revoked' };
  }

  // ==========================================
  // SUPER ADMIN METHODS
  // ==========================================

  async findAll() {
    console.log('[UsersService] Fetching all users from DB...');
    const users = await this.db.query.user.findMany({
      with: {
        tokenBalance: true,
        subscriptions: {
          where: eq(subscription.status, 'ACTIVE'),
          orderBy: (s, { desc }) => [desc(s.createdAt)],
          limit: 1,
        },
      },
      orderBy: (user, { desc }) => [desc(user.createdAt)],
    });
    console.log(`[UsersService] Found ${users.length} users`);
    return users;
  }

  async createUser(dto: {
    name: string;
    email: string;
    role: string;
    password?: string;
  }) {
    console.log(
      `[UsersService] Creating user: ${dto.email} with role ${dto.role}`,
    );

    // Better Auth admin API to create user
    const result = await auth.api.createUser({
      body: {
        email: dto.email,
        password: dto.password || 'TemporaryPassword123!',
        name: dto.name,
        role: dto.role,
      },
    } as any);

    if (!result) {
      throw new Error('Failed to create user via Better Auth');
    }

    return result;
  }

  async updateRole(id: string, role: string) {
    const [updated] = await this.db
      .update(user)
      .set({
        role: role as any,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();
    return updated;
  }

  async addTokens(userId: string, amount: number) {
    const balance = await this.db.query.tokenBalance.findFirst({
      where: eq(tokenBalance.userId, userId),
    });

    if (!balance) {
      // Create balance if it doesn't exist
      const [newBalance] = await this.db
        .insert(tokenBalance)
        .values({
          userId,
          balance: amount,
        })
        .returning();
      return newBalance;
    }

    const [updated] = await this.db
      .update(tokenBalance)
      .set({
        balance: (balance.balance || 0) + amount,
        updatedAt: new Date(),
      })
      .where(eq(tokenBalance.userId, userId))
      .returning();
    return updated;
  }

  async updateTier(userId: string, plan: 'FREE' | 'PRO' | 'ENTERPRISE') {
    const tierData = BILLING_TIERS[plan];
    if (!tierData) {
      throw new Error(`Invalid plan: ${plan}`);
    }
    const tokens = tierData.monthlyTokens;

    await this.db.transaction(async (tx) => {
      // Deactivate current subscriptions
      await tx
        .update(subscription)
        .set({ status: 'CANCELED', updatedAt: new Date() })
        .where(
          and(
            eq(subscription.userId, userId),
            eq(subscription.status, 'ACTIVE'),
          ),
        );

      // Create new subscription if not FREE
      if (plan !== 'FREE') {
        await tx.insert(subscription).values({
          userId,
          plan,
          status: 'ACTIVE',
          tokensPerMonth: tokens,
          stripeSubscriptionId: `manual_${uuidv4()}`,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
      }

      // Reset tokens
      const existingBalance = await tx.query.tokenBalance.findFirst({
        where: eq(tokenBalance.userId, userId),
      });

      if (existingBalance) {
        await tx
          .update(tokenBalance)
          .set({ balance: tokens, updatedAt: new Date() })
          .where(eq(tokenBalance.userId, userId));
      } else {
        await tx.insert(tokenBalance).values({
          userId,
          balance: tokens,
        });
      }
    });

    return { success: true, plan, tokens };
  }

  async delete(id: string) {
    await this.db.delete(user).where(eq(user.id, id));
    return { message: 'User deleted successfully' };
  }
}
