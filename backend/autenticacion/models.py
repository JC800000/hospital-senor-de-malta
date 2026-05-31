from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class UsuarioManager(BaseUserManager):
    def create_user(self, ci, password=None, **extra_fields):
        if not ci:
            raise ValueError('El CI es obligatorio')
        user = self.model(ci=ci, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, ci, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('rol', 'director')
        extra_fields.setdefault('nombres', 'Super')
        extra_fields.setdefault('apellidos', 'Admin')
        return self.create_user(ci, password, **extra_fields)


class Usuario(AbstractBaseUser):
    ROL_CHOICES = [
        ('director', 'Director'),
        ('administrativo', 'Administrativo'),
        ('medico', 'Médico'),
        ('especialista', 'Especialista'),
        ('farmacia', 'Farmacia'),
        ('paciente_portal', 'Paciente Portal'),
    ]
    TURNO_CHOICES = [
        ('manana', 'Mañana'),
        ('tarde', 'Tarde'),
        ('ambos', 'Ambos'),
    ]

    ci = models.CharField(max_length=20, unique=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES)
    especialidad = models.CharField(max_length=100, null=True, blank=True)
    turno = models.CharField(max_length=10, choices=TURNO_CHOICES, default='manana')
    activo = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'ci'
    REQUIRED_FIELDS = ['nombres', 'apellidos', 'rol']

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return f'{self.nombres} {self.apellidos} ({self.ci})'

    @property
    def is_active(self):
        return self.activo

    def has_perm(self, perm, obj=None):
        return self.is_staff

    def has_module_perms(self, app_label):
        return self.is_staff
