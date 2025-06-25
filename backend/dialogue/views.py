from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from .models import DialogueLog, UserDialogFeature
from .serializers import DialogueLogSerializer

# モデルごとのチャットエンジン
from ai_model.chat_engine_A import generate_reply as generate_reply_A
from ai_model.chat_engine_B import generate_reply as generate_reply_B
from ai_model.chat_engine_C import generate_reply as generate_reply_C

class DialogueLogListCreateView(generics.ListCreateAPIView):
    queryset = DialogueLog.objects.all()
    serializer_class = DialogueLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SelectEntryModeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        entry_mode = request.data.get("entry_mode")
        personality = request.data.get("personality")

        if entry_mode not in ["survey", "quick"]:
            return Response({"error": "entry_mode が不正です。"}, status=400)
        if personality not in ["talkative", "calm", "neutral"]:
            return Response({"error": "personality が不正です。"}, status=400)

        # 対話特徴（エンジン）へのマッピング
        if personality == "talkative":
            feature_type = "A"
        elif personality == "calm":
            feature_type = "B"
        else:
            feature_type = "C"

        UserDialogFeature.objects.update_or_create(
            user=request.user,
            defaults={
                "entry_mode": entry_mode,
                "personality": personality,
                "feature_type": feature_type,
            }
        )

        return Response({
            "message": f"{entry_mode} / {personality} が設定されました。",
            "feature_type": feature_type
        })


class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_input = request.data.get("user_input")
        if not user_input:
            return Response({"error": "user_input is required"}, status=400)

        try:
            feature = UserDialogFeature.objects.get(user=request.user)
            feature_type = feature.feature_type
        except UserDialogFeature.DoesNotExist:
            return Response({"error": "対話特徴が未設定です。"}, status=400)

        # モデル分岐
        try:
            if feature_type == "A":
                response_data = generate_reply_A(user_input)
            elif feature_type == "B":
                response_data = generate_reply_B(user_input)
            elif feature_type == "C":
                response_data = generate_reply_C(user_input)
            else:
                return Response({"error": "未知の対話特徴です。"}, status=400)

            cleaned_response = response_data.get("text", "").strip()
            emotion = response_data.get("emotion", "neutral")

            DialogueLog.objects.create(
                user=request.user,
                user_input=user_input,
                response_text=cleaned_response,
                emotion=emotion
            )

            return Response({
                "response": cleaned_response,
                "emotion": emotion
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)