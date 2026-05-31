import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.utils import timezone
from django.db import transaction
from .models import Consulta, SignosVitales, Derivacion


class SignosVitalesType(DjangoObjectType):
    class Meta:
        model = SignosVitales
        fields = ('temperatura', 'presion_sistolica', 'presion_diastolica',
                  'peso', 'talla', 'frecuencia_cardiaca', 'saturacion_oxigeno', 'glucosa',
                  'frecuencia_respiratoria')


class DerivacionType(DjangoObjectType):
    class Meta:
        model = Derivacion
        fields = ('id', 'paciente', 'medico_origen', 'especialidad_destino',
                  'medico_destino', 'motivo', 'estado', 'fecha_derivacion',
                  'fecha_atencion', 'notas_especialista', 'consulta_origen')
        convert_choices_to_enum = False


class ConsultaType(DjangoObjectType):
    signos_vitales = graphene.Field(SignosVitalesType)
    derivacion = graphene.Field(DerivacionType)

    class Meta:
        model = Consulta
        fields = ('id', 'ticket', 'paciente', 'medico', 'fecha_inicio', 'fecha_fin',
                  'motivo', 'diagnostico', 'observaciones', 'tipo', 'especialidad',
                  'derivado_por', 'estado', 'sintomas', 'nivel_dolor')
        convert_choices_to_enum = False

    def resolve_signos_vitales(self, info):
        try:
            return self.signos_vitales
        except SignosVitales.DoesNotExist:
            return None

    def resolve_derivacion(self, info):
        return self.derivaciones.first()


class SignosVitalesInput(graphene.InputObjectType):
    temperatura = graphene.Float()
    presion_sistolica = graphene.Int()
    presion_diastolica = graphene.Int()
    peso = graphene.Float()
    talla = graphene.Float()
    frecuencia_cardiaca = graphene.Int()
    saturacion_oxigeno = graphene.Int()
    glucosa = graphene.Int()
    frecuencia_respiratoria = graphene.Int()


class IniciarConsulta(graphene.Mutation):
    class Arguments:
        ticket_id = graphene.ID(required=True)
        motivo = graphene.String(required=True)

    Output = ConsultaType

    @login_required
    def mutate(self, info, ticket_id, motivo):
        from tickets.models import Ticket
        ticket = Ticket.objects.get(pk=ticket_id)
        ticket.estado = 'atendiendo'
        ticket.save()

        consulta = Consulta.objects.create(
            ticket=ticket,
            paciente=ticket.paciente,
            medico=info.context.user,
            motivo=motivo,
        )
        return consulta


class FinalizarConsulta(graphene.Mutation):
    class Arguments:
        consulta_id = graphene.ID(required=True)
        diagnostico = graphene.String(required=True)
        observaciones = graphene.String()
        signos_vitales = SignosVitalesInput()
        sintomas = graphene.String()
        nivel_dolor = graphene.Int()

    Output = ConsultaType

    @login_required
    def mutate(self, info, consulta_id, diagnostico, observaciones=None,
               signos_vitales=None, sintomas=None, nivel_dolor=None):
        with transaction.atomic():
            consulta = Consulta.objects.get(pk=consulta_id)
            consulta.diagnostico = diagnostico
            consulta.observaciones = observaciones
            consulta.estado = 'finalizada'
            consulta.fecha_fin = timezone.now()
            if sintomas is not None:
                consulta.sintomas = sintomas
            if nivel_dolor is not None:
                consulta.nivel_dolor = nivel_dolor
            consulta.save()

            if signos_vitales:
                sv_data = {k: v for k, v in signos_vitales.items() if v is not None}
                SignosVitales.objects.update_or_create(consulta=consulta, defaults=sv_data)

            consulta.ticket.estado = 'atendido'
            consulta.ticket.fecha_atencion = timezone.now()
            consulta.ticket.save()

        return consulta


