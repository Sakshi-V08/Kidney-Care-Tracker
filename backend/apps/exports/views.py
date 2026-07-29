from django.db.models import Q
from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.views import APIView

from apps.audit.services import log_action
from apps.exports.services.exporters import export_csv, export_excel, export_pdf_summary
from apps.patients.models import Patient


class ExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fmt = request.query_params.get("format", "pdf")
        patient_id = request.query_params.get("patient")
        doctor_mode = request.query_params.get("doctor", "false").lower() == "true"
        qs = Patient.objects.all()
        if not request.user.is_admin_role:
            qs = qs.filter(Q(user=request.user) | Q(caregivers=request.user))
        patient = qs.filter(pk=patient_id).first() if patient_id else qs.first()
        if not patient:
            return HttpResponse("Patient not found", status=status.HTTP_404_NOT_FOUND)

        if fmt == "csv":
            data = export_csv(patient)
            resp = HttpResponse(data, content_type="text/csv")
            resp["Content-Disposition"] = f'attachment; filename="{patient.folder_name}_labs.csv"'
        elif fmt == "excel":
            data = export_excel(patient)
            resp = HttpResponse(
                data,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            resp["Content-Disposition"] = f'attachment; filename="{patient.folder_name}_labs.xlsx"'
        else:
            data = export_pdf_summary(patient, doctor_mode=doctor_mode)
            resp = HttpResponse(data, content_type="application/pdf")
            name = "doctor_report" if doctor_mode else "summary"
            resp["Content-Disposition"] = f'attachment; filename="{patient.folder_name}_{name}.pdf"'

        log_action(
            user=request.user,
            action="export.generate",
            details={"patient_id": patient.id, "format": fmt, "doctor_mode": doctor_mode},
        )
        return resp
