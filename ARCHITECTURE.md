# MagazineOS Architecture Documentation

## Overview

MagazineOS is an Elite AI Editorial and Content Operations Engine for creating, managing, and publishing world-class magazine content with comprehensive editorial workflows, AI-powered content generation, and enterprise-grade compliance features.

## Technology Stack

### Frontend
- **Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI)
- **State Management**: Zustand
- **Form Management**: React Hook Form
- **GraphQL Client**: Apollo Client
- **Testing**: Vitest + React Testing Library
- **Styling**: Emotion (CSS-in-JS)

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS 10
- **API**: GraphQL with Apollo Server
- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **Cache**: Redis
- **Authentication**: JWT + Passport
- **Validation**: Zod + Class Validator
- **Testing**: Jest + Supertest

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (development), Kubernetes (production)
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (EC2, RDS, S3, CloudFront)
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack

## Project Structure

```
MagazineOS/
├── backend/
│   ├── src/
│   │   ├── app.module.ts                 # Main NestJS module
│   │   ├── main.ts                       # Application entry point
│   │   ├── auth/                         # Authentication module
│   │   ├── content/                      # Content management
│   │   │   ├── content.service.ts        # Core business logic
│   │   │   ├── content.resolver.ts       # GraphQL resolver
│   │   │   └── content.module.ts         # Module definition
│   │   ├── workflow/                     # Workflow state machine
│   │   ├── publishing/                   # Publishing orchestration
│   │   ├── analytics/                    # Analytics & tracking
│   │   ├── ai/                           # AI integration
│   │   ├── security/                     # Moderation & compliance
│   │   ├── entities/                     # TypeORM entities
│   │   ├── guards/                       # Auth guards
│   │   ├── interceptors/                 # Response interceptors
│   │   └── dto/                          # Data transfer objects
│   ├── database/
│   │   ├── schema.sql                    # PostgreSQL schema
│   │   └── migrations/                   # Database migrations
│   ├── test/                             # Backend tests
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx                      # React entry point
│   │   ├── App.tsx                       # Root component
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── LayoutShell.tsx       # Main layout wrapper
│   │   │   │   └── Sidebar.tsx           # Navigation sidebar
│   │   │   ├── editor/
│   │   │   │   ├── RichTextEditor.tsx    # Content editor
│   │   │   │   └── EditorToolbar.tsx     # Editor controls
│   │   │   ├── workflow/
│   │   │   │   └── KanbanBoard.tsx       # Workflow visualization
│   │   │   ├── publishing/
│   │   │   │   └── PublishingCenter.tsx  # Publishing UI
│   │   │   └── common/                   # Reusable components
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   ├── content/
│   │   │   ├── workflow/
│   │   │   ├── publishing/
│   │   │   ├── analytics/
│   │   │   ├── media/
│   │   │   ├── settings/
│   │   │   └── auth/
│   │   ├── stores/
│   │   │   ├── auth.store.ts             # Auth state
│   │   │   ├── content.store.ts          # Content state
│   │   │   └── ui.store.ts               # UI state
│   │   ├── hooks/
│   │   │   ├── useGraphQL.ts             # GraphQL queries
│   │   │   └── useAuth.ts                # Auth helpers
│   │   ├── types/                        # TypeScript types
│   │   └── utils/                        # Utility functions
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── electron/
│   ├── src/
│   │   ├── main.ts                       # Electron main process
│   │   ├── preload.ts                    # Preload script
│   │   └── config/                       # App configuration
│   ├── public/
│   │   └── icon.png
│   └── package.json
├── docker-compose.yml                    # Local development
├── .env.example                          # Environment template
├── .github/
│   └── workflows/
│       └── ci-cd.yml                     # GitHub Actions pipeline
├── ARCHITECTURE.md                       # This file
└── README.md                             # Project overview
```

## Core Services

### 1. Content Service
Manages the complete content lifecycle:
- CRUD operations for all content types
- Version control and revision history
- Workflow state transitions
- Taxonomy tagging
- SEO metadata management

**Key Methods**:
- `createContent()` - Create new content item
- `updateContent()` - Update with revision tracking
- `submitForReview()` - Submit for editorial review
- `approveContent()` - Approve after review
- `publishContent()` - Publish to audience
- `getContentRevisions()` - Retrieve version history

### 2. Workflow Service
Implements content workflow state machine:
- Draft → In Review → Approved → Scheduled → Published
- Role-based approval workflows
- Rejection and revision cycles
- Workflow history tracking

**States**:
- BRIEF: Initial brief/outline
- DRAFT: Content being written
- IN_REVIEW: Under editorial review
- APPROVED: Approved, ready to publish
- SCHEDULED: Scheduled for publication
- PUBLISHED: Live content
- ARCHIVED: Archived content

