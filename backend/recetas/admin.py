from django.contrib import admin
from .models import Receta, ItemReceta


class ItemRecetaInline(admin.TabularInline):
    model = ItemReceta
    extra = 0


@admin.register(Receta)
class RecetaAdmin(admin.ModelAdmin):
    list_display = ('id', 'paciente', 'medico', 'estado', 'fecha_emision')
    list_filter = ('estado',)
    search_fields = ('paciente__ci', 'paciente__nombres')
    inlines = [ItemRecetaInline]
