import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
@Entity('audit_log')
@Index(['orgId'])
@Index(['userId'])
@Index(['createdAt'])
export class AuditLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orgId: string;

  @Field()
  @Column()
  action: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  entityType: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  entityId: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Field()
  @Column({ type: 'jsonb', default: '{}' })
  changeData: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ipAddress: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  userAgent: string;

  @Field()
  @Column({ default: 'success' })
  status: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  errorMessage: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
