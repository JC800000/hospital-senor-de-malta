from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    model = Usuario
    list_display = ('ci', 'nombres', 'apellidos', 'rol', 'activo', 'is_staff')
    list_filter = ('rol', 'activo', 'turno')
    search_fields = ('ci', 'nombres', 'apellidos')
    ordering = ('ci',)

    fieldsets = (
        (None, {'fields': ('ci', 'password')}),
        ('Datos personales', {'fields': ('nombres', 'apellidos', 'rol', 'especialidad', 'turno')}),
        ('Permisos', {'fields': ('activo', 'is_staff')}),
        ('Fechas', {'fields': ('ultimo_acceso',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('ci', 'nombres', 'apellidos', 'rol', 'password1', 'password2'),
        }),
    )

    readonly_fields = ('ultimo_acceso',)
    filter_horizontal = ()
