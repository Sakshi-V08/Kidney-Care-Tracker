"""
Unit conversion and reference-range helpers for laboratory values.
Standard units (SI-leaning with common clinical defaults):
  creatinine -> mg/dL (also store µmol/L equivalent)
  urea/BUN   -> mg/dL
  electrolytes -> mEq/L or mmol/L (1:1 for Na/K/Cl)
  egfr -> mL/min/1.73m²
"""
from __future__ import annotations

import re
from typing import Optional, Tuple

# Conversion factors to preferred storage units
CREATININE_MGDL_TO_UMOLL = 88.4
BUN_TO_UREA = 2.14  # approx BUN mg/dL * 2.14 ≈ urea mg/dL
UREA_TO_BUN = 1 / 2.14

PREFERRED_UNITS = {
    "creatinine": "mg/dL",
    "blood_urea": "mg/dL",
    "bun": "mg/dL",
    "egfr": "mL/min/1.73m2",
    "uric_acid": "mg/dL",
    "sodium": "mEq/L",
    "potassium": "mEq/L",
    "chloride": "mEq/L",
    "calcium": "mg/dL",
    "phosphorus": "mg/dL",
    "albumin": "g/dL",
    "total_protein": "g/dL",
    "hemoglobin": "g/dL",
    "hba1c": "%",
    "fasting_sugar": "mg/dL",
    "random_sugar": "mg/dL",
    "hdl": "mg/dL",
    "ldl": "mg/dL",
    "triglycerides": "mg/dL",
    "total_cholesterol": "mg/dL",
    "alt": "U/L",
    "ast": "U/L",
    "alp": "U/L",
    "bilirubin": "mg/dL",
    "weight": "kg",
    "bmi": "kg/m2",
    "systolic_bp": "mmHg",
    "diastolic_bp": "mmHg",
    "protein_creatinine_ratio": "mg/g",
    "microalbumin": "mg/L",
}

# Default adult reference ranges in preferred units (educational defaults)
DEFAULT_REFERENCES = {
    "creatinine": (0.6, 1.3),
    "blood_urea": (15, 40),
    "bun": (7, 20),
    "egfr": (90, 200),
    "uric_acid": (3.5, 7.2),
    "sodium": (135, 145),
    "potassium": (3.5, 5.0),
    "chloride": (96, 106),
    "calcium": (8.5, 10.5),
    "phosphorus": (2.5, 4.5),
    "albumin": (3.5, 5.0),
    "total_protein": (6.0, 8.3),
    "hemoglobin": (12.0, 17.5),
    "hba1c": (4.0, 5.6),
    "fasting_sugar": (70, 100),
    "random_sugar": (70, 140),
    "hdl": (40, 100),
    "ldl": (0, 100),
    "triglycerides": (0, 150),
    "total_cholesterol": (0, 200),
    "alt": (7, 56),
    "ast": (10, 40),
    "alp": (44, 147),
    "bilirubin": (0.1, 1.2),
    "systolic_bp": (90, 120),
    "diastolic_bp": (60, 80),
    "protein_creatinine_ratio": (0, 150),
}


def normalize_unit(unit: str) -> str:
    if not unit:
        return ""
    u = unit.strip().lower().replace("µ", "u").replace("μ", "u")
    u = u.replace(" ", "")
    replacements = {
        "mg/dl": "mg/dL",
        "mgdl": "mg/dL",
        "umol/l": "umol/L",
        "mmol/l": "mmol/L",
        "meq/l": "mEq/L",
        "g/dl": "g/dL",
        "g/l": "g/L",
        "u/l": "U/L",
        "iu/l": "U/L",
        "ml/min/1.73m2": "mL/min/1.73m2",
        "ml/min": "mL/min/1.73m2",
        "mmhg": "mmHg",
        "mg/g": "mg/g",
        "mg/l": "mg/L",
    }
    return replacements.get(u, unit.strip())


def convert_value(key: str, value: float, unit: str) -> Tuple[float, str]:
    """Convert to preferred storage unit; also expose creatinine µmol/L via helper."""
    unit = normalize_unit(unit)
    preferred = PREFERRED_UNITS.get(key, unit)

    if key == "creatinine":
        if unit in ("umol/L", "µmol/L", "μmol/L"):
            return round(value / CREATININE_MGDL_TO_UMOLL, 3), "mg/dL"
        return value, "mg/dL"

    if key == "blood_urea" and unit in ("mmol/L",):
        return round(value * 6.0, 2), "mg/dL"  # urea mmol/L → mg/dL approx

    if key == "bun" and "urea" in unit.lower():
        return round(value * UREA_TO_BUN, 2), "mg/dL"

    if key in ("sodium", "potassium", "chloride"):
        return value, preferred  # mmol/L ≈ mEq/L

    if key == "albumin" and unit == "g/L":
        return round(value / 10.0, 2), "g/dL"

    if key == "hemoglobin" and unit == "g/L":
        return round(value / 10.0, 2), "g/dL"

    if key in ("fasting_sugar", "random_sugar") and unit == "mmol/L":
        return round(value * 18.0, 1), "mg/dL"

    if key in ("hdl", "ldl", "triglycerides", "total_cholesterol") and unit == "mmol/L":
        factor = 38.67 if key != "triglycerides" else 88.57
        return round(value * factor, 1), "mg/dL"

    if key == "weight" and unit.lower() in ("lb", "lbs"):
        return round(value * 0.453592, 1), "kg"

    return value, preferred or unit


def creatinine_to_umol(mg_dl: float) -> float:
    return round(mg_dl * CREATININE_MGDL_TO_UMOLL, 1)


def parse_reference_range(text: str) -> Tuple[Optional[float], Optional[float]]:
    if not text:
        return None, None
    text = text.replace("–", "-").replace("—", "-")
    m = re.search(r"([\d.]+)\s*-\s*([\d.]+)", text)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"[<>]\s*([\d.]+)", text)
    if m:
        v = float(m.group(1))
        if "<" in text:
            return None, v
        return v, None
    return None, None


def flag_status(
    key: str,
    value: Optional[float],
    low: Optional[float],
    high: Optional[float],
    *,
    allow_default_refs: bool = False,
) -> str:
    """
    Flag high/low only when a reference range came from the report
    (or allow_default_refs=True for non-clinical tooling).
    Never invent a status from assumed ranges in production analysis.
    """
    if value is None:
        return "unknown"
    if low is None and high is None:
        if allow_default_refs:
            low, high = DEFAULT_REFERENCES.get(key, (None, None))
        else:
            return "unknown"
    if low is not None and value < low:
        if key == "potassium" and value < 2.5:
            return "critical"
        if key == "sodium" and value < 120:
            return "critical"
        return "low"
    if high is not None and value > high:
        if key == "potassium" and value > 6.0:
            return "critical"
        if key == "creatinine" and value > 5.0:
            return "critical"
        return "high"
    if key == "egfr" and low is not None and value < low:
        return "low"
    return "normal"
