from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_role)


class IsPatientOwnerOrAdmin(BasePermission):
    """Object-level: patient owner, linked caregiver, or admin."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_admin_role:
            return True
        patient = getattr(obj, "patient", obj)
        if hasattr(patient, "user") and patient.user_id == user.id:
            return True
        if hasattr(patient, "caregivers") and patient.caregivers.filter(id=user.id).exists():
            return True
        return False
