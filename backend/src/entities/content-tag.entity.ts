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
import { TaxonomyTag } from './taxonomy-tag.entity';
import { User } from './user.entity';

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
