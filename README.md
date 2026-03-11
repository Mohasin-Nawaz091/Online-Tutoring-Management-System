# 🎓 Online Tutoring Management System - TutorFlow

A complete full-stack web application designed to connect students with expert tutors. This project features a Python Flask backend, a MySQL database, and a modern, responsive frontend.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your laptop:

1.  **Python 3.10+**
2.  **MySQL Server** (e.g., MySQL Community Server or XAMPP)
3.  **A Web Browser** (Chrome, Firefox, or Edge)

---

## 🚀 Step-by-Step Setup Instructions

### 1. Clone or Extract the Project
Make sure all project files are in a dedicated folder (e.g., `dp_project_sm`).

### 2. Install Python Dependencies
Open your terminal (PowerShell or Command Prompt) in the project root directory and run:

```bash
pip install flask flask-sqlalchemy flask-cors pymysql
```

### 3. Configure MySQL Database
1.  **Start your MySQL Server** (via MySQL Workbench or XAMPP).
2.  **Create the database**:
    Open your MySQL shell and run:
    ```sql
    CREATE DATABASE tutorflow;
    ```
3.  **Update Configuration**:
    Open `backend/config.py` and update the `DB_PASSWORD` with your actual MySQL root password:
    ```python
    DB_PASSWORD = 'your_mysql_password'
    ```

### 4. Initialize & Seed the Database
This step creates the necessary tables and populates them with initial demo data.
In your terminal, navigate to the `backend` folder and run:

```bash
cd backend
python seed.py
```

### 5. Run the Application
To start the backend server, run:

```bash
python app.py
```
*The server will start running at `http://localhost:5000`.*

---

## 🌐 Accessing the Frontend

Once the backend is running:
1.  Navigate back to the project root folder.
2.  Open **`index.html`** in your web browser.
3.  You can now browse tutors, register an account, and book sessions!

---

## 🔑 Default Login Credentials

Use these accounts to test the system immediately:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `alex@student.com` | `123456` |
| **Tutor** | `sarah@tutor.com` | `123456` |
| **Admin** | `admin@tutorflow.com` | `admin123` |

---

## 📂 Project Structure

- `index.html`: Landing page.
- `/js`: Frontend logic and API bridge.
- `/backend`: Flask application, SQLAlchemy models, and routes.
- `backend/config.py`: Database connection settings.
- `backend/seed.py`: Database initialization script.

---

*Developed for University Database Lab Project.*
