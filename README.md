# Healthcare Diagnosis System (Internship Project)

This repository showcases my contributions during my internship as a Software Engineering Intern at VCS Systems. The project focuses on building and enhancing a healthcare diagnosis monitoring system used by medical professionals and patients.

---

## Overview

CardioNeuroPots is a multi-role cross-platform (iOS & Android) healthcare application designed to assist providers in managing and analyzing patient diagnoses. The system supports real-time data access, diagnosis tracking, and AI-driven insights.

The application serves:
- 15,000+ patients  
- 300+ healthcare providers  

---

## My Contributions

- Developed and owned the **patient diagnosis module**, supporting both single and multiple diagnoses  
- Implemented diagnosis handling across **500+ patient records and 120+ ICD-10 codes**  
- Built and integrated backend APIs using **ASP.NET C# REST architecture**  

- Designed and implemented a **SQL stored procedure** to handle:
  - Add diagnosis  
  - Fetch diagnosis (list & individual)  
  - Update diagnosis  
  - Delete diagnosis  

- Developed frontend components including:
  - Diagnosis Tab UI  
  - Add Patient Details Modal  

- Integrated **AI-based clinical insights** and enabled storage of AI-generated results  

- Tested and validated APIs using **Postman**  

---

## AI Integration

- Integrated AI-driven clinical insights using OpenRouter API  
- Built a Python Flask backend for processing diagnosis data  
- Deployed backend on Render  
- Enabled automated diagnosis analysis and persistent storage in SQL Server  

---

## Architecture

SQL Server (Database)  
↓  
ASP.NET C# REST API (Backend)  
↓  
React Native (Frontend - iOS & Android)  

---

## Tech Stack

- React Native (TypeScript)  
- ASP.NET C#  
- SQL Server  
- Python (Flask)  
- OpenRouter API  
- Redux  
- Postman  
- Render  
- Xcode & Android Emulator  

---

## Screenshots

### Diagnosis Tab

<img width="739" height="1600" alt="e2836e7e-6489-4afd-9fe8-7beffe3ba641" src="https://github.com/user-attachments/assets/d21cc1fd-b252-4f12-898a-4b593fb784ed" />

<img width="739" height="1600" alt="24d3bb60-ce7f-4007-adf4-a3391a085250" src="https://github.com/user-attachments/assets/272b634c-c5c7-44c2-b734-1dbfc5eacf6e" />

### Add Patient Modal

<img width="739" height="1600" alt="da38bb9e-7ff7-4ec8-a058-0c50ee436352" src="https://github.com/user-attachments/assets/f0aa0fbb-c3da-4bfe-92ce-015dfab58a8c" />

<img width="739" height="1600" alt="f4b958ad-25df-42a0-80a9-a991832250b0" src="https://github.com/user-attachments/assets/edf6b401-0aa2-4eac-94d0-895507ef2c6c" />

### API Testing (Postman)

<img width="921" height="615" alt="Screenshot 2026-04-08 130651" src="https://github.com/user-attachments/assets/30505bd0-2357-442a-8cb7-29319a195129" />

<img width="754" height="601" alt="Screenshot 2026-04-08 110842" src="https://github.com/user-attachments/assets/6d887f2e-0825-46f7-8400-07a33841a682" />

<img width="769" height="583" alt="Screenshot 2026-04-08 110729" src="https://github.com/user-attachments/assets/fa91267d-a3bd-4cae-8daf-48ea7e59e704" />






---
## Code Structure

- `code_snippets/backend/stored_procedure.sql` → Handles diagnosis CRUD operations  
- `code_snippets/diagnosisAPI.tsx` → Backend API integration  
- `code_snippets/DiagnosisTab.tsx` → Frontend diagnosis management UI  
- `code_snippets/addDiagnosisModal.tsx` → Patient data input component  

## Note

This project was developed during my internship at VCS Systems.  
Due to company confidentiality policies, the complete source code cannot be shared.

This repository includes only selected code snippets, database procedures, and screenshots that demonstrate my contributions.
