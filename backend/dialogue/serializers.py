from rest_framework import serializers
from .models import DialogueLog

class DialogueLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DialogueLog
        fields = ['id', 'user', 'user_input', 'response_text', 'created_at']
        read_only_fields = ['user']
