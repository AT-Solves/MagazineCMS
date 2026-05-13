# MagazineOS Testing Strategy & Execution Guide

## Overview

Comprehensive testing strategy for MagazineOS with target coverage metrics and quality assurance procedures to ensure publication-ready content and robust platform reliability.

## Testing Pyramid

```
        ╱╲
       ╱  ╲         E2E Tests (10%)
      ╱    ╲        - User workflows
     ╱──────╲       - Integration scenarios
    ╱        ╲
   ╱          ╲     Integration Tests (30%)
  ╱____________╲    - Service layer
 ╱              ╲   - Database transactions
╱                ╲  - API contracts
╱__________________╲
Unit Tests (60%)
- Functions
- Services
- Utilities
```

## Unit Testing

### Backend (Jest)

**Target Coverage**: 80%

**Test Structure**:
```bash
backend/test/
├── services/
│   ├── content.service.spec.ts
│   ├── workflow.service.spec.ts
│   ├── publishing.service.spec.ts
│   ├── analytics.service.spec.ts
│   ├── ai.service.spec.ts
│   └── security.service.spec.ts
├── guards/
│   └── auth.guard.spec.ts
└── utils/
    └── slug-generator.spec.ts
```

**Running Tests**:
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run specific test file
npm test -- content.service.spec.ts

# Watch mode (re-run on change)
npm test -- --watch

# Update snapshots
npm test -- -u
```

**Example Test**:
```typescript
describe('ContentService', () => {
  describe('createContent', () => {
    it('should create content with draft status', async () => {
      const result = await service.createContent(
        orgId,
        ContentType.ARTICLE,
        'Test',
        userId,
      );

      expect(result.status).toBe(ContentStatus.DRAFT);
      expect(result.version).toBe(1);
    });

    it('should create workflow history', async () => {
      await service.createContent(
        orgId,
        ContentType.ARTICLE,
        'Test',
        userId,
      );

      expect(workflowRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentState: ContentStatus.DRAFT,
        }),
      );
    });
  });
});
```

### Frontend (Vitest)

**Target Coverage**: 60%

**Test Structure**:
```bash
frontend/src/
├── components/
│   ├── __tests__/
│   │   ├── RichTextEditor.test.tsx
│   │   ├── KanbanBoard.test.tsx
│   │   └── PublishingCenter.test.tsx
│   └── __tests__/
└── stores/
    ├── __tests__/
    │   ├── auth.store.test.ts
    │   └── content.store.test.ts
```

**Running Tests**:
```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Interactive UI
npm run test:ui

# Watch mode
npm run test -- --watch

# Debug mode
npm run test -- --inspect-brk
```

**Example Component Test**:
```typescript
describe('RichTextEditor', () => {
  it('should render editor with toolbar', () => {
    render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
      />,
    );

    expect(
      screen.getByRole('button', { name: /bold/i }),
    ).toBeInTheDocument();
  });

  it('should call onChange on content update', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    await user.click(editor);
    await user.keyboard('test');

    expect(mockOnChange).toHaveBeenCalled();
  });
});
```

## Integration Testing

### Backend Integration Tests

**Target Coverage**: 70%

**Database Setup**:
```typescript
// test/setup.ts
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

export async function setupTestDatabase() {
  const module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'test',
        password: 'test',
        database: 'test_db',
        dropSchema: true,
        synchronize: true,
      }),
    ],
  }).compile();

  return module;
}
```

**Running Integration Tests**:
```bash
cd backend

# Run integration tests
npm run test:e2e

# Run specific suite
npm run test:e2e -- content.e2e.spec.ts

# With coverage
npm run test:e2e -- --coverage
```

**Example Integration Test**:
```typescript
describe('Content Workflow (e2e)', () => {
  it('should complete full workflow: create → review → approve → publish', async () => {
    // Create content
    const content = await contentService.createContent(
      orgId,
      ContentType.ARTICLE,
      'Test Article',
      authorId,
    );

    // Submit for review
    await contentService.submitForReview(content.id, orgId, authorId);

    // Approve
    const approved = await contentService.approveContent(
      content.id,
      orgId,
      reviewerId,
    );
    expect(approved.status).toBe(ContentStatus.APPROVED);

    // Schedule publish
    const scheduled = await publishingService.schedulePublish(
      content.id,
      orgId,
      new Date(),
    );
    expect(scheduled.status).toBe('scheduled');

    // Publish
    const published = await publishingService.executePublish(
      scheduled.id,
    );
    expect(published.status).toBe('published');
  });
});
```

## End-to-End Testing

### Playwright E2E Tests

**Target Coverage**: 50% of critical user paths

**Test Structure**:
```bash
frontend/__tests__/e2e/
├── auth.e2e.spec.ts
├── content-creation.e2e.spec.ts
├── content-review.e2e.spec.ts
├── publishing.e2e.spec.ts
├── analytics.e2e.spec.ts
└── workflows.e2e.spec.ts
```

**Running E2E Tests**:
```bash
cd frontend

# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.e2e.spec.ts

# Debug mode (show browser)
npm run test:e2e -- --headed

# Debug with inspector
npm run test:e2e -- --debug

