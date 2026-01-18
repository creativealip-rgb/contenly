import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { user, apiKey, tokenBalance } from '../../db/schema';
import { UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

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
}
