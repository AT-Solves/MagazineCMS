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
