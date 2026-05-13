import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentService } from '../src/services/content/content.service';
import { ContentItem, ContentType, ContentStatus } from '../src/entities/content-item.entity';
import { ContentRevision } from '../src/entities/content-revision.entity';
import { WorkflowState } from '../src/entities/workflow-state.entity';
import { ContentModeration } from '../src/entities/content-moderation.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ContentService', () => {
  let service: ContentService;
  let contentRepository: Repository<ContentItem>;
  let revisionRepository: Repository<ContentRevision>;
  let workflowRepository: Repository<WorkflowState>;
  let moderationRepository: Repository<ContentModeration>;

  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '223e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: getRepositoryToken(ContentItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContentRevision),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkflowState),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContentModeration),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    contentRepository = module.get<Repository<ContentItem>>(
      getRepositoryToken(ContentItem),
    );
    revisionRepository = module.get<Repository<ContentRevision>>(
      getRepositoryToken(ContentRevision),
    );
    workflowRepository = module.get<Repository<WorkflowState>>(
      getRepositoryToken(WorkflowState),
    );
    moderationRepository = module.get<Repository<ContentModeration>>(
      getRepositoryToken(ContentModeration),
    );
  });

  describe('createContent', () => {
    it('should create a new content item with brief status', async () => {
      const mockContent = {
        id: '123',
        orgId: mockOrgId,
        type: ContentType.ARTICLE,
        title: 'Test Article',
        slug: 'test-article',
        status: ContentStatus.BRIEF,
        version: 1,
        createdBy: mockUserId,
        metadataJson: {},
      } as ContentItem;

      jest.spyOn(contentRepository, 'create').mockReturnValue(mockContent);
      jest.spyOn(contentRepository, 'save').mockResolvedValue(mockContent);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue({} as WorkflowState);
      jest.spyOn(moderationRepository, 'save').mockResolvedValue({} as ContentModeration);

      const result = await service.createContent(
        mockOrgId,
        ContentType.ARTICLE,
        'Test Article',
        mockUserId,
      );

      expect(result.title).toBe('Test Article');
      expect(result.status).toBe(ContentStatus.BRIEF);
      expect(contentRepository.create).toHaveBeenCalled();
      expect(contentRepository.save).toHaveBeenCalled();
      expect(workflowRepository.save).toHaveBeenCalled();
      expect(moderationRepository.save).toHaveBeenCalled();
    });
  });

  describe('getContentById', () => {
    it('should retrieve content by id', async () => {
      const mockContent = {
        id: '123',
        orgId: mockOrgId,
        title: 'Test Article',
      } as ContentItem;

      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent);

      const result = await service.getContentById('123', mockOrgId);

      expect(result.title).toBe('Test Article');
      expect(contentRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123', orgId: mockOrgId },
        relations: expect.any(Array),
      });
    });

    it('should throw NotFoundException when content not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getContentById('notfound', mockOrgId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateContent', () => {
    it('should update content and create revision', async () => {
      const mockContent = {
        id: '123',
        orgId: mockOrgId,
        title: 'Original Title',
        richText: {},
        version: 1,
      } as ContentItem;

      const updates = { title: 'Updated Title' };

      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent);
      jest.spyOn(revisionRepository, 'create').mockReturnValue({} as ContentRevision);
      jest.spyOn(revisionRepository, 'save').mockResolvedValue({} as ContentRevision);
      jest.spyOn(contentRepository, 'save').mockResolvedValue({
        ...mockContent,
        ...updates,
        version: 2,
      } as ContentItem);

      const result = await service.updateContent('123', mockOrgId, mockUserId, updates);

      expect(result.title).toBe('Updated Title');
      expect(result.version).toBe(2);
      expect(revisionRepository.save).toHaveBeenCalled();
    });
  });

  describe('submitForReview', () => {
    it('should transition content from draft to in_review', async () => {
      const mockContent = {
        id: '123',
        orgId: mockOrgId,
        status: ContentStatus.DRAFT,
      } as ContentItem;

      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue({} as WorkflowState);
      jest.spyOn(contentRepository, 'save').mockResolvedValue({
        ...mockContent,
        status: ContentStatus.IN_REVIEW,
      } as ContentItem);

      const result = await service.submitForReview('123', mockOrgId, mockUserId);

      expect(result.status).toBe(ContentStatus.IN_REVIEW);
      expect(workflowRepository.save).toHaveBeenCalled();
    });

    it('should throw error when content is not in draft status', async () => {
      const mockContent = {
        id: '123',
        orgId: mockOrgId,
        status: ContentStatus.PUBLISHED,
      } as ContentItem;

      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent);

      await expect(
        service.submitForReview('123', mockOrgId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveContent', () => {
    it('should approve content and update moderation status', async () => {
      const mockContent = {
        id: '123',
        orgId: mockOrgId,
        status: ContentStatus.IN_REVIEW,
        moderation: {
          status: 'pending',
        },
      } as ContentItem;

      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent);
      jest.spyOn(moderationRepository, 'save').mockResolvedValue({} as ContentModeration);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue({} as WorkflowState);
      jest.spyOn(contentRepository, 'save').mockResolvedValue({
        ...mockContent,
        status: ContentStatus.APPROVED,
      } as ContentItem);

      const result = await service.approveContent('123', mockOrgId, mockUserId);

      expect(result.status).toBe(ContentStatus.APPROVED);
      expect(moderationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
        }),
      );
    });
  });

  describe('rejectContent', () => {
    it('should reject content and return to draft', async () => {
      const mockContent = {
        id: '123',
        orgId: mockOrgId,
        status: ContentStatus.IN_REVIEW,
        moderation: {
          status: 'pending',
        },
      } as ContentItem;

      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(mockContent);
      jest.spyOn(moderationRepository, 'save').mockResolvedValue({} as ContentModeration);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue({} as WorkflowState);
      jest.spyOn(contentRepository, 'save').mockResolvedValue({
        ...mockContent,
        status: ContentStatus.DRAFT,
      } as ContentItem);

      const result = await service.rejectContent(
        '123',
        mockOrgId,
        mockUserId,
        'Needs revision',
      );

      expect(result.status).toBe(ContentStatus.DRAFT);
      expect(moderationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'flagged',
        }),
      );
    });
  });

  describe('getContentStats', () => {
    it('should return content statistics by status', async () => {
      const mockStats = [
        { status: 'draft', count: '5' },
        { status: 'in_review', count: '3' },
        { status: 'published', count: '12' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockStats),
      };

      jest.spyOn(contentRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getContentStats(mockOrgId);

      expect(result.draft).toBe(5);
      expect(result.in_review).toBe(3);
      expect(result.published).toBe(12);
    });
  });
});