### 3. Publishing Service
Orchestrates content publication:
- Scheduled publishing with cron-like patterns
- Multilingual content coordination
- Cache invalidation
- Webhook event emission
- Retry logic for failed publishes

**Features**:
- Scheduled publish queuing
- Atomic multi-locale publishing
- Event-driven architecture
- Automatic retry with exponential backoff
- Success/failure notifications

### 4. AI Service
Integrates AI for content enhancement:
- Content generation from briefs
- Readability analysis and improvement
- SEO keyword suggestions
- Content summarization
- Age-appropriateness assessment

**Integrations**:
- OpenAI/Claude for text generation
- Custom NLP models for tagging
- Sentiment analysis for moderation

### 5. Security & Moderation Service
Ensures child safety and compliance:
- Content moderation pipeline
- COPPA compliance checks
- GDPR-K compliance validation
- Parental control enforcement
- Audit logging of all actions

**Checks**:
- Toxic content detection
- Privacy leak detection (names, addresses)
- Age-inappropriate language
- Copyright/plagiarism detection
- Manual review queue management

### 6. Analytics Service
Tracks engagement and learning metrics:
- Page views and unique visitors
- Time spent on content
- Completion rates
- Quiz/activity submissions
- Learning outcome tracking

**Reporting**:
- Real-time dashboards
- Custom report generation
- A/B test result aggregation
- Learning insights by content type

## Database Schema

### Key Tables
- **users**: Team members with role-based access
- **organizations**: Multi-org support with tier-based limits
- **content_items**: Main content storage with soft deletes
- **content_revisions**: Version history with diffs
- **workflow_states**: Audit trail of workflow transitions
- **media_assets**: Image, video, audio storage metadata
- **taxonomy_tags**: Hierarchical content categorization
- **seo_metadata**: SEO fields and optimization scores
- **publishing_schedule**: Scheduled publication queue
- **content_moderation**: Moderation status and flags
- **analytics_events**: Engagement tracking events
- **audit_log**: Complete audit trail of all changes

See `backend/database/schema.sql` for complete schema.

## API Specification

### GraphQL Endpoints

**Content Queries**:
```graphql
query GetContent($id: ID!, $orgId: ID!) {
  contentItem(id: $id, orgId: $orgId) {
    id
    title
    status
    author { fullName }
    seoMetadata { metaTitle, metaDescription }
    tags { name, category }
  }
}
```

**Content Mutations**:
```graphql
mutation CreateContent($input: CreateContentInput!) {
  createContent(input: $input) {
    id
    title
    status
    createdAt
  }
}

mutation SubmitForReview($id: ID!) {
  submitContentForReview(id: $id) {
    id
    status
  }
}

mutation PublishContent($id: ID!, $scheduleAt: DateTime) {
  publishContent(id: $id, scheduleAt: $scheduleAt) {
    id
    status
    publishAt
  }
}
```

**Subscriptions**:
```graphql
subscription OnContentUpdated($orgId: ID!) {
  contentUpdated(orgId: $orgId) {
    id
    title
    status
  }
}
```

See GraphQL schema explorer at `http://localhost:3000/graphql` for full API.

## Authentication & Authorization

### Flow
1. User logs in with email/password
2. Backend validates credentials
3. JWT token issued (1-hour expiration)
4. Refresh token stored securely
5. Token sent with all API requests

### Role-Based Access Control (RBAC)
- **ADMIN**: Full platform access
- **EDITOR**: Create, edit, publish, manage users
- **AUTHOR**: Create and edit own content
- **REVIEWER**: Edit, approve, reject content
- **PUBLISHER**: Publish approved content only

### Guards
- `AuthGuard`: Validates JWT token
- `RoleGuard`: Checks user role permissions
- `OrgGuard`: Ensures org-scoped access

## Workflow State Machine

