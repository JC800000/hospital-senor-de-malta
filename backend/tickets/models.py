from django.db import models


class Ticket(models.Model):
    TIPO_CHOICES = [('presencial', 'Presencial'), ('remoto', 'Remoto')]
    TURNO_CHOICES = [('manana', 'Mañana'), ('tarde', 'Tarde')]
    ESTADO_CHOICES = [
        ('esperando', 'Esperando'),
        ('llamado', 'Llamado'),
        ('atendiendo', 'Atendiendo'),
        ('atendido', 'Atendido'),
        ('cancelado', 'Cancelado'),
    ]

    numero = models.CharField(max_length=10)
    paciente = models.ForeignKey('pacientes.Paciente', on_delete=models.PROTECT, related_name='tickets')
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES, default='presencial')
    turno = models.CharField(max_length=10, choices=TURNO_CHOICES)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='esperando')
    fecha_emision = models.DateTimeField(auto_now_add=True)
    fecha_llamado = models.DateTimeField(null=True, blank=True)
    fecha_atencion = models.DateTimeField(null=True, blank=True)
    emitido_por = models.ForeignKey(
        'autenticacion.Usuario',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='tickets_emitidos'
    )
    tiempo_espera_est = models.IntegerField(null=True, blank=True)
    posicion_cola = models.IntegerField(null=True, blank=True)
    franja_horaria = models.CharField(max_length=11, blank=True, default='')  # "07:00-07:30"
    fecha_slot = models.DateField(null=True, blank=True)  # date of the appointment slot

    class Meta:
        db_table = 'tickets'
        ordering = ['fecha_emision']

    def __str__(self):
        return f'{self.numero} - {self.paciente}'

    def save(self, *args, **kwargs):
        if not self.numero:
            last = Ticket.objects.order_by('-id').first()
            next_num = (last.id + 1) if last else 1
            self.numero = f'T-{next_num:03d}'
        super().save(*args, **kwargs)
