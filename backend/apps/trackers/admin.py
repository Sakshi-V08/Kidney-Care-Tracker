from django.contrib import admin

from .models import (
    AppointmentReminder,
    BloodPressureEntry,
    DietPlan,
    MedicineReminder,
    WaterIntakeEntry,
    WeightEntry,
)

admin.site.register(BloodPressureEntry)
admin.site.register(WeightEntry)
admin.site.register(WaterIntakeEntry)
admin.site.register(MedicineReminder)
admin.site.register(AppointmentReminder)
admin.site.register(DietPlan)
