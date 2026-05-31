from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('numero', 'paciente', 'tipo', 'turno', 'estado', 'fecha_emision')
    list_filter = ('estado', 'tipo', 'turno')
    search_fields = ('numero', 'paciente__ci', 'paciente__nombres')
    ordering = ('-fecha_emision',)
