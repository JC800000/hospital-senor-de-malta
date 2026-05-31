from django.contrib import admin
from .models import Consulta, SignosVitales, Derivacion


@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ('id', 'paciente', 'medico', 'tipo', 'estado', 'fecha_inicio')
    list_filter = ('estado', 'tipo')
    search_fields = ('paciente__ci', 'paciente__nombres', 'medico__ci')


@admin.register(SignosVitales)
class SignosVitalesAdmin(admin.ModelAdmin):
    list_display = ('consulta', 'temperatura', 'presion_sistolica', 'presion_diastolica', 'fecha_registro')


@admin.register(Derivacion)
class DerivacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'paciente', 'medico_origen', 'especialidad_destino', 'estado', 'fecha_derivacion')
    list_filter = ('estado',)
