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
            select: jest.fn().mockReturnThis(),
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

            mockDb.query.article.findMany.mockResolvedValue(mockArticles);
            mockDb.select.mockReturnThis();
            mockDb.from.mockReturnThis();
            mockDb.where.mockResolvedValue([{ count: 2 }]);

            const result = await service.findAll(mockUserId, { page: 1, limit: 20 });

            expect(result.data).toEqual(mockArticles);
            expect(result.meta.total).toBe(2);
        });

        it('should filter by status', async () => {
            const mockArticles = [{ id: '1', title: 'Article 1', status: 'DRAFT' }];

            mockDb.query.article.findMany.mockResolvedValue(mockArticles);
            mockDb.select.mockReturnThis();
            mockDb.from.mockReturnThis();
            mockDb.where.mockResolvedValue([{ count: 1 }]);

            const result = await service.findAll(mockUserId, { status: 'DRAFT' });

            expect(result.data).toEqual(mockArticles);
        });
    });

    describe('findById', () => {
        it('should return article when found', async () => {
            const mockArticle = {
                id: mockArticleId,
                userId: mockUserId,
                title: 'Test Article',
            };

            mockDb.query.article.findFirst.mockResolvedValue(mockArticle);

            const result = await service.findById(mockUserId, mockArticleId);

            expect(result).toEqual(mockArticle);
        });

        it('should throw NotFoundException when article not found', async () => {
            mockDb.query.article.findFirst.mockResolvedValue(null);

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

            mockDb.insert.mockReturnThis();
            mockDb.values.mockReturnThis();
            mockDb.returning.mockResolvedValue([mockCreatedArticle]);

            const result = await service.create(mockUserId, createDto);

            expect(result.title).toBe(createDto.title);
            expect(result.status).toBe('DRAFT');
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

            mockDb.query.article.findFirst.mockResolvedValue(mockExistingArticle);
            mockDb.update.mockReturnThis();
            mockDb.set.mockReturnThis();
            mockDb.where.mockReturnThis();
            mockDb.returning.mockResolvedValue([mockUpdatedArticle]);

            const result = await service.update(mockUserId, mockArticleId, updateDto);

            expect(result.title).toBe(updateDto.title);
        });

        it('should throw NotFoundException when article not found', async () => {
            mockDb.query.article.findFirst.mockResolvedValue(null);

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

            mockDb.query.article.findFirst.mockResolvedValue(mockArticle);
            mockDb.delete.mockReturnThis();
            mockDb.where.mockReturnThis();

            const result = await service.delete(mockUserId, mockArticleId);

            expect(result.message).toBe('Article deleted');
        });

        it('should throw NotFoundException when article not found', async () => {
            mockDb.query.article.findFirst.mockResolvedValue(null);

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