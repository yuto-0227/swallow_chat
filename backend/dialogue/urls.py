from django.urls import path
from .views import DialogueLogListCreateView, SelectTypeView
from .views import AIChatView

urlpatterns = [
    path('logs/', DialogueLogListCreateView.as_view(), name='dialogue-logs'),
    path('select-type/', SelectTypeView.as_view(), name='select-type'),
    path("ai-response/", AIChatView.as_view(), name="ai_response"),
]

