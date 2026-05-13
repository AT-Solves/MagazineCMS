-- MagazineOS PostgreSQL Schema
-- Comprehensive Content Management System for AI-Generated Magazine Publishing
-- Version 1.0.0

-- Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- ORGANIZATIONS & USERS
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    tier VARCHAR(50) NOT NULL DEFAULT 'pro' CHECK (tier IN ('free', 'pro', 'enterprise')),
    max_concurrent_editors INTEGER NOT NULL DEFAULT 10,
    max_monthly_publishes INTEGER NOT NULL DEFAULT 1000,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'author' CHECK (role IN ('admin', 'editor', 'author', 'reviewer', 'publisher')),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_safety_clearance BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- CONTENT ITEMS & VERSIONING
-- ============================================================================

CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'story', 'quiz', 'activity', 'interactive_story')),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('brief', 'draft', 'in_review', 'approved', 'scheduled', 'published', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    current_reviewer UUID REFERENCES users(id) ON DELETE SET NULL,
    content_json JSONB NOT NULL DEFAULT '{}',
    rich_text JSONB NOT NULL DEFAULT '{}',
    metadata_json JSONB DEFAULT '{}',
    publish_at TIMESTAMP,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_content_items_org_id ON content_items(org_id);
CREATE INDEX idx_content_items_slug ON content_items(slug);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_created_by ON content_items(created_by);
CREATE INDEX idx_content_items_publish_at ON content_items(publish_at);
CREATE INDEX idx_content_items_created_at ON content_items(created_at DESC);

CREATE TABLE content_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('draft_save', 'minor_edit', 'major_edit', 'review_feedback', 'approval')),
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    previous_state JSONB,
    new_state JSONB NOT NULL,
    diff JSONB,
    change_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, version)
);

CREATE INDEX idx_content_revisions_content_id ON content_revisions(content_id);

-- ============================================================================
-- WORKFLOW & STATE MANAGEMENT
-- ============================================================================

CREATE TABLE workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    current_state VARCHAR(50) NOT NULL CHECK (current_state IN ('brief', 'draft', 'in_review', 'approved', 'scheduled', 'published')),
    previous_state VARCHAR(50),
    transition_reason TEXT,
    triggered_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_states_content_id ON workflow_states(content_id);
CREATE INDEX idx_workflow_states_timestamp ON workflow_states(timestamp DESC);

-- ============================================================================
-- MEDIA & ASSETS
-- ============================================================================

CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(1000) NOT NULL UNIQUE,
    mime_type VARCHAR(100),
    duration INTEGER,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    caption TEXT,
    tags JSONB DEFAULT '[]',
    usage_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_media_assets_org_id ON media_assets(org_id);
CREATE INDEX idx_media_assets_s3_key ON media_assets(s3_key);
CREATE INDEX idx_media_assets_created_at ON media_assets(created_at DESC);

CREATE TABLE content_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    position_order INTEGER NOT NULL,
    section VARCHAR(100),
    placement_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, media_id)
);

CREATE INDEX idx_content_media_content_id ON content_media(content_id);
CREATE INDEX idx_content_media_media_id ON content_media(media_id);

-- ============================================================================
-- TAXONOMY & TAGGING
-- ============================================================================

CREATE TABLE taxonomy_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('subject', 'age_group', 'content_type', 'skill', 'curriculum_topic', 'learning_outcome')),
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7),
    icon_name VARCHAR(100),
    parent_tag_id UUID REFERENCES taxonomy_tags(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, slug, category)
);

CREATE INDEX idx_taxonomy_tags_org_id ON taxonomy_tags(org_id);
CREATE INDEX idx_taxonomy_tags_category ON taxonomy_tags(category);

CREATE TABLE content_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES taxonomy_tags(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, tag_id)
);

CREATE INDEX idx_content_tags_content_id ON content_tags(content_id);
CREATE INDEX idx_content_tags_tag_id ON content_tags(tag_id);

-- ============================================================================
-- SEO & METADATA
-- ============================================================================

CREATE TABLE seo_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE UNIQUE,
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    slug VARCHAR(500),
    canonical_url VARCHAR(1000),
    og_title VARCHAR(200),
    og_description VARCHAR(500),
    og_image_url VARCHAR(1000),
    twitter_card VARCHAR(50),
    keywords JSONB DEFAULT '[]',
    robots_directive VARCHAR(100) DEFAULT 'index, follow',
    structured_data JSONB DEFAULT '{}',
    focus_keyword VARCHAR(100),
    readability_score INTEGER,
    seo_score INTEGER,
    ai_suggestions JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seo_metadata_content_id ON seo_metadata(content_id);

-- ============================================================================
-- PUBLISHING & SCHEDULING
-- ============================================================================

CREATE TABLE publishing_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    publish_at TIMESTAMP NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
    published_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_publishing_schedule_content_id ON publishing_schedule(content_id);
CREATE INDEX idx_publishing_schedule_publish_at ON publishing_schedule(publish_at);
CREATE INDEX idx_publishing_schedule_status ON publishing_schedule(status);

