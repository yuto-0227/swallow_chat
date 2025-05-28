from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from .models import DialogueLog, UserDialogFeature
from .serializers import DialogueLogSerializer
from ai_model.chat_engine import generate_reply
from .models import DialogueLog  # 既存ログ保存用モデル

class DialogueLogListCreateView(generics.ListCreateAPIView):
    queryset = DialogueLog.objects.all()
    serializer_class = DialogueLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # 現在のユーザーを設定して保存
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
            return Response({"error": "user_input is required"}, status=400)

        response_text = generate_reply(user_input)

        # 対話ログの保存（オプション）
        DialogueLog.objects.create(
            user=request.user,
            user_input=user_input,
            response_text=response_text
        )

        return Response({"response": response_text})
