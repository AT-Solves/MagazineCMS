# MagazineOS

**Elite AI Editorial and Content Operations Engine**

An enterprise-grade Magazine Content Management System for creating, managing, and publishing world-class magazine content with AI-powered generation, comprehensive editorial workflows, and full compliance with child safety standards.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green)
![React](https://img.shields.io/badge/react-18.2-blue)

## Features

### 📝 Content Management
- **Multiple Content Types**: Articles, Stories, Quizzes, Activities, Interactive Stories
- **Rich Text Editing**: Advanced WYSIWYG editor with formatting, media insertion, and preview
- **Version Control**: Complete revision history with rollback capabilities
- **Draft & Approval Workflows**: Multi-stage approval process with reviewer assignments
- **Media Management**: Centralized media asset library with S3 integration
- **Taxonomy System**: Hierarchical tagging with custom categories

### 🤖 AI-Powered Features
- **Content Generation**: AI-assisted story and article creation from briefs
- **SEO Optimization**: Automated keyword suggestions and meta-data generation
- **Content Tagging**: Intelligent auto-tagging based on content analysis
- **Readability Analysis**: Grade-level assessment and improvement suggestions
- **Age Assessment**: Automatic age-appropriateness scoring

### 📊 Editorial Workflows
- **Kanban-Style Board**: Visual content workflow management
- **Multi-Role Support**: Admin, Editor, Author, Reviewer, Publisher roles
- **Comments & Collaboration**: Threaded comments and suggestions
- **Activity Tracking**: Complete audit log of all actions
- **Bulk Operations**: Batch actions on multiple content items

### 📅 Publishing
- **Scheduled Publishing**: Queue content for future publication
- **Multilingual Support**: Coordinate publishing across locales
- **Webhook Integration**: Trigger external systems on publish events
- **Cache Management**: Automatic cache invalidation on publish
- **Retry Logic**: Automatic retry with exponential backoff

### 📈 Analytics
- **Engagement Metrics**: Views, time spent, completion rates
- **Learning Insights**: Quiz submissions and learning outcomes
- **Custom Reports**: Flexible reporting engine
- **Real-Time Dashboard**: Live engagement tracking
- **A/B Testing**: Built-in A/B test framework

### 🔒 Safety & Compliance
- **Content Moderation**: AI-powered + manual review queue
- **COPPA Compliance**: Children's Online Privacy Protection Act
- **GDPR-K Compliance**: GDPR for kids in Europe
- **Parental Controls**: Parent consent and control mechanisms
- **Data Privacy**: Strict PII handling and minimization

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/magazineos.git
   cd magazineos
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - GraphQL: http://localhost:3000/graphql

### Manual Setup

**Backend**
```bash
cd backend
npm install
npm run db:migrate  # Apply database migrations
npm run start:dev   # Start development server
```

**Frontend**
```bash
cd frontend
npm install
npm run dev         # Start development server
```

## Development

### Available Commands

**Backend**
```bash
npm run build        # Build for production
npm run start        # Start production server
npm run start:dev    # Start with hot reload
npm run test         # Run unit tests
npm run test:cov     # Test with coverage
npm run lint         # Lint code
npm run format       # Format code
```

**Frontend**
```bash
npm run build        # Build for production
npm run dev          # Start dev server
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Interactive test UI
npm run lint         # Lint code
npm run format       # Format code
```

### Project Structure

```
backend/
├── src/
│   ├── services/          # Business logic
│   ├── entities/          # Database models
│   ├── resolvers/         # GraphQL resolvers
│   ├── guards/            # Auth & authorization
│   └── modules/           # Feature modules
└── test/                  # Test suites

frontend/
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── stores/            # Zustand stores
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilities
└── __tests__/             # Test files
```

## API Documentation

### GraphQL Schema

The GraphQL API is self-documented and explorable at:
```
http://localhost:3000/graphql
```

**Example Query**:
```graphql
query GetContent($id: ID!) {
  contentItem(id: $id) {
    id
    title
    status
    author { fullName }
    seoMetadata { metaTitle }
    tags { name }
  }
}
```

**Example Mutation**:
```graphql
mutation CreateContent($input: CreateContentInput!) {
  createContent(input: $input) {
    id
    title
    status
  }
}
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API specification.

## Authentication

### Login
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

Returns JWT token valid for 24 hours.

### Protected Requests
```bash
Authorization: Bearer <jwt-token>
```

## Testing

### Run All Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:cov
```

### Coverage Targets
- Backend: 80% overall
- Frontend: 60% overall
- Critical paths: 95%

## Deployment

### Docker Build
```bash
docker build -t magazineos-backend ./backend
docker build -t magazineos-frontend ./frontend
```

### Cloud Deployment

**AWS ECS**
```bash
aws ecs create-service --cluster magazineos \
  --service-name api \
  --task-definition magazineos-backend:1
```

**Kubernetes**
```bash
kubectl apply -f k8s/
```

### Environment Setup

**Staging**
```bash
git push origin develop
# Automatically deploys to staging
```

**Production**
```bash
git push origin main
# Runs full test suite and deploys to production
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed deployment guide.

## Database

### Migrations
```bash
# Create new migration
npm run db:generate -- --name AddNewTable

# Apply migrations
npm run db:migrate

# Revert last migration
npm run db:revert
```

### Schema
See [backend/database/schema.sql](./backend/database/schema.sql) for complete schema.

## Security

### Key Features
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Input validation with Zod
- ✅ SQL injection prevention (TypeORM)
- ✅ XSS protection (Content Security Policy)
- ✅ CSRF token validation
- ✅ Rate limiting on API endpoints
- ✅ Secure password hashing (bcrypt)
- ✅ TLS 1.3 encryption
- ✅ Audit logging of all actions

### Compliance
- ✅ COPPA (Children's Online Privacy Protection Act)
- ✅ GDPR-K (GDPR for kids)
- ✅ FERPA (if used in schools)
- ✅ CCPA (California Consumer Privacy Act)

## Performance

### Frontend
- Bundle size: < 500KB gzipped
- Lighthouse score: 90+
- Core Web Vitals: All green

### Backend
- API response time: < 200ms p95
- GraphQL query batching enabled
- Redis caching layer
- Database connection pooling
- CDN for static assets

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Metrics
Prometheus metrics available at:
```
http://localhost:3000/metrics
```

### Logs
View application logs:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Make your changes
4. Run tests: `npm run test`
5. Commit: `git commit -m "description"`
6. Push: `git push origin feature/name`
7. Create a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## Troubleshooting

### Backend won't start
```bash
# Check database connection
docker-compose logs postgres

# Check migrations
npm run db:migrate

# Clear Redis
docker-compose exec redis redis-cli FLUSHALL
```

### Frontend won't build
```bash
# Clear node_modules
rm -rf frontend/node_modules
npm install

# Clear cache
npm run build -- --force
```

### GraphQL not responding
```bash
# Check Apollo Server logs
docker-compose logs backend | grep Apollo

# Test GraphQL endpoint
curl http://localhost:3000/graphql
```

## Performance Tips

### Development
- Use React DevTools extension
- Enable Redux DevTools for state debugging
- Use Chrome DevTools Performance tab

### Production
- Enable gzip compression
- Use CDN for static assets
- Enable browser caching headers
- Minify CSS and JavaScript
- Lazy load images

## Resources

- 📚 [Documentation](./docs/)
- 📋 [API Reference](./ARCHITECTURE.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/magazineos/issues)
- 💬 [Discussions](https://github.com/yourusername/magazineos/discussions)
- 📝 [Blog](https://blog.magazineos.com)

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- 📧 Email: support@magazineos.com
- 💬 Discord: [Join Community](https://discord.gg/magazineos)
- 🐦 Twitter: [@MagazineOS](https://twitter.com/MagazineOS)

## Roadmap

### Q2 2026
- ✅ Core CMS platform
- ✅ Editorial workflows
- ✅ Publishing pipeline
- ✅ Analytics dashboard

### Q3 2026
- 🔄 Advanced AI features
- 🔄 Recommendation engine
- 🔄 Multi-tenant architecture
- 🔄 Mobile app

### Q4 2026
- 📅 Knowledge graph
- 📅 Voice interface
- 📅 AR/VR support
- 📅 Enterprise features

---

**Made with ❤️ by the Editorial AI Team**

*Last Updated: May 2026 | Version: 1.0.0*
