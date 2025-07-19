# 🎯 Role-Based Task Manager Portal

A full-stack web application for managing academic tasks with role-based dashboards and permissions. Built using **React.js** (frontend), **Spring Boot** (backend), and **MySQL** (database).

---

## 🚀 Features

### 👨‍🏫 HOD (Head of Department)
- Register & login as HOD
- View all faculty members
- Assign tasks to faculty with:
  - Task title & description
  - Start date & deadline
- Track task progress submitted by faculty

### 👩‍🏫 Faculty
- Register & login as Faculty
- View tasks assigned by HOD
- Update task status (Pending / In-progress / Completed)
- Assign tasks to students
- Monitor student submissions

### 👨‍🎓 Student
- Register & login as Student
- View tasks assigned by faculty
- Upload documents such as:
  - Fee receipts
  - Assignment/project files
- View task status and faculty feedback

---

## 🔐 Role-Based Authentication

- Users can register and login based on their role (Student, Faculty, or HOD)
- Protected dashboards using JWT-based authentication
- Role-based routing and access control

---

## 🛠 Tech Stack

| Layer        | Technology     |
|--------------|----------------|
| 🖥 Frontend   | React.js, Tailwind CSS |
| 🧠 Backend    | Spring Boot (Java), Spring Security |
| 💽 Database   | MySQL |
| 🔒 Auth       | JWT (JSON Web Token) |

---

## 📁 Folder Structure Overview

### 📦 Backend (Spring Boot)

