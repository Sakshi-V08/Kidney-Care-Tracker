# Database Schema (KHIS)

PostgreSQL (SQLite supported for local demo).

## Core tables

### accounts_user
Custom user: `role` (admin|doctor|patient|caregiver), phone, preferred_language, dark_mode, voice_assistant_enabled.

### patients_patient
Patient profile linked 1:1 to user (optional), M2M caregivers, `folder_name` unique slug for storage path `media/patients/<folder_name>/`, ckd_stage, risk_level, kidney_score.

### patients_upcomingtest
Scheduled labs: test_name, due_date, completed.

### reports_labreport
Uploaded file, SHA-256 `file_hash` (duplicate detection), report_date, hospital_name, doctor_name, status, ocr_raw_text.

### reports_labresult
Extracted investigation rows: investigation_key, raw/standardized value+unit, reference range, status_flag.

### analysis_investigationanalysis
Per-patient latest analysis: trend, severity, rate_of_change, clinical meaning/causes/complications, urgency, confidence.

### analysis_healthsummary
Narrative summary_text + preventive_suggestions JSON.

### analysis_trendsnapshot
Cached chart series JSON per investigation_key.

### chat_chatsession / chat_chatmessage
Patient-grounded AI assistant history.

### notifications_notification
Lab/follow-up alerts with severity.

### trackers_*
bp, weight, water, medicine reminders, appointments, diet plans.

### audit_auditlog
Who/what/when/IP for security review.

## ER overview

```
User 1──1 Patient ──< LabReport ──< LabResult
              │
              ├──< InvestigationAnalysis
              ├──< HealthSummary
              ├──< TrendSnapshot
              ├──< ChatSession ──< ChatMessage
              ├──< Notification
              └──< Trackers (BP/Weight/Water/Meds/Appts/Diet)
```
