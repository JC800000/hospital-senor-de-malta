from django.contrib import admin
from .models import Paciente


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('ci', 'nombres', 'apellidos', 'fecha_nac', 'sexo', 'activo')
    list_filter = ('sexo', 'activo', 'tipo_sangre')
    search_fields = ('ci', 'nombres', 'apellidos')
    ordering = ('apellidos', 'nombres')
