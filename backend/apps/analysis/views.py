from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analysis.models import HealthSummary, InvestigationAnalysis, TrendSnapshot
from apps.analysis.serializers import (
    HealthSummarySerializer,
    InvestigationAnalysisSerializer,
    TrendSnapshotSerializer,
)
from apps.analysis.services.engine import analyze_patient_after_report, generate_health_summary
from apps.patients.models import Patient


def _patient_qs(user):
    qs = Patient.objects.all()
    if user.is_admin_role:
        return qs
    return qs.filter(Q(user=user) | Q(caregivers=user))


class AnalysisListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get("patient")
        qs = InvestigationAnalysis.objects.select_related("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        else:
            qs = qs.filter(patient__in=_patient_qs(request.user))
        if not request.user.is_admin_role:
            qs = qs.filter(patient__in=_patient_qs(request.user))
        return Response(InvestigationAnalysisSerializer(qs, many=True).data)


class SummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get("patient")
        patients = _patient_qs(request.user)
        patient = patients.filter(pk=patient_id).first() if patient_id else patients.first()
        if not patient:
            return Response({"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
        summary = HealthSummary.objects.filter(patient=patient).first()
        if not summary:
            summary = generate_health_summary(patient)
        return Response(HealthSummarySerializer(summary).data)

    def post(self, request):
        patient_id = request.data.get("patient")
        patient = _patient_qs(request.user).filter(pk=patient_id).first()
        if not patient:
            return Response({"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
        analyze_patient_after_report(patient.id)
        summary = HealthSummary.objects.filter(patient=patient).first()
        return Response(HealthSummarySerializer(summary).data)


class TrendsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get("patient")
        key = request.query_params.get("key")
        period = request.query_params.get("period", "all")  # monthly|yearly|all
        patients = _patient_qs(request.user)
        patient = patients.filter(pk=patient_id).first() if patient_id else patients.first()
        if not patient:
            return Response({"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

        qs = TrendSnapshot.objects.filter(patient=patient)
        if key:
            qs = qs.filter(investigation_key=key)
        data = TrendSnapshotSerializer(qs, many=True).data

        # Optional period aggregation
        if period in ("monthly", "yearly"):
            for item in data:
                item["series"] = _aggregate(item["series"], period)
        return Response({"patient": patient.id, "period": period, "trends": data})


def _aggregate(series, period):
    from collections import defaultdict

    buckets = defaultdict(list)
    for point in series:
        date = point.get("date", "")[:7] if period == "monthly" else point.get("date", "")[:4]
        if date:
            buckets[date].append(point["value"])
    out = []
    for k in sorted(buckets.keys()):
        vals = buckets[k]
        out.append({"date": k, "value": round(sum(vals) / len(vals), 3), "unit": series[-1].get("unit") if series else ""})
    return out
