import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

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
