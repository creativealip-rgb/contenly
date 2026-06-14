import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { DrizzleService } from '../../db/drizzle.service';
import { NotFoundException } from '@nestjs/common';

describe('ArticlesService', () => {
    let service: ArticlesService;
    let mockDb: any;

    const mockUserId = 'test-user-id';
    const mockArticleId = 'test-article-id';

    beforeEach(async () => {
        mockDb = {
            query: {
                article: {
                    findMany: jest.fn(),
                    findFirst: jest.fn(),
                },
            },
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            __selectResults: [],
            select: jest.fn(() => {
                const next = mockDb.__selectResults.shift() || { result: [], terminal: 'offset' };
                const builder: any = {
                    from: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    limit: jest.fn(() => next.terminal === 'limit' ? next.result : builder),
                    offset: jest.fn(() => next.terminal === 'offset' ? next.result : builder),
                    where: jest.fn(() => next.terminal === 'where' ? next.result : builder),
                };
                return builder;
            }),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            returning: jest.fn(),
            orderBy: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
        };

        const mockDrizzleService = {
            db: mockDb,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArticlesService,
                { provide: DrizzleService, useValue: mockDrizzleService },
            ],
        }).compile();

        service = module.get<ArticlesService>(ArticlesService);
    });

    describe('findAll', () => {
        it('should return paginated articles', async () => {
            const mockArticles = [
                { id: '1', title: 'Article 1', status: 'DRAFT' },
                { id: '2', title: 'Article 2', status: 'PUBLISHED' },
            ];

            mockDb.__selectResults = [
                { result: mockArticles, terminal: 'offset' },
                { result: [{ count: 2 }], terminal: 'where' },
            ];

            const result = await service.findAll(mockUserId, { page: 1, limit: 20 });

            expect(result.data).toEqual(mockArticles.map((item) => ({ ...item, wpSite: null })));
            expect(result.meta.total).toBe(2);
        });

        it('should filter by status', async () => {
            const mockArticles = [{ id: '1', title: 'Article 1', status: 'DRAFT' }];

            mockDb.__selectResults = [
                { result: mockArticles, terminal: 'offset' },
                { result: [{ count: 1 }], terminal: 'where' },
            ];

            const result = await service.findAll(mockUserId, { status: 'DRAFT' });

            expect(result.data).toEqual(mockArticles.map((item) => ({ ...item, wpSite: null })));
        });
    });

    describe('findById', () => {
        it('should return article when found', async () => {
            const mockArticle = {
                id: mockArticleId,
                userId: mockUserId,
                title: 'Test Article',
            };

            mockDb.__selectResults = [{ result: [mockArticle], terminal: 'limit' }];

            const result = await service.findById(mockUserId, mockArticleId);

            expect(result).toEqual({ ...mockArticle, wpSite: null });
        });

        it('should throw NotFoundException when article not found', async () => {
            mockDb.__selectResults = [{ result: [], terminal: 'limit' }];

            await expect(service.findById(mockUserId, mockArticleId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        it('should create a new article', async () => {
            const createDto = {
                title: 'New Article',
                originalContent: 'Original content',
                generatedContent: 'Generated content',
                sourceUrl: 'https://example.com',
            };

            const mockCreatedArticle = {
                id: 'new-id',
                userId: mockUserId,
                ...createDto,
                status: 'DRAFT',
            };

            mockDb.__selectResults = [{ result: [], terminal: 'limit' }];
            mockDb.insert.mockReturnThis();
            mockDb.values.mockReturnThis();
            mockDb.returning.mockResolvedValue([mockCreatedArticle]);

            const result = await service.create(mockUserId, createDto);

            expect(result.title).toBe(createDto.title);
            expect(result.status).toBe('DRAFT');
        });

        it('should reuse existing article for duplicate sourceUrl', async () => {
            const createDto = {
                title: 'Duplicate Article',
                originalContent: 'Original content',
                generatedContent: 'Generated content',
                sourceUrl: ' https://example.com/source ',
            };
            const existingArticle = {
                id: 'existing-id',
                userId: mockUserId,
                title: 'Existing Article',
                sourceUrl: 'https://example.com/source',
                status: 'DRAFT',
            };

            mockDb.__selectResults = [{ result: [existingArticle], terminal: 'limit' }];

            const result = await service.create(mockUserId, createDto);

            expect(result).toEqual(existingArticle);
            expect(mockDb.insert).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update an existing article', async () => {
            const updateDto = {
                title: 'Updated Title',
                status: 'PUBLISHED',
            };

            const mockExistingArticle = {
                id: mockArticleId,
                userId: mockUserId,
                title: 'Old Title',
                status: 'DRAFT',
            };

            const mockUpdatedArticle = {
                ...mockExistingArticle,
                ...updateDto,
            };

            mockDb.__selectResults = [{ result: [mockExistingArticle], terminal: 'limit' }];
            mockDb.update.mockReturnThis();
            mockDb.set.mockReturnThis();
            mockDb.where.mockReturnThis();
            mockDb.returning.mockResolvedValue([mockUpdatedArticle]);

            const result = await service.update(mockUserId, mockArticleId, updateDto);

            expect(result.title).toBe(updateDto.title);
        });

        it('should throw NotFoundException when article not found', async () => {
            mockDb.__selectResults = [{ result: [], terminal: 'limit' }];

            await expect(
                service.update(mockUserId, mockArticleId, { title: 'Updated' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete an existing article', async () => {
            const mockArticle = {
                id: mockArticleId,
                userId: mockUserId,
            };

            mockDb.__selectResults = [{ result: [mockArticle], terminal: 'limit' }];
            mockDb.delete.mockReturnThis();
            mockDb.where.mockReturnThis();

            const result = await service.delete(mockUserId, mockArticleId);

            expect(result.message).toBe('Article deleted');
        });

        it('should throw NotFoundException when article not found', async () => {
            mockDb.__selectResults = [{ result: [], terminal: 'limit' }];

            await expect(service.delete(mockUserId, mockArticleId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('updateStatus', () => {
        it('should update article status', async () => {
            const mockUpdatedArticle = {
                id: mockArticleId,
                status: 'PUBLISHED',
                wpPostId: 'wp-123',
                wpPostUrl: 'https://example.com/post',
            };

            mockDb.update.mockReturnThis();
            mockDb.set.mockReturnThis();
            mockDb.where.mockReturnThis();
            mockDb.returning.mockResolvedValue([mockUpdatedArticle]);

            const result = await service.updateStatus(mockArticleId, 'PUBLISHED', {
                wpPostId: 'wp-123',
                wpPostUrl: 'https://example.com/post',
            });

            expect(result.status).toBe('PUBLISHED');
        });
    });
});