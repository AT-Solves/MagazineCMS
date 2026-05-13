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
@Entity('media_assets')
@Index(['orgId'])
@Index(['s3Key'], { unique: true })
export class MediaAsset {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orgId: string;

  @Field()
  @Column()
  filename: string;

  @Field()
  @Column()
  fileType: string;

  @Field()
  @Column('bigint')
  fileSize: number;

  @Field()
  @Column()
  s3Key: string;

  @Field()
  @Column()
  mimeType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  duration: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  width: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  height: number;

  @Field()
  @Column()
  altText: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  caption: string;

  @Field()
  @Column({ type: 'jsonb', default: '[]' })
  tags: string[];

  @Field()
  @Column({ default: 0 })
  usageCount: number;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => User)
  creator: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
