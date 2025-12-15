-- =========================
-- 1. UTILISATEURS & ENTREPRISES
-- =========================
 
CREATE TABLE users (
 id SERIAL PRIMARY KEY,
 email VARCHAR(255) UNIQUE NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 role VARCHAR(50) NOT NULL, -- 'admin', 'client'
 created_at TIMESTAMP DEFAULT NOW(),
 updated_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE organizations (
 id SERIAL PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 type VARCHAR(50), -- 'AE', 'TPE', 'PME', 'cabinet'
 created_at TIMESTAMP DEFAULT NOW(),
 updated_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE user_organization (
 id SERIAL PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 role VARCHAR(50) NOT NULL, -- 'owner', 'member'
 created_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE sites (
 id SERIAL PRIMARY KEY,
 organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 name VARCHAR(255) NOT NULL,
 address TEXT,
 city VARCHAR(255),
 country VARCHAR(255),
 site_type VARCHAR(50), -- 'bureau','atelier','entrepot','restaurant','chantier', etc.
 created_at TIMESTAMP DEFAULT NOW(),
 updated_at TIMESTAMP DEFAULT NOW()
);
 
-- =========================
-- 2. SECTEURS & PROFIL ENTREPRISE
-- =========================
 
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
 
CREATE TABLE company_profile (
 id SERIAL PRIMARY KEY,
 organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 sector_id INTEGER REFERENCES sector(id),
 subsector_id INTEGER REFERENCES subsector(id),
 employee_count INTEGER,
 has_icpe BOOLEAN DEFAULT FALSE,
 has_atex BOOLEAN DEFAULT FALSE,
 uses_chemicals BOOLEAN DEFAULT FALSE,
 transport_type VARCHAR(50), -- 'none','non_dangerous','adr'
 waste_types JSONB,         -- ex: ["dechets_dangereux","dechets_btp"]
 rse_focus JSONB,           -- ex: ["dechets","energie"]
 created_at TIMESTAMP DEFAULT NOW(),
 updated_at TIMESTAMP DEFAULT NOW()
);
 
-- =========================
-- 3. TEXTES RÉGLEMENTAIRES
-- =========================
 
CREATE TABLE legal_source (
 id SERIAL PRIMARY KEY,
 external_id VARCHAR(255),   -- ID Légifrance ou autre
 type VARCHAR(50),          -- 'loi','decret','arrete','directive','note'
 reference_number VARCHAR(255),
 title TEXT,
 url_official TEXT,
 domain VARCHAR(50),        -- 'QSE','RSE','ICPE','ATEX',...
 created_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE legal_text_version (
 id SERIAL PRIMARY KEY,
 legal_source_id INTEGER NOT NULL REFERENCES legal_source(id) ON DELETE CASCADE,
 version_date DATE NOT NULL,
 full_text TEXT NOT NULL,
 entry_into_force_date DATE,
 status VARCHAR(50), -- 'active','repealed'
 created_at TIMESTAMP DEFAULT NOW()
);
 
-- =========================
-- 4. OBLIGATIONS GÉNÉRIQUES (TEMPLATES)
-- =========================
 
CREATE TABLE obligation_template (
 id SERIAL PRIMARY KEY,
 legal_text_version_id INTEGER NOT NULL REFERENCES legal_text_version(id) ON DELETE CASCADE,
 code VARCHAR(100),              -- code interne ex: SEC-INC-001
 title TEXT NOT NULL,
 description TEXT,
 references TEXT,                -- texte brut : articles, numéros
 domaines TEXT,                  -- ex: '["SECURITE","INCENDIE"]'
 risk_type VARCHAR(100),         -- 'chute','incendie','chimique', etc.
 sectors JSONB,                  -- ex: ["btp","logistique"]
 thresholds TEXT,                -- description seuils (texte libre, ex: "> 500 m3")
 severity VARCHAR(50),           -- 'low','medium','high','critical'
 default_frequency VARCHAR(50),   -- 'once','monthly','yearly','conditional'
 applicability_condition_raw TEXT, -- texte libre, pour aide à l'IA
 created_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE sector_obligation_link (
 id SERIAL PRIMARY KEY,
 obligation_template_id INTEGER NOT NULL REFERENCES obligation_template(id) ON DELETE CASCADE,
 sector_id INTEGER NOT NULL REFERENCES sector(id) ON DELETE CASCADE,
 subsector_id INTEGER REFERENCES subsector(id),
 notes TEXT
);
 
-- =========================
-- 5. OBLIGATIONS SPÉCIFIQUES À L’ENTREPRISE
-- =========================
 
CREATE TABLE company_obligation_instance (
 id SERIAL PRIMARY KEY,
 organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 site_id INTEGER REFERENCES sites(id), -- nullable si obligation globale
 obligation_template_id INTEGER NOT NULL REFERENCES obligation_template(id) ON DELETE CASCADE,
 applicability_status VARCHAR(20), -- 'applicable','not_applicable','to_verify'
 severity VARCHAR(50),           -- recopie/ajustement depuis template
 ai_reason TEXT,                 -- explication IA sur l'applicabilité
 first_detected_at TIMESTAMP DEFAULT NOW(),
 last_reviewed_at TIMESTAMP,
 due_date DATE,
 comments TEXT
);
 
-- =========================
-- 6. ACTIONS (PLAN D’ACTIONS)
-- =========================
 
CREATE TABLE action_item (
 id SERIAL PRIMARY KEY,
 company_obligation_instance_id INTEGER NOT NULL REFERENCES company_obligation_instance(id) ON DELETE CASCADE,
 title TEXT NOT NULL,
 description TEXT,
 priority VARCHAR(50), -- 'critical','high','medium','low'
 domaine VARCHAR(50),  -- 'SECURITE','INCENDIE','ICPE','ATEX','CHIMIQUE','ENVIRONNEMENT','RSE','QUALITE'
 reference_legale TEXT,
 risk_if_not_done TEXT,
 preuve_attendue TEXT,
 
 status VARCHAR(50) DEFAULT 'open', -- 'open','in_progress','done','ignored'
 created_at TIMESTAMP DEFAULT NOW(),
 due_date DATE,
 completed_at TIMESTAMP,
 completed_by INTEGER REFERENCES users(id),
 completed_comment TEXT
);
 
-- =========================
-- 7. CHECKLISTS (CONFIG) & LOGS
-- =========================
 
-- Configuration des tâches récurrentes pour une entreprise
CREATE TABLE checklist_item (
 id SERIAL PRIMARY KEY,
 organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 site_id INTEGER REFERENCES sites(id),
 
 company_obligation_instance_id INTEGER REFERENCES company_obligation_instance(id),
 action_item_id INTEGER REFERENCES action_item(id),
 
 label TEXT NOT NULL,                -- texte visible pour l'utilisateur
 domaine VARCHAR(50),                -- 'SECURITE','INCENDIE',...
 frequency VARCHAR(50),              -- 'monthly','quarterly','semiannual','yearly','on_event','daily'
 month_target INTEGER,               -- 1-12 ou NULL
 severity VARCHAR(50),               -- 'critical','high','medium','low'
 
 dependency_checklist_id INTEGER REFERENCES checklist_item(id),
 is_mandatory BOOLEAN DEFAULT TRUE,   -- obligation légale ou recommandation (RSE)
 created_at TIMESTAMP DEFAULT NOW()
);
 
-- Historique des "Fait" sur les checklists (log)
CREATE TABLE checklist_log (
 id SERIAL PRIMARY KEY,
 checklist_item_id INTEGER NOT NULL REFERENCES checklist_item(id) ON DELETE CASCADE,
 organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 site_id INTEGER REFERENCES sites(id),
 
 done_at TIMESTAMP DEFAULT NOW(),
 done_by INTEGER REFERENCES users(id),
 comment TEXT,
 attachments JSONB  -- liste d'URLs de fichiers
);
 
-- =========================
-- 8. FICHIERS / PREUVES
-- =========================
 
CREATE TABLE file_upload (
 id SERIAL PRIMARY KEY,
 organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
 uploaded_by INTEGER REFERENCES users(id),
 file_name TEXT NOT NULL,
 file_url TEXT NOT NULL,     -- stockage MinIO / S3
 file_size BIGINT,
 file_type VARCHAR(255),
 created_at TIMESTAMP DEFAULT NOW()
);
 
-- Liens entre fichiers et actions/checklists (facultatif mais propre)
CREATE TABLE file_link (
 id SERIAL PRIMARY KEY,
 file_id INTEGER NOT NULL REFERENCES file_upload(id) ON DELETE CASCADE,
 action_item_id INTEGER REFERENCES action_item(id) ON DELETE CASCADE,
 checklist_log_id INTEGER REFERENCES checklist_log(id) ON DELETE CASCADE
);
 
-- =========================
-- 9. BULLETINS, NOTIFICATIONS, AUDIT
-- =========================
 
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
 type VARCHAR(50), -- 'new_obligation','action_due','checklist_reminder'
 payload JSONB,
 read_at TIMESTAMP,
 created_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE audit_log (
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id),
 organization_id INTEGER REFERENCES organizations(id),
 action VARCHAR(255),     -- ex: 'ACTION_COMPLETED','CHECKLIST_DONE'
 entity_type VARCHAR(100), -- 'action_item','checklist_item','company_obligation_instance',...
 entity_id INTEGER,
 created_at TIMESTAMP DEFAULT NOW(),
 metadata JSONB
);