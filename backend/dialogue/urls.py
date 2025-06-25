from django.urls import path
from .views import DialogueLogListCreateView, SelectEntryModeView, AIChatView

urlpatterns = [
    path("logs/", DialogueLogListCreateView.as_view(), name="dialogue-logs"),
    path("select-entry-mode/", SelectEntryModeView.as_view(), name="select-entry-mode"),
    path("ai-response/", AIChatView.as_view(), name="ai-response"),
]