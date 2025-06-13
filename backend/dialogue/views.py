from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from .models import DialogueLog, UserDialogFeature
from .serializers import DialogueLogSerializer

# 3つのchat_engineから個別にインポート（ファイル名、関数名は調整してください）
from ai_model.chat_engine_A import generate_reply as generate_reply_A
from ai_model.chat_engine_B import generate_reply as generate_reply_B
from ai_model.chat_engine_C import generate_reply as generate_reply_C

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

        if type_selected not in ['A', 'B', 'C']:
            return Response({"error": "無効なタイプです。"}, status=status.HTTP_400_BAD_REQUEST)

        UserDialogFeature.objects.update_or_create(
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
            feature = UserDialogFeature.objects.get(user=request.user)
            type_selected = feature.feature_type
        except UserDialogFeature.DoesNotExist:
            return Response({"error": "対話特徴が選択されていません。"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if type_selected == 'A':
                response_data = generate_reply_A(user_input)
            elif type_selected == 'B':
                response_data = generate_reply_B(user_input)
            elif type_selected == 'C':
                response_data = generate_reply_C(user_input)
            else:
                return Response({"error": "未知のタイプです。"}, status=status.HTTP_400_BAD_REQUEST)

            cleaned_response = response_data.get("text", "").strip()
            emotion = response_data.get("emotion", "neutral")

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
