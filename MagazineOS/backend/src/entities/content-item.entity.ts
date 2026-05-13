import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { ContentRevision } from './content-revision.entity';
import { WorkflowState } from './workflow-state.entity';
import { ContentModeration } from './content-moderation.entity';
import { SeoMetadata } from './seo-metadata.entity';
import { PublishingSchedule } from './publishing-schedule.entity';
import { ContentTag } from './content-tag.entity';

export enum ContentType {
  ARTICLE = 'article',
  STORY = 'story',
  QUIZ = 'quiz',
  ACTIVITY = 'activity',
  INTERACTIVE_STORY = 'interactive_story',
}

export enum ContentStatus {
  BRIEF = 'brief',
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('content_items')
@Index(['orgId', 'status', 'updatedAt'])
@Index(['orgId', 'createdBy', 'createdAt'])
@Index(['slug'])
export class ContentItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orgId: string;

  @ManyToOne(() => Organization, (org) => org.content, { onDelete: 'CASCADE' })
  organization: Organization;

  @Field()
  @Column({ type: 'enum', enum: ContentType })
  type: ContentType;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  slug: string;

  @Field()
  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Field()
  @Column({ default: 1 })
  version: number;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => User, (user) => user.contentCreated, { onDelete: 'SET NULL', nullable: true })
  author: User;

  @Column('uuid', { nullable: true })
  currentReviewerId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  currentReviewer: User;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  contentJson: Record<string, any>;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  richText: Record<string, any>;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  metadataJson: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  publishAt: Date;

  @Field()
  @Column({ default: false })
  featured: boolean;

  @Field()
  @Column({ default: 0 })
  viewCount: number;

  @OneToMany(() => ContentRevision, (revision) => revision.content)
  revisions: ContentRevision[];

  @OneToMany(() => WorkflowState, (workflow) => workflow.content)
  workflowHistory: WorkflowState[];

  @OneToOne(() => ContentModeration, (moderation) => moderation.content, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  moderation: ContentModeration;

  @OneToOne(() => SeoMetadata, (seo) => seo.content, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  seoMetadata: SeoMetadata;

  @OneToMany(() => PublishingSchedule, (schedule) => schedule.content)
  publishingSchedules: PublishingSchedule[];

  @OneToMany(() => ContentTag, (tag) => tag.content, { cascade: true })
  tags: ContentTag[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  publishedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
