import graphene
import datetime
from graphql_jwt.decorators import login_required


class ReporteResumenType(graphene.ObjectType):
    total_pacientes = graphene.Int()
    total_consultas = graphene.Int()
    total_tickets = graphene.Int()
    tickets_hoy = graphene.Int()
    consultas_finalizadas = graphene.Int()
    recetas_pendientes = graphene.Int()
    recetas_despachadas = graphene.Int()


class TicketDiaType(graphene.ObjectType):
    fecha = graphene.String()    # "dd/mm"
    total = graphene.Int()
    atendidos = graphene.Int()
    cancelados = graphene.Int()


class ReporteTicketsType(graphene.ObjectType):
    # Totales fijos (siempre relativos a hoy)
    hoy = graphene.Int()
    semana = graphene.Int()
    mes = graphene.Int()
    # Período personalizado
    periodo = graphene.Int()
    por_dia = graphene.List(TicketDiaType)
    # Breakdown del período
    manana = graphene.Int()
    tarde = graphene.Int()
    atendidos = graphene.Int()
    cancelados = graphene.Int()
    activos = graphene.Int()


class Query(graphene.ObjectType):
    reporte_resumen = graphene.Field(
        ReporteResumenType,
        fecha_inicio=graphene.Date(required=True),
        fecha_fin=graphene.Date(required=True)
    )
    reporte_tickets = graphene.Field(
        ReporteTicketsType,
        fecha_inicio=graphene.Date(required=True),
        fecha_fin=graphene.Date(required=True)
    )

    @login_required
    def resolve_reporte_resumen(self, info, fecha_inicio, fecha_fin):
        user = info.context.user
        if user.rol not in ('director', 'administrativo'):
            raise Exception('Sin permiso: solo director o administrativo')

        from pacientes.models import Paciente
        from tickets.models import Ticket
        from consultas.models import Consulta
        from recetas.models import Receta
        from django.utils import timezone

        hoy = timezone.now().date()

        total_pacientes = Paciente.objects.filter(activo=True).count()
        total_tickets = Ticket.objects.filter(
            fecha_emision__date__gte=fecha_inicio,
            fecha_emision__date__lte=fecha_fin
        ).count()
        tickets_hoy = Ticket.objects.filter(fecha_emision__date=hoy).count()
        total_consultas = Consulta.objects.filter(
            fecha_inicio__date__gte=fecha_inicio,
            fecha_inicio__date__lte=fecha_fin
        ).count()
        consultas_finalizadas = Consulta.objects.filter(
            fecha_inicio__date__gte=fecha_inicio,
            fecha_inicio__date__lte=fecha_fin,
            estado='finalizada'
        ).count()
        recetas_pendientes = Receta.objects.filter(estado='pendiente').count()
        recetas_despachadas = Receta.objects.filter(
            fecha_emision__date__gte=fecha_inicio,
            fecha_emision__date__lte=fecha_fin,
            estado='despachada'
        ).count()

        return ReporteResumenType(
            total_pacientes=total_pacientes,
            total_consultas=total_consultas,
            total_tickets=total_tickets,
            tickets_hoy=tickets_hoy,
            consultas_finalizadas=consultas_finalizadas,
            recetas_pendientes=recetas_pendientes,
            recetas_despachadas=recetas_despachadas,
        )

    @login_required
    def resolve_reporte_tickets(self, info, fecha_inicio, fecha_fin):
        user = info.context.user
        if user.rol not in ('director', 'administrativo'):
            raise Exception('Sin permiso: solo director o administrativo')

        from tickets.models import Ticket
        from django.utils import timezone

        hoy = timezone.now().date()
        inicio_semana = hoy - datetime.timedelta(days=hoy.weekday())  # lunes
        inicio_mes = hoy.replace(day=1)

        def qs_periodo(fi, ff):
            return Ticket.objects.filter(
                fecha_emision__date__gte=fi,
                fecha_emision__date__lte=ff,
            )

        tickets_hoy = qs_periodo(hoy, hoy).count()
        tickets_semana = qs_periodo(inicio_semana, hoy).count()
        tickets_mes = qs_periodo(inicio_mes, hoy).count()

        periodo_qs = qs_periodo(fecha_inicio, fecha_fin)
        tickets_periodo = periodo_qs.count()

        # Detalle diario
        delta = (fecha_fin - fecha_inicio).days
        por_dia = []
        for i in range(delta + 1):
            fecha = fecha_inicio + datetime.timedelta(days=i)
            dia_qs = Ticket.objects.filter(fecha_emision__date=fecha)
            por_dia.append(TicketDiaType(
                fecha=fecha.strftime('%d/%m'),
                total=dia_qs.count(),
                atendidos=dia_qs.filter(estado='atendido').count(),
                cancelados=dia_qs.filter(estado='cancelado').count(),
            ))

        return ReporteTicketsType(
            hoy=tickets_hoy,
            semana=tickets_semana,
            mes=tickets_mes,
            periodo=tickets_periodo,
            por_dia=por_dia,
            manana=periodo_qs.filter(turno='manana').count(),
            tarde=periodo_qs.filter(turno='tarde').count(),
            atendidos=periodo_qs.filter(estado='atendido').count(),
            cancelados=periodo_qs.filter(estado='cancelado').count(),
            activos=periodo_qs.filter(estado__in=['esperando', 'llamado', 'atendiendo']).count(),
        )
