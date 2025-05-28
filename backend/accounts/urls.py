from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ProfileView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # JWTに切り替え
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),       # 任意（トークン更新用）
    path('profile/', ProfileView.as_view(), name='api-profile'),
]
