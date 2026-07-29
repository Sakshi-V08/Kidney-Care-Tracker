from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.views import APIView

from apps.patients.models import Patient

from .models import ChatMessage, ChatSession
from .services import answer_question


class ChatMessageSerializer(ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("id", "role", "content", "created_at")


class ChatSessionSerializer(ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ("id", "patient", "title", "messages", "created_at", "updated_at")


class ChatAskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        patient_id = request.data.get("patient")
        message = (request.data.get("message") or "").strip()
        session_id = request.data.get("session")
        if not message:
            return Response({"detail": "message required"}, status=status.HTTP_400_BAD_REQUEST)

        patients = Patient.objects.all()
        if not request.user.is_admin_role:
            patients = patients.filter(Q(user=request.user) | Q(caregivers=request.user))
        patient = patients.filter(pk=patient_id).first() if patient_id else patients.first()
        if not patient:
            return Response({"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

        if session_id:
            session = ChatSession.objects.filter(pk=session_id, user=request.user, patient=patient).first()
        else:
            session = None
        if not session:
            session = ChatSession.objects.create(patient=patient, user=request.user)

        ChatMessage.objects.create(session=session, role=ChatMessage.Role.USER, content=message)
        reply = answer_question(patient, message)
        ChatMessage.objects.create(session=session, role=ChatMessage.Role.ASSISTANT, content=reply)
        session.save()
        return Response(
            {
                "session": session.id,
                "reply": reply,
                "messages": ChatMessageSerializer(session.messages.all(), many=True).data,
            }
        )


class ChatSessionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(user=request.user).prefetch_related("messages")
        return Response(ChatSessionSerializer(sessions, many=True).data)
