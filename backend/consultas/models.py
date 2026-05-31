from django.db import models


class Consulta(models.Model):
    TIPO_CHOICES = [('general', 'General'), ('especialidad', 'Especialidad')]
    ESTADO_CHOICES = [('activa', 'Activa'), ('finalizada', 'Finalizada')]

    ticket = models.ForeignKey('tickets.Ticket', on_delete=models.PROTECT, related_name='consultas')
    paciente = models.ForeignKey('pacientes.Paciente', on_delete=models.PROTECT, related_name='consultas')
    medico = models.ForeignKey(
        'autenticacion.Usuario', on_delete=models.PROTECT, related_name='consultas_medico'
    )
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    motivo = models.TextField()
    diagnostico = models.TextField(blank=True)
    observaciones = models.TextField(null=True, blank=True)
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES, default='general')
    especialidad = models.CharField(max_length=100, blank=True)
    derivado_por = models.ForeignKey(
        'autenticacion.Usuario',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='consultas_derivadas'
    )
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='activa')
    sintomas = models.TextField(blank=True, default='')
    nivel_dolor = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'consultas'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f'Consulta {self.id} - {self.paciente} - {self.estado}'


class SignosVitales(models.Model):
    consulta = models.OneToOneField(Consulta, on_delete=models.CASCADE, related_name='signos_vitales')
    temperatura = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    presion_sistolica = models.IntegerField(null=True, blank=True)
    presion_diastolica = models.IntegerField(null=True, blank=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    talla = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    frecuencia_cardiaca = models.IntegerField(null=True, blank=True)
    saturacion_oxigeno = models.IntegerField(null=True, blank=True)
    glucosa = models.IntegerField(null=True, blank=True)
    frecuencia_respiratoria = models.IntegerField(null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'signos_vitales'


class Derivacion(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('finalizada', 'Finalizada'),
    ]

    consulta_origen = models.ForeignKey(Consulta, on_delete=models.PROTECT, related_name='derivaciones')
    paciente = models.ForeignKey('pacientes.Paciente', on_delete=models.PROTECT, related_name='derivaciones')
    medico_origen = models.ForeignKey(
        'autenticacion.Usuario', on_delete=models.PROTECT, related_name='derivaciones_origen'
    )
    especialidad_destino = models.CharField(max_length=100)
    medico_destino = models.ForeignKey(
        'autenticacion.Usuario',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='derivaciones_destino'
    )
    motivo = models.TextField()
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    fecha_derivacion = models.DateTimeField(auto_now_add=True)
    fecha_atencion = models.DateTimeField(null=True, blank=True)
    notas_especialista = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'derivaciones'
        ordering = ['-fecha_derivacion']
