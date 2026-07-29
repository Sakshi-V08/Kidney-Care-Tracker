from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("KHIS", {"fields": ("role", "phone", "preferred_language", "dark_mode", "voice_assistant_enabled")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("KHIS", {"fields": ("role", "phone")}),
    )
