-- =========================
-- CREATE DATABASES
-- =========================
CREATE DATABASE db_identity;
CREATE DATABASE db_conference;
CREATE DATABASE db_submission;
CREATE DATABASE db_review;

-- =========================
-- CONNECT TO REVIEW DB
-- =========================
\c db_review;

-- =========================
-- TABLE: review_assignments
-- =========================
CREATE TABLE review_assignments (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    conference_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'assigned'
);

-- =========================
-- TABLE: reviews
-- =========================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    conference_id INT NOT NULL,

    score INT CHECK (score >= 0 AND score <= 10),
    comment TEXT,

    decision VARCHAR(20) CHECK (decision IN ('Chap nhan', 'Tu choi', 'Sua doi')),
    submitted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
