import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { Organization } from './organization.entity';
import { ContentItem } from './content-item.entity';

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  REVIEWER = 'reviewer',
  PUBLISHER = 'publisher',
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('users')
@Index(['email'], { unique: true })
@Index(['orgId', 'role'])
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  fullName: string;

  @Field()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.AUTHOR })
  role: UserRole;

  @Column('uuid')
  orgId: string;

  @ManyToOne(() => Organization, (org) => org.users)
  organization: Organization;

  @Field()
  @Column({ default: false })
  childSafetyClearance: boolean;

  @Field()
  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ nullable: true })
  mfaSecret: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastLogin: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  preferences: Record<string, any>;

  @OneToMany(() => ContentItem, (content) => content.createdBy)
  contentCreated: ContentItem[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