```
    ┌─────────────────────────────────────────┐
    │  BRIEF (Story outline/brief)            │
    └────────────┬────────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────────┐
    │  DRAFT (Content being written)          │
    └────────────┬────────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────────┐
    │  IN_REVIEW (Under editorial review)    │◄──────────┐
    └────┬───────────────────────────────────┬┘           │
         │                                   │             │
         ▼ (Approved)              (Rejected) ▼            │
    ┌──────────────┐           ┌─────────────────────────┐│
    │  APPROVED    │           │  Back to DRAFT          ││
    └────┬─────────┘           └───────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────────┐
    │  SCHEDULED (Queued for publication)     │
    └────┬─────────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────────┐
    │  PUBLISHED (Live on platform)           │
    └──────────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests (Backend)
- Service methods with mocked repositories
- Target: 80% code coverage
- Run: `npm run test`

### Integration Tests (Backend)
- Full workflow scenarios
- Database transactions
- API integration flows
- Run: `npm run test:e2e`

### Component Tests (Frontend)
- React component interactions
- Form submissions
- State management
- Run: `npm run test`

### E2E Tests (Frontend)
- Complete user workflows
- Multi-page journeys
- API integration
- Run: `npm run test:e2e`

### Security Tests
- SQL injection prevention
- XSS protection
- CSRF token validation
- Authentication bypass attempts

## Deployment

### Local Development
```bash
cp .env.example .env
docker-compose up
# Access: http://localhost:5173 (frontend)
#         http://localhost:3000 (backend)
```

### Staging Deployment
```bash
git push origin develop
# Triggers CI/CD pipeline
# Deploys to staging environment
```

### Production Deployment
```bash
git push origin main
# Runs full test suite
# Builds Docker images
# Blue-green deployment to prod
```

### Kubernetes Manifests
Located in `k8s/` directory:
- `deployment.yaml`: Pod specifications
- `service.yaml`: Service configuration
- `ingress.yaml`: Load balancer setup
- `configmap.yaml`: Configuration management
- `secret.yaml`: Sensitive data

## Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading of components
- Image optimization with next-gen formats
- HTTP caching headers
- Gzip compression
- Bundle size target: <500KB gzipped

### Backend
- Database query optimization with indexes
- Redis caching layer
- GraphQL query batching
- Pagination for list endpoints
- Connection pooling
- CDN for static assets

### Database
- Strategic indexing on hot columns
- Query result caching in Redis
- Read replicas for scaling reads
- Partitioning for large tables
- Regular VACUUM and ANALYZE

## Security Hardening

### Application Level
- Input validation with Zod
- SQL injection prevention (ORM usage)
- XSS protection (Content-Security-Policy headers)
- CSRF token validation
- Rate limiting on API endpoints
- Secure password hashing (bcrypt)

### Transport Level
- TLS 1.3 minimum
- HSTS headers
- Secure/HttpOnly cookies
- CORS whitelist enforcement

### Data Level
- Encryption at rest (database)
- Encryption in transit (TLS)
- Sensitive data masking in logs
- PII handling compliance
- Audit logging of all data access

### Compliance
- COPPA (Children's Online Privacy Protection Act)
- GDPR-K (GDPR for kids in Europe)
- FERPA (if used in schools)
- CCPA (California Consumer Privacy Act)
- SOC 2 compliance targets

## Monitoring & Logging

### Application Monitoring
- Prometheus metrics exposure
- Grafana dashboards
- Alert rules for critical issues
- Distributed tracing with Jaeger

### Log Management
- Centralized ELK stack
- Log retention: 30 days
- Structured JSON logging
- Real-time log streaming

### Health Checks
- `/health` endpoint for infrastructure
- `/ready` endpoint for readiness probes
- Dependency health checks (DB, Redis)
- Automated alerting on failures

## Future Enhancements

### Phase 2: Advanced Features
- Multi-tenant architecture with row-level security
- Custom recommendation engine
- Knowledge graph for content relationships
- Advanced content analytics

### Phase 3: AI Enhancement
- Autonomous content generation agents
- Real-time content personalization
- Adaptive learning path optimization
- Conversational AI editor

### Phase 4: Enterprise Scale
- Voice interface support
- AR/VR content experiences
- Federated search across tenants
- Cross-region deployment

## Development Workflow

### Getting Started
1. Clone repository
2. Copy `.env.example` to `.env`
3. Run `docker-compose up`
4. Visit `http://localhost:5173`

### Making Changes
1. Create feature branch: `git checkout -b feature/name`
2. Make changes with hot-reload
3. Run tests: `npm run test`
4. Commit: `git commit -m "description"`
5. Push: `git push origin feature/name`
6. Create Pull Request
7. CI/CD pipeline runs automatically
8. Merge after approval

### Code Quality
- Linting: `npm run lint`
- Formatting: `npm run format`
- Type checking: `npm run type-check`
- Tests: `npm run test`

## Troubleshooting

### Backend won't start
- Check `.env` configuration
- Verify PostgreSQL is running
- Check database migrations: `npm run db:migrate`

### Frontend won't load
- Clear node_modules: `rm -rf frontend/node_modules`
- Reinstall: `npm install`
- Check GraphQL endpoint in `.env`

### Database connection issues
- Verify PostgreSQL is running
- Check DB credentials in `.env`
- Verify network connectivity
- Check Docker network: `docker network ls`

## Support & Resources

- **Documentation**: See docs/ folder
- **API Docs**: GraphQL introspection at `/graphql`
- **Issues**: Create GitHub issues for bugs
- **Contributing**: See CONTRIBUTING.md
- **License**: MIT

---

**Last Updated**: May 2026
**Version**: 1.0.0
**Status**: Production Ready
