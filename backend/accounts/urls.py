from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ProfileView, update_nickname
from .views import get_nickname

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # JWTに切り替え
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),       # 任意（トークン更新用）
    path('profile/', ProfileView.as_view(), name='api-profile'),
    path('nickname/', get_nickname),
    path('update-nickname/', update_nickname, name='update-nickname'),
]
