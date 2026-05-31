from django.contrib import admin
from .models import Medicamento


@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'presentacion', 'stock_actual', 'stock_minimo', 'activo', 'fecha_vencimiento')
    list_filter = ('activo',)
    search_fields = ('nombre', 'presentacion')
