from django.db import models


class Receta(models.Model):
    ESTADO_CHOICES = [('pendiente', 'Pendiente'), ('despachada', 'Despachada')]

    consulta = models.ForeignKey('consultas.Consulta', on_delete=models.PROTECT, related_name='recetas')
    paciente = models.ForeignKey('pacientes.Paciente', on_delete=models.PROTECT, related_name='recetas')
    medico = models.ForeignKey(
        'autenticacion.Usuario', on_delete=models.PROTECT, related_name='recetas_emitidas'
    )
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    fecha_emision = models.DateTimeField(auto_now_add=True)
    fecha_despacho = models.DateTimeField(null=True, blank=True)
    despachado_por = models.ForeignKey(
        'autenticacion.Usuario',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='recetas_despachadas'
    )

    class Meta:
        db_table = 'recetas'
        ordering = ['-fecha_emision']

    def __str__(self):
        return f'Receta {self.id} - {self.paciente} - {self.estado}'


class ItemReceta(models.Model):
    receta = models.ForeignKey(Receta, on_delete=models.CASCADE, related_name='items')
    medicamento_nombre = models.CharField(max_length=150)
    cantidad = models.CharField(max_length=100, blank=True, default='')
    frecuencia = models.CharField(max_length=100, blank=True, default='')
    tiempo_uso = models.CharField(max_length=100, blank=True, default='')
    via_administracion = models.CharField(max_length=100, blank=True, default='')
    cantidad_recetada = models.IntegerField(null=True, blank=True)
    cantidad_dispensada = models.IntegerField(null=True, blank=True)
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'items_receta'

    def __str__(self):
        return self.medicamento_nombre
