# Generated by Django 5.2 on 2025-05-13 06:14

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dialogue", "0004_remove_dialoguelog_user_input"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="dialoguelog",
            name="message",
        ),
        migrations.AddField(
            model_name="dialoguelog",
            name="response_text",
            field=models.TextField(default="N/A"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="dialoguelog",
            name="user_input",
            field=models.TextField(default="N/A"),
            preserve_default=False,
        ),
    ]
