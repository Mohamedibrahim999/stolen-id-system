CREATE DATABASE stolen_id_system;
USE stolen_id_system;

-- USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user'
);

-- STOLEN IDS TABLE
CREATE TABLE stolen_ids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    national_id VARCHAR(14) UNIQUE,
    report_number VARCHAR(50),
    police_station VARCHAR(100),
    report_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- Add index for faster lookups
CREATE INDEX idx_national_id ON stolen_ids(national_id);

select * from stolen_ids

select * from users