class DerivarPaciente(graphene.Mutation):
    class Arguments:
        consulta_id = graphene.ID(required=True)
        especialidad_destino = graphene.String(required=True)
        medico_destino_id = graphene.ID()
        motivo = graphene.String(required=True)

    Output = DerivacionType

    @login_required
    def mutate(self, info, consulta_id, especialidad_destino, motivo, medico_destino_id=None):
        from autenticacion.models import Usuario
        consulta = Consulta.objects.get(pk=consulta_id)
        medico_destino = None
        if medico_destino_id:
            medico_destino = Usuario.objects.get(pk=medico_destino_id)

        derivacion = Derivacion.objects.create(
            consulta_origen=consulta,
            paciente=consulta.paciente,
            medico_origen=info.context.user,
            especialidad_destino=especialidad_destino,
            medico_destino=medico_destino,
            motivo=motivo,
        )
        return derivacion


class AceptarDerivacion(graphene.Mutation):
    class Arguments:
        derivacion_id = graphene.ID(required=True)

    Output = DerivacionType

    @login_required
    def mutate(self, info, derivacion_id):
        derivacion = Derivacion.objects.get(pk=derivacion_id)
        derivacion.estado = 'aceptada'
        derivacion.medico_destino = info.context.user
        derivacion.fecha_atencion = timezone.now()
        derivacion.save()
        return derivacion


class Query(graphene.ObjectType):
    consultas = graphene.List(
        ConsultaType,
        medico_id=graphene.ID(),
        paciente_id=graphene.ID(),
        estado=graphene.String()
    )
    consulta_por_id = graphene.Field(ConsultaType, id=graphene.ID(required=True))
    historial_paciente = graphene.List(ConsultaType, paciente_id=graphene.ID(required=True))
    consulta_activa = graphene.Field(ConsultaType, medico_id=graphene.ID(required=True))
    derivaciones = graphene.List(
        DerivacionType,
        medico_destino_id=graphene.ID(),
        estado=graphene.String()
    )

    @login_required
    def resolve_consultas(self, info, medico_id=None, paciente_id=None, estado=None):
        qs = Consulta.objects.all()
        if medico_id:
            qs = qs.filter(medico_id=medico_id)
        if paciente_id:
            qs = qs.filter(paciente_id=paciente_id)
        if estado:
            qs = qs.filter(estado=estado)
        return qs

    @login_required
    def resolve_consulta_por_id(self, info, id):
        try:
            return Consulta.objects.get(pk=id)
        except Consulta.DoesNotExist:
            return None

    @login_required
    def resolve_historial_paciente(self, info, paciente_id):
        return Consulta.objects.filter(paciente_id=paciente_id).order_by('-fecha_inicio')

    @login_required
    def resolve_consulta_activa(self, info, medico_id):
        return Consulta.objects.filter(medico_id=medico_id, estado='activa').first()

    @login_required
    def resolve_derivaciones(self, info, medico_destino_id=None, estado=None):
        qs = Derivacion.objects.all()
        if medico_destino_id:
            qs = qs.filter(medico_destino_id=medico_destino_id)
        if estado:
            qs = qs.filter(estado=estado)
        return qs


class FinalizarDerivacion(graphene.Mutation):
    class Arguments:
        derivacion_id = graphene.ID(required=True)
        notas_especialista = graphene.String(required=True)

    Output = DerivacionType

    @login_required
    def mutate(self, info, derivacion_id, notas_especialista):
        derivacion = Derivacion.objects.get(pk=derivacion_id)
        derivacion.estado = 'finalizada'
        derivacion.notas_especialista = notas_especialista
        if not derivacion.fecha_atencion:
            derivacion.fecha_atencion = timezone.now()
        derivacion.save()
        return derivacion


class Mutation(graphene.ObjectType):
    iniciar_consulta = IniciarConsulta.Field()
    finalizar_consulta = FinalizarConsulta.Field()
    derivar_paciente = DerivarPaciente.Field()
    aceptar_derivacion = AceptarDerivacion.Field()
    finalizar_derivacion = FinalizarDerivacion.Field()
