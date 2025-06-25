from django.contrib import admin
from .models import DialogueLog, UserDialogFeature

@admin.register(DialogueLog)
class DialogueLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_input', 'emotion', 'created_at')
    list_filter = ('emotion', 'created_at')
    search_fields = ('user__username', 'user_input', 'response_text')

@admin.register(UserDialogFeature)
class UserDialogFeatureAdmin(admin.ModelAdmin):
    list_display = ('user', 'entry_mode', 'personality', 'feature_type')
    list_filter = ('entry_mode', 'personality', 'feature_type')
    search_fields = ('user__username',)
