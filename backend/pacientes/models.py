from django.db import models


class Paciente(models.Model):
    SEXO_CHOICES = [('M', 'Masculino'), ('F', 'Femenino')]
    ESTADO_CIVIL_CHOICES = [
        ('soltero', 'Soltero/a'),
        ('casado', 'Casado/a'),
        ('viudo', 'Viudo/a'),
        ('divorciado', 'Divorciado/a'),
    ]
    TIPO_SANGRE_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('O+', 'O+'), ('O-', 'O-'), ('AB+', 'AB+'), ('AB-', 'AB-'),
    ]

    ci = models.CharField(max_length=20, unique=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    fecha_nac = models.DateField()
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES)
    estado_civil = models.CharField(max_length=20, choices=ESTADO_CIVIL_CHOICES, blank=True)
    ocupacion = models.CharField(max_length=100, blank=True)
    departamento = models.CharField(max_length=50, blank=True)
    municipio = models.CharField(max_length=100, blank=True)
    direccion = models.TextField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    idioma_principal = models.CharField(max_length=30, default='español')
    tipo_sangre = models.CharField(max_length=5, choices=TIPO_SANGRE_CHOICES, blank=True)
    alergias = models.TextField(null=True, blank=True)
    observaciones = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        'autenticacion.Usuario',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='pacientes_registrados'
    )

    class Meta:
        db_table = 'pacientes'

    def __str__(self):
        return f'{self.nombres} {self.apellidos} ({self.ci})'
