from django.db import models
from django.conf import settings

class DialogueLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    user_input = models.TextField()
    response_text = models.TextField()
    emotion = models.CharField(max_length=20, default="neutral")
    created_at = models.DateTimeField(auto_now_add=True)

class UserDialogFeature(models.Model):
    ENTRY_MODE_CHOICES = [
        ('survey', 'Survey'),  # アンケートあり
        ('quick', 'Quick'),    # アンケートなし
    ]

    PERSONALITY_CHOICES = [
        ('talkative', 'Talkative'),
        ('calm', 'Calm'),
        ('neutral', 'Neutral'),
    ]

    FEATURE_TYPE_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # ✅ デフォルトを指定
    entry_mode = models.CharField(max_length=10, choices=ENTRY_MODE_CHOICES, default='quick')
    personality = models.CharField(max_length=10, choices=PERSONALITY_CHOICES, default='neutral')
    feature_type = models.CharField(max_length=1, choices=FEATURE_TYPE_CHOICES, default='A')

    def __str__(self):
        return f"{self.user.username} ({self.entry_mode}, {self.personality})"
