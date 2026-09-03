-- Drop existing tables to replace the database completely
BEGIN;

DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Enable pgcrypto for bcrypt-style hashing (crypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    firstname TEXT,
    lastname TEXT,
    phone TEXT,
    date_of_birth DATE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Refresh tokens (pour support refresh_token)
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed: roles
INSERT INTO roles (name) VALUES ('admin'), ('user') ON CONFLICT (name) DO NOTHING;

-- Seed: admin user (hashage effectué côté DB avec crypt()).
-- Remplacez les mots de passe en clair ci-dessous si vous souhaitez un mot de passe différent.
INSERT INTO users (email, password, firstname, lastname, phone, date_of_birth, role_id)
VALUES (
    'admin@example.com',
    crypt('ChangeMe123!', gen_salt('bf')),
    'Admin',
    'Seed',
    '0600000000',
    '1980-01-01',
    (SELECT id FROM roles WHERE name = 'admin')
)
ON CONFLICT (email) DO NOTHING;

-- Seed: user
INSERT INTO users (email, password, firstname, lastname, phone, date_of_birth, role_id)
VALUES (
    'user@example.com',
    crypt('userpass', gen_salt('bf')),
    'User',
    'Seed',
    '0600000001',
    '1990-01-01',
    (SELECT id FROM roles WHERE name = 'user')
)
ON CONFLICT (email) DO NOTHING;

-- Seed: exemple de tâche pour l'admin
INSERT INTO tasks (title, description, completed, user_id)
VALUES (
    'Tâche initiale',
    'Tâche créée par le seed',
    FALSE,
    (SELECT id FROM users WHERE email = 'admin@example.com')
)
ON CONFLICT DO NOTHING;

COMMIT;