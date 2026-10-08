-- EDUFA (Education For All) - Bursary & Sponsorship Allocation Fairness Scorer
-- PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'applicant', -- 'applicant' | 'committee' | 'admin'
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  region TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  financial_data_json TEXT NOT NULL,
  academic_data_json TEXT NOT NULL,
  alignment_data_json TEXT NOT NULL,
  funding_scope_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted', -- 'draft' | 'submitted' | 'under_review' | 'more_info_requested' | 'approved' | 'rejected'
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS score_records (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  need_score DOUBLE PRECISION NOT NULL,           -- Max 35% weight
  academic_score DOUBLE PRECISION NOT NULL,       -- Max 25% weight
  alignment_score DOUBLE PRECISION NOT NULL,      -- Max 20% weight
  sustainability_score DOUBLE PRECISION NOT NULL, -- Max 20% weight
  composite_score DOUBLE PRECISION NOT NULL,     -- Composite Fairness Score (0-100)
  explanation_json TEXT NOT NULL,                -- Positive drivers, risk flags, rationale narrative
  calculated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- 'approve' | 'reject' | 'request_info'
  notes TEXT NOT NULL,
  decided_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_score_records_application_id ON score_records(application_id);
CREATE INDEX IF NOT EXISTS idx_score_records_composite_score ON score_records(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_application_id ON decisions(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
