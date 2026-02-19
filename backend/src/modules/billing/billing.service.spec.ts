import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { DrizzleService } from '../../db/drizzle.service';
import { BadRequestException } from '@nestjs/common';

describe('BillingService', () => {
    let service: BillingService;
    let mockDb: any;

    const mockUserId = 'test-user-id';

    beforeEach(async () => {
        mockDb = {
            query: {
                tokenBalance: {
                    findFirst: jest.fn(),
                },
                transaction: {
                    findMany: jest.fn(),
                },
                subscription: {
                    findFirst: jest.fn(),
                },
            },
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            returning: jest.fn(),
            transaction: jest.fn((cb) => cb(mockDb)),
            orderBy: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
        };

        const mockDrizzleService = {
            db: mockDb,
        };

        const mockConfigService = {
            get: jest.fn((key: string) => {
                if (key === 'STRIPE_SECRET_KEY') return null;
                if (key === 'FRONTEND_URL') return 'http://localhost:3000';
                return null;
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                { provide: DrizzleService, useValue: mockDrizzleService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
    });

    describe('getBalance', () => {
        it('should return existing balance', async () => {
            const mockBalance = { userId: mockUserId, balance: 100 };
            mockDb.query.tokenBalance.findFirst.mockResolvedValue(mockBalance);

            const result = await service.getBalance(mockUserId);

            expect(result).toEqual(mockBalance);
        });

        it('should create initial balance if not exists', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue(null);
            mockDb.insert.mockReturnThis();
            mockDb.values.mockReturnThis();
            mockDb.returning.mockResolvedValue([{ userId: mockUserId, balance: 10 }]);

            const result = await service.getBalance(mockUserId);

            expect(result.balance).toBe(10);
        });
    });

    describe('checkBalance', () => {
        it('should return true when balance is sufficient', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue({ balance: 100 });

            const result = await service.checkBalance(mockUserId, 50);

            expect(result).toBe(true);
        });

        it('should return false when balance is insufficient', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue({ balance: 30 });

            const result = await service.checkBalance(mockUserId, 50);

            expect(result).toBe(false);
        });

        it('should return false when no balance exists', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue(null);
            mockDb.insert.mockReturnThis();
            mockDb.values.mockReturnThis();
            mockDb.returning.mockResolvedValue([{ balance: 10 }]);

            const result = await service.checkBalance(mockUserId, 50);

            expect(result).toBe(false);
        });
    });

    describe('deductTokens', () => {
        it('should deduct tokens successfully', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue({ balance: 100 });
            mockDb.update.mockReturnThis();
            mockDb.set.mockReturnThis();
            mockDb.where.mockReturnThis();
            mockDb.insert.mockReturnThis();
            mockDb.values.mockReturnThis();

            await service.deductTokens(mockUserId, 30, 'Test deduction');

            expect(mockDb.transaction).toHaveBeenCalled();
        });

        it('should throw error when balance is insufficient', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue({ balance: 20 });

            await expect(service.deductTokens(mockUserId, 30, 'Test deduction')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('addTokens', () => {
        it('should add tokens to existing balance', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue({ balance: 100 });
            mockDb.update.mockReturnThis();
            mockDb.set.mockReturnThis();
            mockDb.where.mockReturnThis();
            mockDb.insert.mockReturnThis();
            mockDb.values.mockReturnThis();

            await service.addTokens(mockUserId, 50, 'payment-id');

            expect(mockDb.transaction).toHaveBeenCalled();
        });

        it('should create new balance if not exists', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue(null);
            mockDb.insert.mockReturnThis();
            mockDb.values.mockReturnThis();

            await service.addTokens(mockUserId, 50, 'payment-id');

            expect(mockDb.transaction).toHaveBeenCalled();
        });
    });

    describe('getTransactions', () => {
        it('should return paginated transactions', async () => {
            const mockTransactions = [
                { id: '1', userId: mockUserId, tokens: 100 },
                { id: '2', userId: mockUserId, tokens: -50 },
            ];

            mockDb.query.transaction.findMany.mockResolvedValue(mockTransactions);
            mockDb.select.mockReturnThis();
            mockDb.from.mockReturnThis();
            mockDb.where.mockResolvedValue([{ count: 2 }]);

            const result = await service.getTransactions(mockUserId, 1, 20);

            expect(result.data).toEqual(mockTransactions);
            expect(result.meta.total).toBe(2);
        });
    });

    describe('initializeBalance', () => {
        it('should not create balance if already exists', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue({ balance: 100 });

            await service.initializeBalance(mockUserId);

            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        it('should create balance if not exists', async () => {
            mockDb.query.tokenBalance.findFirst.mockResolvedValue(null);
            mockDb.insert.mockReturnThis();
            mockDb.values.mockReturnThis();

            await service.initializeBalance(mockUserId);

            expect(mockDb.insert).toHaveBeenCalled();
        });
    });
});