// Content Revision Entity
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ContentItem } from './content-item.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('content_revisions')
@Index(['contentId'])
export class ContentRevision {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  contentId: string;

  @ManyToOne(() => ContentItem, (content) => content.revisions, { onDelete: 'CASCADE' })
  content: ContentItem;

  @Field()
  @Column()
  version: number;

  @Field()
  @Column()
  changeType: string;

  @Column('uuid')
  changedBy: string;

  @ManyToOne(() => User)
  author: User;

  @Field()
  @Column({ type: 'jsonb' })
  previousState: Record<string, any>;

  @Field()
  @Column({ type: 'jsonb' })
  newState: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  diff: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  changeSummary: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

// Workflow State Entity
@ObjectType()
@Entity('workflow_states')
@Index(['contentId'])
export class WorkflowState {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  contentId: string;

  @ManyToOne(() => ContentItem, (content) => content.workflowHistory, { onDelete: 'CASCADE' })
  content: ContentItem;

  @Field()
  @Column()
  currentState: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  previousState: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  transitionReason: string;

  @Column('uuid')
  triggeredBy: string;

  @ManyToOne(() => User)
  triggeredByUser: User;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Field()
  @CreateDateColumn()
  timestamp: Date;
}

// Media Asset Entity
@ObjectType()
@Entity('media_assets')
@Index(['orgId'])
@Index(['s3Key'], { unique: true })
export class MediaAsset {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orgId: string;

  @Field()
  @Column()
  filename: string;

  @Field()
  @Column()
  fileType: string;

  @Field()
  @Column('bigint')
  fileSize: number;

  @Field()
  @Column()
  s3Key: string;

  @Field()
  @Column()
  mimeType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  duration: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  width: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  height: number;

  @Field()
  @Column()
  altText: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  caption: string;

  @Field()
  @Column({ type: 'jsonb', default: '[]' })
  tags: string[];

  @Field()
  @Column({ default: 0 })
  usageCount: number;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => User)
  creator: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

// Taxonomy Tag Entity
@ObjectType()
@Entity('taxonomy_tags')
@Index(['orgId', 'category'])
export class TaxonomyTag {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orgId: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  category: string;

  @Field()
  @Column()
  slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  colorCode: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  iconName: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  parentTagId: string;

  @Field()
  @Column({ default: 0 })
  sortOrder: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

// Content Tag Entity
@ObjectType()
@Entity('content_tags')
@Index(['contentId'])
@Index(['tagId'])
export class ContentTag {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  contentId: string;

  @ManyToOne(() => ContentItem, (content) => content.tags, { onDelete: 'CASCADE' })
  content: ContentItem;

  @Column('uuid')
  tagId: string;

  @ManyToOne(() => TaxonomyTag)
  tag: TaxonomyTag;

  @Column('uuid')
  assignedBy: string;

  @ManyToOne(() => User)
  assignedByUser: User;

  @Field()
  @CreateDateColumn()
  assignedAt: Date;
}

// SEO Metadata Entity
@ObjectType()
@Entity('seo_metadata')
export class SeoMetadata {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  contentId: string;

  @ManyToOne(() => ContentItem, (content) => { }, { onDelete: 'CASCADE' })
  content: ContentItem;

  @Field({ nullable: true })
  @Column({ nullable: true })
  metaTitle: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  metaDescription: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  canonicalUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ogTitle: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ogDescription: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ogImageUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  twitterCard: string;

  @Field()
  @Column({ type: 'jsonb', default: '[]' })
  keywords: string[];

  @Field()
  @Column({ default: 'index, follow' })
  robotsDirective: string;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  structuredData: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  focusKeyword: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  readabilityScore: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  seoScore: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

// Publishing Schedule Entity
@ObjectType()
@Entity('publishing_schedule')
@Index(['contentId'])
@Index(['publishAt'])
@Index(['status'])
export class PublishingSchedule {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  contentId: string;

  @ManyToOne(() => ContentItem, (content) => content.publishingSchedules, { onDelete: 'CASCADE' })
  content: ContentItem;

  @Column('uuid')
  orgId: string;

  @Field()
  @Column()
  publishAt: Date;

  @Field()
  @Column({ default: 'en' })
  locale: string;

  @Field()
  @Column({ default: 'scheduled' })
  status: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  publishedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ default: 3 })
  maxRetries: number;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => User)
  creator: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

// Content Moderation Entity
@ObjectType()
@Entity('content_moderation')
export class ContentModeration {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  contentId: string;

  @ManyToOne(() => ContentItem)
  content: ContentItem;

  @Field()
  @Column({ default: 'pending' })
  status: string;

  @Field()
  @Column({ type: 'jsonb', default: '[]' })
  flags: string[];

  @Field()
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  aiRiskScore: number;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  aiAnalysis: Record<string, any>;

  @Column('uuid', { nullable: true })
  manualReviewBy: string;

  @ManyToOne(() => User, { nullable: true })
  reviewer: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewNotes: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ageAppropriatenessScore: number;

  @Field()
  @Column({ default: false })
  factualAccuracyVerified: boolean;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  contentSafetyChecks: Record<string, any>;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

// Analytics Event Entity
@ObjectType()
@Entity('analytics_events')
@Index(['orgId'])
@Index(['contentId'])
@Index(['createdAt'])
export class AnalyticsEvent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orgId: string;

  @Column('uuid', { nullable: true })
  contentId: string;

  @ManyToOne(() => ContentItem, { nullable: true })
  content: ContentItem;

  @Field()
  @Column()
  eventType: string;

  @Column('uuid', { nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  anonymousUserId: string;

  @Field()
  @Column()
  sessionId: string;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  deviceType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  countryCode: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

// Audit Log Entity
@ObjectType()
@Entity('audit_log')
@Index(['orgId'])
@Index(['userId'])
@Index(['createdAt'])
export class AuditLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orgId: string;

  @Field()
  @Column()
  action: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  entityType: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  entityId: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  changeData: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ipAddress: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  userAgent: string;

  @Field()
  @Column({ default: 'success' })
  status: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  errorMessage: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
