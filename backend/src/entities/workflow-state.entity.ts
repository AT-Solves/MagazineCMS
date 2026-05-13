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
