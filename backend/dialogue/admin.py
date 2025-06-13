from django.contrib import admin
from .models import UserDialogFeature, DialogueLog

@admin.register(DialogueLog)
class DialogueLogAdmin(admin.ModelAdmin):
    list_display = ("user", "user_input", "response_text", "emotion", "created_at")
    list_filter = ("emotion", "created_at")
    search_fields = ("user__username", "user_input", "response_text")

admin.site.register(UserDialogFeature)
