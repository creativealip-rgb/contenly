import { Injectable, BadRequestException } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { tokenBalance, transaction } from '../../db/schema';

@Injectable()
export class BillingService {
    constructor(private drizzle: DrizzleService) { }

    get db() {
        return this.drizzle.db;
    }

    async initializeBalance(userId: string) {
        // Check if balance already exists
        const existing = await this.db.query.tokenBalance.findFirst({
            where: eq(tokenBalance.userId, userId),
        });

        if (!existing) {
            await this.db.insert(tokenBalance).values({
                userId,
                balance: 10, // Free trial tokens
            });
        }
    }

    async getBalance(userId: string) {
        let balance = await this.db.query.tokenBalance.findFirst({
            where: eq(tokenBalance.userId, userId),
        });

        if (!balance) {
            // Create initial balance
            const [newBalance] = await this.db
                .insert(tokenBalance)
                .values({
                    userId,
                    balance: 10, // Free trial tokens
                })
                .returning();
            balance = newBalance;
        }

        return balance;
    }

    async checkBalance(userId: string, required: number): Promise<boolean> {
        const balance = await this.getBalance(userId);
        return (balance?.balance || 0) >= required;
    }

    async deductTokens(userId: string, amount: number, description: string) {
        const balance = await this.getBalance(userId);

        if ((balance?.balance || 0) < amount) {
            throw new BadRequestException('Insufficient token balance');
        }

        // Use transaction for atomic operation
        await this.db.transaction(async (tx) => {
            await tx
                .update(tokenBalance)
                .set({
                    balance: sql`${tokenBalance.balance} - ${amount}`,
                    totalUsed: sql`${tokenBalance.totalUsed} + ${amount}`,
                    updatedAt: new Date(),
                })
                .where(eq(tokenBalance.userId, userId));

            await tx.insert(transaction).values({
                userId,
                type: 'USAGE',
                amount: 0,
                tokens: -amount,
                status: 'COMPLETED',
                metadata: { description },
            });
        });
    }

    async addTokens(userId: string, amount: number, stripePaymentId?: string) {
        await this.db.transaction(async (tx) => {
            // Upsert token balance
            const existing = await tx.query.tokenBalance.findFirst({
                where: eq(tokenBalance.userId, userId),
            });

            if (existing) {
                await tx
                    .update(tokenBalance)
                    .set({
                        balance: sql`${tokenBalance.balance} + ${amount}`,
                        totalPurchased: sql`${tokenBalance.totalPurchased} + ${amount}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(tokenBalance.userId, userId));
            } else {
                await tx.insert(tokenBalance).values({
                    userId,
                    balance: amount,
                    totalPurchased: amount,
                });
            }

            await tx.insert(transaction).values({
                userId,
                type: 'PURCHASE',
                amount: 0, // To be set with actual price
                tokens: amount,
                stripePaymentId,
                status: 'COMPLETED',
            });
        });
    }

    async getTransactions(userId: string, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const transactions = await this.db.query.transaction.findMany({
            where: eq(transaction.userId, userId),
            orderBy: (t, { desc }) => [desc(t.createdAt)],
            offset,
            limit,
        });

        // Get total count
        const [{ count }] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(transaction)
            .where(eq(transaction.userId, userId));

        return {
            data: transactions,
            meta: {
                total: Number(count),
                page,
                limit,
                totalPages: Math.ceil(Number(count) / limit),
            },
        };
    }

    async getSubscription(userId: string) {
        const { subscription } = await import('../../db/schema');

        return this.db.query.subscription.findFirst({
            where: and(
                eq(subscription.userId, userId),
                eq(subscription.status, 'ACTIVE'),
            ),
            orderBy: (s, { desc }) => [desc(s.createdAt)],
        });
    }
}
