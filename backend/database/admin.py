from django.contrib import admin
from . import models

# Registrar todos los modelos automáticamente
for model_name, model in models.__dict__.items():
    if hasattr(model, "_meta") and not model._meta.abstract:
        try:
            admin.site.register(model)
        except admin.sites.AlreadyRegistered:
            pass
