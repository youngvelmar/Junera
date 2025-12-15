-- =========================================
-- RESET COMPLET DES TABLES EXISTANTES
-- =========================================
DROP TABLE IF EXISTS file_link CASCADE;
DROP TABLE IF EXISTS file_upload CASCADE;
DROP TABLE IF EXISTS checklist_log CASCADE;
DROP TABLE IF EXISTS checklist_item CASCADE;
DROP TABLE IF EXISTS action_item CASCADE;
DROP TABLE IF EXISTS company_obligation_instance CASCADE;
DROP TABLE IF EXISTS sector_obligation_link CASCADE;
DROP TABLE IF EXISTS obligation_template CASCADE;
DROP TABLE IF EXISTS legal_text_version CASCADE;
DROP TABLE IF EXISTS legal_source CASCADE;
DROP TABLE IF EXISTS company_profile CASCADE;
DROP TABLE IF EXISTS subsector CASCADE;
DROP TABLE IF EXISTS sector CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS user_organization CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS monthly_bulletin CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;

-- =========================================
-- 1. UTILISATEURS & ORGANISATIONS
-- =========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sector (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE subsector (
  id SERIAL PRIMARY KEY,
  sector_id INTEGER NOT NULL REFERENCES sector(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(255),
  country VARCHAR(255),
  site_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_organization (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE company_profile (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sector_id INTEGER REFERENCES sector(id),
  subsector_id INTEGER REFERENCES subsector(id),
  employee_count INTEGER,
  has_icpe BOOLEAN DEFAULT FALSE,
  has_atex BOOLEAN DEFAULT FALSE,
  uses_chemicals BOOLEAN DEFAULT FALSE,
  transport_type VARCHAR(50),
  waste_types JSONB,
  rse_focus JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 2. TEXTES RÉGLEMENTAIRES
-- =========================================
CREATE TABLE legal_source (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255),
  type VARCHAR(50),
  reference_number VARCHAR(255),
  title TEXT,
  url_official TEXT,
  domain VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE legal_text_version (
  id SERIAL PRIMARY KEY,
  legal_source_id INTEGER NOT NULL REFERENCES legal_source(id) ON DELETE CASCADE,
  version_date DATE NOT NULL,
  full_text TEXT NOT NULL,
  entry_into_force_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 3. OBLIGATIONS GÉNÉRIQUES (TEMPLATES)
-- =========================================
CREATE TABLE obligation_template (
  id SERIAL PRIMARY KEY,
  legal_text_version_id INTEGER NOT NULL REFERENCES legal_text_version(id) ON DELETE CASCADE,
  code VARCHAR(100),
  title TEXT NOT NULL,
  description TEXT,
  references TEXT,
  domaines TEXT,
  risk_type VARCHAR(100),
  sectors JSONB,
  thresholds TEXT,
  severity VARCHAR(50),
  default_frequency VARCHAR(50),
  applicability_condition_raw TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sector_obligation_link (
  id SERIAL PRIMARY KEY,
  obligation_template_id INTEGER NOT NULL REFERENCES obligation_template(id) ON DELETE CASCADE,
  sector_id INTEGER NOT NULL REFERENCES sector(id) ON DELETE CASCADE,
  subsector_id INTEGER REFERENCES subsector(id),
  notes TEXT
);

-- =========================================
-- 4. OBLIGATIONS SPÉCIFIQUES À L’ENTREPRISE
-- =========================================
CREATE TABLE company_obligation_instance (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id INTEGER REFERENCES sites(id),
  obligation_template_id INTEGER NOT NULL REFERENCES obligation_template(id) ON DELETE CASCADE,
  applicability_status VARCHAR(20),
  severity VARCHAR(50),
  ai_reason TEXT,
  first_detected_at TIMESTAMP DEFAULT NOW(),
  last_reviewed_at TIMESTAMP,
  due_date DATE,
  comments TEXT
);

-- =========================================
-- 5. ACTIONS (PLAN D’ACTIONS)
-- =========================================
CREATE TABLE action_item (
  id SERIAL PRIMARY KEY,
  company_obligation_instance_id INTEGER NOT NULL REFERENCES company_obligation_instance(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(50),
  domaine VARCHAR(50),
  reference_legale TEXT,
  risk_if_not_done TEXT,
  preuve_attendue TEXT,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  due_date DATE,
  completed_at TIMESTAMP,
  completed_by INTEGER REFERENCES users(id),
  completed_comment TEXT
);

-- =========================================
-- 6. CHECKLISTS (CONFIG) & LOGS
-- =========================================
CREATE TABLE checklist_item (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id INTEGER REFERENCES sites(id),
  company_obligation_instance_id INTEGER REFERENCES company_obligation_instance(id),
  action_item_id INTEGER REFERENCES action_item(id),
  label TEXT NOT NULL,
  domaine VARCHAR(50),
  frequency VARCHAR(50),
  month_target INTEGER,
  severity VARCHAR(50),
  dependency_checklist_id INTEGER REFERENCES checklist_item(id),
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE checklist_log (
  id SERIAL PRIMARY KEY,
  checklist_item_id INTEGER NOT NULL REFERENCES checklist_item(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id INTEGER REFERENCES sites(id),
  done_at TIMESTAMP DEFAULT NOW(),
  done_by INTEGER REFERENCES users(id),
  comment TEXT,
  attachments JSONB
);

-- =========================================
-- 7. FICHIERS / PREUVES
-- =========================================
CREATE TABLE file_upload (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by INTEGER REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE file_link (
  id SERIAL PRIMARY KEY,
  file_id INTEGER NOT NULL REFERENCES file_upload(id) ON DELETE CASCADE,
  action_item_id INTEGER REFERENCES action_item(id) ON DELETE CASCADE,
  checklist_log_id INTEGER REFERENCES checklist_log(id) ON DELETE CASCADE
);

-- =========================================
-- 8. BULLETINS, NOTIFICATIONS, AUDIT
-- =========================================
CREATE TABLE monthly_bulletin (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  summary_text TEXT
);

CREATE TABLE notification (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  type VARCHAR(50),
  payload JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  action VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);