# Generate report
npm run test:e2e -- --reporter=html
```

**Example E2E Test**:
```typescript
test.describe('Content Creation Workflow', () => {
  test('should create and publish article', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'editor@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Create new content
    await page.click('text=New Content');
    await page.click('text=Article');
    await page.fill('input[name="title"]', 'Test Article');

    // Add content
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.type('This is a test article.');

    // Save
    await page.click('button:has-text("Save Draft")');
    await page.waitForSelector('text=Saved');

    // Submit for review
    await page.click('button:has-text("Submit for Review")');
    await page.fill('textarea[name="notes"]', 'Ready for review');
    await page.click('button:has-text("Submit")');

    // Verify status
    await expect(page.locator('text=In Review')).toBeVisible();
  });
});
```

## Accessibility Testing

**Target**: WCAG 2.1 AA Compliance

### Tools
- axe DevTools
- Lighthouse
- Screen reader testing (NVDA, JAWS)
- Keyboard navigation

### Running Accessibility Tests
```bash
# Install axe-playwright
npm install --save-dev @axe-core/playwright

# Run accessibility scan
npm run test:a11y

# Generate report
npm run test:a11y -- --reporter=json
```

**Example Accessibility Test**:
```typescript
test('should pass accessibility scan', async ({ page }) => {
  await page.goto('/');

  // Run axe accessibility scan
  const accessibilityScanResults = await injectAxe(page);
  await checkA11y(page, null, {
    rules: {
      // Disable specific rules if needed
      'color-contrast': { enabled: false },
    },
  });
});
```

## Performance Testing

**Tools**: Lighthouse, k6

### Running Performance Tests
```bash
# Lighthouse CI
npm run lighthouse:ci

# k6 load testing
npm install -g k6
k6 run tests/performance/load.js
```

**Load Test Example**:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const response = http.get(
    'http://localhost:3000/api/content',
    {
      headers: {
        Authorization: 'Bearer ' + __ENV.TOKEN,
      },
    },
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

## Security Testing

**Tools**: OWASP ZAP, Snyk, Dependabot

### Running Security Scans
```bash
# Snyk vulnerability scan
npm install -g snyk
snyk test
snyk monitor

# OWASP ZAP (Docker)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000
```

### Security Test Checklist
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF token validation
- [ ] Authentication bypass attempts
- [ ] Authorization checks
- [ ] Sensitive data exposure
- [ ] Insecure deserialization
- [ ] Using components with known vulnerabilities

## Content Quality Assurance

### Content QA Checklist
```
☐ Formatting accuracy
☐ Grammar and spelling
☐ Links functional
☐ Images optimized
☐ Alt text present
☐ Metadata complete
☐ SEO fields filled
☐ Taxonomy tags applied
☐ Age appropriateness
☐ Factual accuracy
☐ Tone consistency
```

### Automated Content Validation
```typescript
// Check all required SEO fields
validateSeoMetadata(content) {
  return {
    metaTitle: content.seoMetadata.metaTitle?.length > 0,
    metaDescription: content.seoMetadata.metaDescription?.length > 0,
    keywords: content.seoMetadata.keywords?.length > 0,
    ogImage: content.seoMetadata.ogImageUrl?.length > 0,
  };
}

// Validate content structure
validateContentStructure(content) {
  return {
    hasTitle: content.title?.length > 0,
    hasSummary: content.contentJson.summary?.length > 0,
    hasBody: content.richText.blocks?.length > 0,
    hasImages: content.mediaAssets?.length > 0,
    hasCta: content.contentJson.callToAction?.length > 0,
  };
}
```

## Test Reporting

### Coverage Reports
```bash
# Generate coverage reports
npm run test:cov

# Open coverage report in browser
open coverage/lcov-report/index.html
```

### Test Reports
```bash
# HTML test report
npm run test -- --reporter=html

# JUnit XML (for CI/CD)
npm run test -- --reporter=junit
```

### CI/CD Integration

See `.github/workflows/ci-cd.yml` for automated test execution in CI/CD pipeline.

## Test Maintenance

### Updating Tests
```bash
# Update snapshots
npm test -- -u

# Update visual regression baselines
npm run test:visual -- --update
```

### Flaky Test Management
- Isolate tests to prevent interdependencies
- Use proper setup/teardown
- Mock external dependencies
- Increase timeouts for slow operations
- Retry flaky tests up to 3 times

## Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Backend Unit Tests | 80% | - |
| Backend Integration | 70% | - |
| Frontend Components | 60% | - |
| Frontend Integration | 50% | - |
| Critical Paths | 95% | - |
| Overall Project | 75% | - |

## Running All Tests

```bash
# Backend
cd backend
npm run test:cov     # Unit + coverage
npm run test:e2e     # Integration

# Frontend
cd frontend
npm run test:coverage    # Unit + coverage
npm run test:e2e         # E2E

# All
npm run test:all     # Run all tests across projects
```

## Continuous Integration

Tests automatically run on:
- Pull requests to `develop` and `main`
- Every commit to `main`
- Manual trigger via GitHub Actions

See `.github/workflows/ci-cd.yml` for pipeline configuration.

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names describe what they test
3. **Arrangement**: Setup, Action, Assert pattern
4. **Fixtures**: Use shared test data
5. **Mocking**: Mock external dependencies
6. **Coverage**: Aim for high but realistic coverage
7. **Performance**: Tests should run quickly
8. **Maintenance**: Update tests with code changes

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: May 2026
**Test Framework Version**: Jest 29.7, Vitest 1.0, Playwright 1.40
