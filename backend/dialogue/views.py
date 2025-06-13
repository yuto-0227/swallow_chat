from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from .models import DialogueLog, UserDialogFeature
from .serializers import DialogueLogSerializer
from ai_model.chat_engine import generate_reply

class DialogueLogListCreateView(generics.ListCreateAPIView):
    queryset = DialogueLog.objects.all()
    serializer_class = DialogueLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SelectTypeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        type_selected = request.data.get('type')
        user = request.user

        if type_selected not in ['A', 'B']:
            return Response({"error": "無効なタイプです。"}, status=status.HTTP_400_BAD_REQUEST)

        feature, created = UserDialogFeature.objects.update_or_create(
            user=user,
            defaults={'feature_type': type_selected}
        )
        return Response({"message": "選択が保存されました。"})

class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_input = request.data.get("user_input")
        if not user_input:
            return Response({"error": "user_input is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response_data = generate_reply(user_input)
            cleaned_response = response_data.get("text", "").strip()
            emotion = response_data.get("emotion", "neutral")

            # 対話ログ保存（emotionも追加）
            DialogueLog.objects.create(
                user=request.user,
                user_input=user_input,
                response_text=cleaned_response,
                emotion=emotion,
            )

            return Response({
                "response": cleaned_response,
                "emotion": emotion
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

