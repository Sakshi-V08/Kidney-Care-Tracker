import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.patients.models import Patient
from apps.reports.services.ocr import parse_lab_text
from apps.reports.services.units import convert_value, creatinine_to_umol, flag_status
from apps.analysis.services.scoring import egfr_to_stage, compute_kidney_score


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def patient_user(db):
    user = User.objects.create_user(username="testpatient", password="pass12345", role=User.Role.PATIENT)
    Patient.objects.create(user=user, full_name="Test Patient")
    return user


@pytest.mark.django_db
def test_register_and_login(api):
    resp = api.post(
        "/api/v1/auth/register/",
        {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
            "first_name": "New",
            "last_name": "User",
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    login = api.post("/api/v1/auth/login/", {"username": "newuser", "password": "StrongPass123!"}, format="json")
    assert login.status_code == status.HTTP_200_OK
    assert "access" in login.data


@pytest.mark.django_db
def test_patient_dashboard_requires_auth(api):
    resp = api.get("/api/v1/dashboard/")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_patient_dashboard(api, patient_user):
    api.force_authenticate(user=patient_user)
    resp = api.get("/api/v1/dashboard/")
    assert resp.status_code == status.HTTP_200_OK
    assert "overall_kidney_score" in resp.data
    assert "disclaimer" in resp.data


def test_creatinine_unit_conversion():
    mg, unit = convert_value("creatinine", 221.0, "umol/L")
    assert unit == "mg/dL"
    assert abs(mg - 2.5) < 0.05
    assert creatinine_to_umol(2.5) == 221.0


def test_flag_potassium_critical():
    assert flag_status("potassium", 6.5, 3.5, 5.0) == "critical"


def test_egfr_staging():
    assert egfr_to_stage(95) == "1"
    assert egfr_to_stage(50) == "3a"
    assert egfr_to_stage(20) == "4"
    assert egfr_to_stage(10) == "5"


def test_ocr_parse_sample_text():
    text = """
    Hospital: City Lab
    Doctor: Dr. Mehta
    Report Date: 10/12/2025
    Creatinine 3.1 mg/dL (0.6-1.3)
    eGFR 24 mL/min/1.73m2
    Potassium 4.8 mEq/L (3.5-5.0)
    Blood Urea 58 mg/dL (15-40)
    """
    parsed = parse_lab_text(text)
    keys = {r.investigation_key for r in parsed.results}
    assert "creatinine" in keys
    assert "egfr" in keys
    assert "potassium" in keys
    assert parsed.hospital_name
    assert parsed.report_date == "2025-12-10"


@pytest.mark.django_db
def test_chat_endpoint(api, patient_user):
    api.force_authenticate(user=patient_user)
    patient = patient_user.patient_profile
    resp = api.post(
        "/api/v1/chat/",
        {"patient": patient.id, "message": "Explain eGFR."},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    assert "reply" in resp.data
    assert "educational" in resp.data["reply"].lower() or "informational" in resp.data["reply"].lower() or "consult" in resp.data["reply"].lower()
