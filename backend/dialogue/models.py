from django.db import models
from django.contrib.auth.models import User

from django.conf import settings

class DialogueLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    user_input = models.TextField()
    response_text = models.TextField()
    emotion = models.CharField(max_length=20, default="neutral")
    created_at = models.DateTimeField(auto_now_add=True)


class UserDialogFeature(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    feature_type = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B')])  # 対話特徴

    def __str__(self):
        return f"UserDialogFeature for {self.user.username} with feature {self.feature_type}"


