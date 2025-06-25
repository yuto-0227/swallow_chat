from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CustomUser
from .serializers import UserSerializer
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data['token'])
        user = token.user
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 特定ユーザー名「testuser」は毎回「初回ログイン扱い」にする
        if user.username == "testuser":
            user.first_login_done = False  # ← 毎回初回に強制
        serializer = UserSerializer(user)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_first_login_done(request):
    user = request.user
    user.first_login_done = True
    user.save()
    return Response({'message': '初回ログインフラグを更新しました。'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_nickname(request):
    return Response({'nickname': request.user.nickname})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_nickname(request):
    nickname = request.data.get('nickname')
    if nickname and 1 <= len(nickname) <= 8:
        request.user.nickname = nickname
        request.user.save()
        return Response({'message': 'ニックネームを更新しました。'})
    return Response({'error': 'ニックネームは1〜8文字で入力してください。'}, status=status.HTTP_400_BAD_REQUEST)
