"""
OCR + intelligent lab report parsing pipeline.
Uses Tesseract when available; falls back to text extraction from PDF;
includes a robust regex/LLM-assisted parser for investigation lines.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings

from apps.reports.models import KNOWN_INVESTIGATIONS, LabCategory
from apps.reports.services.units import (
    convert_value,
    flag_status,
    normalize_unit,
    parse_reference_range,
)

logger = logging.getLogger(__name__)

# Synonym map → canonical investigation_key
SYNONYMS: Dict[str, str] = {
    "creatinine": "creatinine",
    "serum creatinine": "creatinine",
    "s. creatinine": "creatinine",
    "creat": "creatinine",
    "blood urea": "blood_urea",
    "urea": "blood_urea",
    "blood urea nitrogen": "bun",
    "bun": "bun",
    "egfr": "egfr",
    "e.g.f.r": "egfr",
    "estimated gfr": "egfr",
    "gfr": "egfr",
    "uric acid": "uric_acid",
    "sodium": "sodium",
    "na": "sodium",
    "na+": "sodium",
    "potassium": "potassium",
    "k": "potassium",
    "k+": "potassium",
    "chloride": "chloride",
    "cl": "chloride",
    "calcium": "calcium",
    "ca": "calcium",
    "phosphorus": "phosphorus",
    "phosphate": "phosphorus",
    "po4": "phosphorus",
    "albumin": "albumin",
    "serum albumin": "albumin",
    "total protein": "total_protein",
    "protein": "urine_protein",
    "urine protein": "urine_protein",
    "urine albumin": "urine_albumin",
    "microalbumin": "microalbumin",
    "microalbuminuria": "microalbumin",
    "protein creatinine ratio": "protein_creatinine_ratio",
    "pcr": "protein_creatinine_ratio",
    "upc": "protein_creatinine_ratio",
    "specific gravity": "specific_gravity",
    "sp. gravity": "specific_gravity",
    "ph": "urine_ph",
    "urine ph": "urine_ph",
    "sugar": "urine_sugar",
    "glucose (urine)": "urine_sugar",
    "ketone": "ketone",
    "ketones": "ketone",
    "blood": "urine_blood",
    "rbc": "rbc",
    "wbc": "wbc",
    "casts": "casts",
    "crystals": "crystals",
    "hemoglobin": "hemoglobin",
    "haemoglobin": "hemoglobin",
    "hb": "hemoglobin",
    "hgb": "hemoglobin",
    "platelet": "platelet",
    "platelets": "platelet",
    "plt": "platelet",
    "hematocrit": "hematocrit",
    "haematocrit": "hematocrit",
    "hct": "hematocrit",
    "alt": "alt",
    "sgpt": "alt",
    "ast": "ast",
    "sgot": "ast",
    "alp": "alp",
    "alkaline phosphatase": "alp",
    "bilirubin": "bilirubin",
    "total bilirubin": "bilirubin",
    "hba1c": "hba1c",
    "hb a1c": "hba1c",
    "glycated hemoglobin": "hba1c",
    "fasting sugar": "fasting_sugar",
    "fasting glucose": "fasting_sugar",
    "fbs": "fasting_sugar",
    "fasting blood sugar": "fasting_sugar",
    "random sugar": "random_sugar",
    "rbs": "random_sugar",
    "hdl": "hdl",
    "hdl cholesterol": "hdl",
    "ldl": "ldl",
    "ldl cholesterol": "ldl",
    "triglycerides": "triglycerides",
    "triglyceride": "triglycerides",
    "total cholesterol": "total_cholesterol",
    "cholesterol": "total_cholesterol",
    "systolic": "systolic_bp",
    "diastolic": "diastolic_bp",
    "blood pressure": "systolic_bp",
    "weight": "weight",
    "bmi": "bmi",
    "body mass index": "bmi",
}

DISPLAY_NAMES = {
    "creatinine": "Creatinine",
    "blood_urea": "Blood Urea",
    "bun": "BUN",
    "egfr": "eGFR",
    "uric_acid": "Uric Acid",
    "sodium": "Sodium",
    "potassium": "Potassium",
    "chloride": "Chloride",
    "calcium": "Calcium",
    "phosphorus": "Phosphorus",
    "albumin": "Albumin",
    "total_protein": "Total Protein",
    "urine_protein": "Urine Protein",
    "urine_albumin": "Urine Albumin",
    "microalbumin": "Microalbumin",
    "protein_creatinine_ratio": "Protein Creatinine Ratio",
    "specific_gravity": "Specific Gravity",
    "urine_ph": "Urine pH",
    "urine_sugar": "Urine Sugar",
    "ketone": "Ketone",
    "urine_blood": "Urine Blood",
    "urine_rbc": "Urine RBC",
    "urine_wbc": "Urine WBC",
    "casts": "Casts",
    "crystals": "Crystals",
    "hemoglobin": "Hemoglobin",
    "rbc": "RBC",
    "wbc": "WBC",
    "platelet": "Platelet",
    "hematocrit": "Hematocrit",
    "alt": "ALT",
    "ast": "AST",
    "alp": "ALP",
    "bilirubin": "Bilirubin",
    "hba1c": "HbA1c",
    "fasting_sugar": "Fasting Sugar",
    "random_sugar": "Random Sugar",
    "hdl": "HDL",
    "ldl": "LDL",
    "triglycerides": "Triglycerides",
    "total_cholesterol": "Total Cholesterol",
    "systolic_bp": "Systolic BP",
    "diastolic_bp": "Diastolic BP",
    "weight": "Weight",
    "bmi": "BMI",
}


@dataclass
class ParsedResult:
    investigation_key: str
    investigation_name: str
    category: str
    raw_value: str
    numeric_value: Optional[float]
    unit: str
    standardized_value: Optional[float]
    standardized_unit: str
    reference_range: str
    reference_low: Optional[float]
    reference_high: Optional[float]
    status_flag: str
    reference_source: str = "none"
    confidence_score: float = 0.0
    needs_review: bool = False
    extraction_status: str = "extracted"


@dataclass
class ParsedReport:
    raw_text: str
    report_date: Optional[str] = None
    hospital_name: str = ""
    doctor_name: str = ""
    patient_name: str = ""
    results: List[ParsedResult] = field(default_factory=list)
    meta: Dict[str, Any] = field(default_factory=dict)
    ocr_quality: str = "good"
    ocr_message: str = ""


def _resolve_key(name: str) -> Optional[str]:
    n = re.sub(r"\s+", " ", name.strip().lower())
    n = n.replace(":", "").strip()
    if n in SYNONYMS:
        return SYNONYMS[n]
    for syn, key in SYNONYMS.items():
        if syn in n or n in syn:
            return key
    return None


def extract_text_from_file(file_path: Path) -> str:
    suffix = file_path.suffix.lower()
    text = ""

    if suffix == ".pdf":
        text = _extract_pdf_text(file_path)
        if len(text.strip()) < 40:
            text = _ocr_pdf_images(file_path) or text
    elif suffix in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}:
        text = _ocr_image(file_path)
    else:
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            text = _ocr_image(file_path)

    if settings.USE_GOOGLE_VISION and settings.GOOGLE_VISION_API_KEY and len(text.strip()) < 40:
        vision_text = _google_vision_ocr(file_path)
        if vision_text:
            text = vision_text

    return text


def _extract_pdf_text(path: Path) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        parts = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        return "\n".join(parts)
    except Exception as exc:
        logger.warning("PDF text extract failed: %s", exc)
        return ""


def _ocr_image(path: Path) -> str:
    try:
        import pytesseract
        from PIL import Image

        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
        img = Image.open(path)
        return pytesseract.image_to_string(img)
    except Exception as exc:
        logger.warning("Tesseract OCR failed for %s: %s", path, exc)
        return ""


def _ocr_pdf_images(path: Path) -> str:
    try:
        from pdf2image import convert_from_path

        images = convert_from_path(str(path), dpi=200)
        chunks = []
        for img in images:
            import pytesseract

            if settings.TESSERACT_CMD:
                pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
            chunks.append(pytesseract.image_to_string(img))
        return "\n".join(chunks)
    except Exception as exc:
        logger.warning("PDF OCR failed: %s", exc)
        return ""


def _google_vision_ocr(path: Path) -> str:
    # Optional; requires API key and google-cloud-vision. Kept lightweight.
    logger.info("Google Vision OCR skipped (optional dependency).")
    return ""


def _extract_meta(text: str) -> Dict[str, str]:
    meta: Dict[str, str] = {
        "hospital_name": "",
        "doctor_name": "",
        "report_date": "",
        "patient_name": "",
    }

    date_patterns = [
        r"(?:report\s*date|date|collected|collected on|sample date)\s*[:\-]?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})",
        r"(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{4})",
        r"(\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2})",
    ]
    for pat in date_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            meta["report_date"] = _normalize_date(m.group(1)) or ""
            if meta["report_date"]:
                break

    hosp = re.search(
        r"(?:hospital|lab(?:oratory)?|clinic|diagnostic)\s*[:\-]?\s*([A-Za-z0-9 &.\-]{3,80})",
        text,
        re.IGNORECASE,
    )
    if hosp:
        meta["hospital_name"] = hosp.group(1).strip()[:255]

    doc = re.search(
        r"(?:dr\.?|doctor|consultant|nephrologist)\s*[:\-]?\s*([A-Za-z .]{3,80})",
        text,
        re.IGNORECASE,
    )
    if doc:
        meta["doctor_name"] = doc.group(1).strip()[:255]

    patient = re.search(
        r"(?:patient\s*name|name\s*of\s*patient|patient)\s*[:\-]?\s*([A-Za-z .]{3,80})",
        text,
        re.IGNORECASE,
    )
    if patient:
        meta["patient_name"] = patient.group(1).strip()[:255]

    return meta


def _normalize_date(raw: str) -> Optional[str]:
    raw = raw.strip().replace(".", "/").replace("-", "/")
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y/%m/%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(raw, fmt).date().isoformat()
        except ValueError:
            continue
    return None


LINE_PATTERN = re.compile(
    r"(?P<name>[A-Za-z][A-Za-z0-9\s\.\(\)\+\-/]{1,40}?)\s*[:\-]?\s+"
    r"(?P<value><?\s*[\d]+\.?[\d]*|Nil|Negative|Positive|Trace|\+)\s*"
    r"(?P<unit>mg/dL|mg/dl|g/dL|g/dl|mmol/L|mmol/l|mEq/L|meq/l|µmol/L|umol/L|"
    r"U/L|IU/L|%|mL/min(?:/1\.73m2)?|mmHg|mg/g|mg/L)?\s*"
    r"(?P<ref>\(?\s*[\d\.]+\s*[-–—]\s*[\d\.]+\s*\)?)?",
    re.IGNORECASE,
)


def _line_confidence(raw_value: str, unit: str, ref: str, numeric: Optional[float]) -> Tuple[float, bool, str]:
    """Return confidence, needs_review, extraction_status from parse quality only."""
    if numeric is None and raw_value.lower() not in {"nil", "negative", "positive", "trace", "+"}:
        return 0.35, True, "uncertain"
    score = 0.55
    if unit:
        score += 0.15
    if ref:
        score += 0.15
    if numeric is not None:
        score += 0.1
    score = min(0.95, score)
    needs_review = score < 0.65
    status = "uncertain" if needs_review else "extracted"
    return round(score, 2), needs_review, status


def parse_lab_text(text: str) -> ParsedReport:
    text = (text or "").strip()
    if len(text) < 20:
        return ParsedReport(
            raw_text=text,
            ocr_quality="poor",
            ocr_message=(
                "Unable to extract reliable text from this report. "
                "Please upload a clearer PDF or higher-resolution image. "
                "No laboratory values were assumed."
            ),
            results=[],
        )

    meta = _extract_meta(text)
    results: List[ParsedResult] = []
    seen = set()

    for line in text.splitlines():
        line = line.strip()
        if len(line) < 3:
            continue
        m = LINE_PATTERN.search(line)
        if not m:
            continue
        name = m.group("name").strip()
        key = _resolve_key(name)
        if not key or key in seen:
            continue
        raw_value = m.group("value").strip()
        unit = normalize_unit(m.group("unit") or "")
        ref = (m.group("ref") or "").strip("() ")

        numeric = None
        try:
            cleaned = re.sub(r"[^\d.]", "", raw_value)
            numeric = float(cleaned) if cleaned else None
        except ValueError:
            numeric = None

        # Preserve exact report values; normalize units only when a known conversion applies
        std_val, std_unit = (None, unit)
        if numeric is not None:
            std_val, std_unit = convert_value(key, numeric, unit)

        low, high = parse_reference_range(ref)
        ref_source = "report" if (low is not None or high is not None or ref) else "none"
        # Status only when the report itself provided a reference range — never invent ranges
        flag = flag_status(
            key,
            std_val if std_val is not None else numeric,
            low,
            high,
            allow_default_refs=False,
        )
        conf, needs_review, ext_status = _line_confidence(raw_value, unit, ref, numeric)
        category = KNOWN_INVESTIGATIONS.get(key, LabCategory.OTHER)

        results.append(
            ParsedResult(
                investigation_key=key,
                investigation_name=DISPLAY_NAMES.get(key, name.title()),
                category=category,
                raw_value=raw_value,
                numeric_value=numeric,
                unit=unit,
                standardized_value=std_val,
                standardized_unit=std_unit,
                reference_range=ref or "Not Available",
                reference_low=low,
                reference_high=high,
                status_flag=flag,
                reference_source=ref_source,
                confidence_score=conf,
                needs_review=needs_review,
                extraction_status=ext_status,
            )
        )
        seen.add(key)

    # LLM may ONLY extract values present in the OCR text — never invent missing analytes
    if len(results) < 3 and settings.OPENAI_API_KEY and len(text) >= 40:
        llm_results = _llm_parse(text)
        for r in llm_results:
            if r.investigation_key not in seen:
                results.append(r)
                seen.add(r.investigation_key)

    if not results:
        quality = "poor"
        message = (
            "No laboratory values could be extracted from this report. "
            "Fields are marked as Unable to Extract — no values were assumed or estimated. "
            "Please try a clearer scan or enter values after manual review."
        )
    elif len(results) < 3 or any(r.needs_review for r in results):
        quality = "partial"
        message = (
            f"Extracted {len(results)} investigation(s) from the uploaded report. "
            "Uncertain fields are highlighted for manual review. "
            "Missing tests are Not Available — they were not fabricated."
        )
    else:
        quality = "good"
        message = f"Successfully extracted {len(results)} investigation(s) from the uploaded report."

    return ParsedReport(
        raw_text=text,
        report_date=meta.get("report_date") or None,
        hospital_name=meta.get("hospital_name", "") or "Not Available",
        doctor_name=meta.get("doctor_name", "") or "Not Available",
        patient_name=meta.get("patient_name", "") or "Not Available",
        results=results,
        meta=meta,
        ocr_quality=quality,
        ocr_message=message,
    )


def _llm_parse(text: str) -> List[ParsedResult]:
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = (
            "Extract ONLY laboratory values that are explicitly present in this report text. "
            "Do NOT invent, estimate, or fill missing tests. "
            "If a field is missing, omit that investigation entirely. "
            "Return JSON array of objects with keys: name, value, unit, reference_range, confidence (0-1). "
            "Only include kidney, urine, CBC, LFT, diabetes, lipid, BP, weight, BMI values that appear in the text.\n\n"
            f"TEXT:\n{text[:6000]}"
        )
        resp = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You extract structured lab data strictly from the provided text. "
                        "Never fabricate values. Reply with JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        content = resp.choices[0].message.content or "[]"
        import json

        content = re.sub(r"^```json\s*|\s*```$", "", content.strip())
        data = json.loads(content)
        out: List[ParsedResult] = []
        for item in data:
            key = _resolve_key(str(item.get("name", "")))
            if not key:
                continue
            raw = str(item.get("value", "")).strip()
            if not raw or raw.lower() in {"n/a", "na", "none", "null", "unknown"}:
                continue
            # Verify the value-ish token appears in the source text (anti-hallucination check)
            token = re.sub(r"[^\d.]", "", raw)
            if token and token not in text.replace(",", ""):
                # soft check: also try raw substring
                if raw.lower() not in text.lower():
                    logger.info("Skipping LLM value not found in OCR text: %s=%s", key, raw)
                    continue
            unit = normalize_unit(str(item.get("unit", "")))
            ref = str(item.get("reference_range", "") or "")
            numeric = None
            try:
                numeric = float(re.sub(r"[^\d.]", "", raw)) if re.search(r"\d", raw) else None
            except ValueError:
                pass
            std_val, std_unit = (None, unit)
            if numeric is not None:
                std_val, std_unit = convert_value(key, numeric, unit)
            low, high = parse_reference_range(ref)
            conf = float(item.get("confidence") or 0.6)
            conf = max(0.4, min(0.9, conf))
            out.append(
                ParsedResult(
                    investigation_key=key,
                    investigation_name=DISPLAY_NAMES.get(key, key),
                    category=KNOWN_INVESTIGATIONS.get(key, LabCategory.OTHER),
                    raw_value=raw,
                    numeric_value=numeric,
                    unit=unit,
                    standardized_value=std_val,
                    standardized_unit=std_unit,
                    reference_range=ref or "Not Available",
                    reference_low=low,
                    reference_high=high,
                    status_flag=flag_status(key, std_val or numeric, low, high, allow_default_refs=False),
                    reference_source="report" if ref else "none",
                    confidence_score=conf,
                    needs_review=conf < 0.7,
                    extraction_status="uncertain" if conf < 0.7 else "extracted",
                )
            )
        return out
    except Exception as exc:
        logger.warning("LLM parse failed: %s", exc)
        return []


def process_report_file(file_path: Path) -> ParsedReport:
    text = extract_text_from_file(file_path)
    return parse_lab_text(text)
