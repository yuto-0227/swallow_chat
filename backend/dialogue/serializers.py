from rest_framework import serializers
from .models import DialogueLog, UserDialogFeature

class DialogueLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DialogueLog
        fields = ['id', 'user', 'user_input', 'response_text', 'emotion', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class UserDialogFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDialogFeature
        fields = ['user', 'entry_mode', 'personality', 'feature_type']
        read_only_fields = ['user']
