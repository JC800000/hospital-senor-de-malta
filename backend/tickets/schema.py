import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.utils import timezone
from .models import Ticket
from pacientes.schema import PacienteType
from autenticacion.schema import UsuarioType


class TicketType(DjangoObjectType):
    class Meta:
        model = Ticket
        fields = ('id', 'numero', 'paciente', 'tipo', 'turno', 'estado',
                  'fecha_emision', 'fecha_llamado', 'fecha_atencion',
                  'emitido_por', 'tiempo_espera_est', 'posicion_cola',
                  'franja_horaria', 'fecha_slot')
        convert_choices_to_enum = False


class ColaEstadoType(graphene.ObjectType):
    total_espera = graphene.Int()
    tiempo_promedio_min = graphene.Int()
    ticket_actual = graphene.String()
    medicos_activos = graphene.Int()


class SlotType(graphene.ObjectType):
    franja = graphene.String()   # "07:00-07:30"
    tomado = graphene.Boolean()
    turno = graphene.String()    # "manana" | "tarde"
    pasado = graphene.Boolean()  # True si la hora de inicio ya pasó en Bolivia


class EmitirTicket(graphene.Mutation):
    class Arguments:
        paciente_id = graphene.ID(required=True)
        tipo = graphene.String(required=True)
        turno = graphene.String()          # opcional: se deriva de franja_horaria
        franja_horaria = graphene.String() # "07:00-07:30"

    Output = TicketType

    @login_required
    def mutate(self, info, paciente_id, tipo, turno=None, franja_horaria=None):
        from pacientes.models import Paciente
        from django.utils.timezone import localdate

        paciente = Paciente.objects.get(pk=paciente_id)

        ticket_activo = Ticket.objects.filter(
            paciente=paciente,
            estado__in=['esperando', 'llamado', 'atendiendo']
        ).first()
        if ticket_activo:
            raise Exception(
                f'El paciente ya tiene el ticket {ticket_activo.numero} activo. '
                f'Solo puede sacar un nuevo ticket cuando finalice su atención.'
            )

        fecha_slot = None
        if franja_horaria:
            import datetime as dt
            fecha_slot = localdate()
            slot_hour = int(franja_horaria[:2])
            slot_min = int(franja_horaria[3:5])
            # Verificar que la franja no esté tomada
            if Ticket.objects.filter(
                franja_horaria=franja_horaria,
                fecha_slot=fecha_slot,
            ).exclude(estado__in=['cancelado', 'atendido']).exists():
                raise Exception(
                    'Este horario ya fue tomado por otro paciente. '
                    'Por favor selecciona otro horario disponible.'
                )
            # Derivar turno desde la hora de inicio de la franja
            turno = 'manana' if slot_hour < 12 else 'tarde'

        if not turno:
            turno = 'manana'

        en_cola = Ticket.objects.filter(
            estado='esperando',
            turno=turno
        ).count()

        ticket = Ticket(
            paciente=paciente,
            tipo=tipo,
            turno=turno,
            posicion_cola=en_cola + 1,
            tiempo_espera_est=(en_cola + 1) * 5,
            franja_horaria=franja_horaria or '',
            fecha_slot=fecha_slot,
        )
        if tipo == 'presencial':
            ticket.emitido_por = info.context.user
        ticket.save()
        return ticket


class LlamarSiguienteTicket(graphene.Mutation):
    class Arguments:
        medico_id = graphene.ID(required=True)

    Output = TicketType

    @login_required
    def mutate(self, info, medico_id):
        # Ordenar por franja_horaria si existe, si no por fecha_emision
        ticket = (
            Ticket.objects.filter(estado='esperando', franja_horaria__gt='')
            .order_by('fecha_slot', 'franja_horaria')
            .first()
            or Ticket.objects.filter(estado='esperando', franja_horaria='')
            .order_by('fecha_emision')
            .first()
        )
        if not ticket:
            return None
        ticket.estado = 'llamado'
        ticket.fecha_llamado = timezone.now()
        ticket.save()
        return ticket


