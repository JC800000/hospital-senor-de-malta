import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.db.models import Q
from datetime import date
from .models import Paciente


class PacienteType(DjangoObjectType):
    nombre_completo = graphene.String()
    edad = graphene.Int()

    class Meta:
        model = Paciente
        fields = ('id', 'ci', 'nombres', 'apellidos', 'fecha_nac', 'sexo',
                  'estado_civil', 'ocupacion', 'departamento', 'municipio',
                  'direccion', 'telefono', 'idioma_principal', 'tipo_sangre',
                  'alergias', 'observaciones', 'activo', 'fecha_registro', 'registrado_por')
        convert_choices_to_enum = False

    def resolve_nombre_completo(self, info):
        return f'{self.nombres} {self.apellidos}'

    def resolve_edad(self, info):
        today = date.today()
        born = self.fecha_nac
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


class PacienteInput(graphene.InputObjectType):
    ci = graphene.String(required=True)
    nombres = graphene.String(required=True)
    apellidos = graphene.String(required=True)
    fecha_nac = graphene.Date(required=True)
    sexo = graphene.String(required=True)
    estado_civil = graphene.String()
    ocupacion = graphene.String()
    departamento = graphene.String()
    municipio = graphene.String()
    direccion = graphene.String()
    telefono = graphene.String()
    idioma_principal = graphene.String()
    tipo_sangre = graphene.String()
    alergias = graphene.String()
    observaciones = graphene.String()


class RegistrarPaciente(graphene.Mutation):
    class Arguments:
        input = PacienteInput(required=True)

    Output = PacienteType

    @login_required
    def mutate(self, info, input):
        data = {k: v for k, v in input.items() if v is not None}
        data['registrado_por'] = info.context.user
        paciente = Paciente.objects.create(**data)
        return paciente


class ActualizarPaciente(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        input = PacienteInput(required=True)

    Output = PacienteType

    @login_required
    def mutate(self, info, id, input):
        paciente = Paciente.objects.get(pk=id)
        for k, v in input.items():
            if v is not None:
                setattr(paciente, k, v)
        paciente.save()
        return paciente


class Query(graphene.ObjectType):
    pacientes = graphene.List(PacienteType, busqueda=graphene.String(), limite=graphene.Int())
    paciente_por_ci = graphene.Field(PacienteType, ci=graphene.String(required=True))
    paciente_por_id = graphene.Field(PacienteType, id=graphene.ID(required=True))

    @login_required
    def resolve_pacientes(self, info, busqueda=None, limite=None):
        qs = Paciente.objects.filter(activo=True).order_by('apellidos', 'nombres')
        if busqueda:
            qs = qs.filter(
                Q(ci__icontains=busqueda) |
                Q(nombres__icontains=busqueda) |
                Q(apellidos__icontains=busqueda)
            )
        if limite:
            qs = qs[:limite]
        return qs

    @login_required
    def resolve_paciente_por_ci(self, info, ci):
        try:
            return Paciente.objects.get(ci=ci, activo=True)
        except Paciente.DoesNotExist:
            return None

    @login_required
    def resolve_paciente_por_id(self, info, id):
        try:
            return Paciente.objects.get(pk=id)
        except Paciente.DoesNotExist:
            return None


class Mutation(graphene.ObjectType):
    registrar_paciente = RegistrarPaciente.Field()
    actualizar_paciente = ActualizarPaciente.Field()
