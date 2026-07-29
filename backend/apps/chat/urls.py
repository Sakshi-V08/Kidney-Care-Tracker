from django.urls import path

from .views import ChatAskView, ChatSessionListView

urlpatterns = [
    path("chat/", ChatAskView.as_view(), name="chat-ask"),
    path("chat/sessions/", ChatSessionListView.as_view(), name="chat-sessions"),
]
