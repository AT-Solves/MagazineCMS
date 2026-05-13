import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentItem } from '../entities/content-item.entity';
import { ContentRevision } from '../entities/content-revision.entity';
import { WorkflowState } from '../entities/workflow-state.entity';
import { ContentModeration } from '../entities/content-moderation.entity';
import { ContentService } from '../services/content/content.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentItem,
      ContentRevision,
      WorkflowState,
      ContentModeration,
    ]),
  ],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
