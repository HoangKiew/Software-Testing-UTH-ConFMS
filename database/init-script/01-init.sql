CREATE DATABASE db_identity;
CREATE DATABASE db_conference;
CREATE DATABASE db_submission;
CREATE DATABASE db_review;

CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  score INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);