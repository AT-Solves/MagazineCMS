import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { User } from './user.entity';
import { ContentItem } from './content-item.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('organizations')
@Index(['slug'], { unique: true })
export class Organization {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  slug: string;

  @Field()
  @Column({ default: 'pro' })
  tier: 'free' | 'pro' | 'enterprise';

  @Field()
  @Column({ default: 10 })
  maxConcurrentEditors: number;

  @Field()
  @Column({ default: 1000 })
  maxMonthlyPublishes: number;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => ContentItem, (content) => content.organization)
  content: ContentItem[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
