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
