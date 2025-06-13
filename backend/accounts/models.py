from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    dialogue_type = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B')], blank=True, null=True)
    first_login_done = models.BooleanField(default=False)
    nickname = models.CharField(max_length=8, default='おうるくん')
