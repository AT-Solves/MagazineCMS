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
