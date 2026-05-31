from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Crea datos de prueba para el sistema Hospital Señor de Malta'

    def handle(self, *args, **options):
        self.seed_usuarios()
        self.seed_pacientes()
        self.seed_medicamentos()
        self.stdout.write(self.style.SUCCESS('Seed completado exitosamente'))

    def seed_usuarios(self):
        from autenticacion.models import Usuario

        usuarios_data = [
            {
                'ci': '10000001',
                'nombres': 'Carlos',
                'apellidos': 'Mendoza Vidal',
                'rol': 'director',
                'is_staff': True,
                'password': 'director123',
            },
            {
                'ci': '10000002',
                'nombres': 'Ana',
                'apellidos': 'Rojas Pedraza',
                'rol': 'administrativo',
                'password': 'admin123',
            },
            {
                'ci': '10000003',
                'nombres': 'Roberto',
                'apellidos': 'Vasquez Torres',
                'rol': 'medico',
                'especialidad': 'Medicina General',
                'password': 'medico123',
            },
            {
                'ci': '10000004',
                'nombres': 'Carmen',
                'apellidos': 'Flores Mamani',
                'rol': 'especialista',
                'especialidad': 'Cardiología',
                'password': 'espec123',
            },
            {
                'ci': '10000005',
                'nombres': 'Jorge',
                'apellidos': 'Lima Choque',
                'rol': 'farmacia',
                'password': 'farma123',
            },
        ]

        for data in usuarios_data:
            password = data.pop('password')
            usuario, created = Usuario.objects.get_or_create(
                ci=data['ci'],
                defaults=data
            )
            if created:
                usuario.set_password(password)
                usuario.save()
                self.stdout.write(f'  + Usuario: {usuario.ci} ({usuario.rol})')
            else:
                self.stdout.write(f'  ~ Usuario ya existe: {usuario.ci}')

    def seed_pacientes(self):
        from pacientes.models import Paciente
        from autenticacion.models import Usuario
        import datetime

        admin = Usuario.objects.filter(rol='administrativo').first()

        pacientes_data = [
            {
                'ci': '45678901',
                'nombres': 'María',
                'apellidos': 'García López',
                'fecha_nac': datetime.date(1990, 3, 15),
                'sexo': 'F',
                'tipo_sangre': 'O+',
                'telefono': '70112233',
                'departamento': 'La Paz',
                'municipio': 'La Paz',
            },
            {
                'ci': '67890123',
                'nombres': 'Carlos',
                'apellidos': 'Pérez Mamani',
                'fecha_nac': datetime.date(1979, 7, 22),
                'sexo': 'M',
                'tipo_sangre': 'A+',
                'telefono': '71223344',
                'alergias': 'Penicilina',
                'observaciones': 'Hipertensión arterial (HTA)',
                'departamento': 'La Paz',
                'municipio': 'El Alto',
            },
            {
                'ci': '23456789',
                'nombres': 'Luis',
                'apellidos': 'Mamani Cruz',
                'fecha_nac': datetime.date(1962, 11, 8),
                'sexo': 'M',
                'tipo_sangre': 'B+',
                'observaciones': 'Diabetes Mellitus tipo 2 (DM2)',
                'departamento': 'Cochabamba',
                'municipio': 'Cochabamba',
            },
            {
                'ci': '34567890',
                'nombres': 'Rosa',
                'apellidos': 'Quispe Flores',
                'fecha_nac': datetime.date(1989, 5, 30),
                'sexo': 'F',
                'tipo_sangre': 'AB+',
                'telefono': '72334455',
                'departamento': 'Santa Cruz',
                'municipio': 'Santa Cruz de la Sierra',
            },
        ]

        for data in pacientes_data:
            data['registrado_por'] = admin
            paciente, created = Paciente.objects.get_or_create(
                ci=data['ci'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  + Paciente: {paciente.ci} ({paciente.nombres} {paciente.apellidos})')
            else:
                self.stdout.write(f'  ~ Paciente ya existe: {paciente.ci}')

    def seed_medicamentos(self):
        from farmacia.models import Medicamento
        import datetime

        medicamentos_data = [
            {
                'nombre': 'Paracetamol',
                'presentacion': 'Tableta 500mg',
                'stock_actual': 200,
                'stock_minimo': 50,
                'unidad': 'tabletas',
                'proveedor': 'Laboratorios Inti',
            },
            {
                'nombre': 'Ibuprofeno',
                'presentacion': 'Tableta 400mg',
                'stock_actual': 150,
                'stock_minimo': 30,
                'unidad': 'tabletas',
                'proveedor': 'Droguería Bolivia',
            },
            {
                'nombre': 'Amoxicilina',
                'presentacion': 'Cápsula 500mg',
                'stock_actual': 8,
                'stock_minimo': 20,
                'unidad': 'cápsulas',
                'proveedor': 'Laboratorios Inti',
            },
            {
                'nombre': 'Metformina',
                'presentacion': 'Tableta 850mg',
                'stock_actual': 100,
                'stock_minimo': 25,
                'unidad': 'tabletas',
                'proveedor': 'Farmacia Central',
            },
            {
                'nombre': 'Enalapril',
                'presentacion': 'Tableta 10mg',
                'stock_actual': 0,
                'stock_minimo': 15,
                'unidad': 'tabletas',
                'proveedor': 'Droguería Bolivia',
            },
            {
                'nombre': 'Omeprazol',
                'presentacion': 'Cápsula 20mg',
                'stock_actual': 75,
                'stock_minimo': 20,
                'unidad': 'cápsulas',
                'fecha_vencimiento': datetime.date(2025, 12, 31),
            },
            {
                'nombre': 'Salbutamol',
                'presentacion': 'Inhalador 100mcg',
                'stock_actual': 12,
                'stock_minimo': 10,
                'unidad': 'inhaladores',
            },
        ]

        for data in medicamentos_data:
            med, created = Medicamento.objects.get_or_create(
                nombre=data['nombre'],
                presentacion=data['presentacion'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  + Medicamento: {med.nombre} ({med.presentacion})')
            else:
                self.stdout.write(f'  ~ Medicamento ya existe: {med.nombre}')
