from django.db import models


class Medicamento(models.Model):
    nombre = models.CharField(max_length=150)
    presentacion = models.CharField(max_length=100, blank=True)
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=10)
    unidad = models.CharField(max_length=20, default='unidades')
    fecha_vencimiento = models.DateField(null=True, blank=True)
    proveedor = models.CharField(max_length=150, null=True, blank=True)
    activo = models.BooleanField(default=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medicamentos'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} ({self.presentacion})'