-- ============================================================================
-- CONTENT MODERATION & COMPLIANCE
-- ============================================================================

CREATE TABLE content_moderation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'rejected')),
    flags JSONB DEFAULT '[]',
    ai_risk_score DECIMAL(3,2) DEFAULT 0.0,
    ai_analysis JSONB DEFAULT '{}',
    manual_review_by UUID REFERENCES users(id) ON DELETE SET NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    age_appropriateness_score INTEGER,
    factual_accuracy_verified BOOLEAN DEFAULT FALSE,
    content_safety_checks JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_moderation_content_id ON content_moderation(content_id);
CREATE INDEX idx_content_moderation_status ON content_moderation(status);

-- ============================================================================
-- ANALYTICS & ENGAGEMENT
-- ============================================================================

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'engagement', 'completion', 'share', 'quiz_submit', 'bookmark', 'comment')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    anonymous_user_id VARCHAR(255),
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    device_type VARCHAR(50),
    country_code VARCHAR(2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_org_id ON analytics_events(org_id);
CREATE INDEX idx_analytics_events_content_id ON analytics_events(content_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);

CREATE TABLE engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE UNIQUE,
    total_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    average_time_on_page DECIMAL(8,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    quiz_submissions INTEGER DEFAULT 0,
    quiz_average_score DECIMAL(5,2),
    comment_count INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engagement_metrics_content_id ON engagement_metrics(content_id);

-- ============================================================================
-- AUDIT & LOGGING
-- ============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    change_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failure')),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity_id ON audit_log(entity_id);

-- ============================================================================
-- MULTILINGUAL SUPPORT
-- ============================================================================

CREATE TABLE content_locales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL,
    title VARCHAR(500),
    slug VARCHAR(500),
    content_json JSONB,
    rich_text JSONB,
    metadata_json JSONB,
    seo_metadata_id UUID REFERENCES seo_metadata(id) ON DELETE SET NULL,
    is_translated BOOLEAN DEFAULT FALSE,
    translated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    translation_status VARCHAR(50) DEFAULT 'pending' CHECK (translation_status IN ('pending', 'in_progress', 'completed', 'reviewed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, locale)
);

CREATE INDEX idx_content_locales_content_id ON content_locales(content_id);
CREATE INDEX idx_content_locales_locale ON content_locales(locale);

-- ============================================================================
-- COLLABORATIONS & COMMENTS
-- ============================================================================

CREATE TABLE content_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_comments_content_id ON content_comments(content_id);
CREATE INDEX idx_content_comments_author_id ON content_comments(author_id);

-- ============================================================================
-- INTEGRATIONS & WEBHOOKS
-- ============================================================================

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(100) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    target_url VARCHAR(1000) NOT NULL,
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    retry_on_failure BOOLEAN DEFAULT TRUE,
    max_retries INTEGER DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_org_id ON webhooks(org_id);
CREATE INDEX idx_webhooks_event_type ON webhooks(event_type);

CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_id UUID,
    status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

CREATE VIEW published_content AS
SELECT
    ci.id,
    ci.org_id,
    ci.type,
    ci.title,
    ci.slug,
    ci.created_by,
    ci.published_at,
    em.total_views,
    em.unique_visitors,
    em.completion_rate,
    cm.status as moderation_status
FROM content_items ci
LEFT JOIN engagement_metrics em ON ci.id = em.content_id
LEFT JOIN content_moderation cm ON ci.id = cm.content_id
WHERE ci.status = 'published' AND ci.deleted_at IS NULL;

CREATE VIEW content_in_review AS
SELECT
    ci.id,
    ci.org_id,
    ci.title,
    ci.slug,
    ci.created_by,
    ci.current_reviewer,
    ci.created_at,
    ci.updated_at,
    cm.status as moderation_status,
    cm.flags
FROM content_items ci
LEFT JOIN content_moderation cm ON ci.id = cm.content_id
WHERE ci.status = 'in_review' AND ci.deleted_at IS NULL;

CREATE VIEW upcoming_publishes AS
SELECT
    ps.id,
    ps.content_id,
    ci.title,
    ci.slug,
    ps.publish_at,
    ps.locale,
    ps.status,
    ps.created_by
FROM publishing_schedule ps
JOIN content_items ci ON ps.content_id = ci.id
WHERE ps.status = 'scheduled' AND ps.publish_at > CURRENT_TIMESTAMP
ORDER BY ps.publish_at ASC;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organizations_update
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_users_update
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_content_items_update
    BEFORE UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_media_assets_update
    BEFORE UPDATE ON media_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_seo_metadata_update
    BEFORE UPDATE ON seo_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_content_moderation_update
    BEFORE UPDATE ON content_moderation
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- GRANTS (for application user)
-- ============================================================================

-- Create application user (run separately after migrations)
-- CREATE USER magazineos_app WITH PASSWORD 'secure_password';
-- GRANT CONNECT ON DATABASE magazineos TO magazineos_app;
-- GRANT USAGE ON SCHEMA public TO magazineos_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO magazineos_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO magazineos_app;