class MarcarTicketAtendido(graphene.Mutation):
    class Arguments:
        ticket_id = graphene.ID(required=True)

    Output = TicketType

    @login_required
    def mutate(self, info, ticket_id):
        ticket = Ticket.objects.get(pk=ticket_id)
        ticket.estado = 'atendido'
        ticket.fecha_atencion = timezone.now()
        ticket.save()
        return ticket


class CancelarTicket(graphene.Mutation):
    class Arguments:
        ticket_id = graphene.ID(required=True)

    exito = graphene.Boolean()
    mensaje = graphene.String()

    @login_required
    def mutate(self, info, ticket_id):
        ticket = Ticket.objects.get(pk=ticket_id)
        ticket.estado = 'cancelado'
        ticket.save()
        return CancelarTicket(exito=True, mensaje='Ticket cancelado')


class Query(graphene.ObjectType):
    tickets = graphene.List(TicketType, estado=graphene.String(), turno=graphene.String())
    cola_estado = graphene.Field(ColaEstadoType)
    mis_tickets_activos = graphene.List(TicketType)
    slots_dia = graphene.List(SlotType, fecha=graphene.Date())

    @login_required
    def resolve_tickets(self, info, estado=None, turno=None):
        qs = Ticket.objects.all().order_by('fecha_emision')
        if estado:
            qs = qs.filter(estado=estado)
        if turno:
            qs = qs.filter(turno=turno)
        return qs

    @login_required
    def resolve_cola_estado(self, info):
        esperando = Ticket.objects.filter(estado='esperando')
        atendiendo = Ticket.objects.filter(estado='atendiendo')
        llamado = Ticket.objects.filter(estado='llamado')
        ticket_actual = atendiendo.first() or llamado.first()
        return ColaEstadoType(
            total_espera=esperando.count(),
            tiempo_promedio_min=30,
            ticket_actual=ticket_actual.numero if ticket_actual else None,
            medicos_activos=atendiendo.count() + llamado.count(),
        )

    @login_required
    def resolve_mis_tickets_activos(self, info):
        user = info.context.user
        if user.rol == 'paciente_portal' and user.especialidad:
            from pacientes.models import Paciente
            try:
                paciente = Paciente.objects.get(pk=int(user.especialidad))
                return Ticket.objects.filter(
                    paciente=paciente
                ).exclude(estado='cancelado').order_by('-fecha_emision')[:10]
            except (Paciente.DoesNotExist, ValueError):
                return []
        return []

    @login_required
    def resolve_slots_dia(self, info, fecha=None):
        import datetime as dt
        from django.utils.timezone import localdate

        fecha = fecha or localdate()

        tomadas = set(
            Ticket.objects.filter(
                fecha_slot=fecha,
                franja_horaria__gt='',
            ).exclude(estado__in=['cancelado', 'atendido']).values_list('franja_horaria', flat=True)
        )

        # Hora actual en Bolivia
        now_local = timezone.localtime()
        current_date = now_local.date()
        current_time = now_local.time()

        def make(h, m, turno):
            h2 = h + (1 if m == 30 else 0)
            m2 = 0 if m == 30 else 30
            f = f"{h:02d}:{m:02d}-{h2:02d}:{m2:02d}"
            return SlotType(franja=f, tomado=f in tomadas, turno=turno, pasado=False)

        # Mañana: 07:00–12:00 → 10 slots
        manana = [make(7 + i // 2, 0 if i % 2 == 0 else 30, 'manana') for i in range(10)]
        # Tarde:  14:00–18:00 → 8 slots
        tarde = [make(14 + i // 2, 0 if i % 2 == 0 else 30, 'tarde') for i in range(8)]
        return manana + tarde


class Mutation(graphene.ObjectType):
    emitir_ticket = EmitirTicket.Field()
    llamar_siguiente_ticket = LlamarSiguienteTicket.Field()
    marcar_ticket_atendido = MarcarTicketAtendido.Field()
    cancelar_ticket = CancelarTicket.Field()
