import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ContentItem } from './content-item.entity';
import { User } from './user.entity';

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
