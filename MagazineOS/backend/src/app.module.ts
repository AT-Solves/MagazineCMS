import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as path from 'path';

// Import modules
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { MediaModule } from './media/media.module';
import { WorkflowModule } from './workflow/workflow.module';
import { PublishingModule } from './publishing/publishing.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { SecurityModule } from './security/security.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { SeoModule } from './seo/seo.module';

// Import entities
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { ContentItem } from './entities/content-item.entity';
import { ContentRevision } from './entities/content-revision.entity';
import { WorkflowState } from './entities/workflow-state.entity';
import { MediaAsset } from './entities/media-asset.entity';
import { TaxonomyTag } from './entities/taxonomy-tag.entity';
import { ContentTag } from './entities/content-tag.entity';
import { SeoMetadata } from './entities/seo-metadata.entity';
import { PublishingSchedule } from './entities/publishing-schedule.entity';
import { ContentModeration } from './entities/content-moderation.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'magazineos'),
        entities: [
          User,
          Organization,
          ContentItem,
          ContentRevision,
          WorkflowState,
          MediaAsset,
          TaxonomyTag,
          ContentTag,
          SeoMetadata,
          PublishingSchedule,
          ContentModeration,
          AnalyticsEvent,
          AuditLog,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('DB_LOGGING', false),
        poolSize: configService.get('DB_POOL_SIZE', 10),
      }),
    }),

    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      imports: [ConfigModule],
      inject: [ConfigService],
      driver: ApolloDriver,
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: path.join(
          process.cwd(),
          'src/schema.graphql',
        ),
        sortSchema: true,
        debug: configService.get('NODE_ENV') !== 'production',
        subscriptions: {
          'graphql-ws': {
            onConnect: (context: any) => {
              const token = context.connectionParams?.authorization?.split(
                ' ',
              )[1];
              return { token };
            },
          },
        },
        context: ({ req, res }) => ({ req, res }),
      }),
    }),

    // Authentication
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
    }),

    // Feature modules
    AuthModule,
    ContentModule,
    MediaModule,
    WorkflowModule,
    PublishingModule,
    AnalyticsModule,
    AiModule,
    SecurityModule,
    TaxonomyModule,
    SeoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
