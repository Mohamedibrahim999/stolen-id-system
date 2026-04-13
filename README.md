# 🪪 Stolen ID System

A full-stack **Identity Theft Reporting & Verification System** that allows users to report stolen national IDs and check whether an ID has been reported as stolen.

Built with modern technologies including **FastAPI, MySQL, React, JWT authentication, and Argon2 password hashing**.

---

# 🚀 Features

## 🔐 Authentication System

* User registration & login
* Secure password hashing using **Argon2**
* JWT token authentication
* Role-based access control (**User / Admin**)

## 🪪 ID Verification

* Public endpoint to verify if a national ID is stolen
* Fast API response with report details

## 🚨 Stolen ID Reporting

* Authenticated users can report stolen IDs
* Prevents duplicate reports
* Stores police station and report number

## 👑 Admin Dashboard

Admins can:

* View all reported stolen IDs
* Manage records
* Monitor the system database

---

# 🧠 Tech Stack

### Backend

* FastAPI
* PyMySQL
* JWT Authentication
* Passlib (Argon2 hashing)

### Frontend

* React
* Vite
* Axios API requests

### Database

* MySQL

---

# 📁 Project Structure

```
stolen-id-system
│
├── backend
│   ├── main.py
│   ├── requirements.txt
│
├── frontend
│   ├── src
│   ├── package.json
│
├── database
│   └── schema.sql
│
└── README.md
```

---

# ⚙️ Backend Setup

## 1️⃣ Install dependencies

```bash
pip install fastapi uvicorn pymysql passlib[argon2] python-jose
```

## 2️⃣ Start the API server

```bash
uvicorn main:app --reload
```

Server runs on:

```
http://127.0.0.1:8000
```

API documentation:

```
http://127.0.0.1:8000/docs
```

---

# 🌐 Frontend Setup

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🗄️ Database Setup

Create the database:

```sql
CREATE DATABASE stolen_id_system;
USE stolen_id_system;
```

Create tables:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE stolen_ids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    national_id VARCHAR(14) UNIQUE,
    report_number VARCHAR(50),
    police_station VARCHAR(100),
    report_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);
```

---

# 🔑 API Endpoints

## Authentication

### Register

```
POST /register
```

### Login

```
POST /login
```

---

## ID System

### Check National ID

```
GET /check-id?national_id=XXXXXXXXXXXXXX
```

Returns whether the ID is **stolen or clear**.

---

### Report Stolen ID

```
POST /report-id
```

Requires **JWT authentication**.

---

## Admin

### Get all stolen IDs

```
GET /all
```

Admin only endpoint.

---

# 👑 Creating an Admin User

Register a user with:

```
username: ali@admin
password: any password
```

The system automatically assigns the **admin role**.

---

# 🔐 Security Features

* Argon2 password hashing
* JWT authentication
* Protected API routes
* Role-based authorization

---

# 📌 Future Improvements

* ID OCR scanning
* QR verification system
* Face recognition verification
* Deployment with Docker
* Public API gateway

---

# 📜 License

MIT License

---

# 👨‍💻 Author

Mohamed Ibrahim
Software Developer

GitHub:
https://github.com/
