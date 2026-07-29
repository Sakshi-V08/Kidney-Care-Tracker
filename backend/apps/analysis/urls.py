from django.urls import path

from .views import AnalysisListView, SummaryView, TrendsView

urlpatterns = [
    path("analysis/", AnalysisListView.as_view(), name="analysis-list"),
    path("summary/", SummaryView.as_view(), name="health-summary"),
    path("trends/", TrendsView.as_view(), name="trends"),
]
