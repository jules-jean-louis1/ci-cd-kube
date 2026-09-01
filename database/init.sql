CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'patient', 'medecin');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'cancelled', 'completed');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstname TEXT NULL,
    lastname TEXT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NULL,
    date_of_birth DATE NULL,
    role user_role NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);


CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE doctor_specialties (
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specialty_id INT REFERENCES specialties(id) ON DELETE CASCADE,
    PRIMARY KEY (doctor_id, specialty_id)
);

CREATE TABLE doctor_schedules (
    id SERIAL PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT DEFAULT 30,
    CONSTRAINT check_times CHECK (start_time < end_time)
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_appointment_times CHECK (start_at < end_at)
);


CREATE INDEX idx_users_search ON users(lastname, email);

CREATE INDEX idx_appointments_conflict_check ON appointments(doctor_id, start_at,end_at);

INSERT INTO users (id, firstname, lastname, email, phone, date_of_birth, role, password_hash) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Jean', 'Dupont', 'jean.dupont@example.com', '0601020304', '1985-05-15', 'medecin', 'hash_medecin'),
('660e8400-e29b-41d4-a716-446655440001', 'Marie', 'Curie', 'marie.curie@example.com', '0605060708', '1990-10-20', 'patient', 'hash_patient');

INSERT INTO specialties (name) VALUES
('Cardiologie'),
('Dermatologie');

INSERT INTO doctor_specialties (doctor_id, specialty_id) VALUES
('550e8400-e29b-41d4-a716-446655440000', 1);

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration) VALUES
('550e8400-e29b-41d4-a716-446655440000', 1, '09:00:00', '17:00:00', 30);

INSERT INTO appointments (patient_id, doctor_id, start_at, end_at, status) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '2026-08-01 10:00:00+02', '2026-08-01 10:30:00+02', 'scheduled');

INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', '2026-08-15 10:00:00');