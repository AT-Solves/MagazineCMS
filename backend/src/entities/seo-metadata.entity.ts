import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ContentItem } from './content-item.entity';

@ObjectType()
@Entity('seo_metadata')
export class SeoMetadata {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  contentId: string;

  @ManyToOne(() => ContentItem, (content) => content.seoMetadata, { onDelete: 'CASCADE' })
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
