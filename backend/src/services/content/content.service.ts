import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentItem, ContentStatus, ContentType } from '../../entities/content-item.entity';
import { ContentRevision } from '../../entities/content-revision.entity';
import { WorkflowState } from '../../entities/workflow-state.entity';
import { ContentModeration } from '../../entities/content-moderation.entity';
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentItem)
    private contentRepository: Repository<ContentItem>,
    @InjectRepository(ContentRevision)
    private revisionRepository: Repository<ContentRevision>,
    @InjectRepository(WorkflowState)
    private workflowRepository: Repository<WorkflowState>,
    @InjectRepository(ContentModeration)
    private moderationRepository: Repository<ContentModeration>,
  ) {}

  /**
   * Create a new content item
   */
  async createContent(
    orgId: string,
    type: ContentType,
    title: string,
    createdBy: string,
    metadata?: Record<string, any>,
  ): Promise<ContentItem> {
    const slug = this.generateSlug(title);

    const content = this.contentRepository.create({
      orgId,
      type,
      title,
      slug,
      createdBy,
      metadataJson: metadata || {},
      status: ContentStatus.BRIEF,
    });

    const savedContent = await this.contentRepository.save(content);

    // Create initial workflow state
    await this.workflowRepository.save({
      contentId: savedContent.id,
      currentState: ContentStatus.BRIEF,
      triggeredBy: createdBy,
      metadata: { reason: 'Content created' },
    });

    // Create moderation record
    await this.moderationRepository.save({
      contentId: savedContent.id,
      status: 'pending',
      flags: [],
    });

    return savedContent;
  }

  /**
   * Get content by ID
   */
  async getContentById(id: string, orgId: string): Promise<ContentItem> {
    const content = await this.contentRepository.findOne({
      where: { id, orgId },
      relations: [
        'author',
        'revisions',
        'workflowHistory',
        'moderation',
        'seoMetadata',
        'publishingSchedules',
        'tags',
      ],
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  /**
   * Get all content for organization
   */
  async getOrgContent(
    orgId: string,
    status?: ContentStatus,
    limit: number = 20,
    offset: number = 0,
  ) {
    const query = this.contentRepository
      .createQueryBuilder('content')
      .where('content.orgId = :orgId', { orgId })
      .andWhere('content.deletedAt IS NULL');

    if (status) {
      query.andWhere('content.status = :status', { status });
    }

    const [items, total] = await query
      .orderBy('content.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  /**
   * Update content
   */
  async updateContent(
    id: string,
    orgId: string,
    userId: string,
    updates: Partial<{
      title: string;
      richText: Record<string, any>;
      contentJson: Record<string, any>;
      metadataJson: Record<string, any>;
    }>,
  ): Promise<ContentItem> {
    const content = await this.getContentById(id, orgId);

    // Save revision
    const revision = this.revisionRepository.create({
      contentId: id,
      version: content.version,
      changeType: 'draft_save',
      changedBy: userId,
      previousState: {
        title: content.title,
        richText: content.richText,
        contentJson: content.contentJson,
      },
      newState: updates,
      changeSummary: `Updated content`,
    });

    await this.revisionRepository.save(revision);

    // Update content
    Object.assign(content, updates);
    content.version += 1;

    return this.contentRepository.save(content);
  }

  /**
   * Submit content for review
   */
  async submitForReview(
    id: string,
    orgId: string,
    userId: string,
  ): Promise<ContentItem> {
    const content = await this.getContentById(id, orgId);

    if (content.status !== ContentStatus.DRAFT) {
      throw new BadRequestException(
        `Only draft content can be submitted for review. Current status: ${content.status}`,
      );
    }

    content.status = ContentStatus.IN_REVIEW;

    await this.workflowRepository.save({
      contentId: id,
      currentState: ContentStatus.IN_REVIEW,
      previousState: ContentStatus.DRAFT,
      triggeredBy: userId,
      metadata: { reason: 'Submitted for review' },
    });

    return this.contentRepository.save(content);
  }

  /**
   * Approve content
   */
  async approveContent(
    id: string,
    orgId: string,
    reviewerId: string,
    notes?: string,
  ): Promise<ContentItem> {
    const content = await this.getContentById(id, orgId);

    if (content.status !== ContentStatus.IN_REVIEW) {
      throw new BadRequestException(
        `Only content in review can be approved. Current status: ${content.status}`,
      );
    }

    content.status = ContentStatus.APPROVED;
    content.currentReviewerId = reviewerId;

    // Update moderation
    const moderation = content.moderation;
    if (moderation) {
      moderation.status = 'approved';
      moderation.manualReviewBy = reviewerId;
      moderation.reviewedAt = new Date();
      moderation.reviewNotes = notes;
      await this.moderationRepository.save(moderation);
    }

    await this.workflowRepository.save({
      contentId: id,
      currentState: ContentStatus.APPROVED,
      previousState: ContentStatus.IN_REVIEW,
      triggeredBy: reviewerId,
      transitionReason: notes,
      metadata: { reason: 'Content approved' },
    });

    return this.contentRepository.save(content);
  }

  /**
   * Reject content
   */
  async rejectContent(
    id: string,
    orgId: string,
    reviewerId: string,
    reason: string,
  ): Promise<ContentItem> {
    const content = await this.getContentById(id, orgId);

    if (content.status !== ContentStatus.IN_REVIEW) {
      throw new BadRequestException(
        `Only content in review can be rejected. Current status: ${content.status}`,
      );
    }

    content.status = ContentStatus.DRAFT;
    content.currentReviewerId = null;

    // Update moderation
    const moderation = content.moderation;
    if (moderation) {
      moderation.status = 'flagged';
      moderation.manualReviewBy = reviewerId;
      moderation.reviewedAt = new Date();
      moderation.reviewNotes = reason;
      await this.moderationRepository.save(moderation);
    }

    await this.workflowRepository.save({
      contentId: id,
      currentState: ContentStatus.DRAFT,
      previousState: ContentStatus.IN_REVIEW,
      triggeredBy: reviewerId,
      transitionReason: reason,
      metadata: { reason: 'Content rejected for revision' },
    });

    return this.contentRepository.save(content);
  }

  /**
   * Delete content (soft delete)
   */
  async deleteContent(id: string, orgId: string): Promise<boolean> {
    const content = await this.getContentById(id, orgId);
    content.deletedAt = new Date();
    await this.contentRepository.save(content);
    return true;
  }

  /**
   * Get content revisions
   */
  async getContentRevisions(contentId: string): Promise<ContentRevision[]> {
    return this.revisionRepository.find({
      where: { contentId },
      order: { version: 'DESC' },
      relations: ['author'],
    });
  }

  /**
   * Restore content to specific revision
   */
  async restoreToRevision(
    contentId: string,
    orgId: string,
    revisionVersion: number,
    userId: string,
  ): Promise<ContentItem> {
    const content = await this.getContentById(contentId, orgId);
    const revision = await this.revisionRepository.findOne({
      where: { contentId, version: revisionVersion },
    });

    if (!revision) {
      throw new NotFoundException(
        `Revision ${revisionVersion} not found for content ${contentId}`,
      );
    }

    // Save current state as new revision
    await this.revisionRepository.save({
      contentId,
      version: content.version,
      changeType: 'major_edit',
      changedBy: userId,
      previousState: {
        title: content.title,
        richText: content.richText,
        contentJson: content.contentJson,
      },
      newState: revision.newState,
      changeSummary: `Restored to revision ${revisionVersion}`,
    });

    // Restore content
    Object.assign(content, revision.newState);
    content.version += 1;

    return this.contentRepository.save(content);
  }

  /**
   * Helper: Generate URL-friendly slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100);
  }

  /**
   * Get content statistics
   */
  async getContentStats(orgId: string) {
    const stats = await this.contentRepository
      .createQueryBuilder('content')
      .select('content.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('content.orgId = :orgId', { orgId })
      .andWhere('content.deletedAt IS NULL')
      .groupBy('content.status')
      .getRawMany();

    return stats.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count);
      return acc;
    }, {});
  }
}
