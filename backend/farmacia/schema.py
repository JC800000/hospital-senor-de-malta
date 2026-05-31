import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from datetime import date
from django.db.models import Q, F
from .models import Medicamento


class MedicamentoType(DjangoObjectType):
    alerta_stock = graphene.String()

    class Meta:
        model = Medicamento
        fields = ('id', 'nombre', 'presentacion', 'stock_actual', 'stock_minimo',
                  'unidad', 'fecha_vencimiento', 'proveedor', 'activo', 'ultima_actualizacion')
        convert_choices_to_enum = False

    def resolve_alerta_stock(self, info):
        if self.stock_actual == 0:
            return 'agotado'
        if self.fecha_vencimiento and self.fecha_vencimiento < date.today():
            return 'vencido'
        if self.stock_actual <= self.stock_minimo:
            return 'bajo'
        return 'ok'


class MedicamentoInput(graphene.InputObjectType):
    nombre = graphene.String(required=True)
    presentacion = graphene.String(required=True)
    stock_actual = graphene.Int(required=True)
    stock_minimo = graphene.Int(required=True)
    unidad = graphene.String()
    fecha_vencimiento = graphene.Date()
    proveedor = graphene.String()


class RegistrarMedicamento(graphene.Mutation):
    class Arguments:
        input = MedicamentoInput(required=True)

    Output = MedicamentoType

    @login_required
    def mutate(self, info, input):
        data = {k: v for k, v in input.items() if v is not None}
        return Medicamento.objects.create(**data)


class ActualizarStock(graphene.Mutation):
    class Arguments:
        medicamento_id = graphene.ID(required=True)
        cantidad = graphene.Int(required=True)
        operacion = graphene.String(required=True)

    Output = MedicamentoType

    @login_required
    def mutate(self, info, medicamento_id, cantidad, operacion):
        medicamento = Medicamento.objects.get(pk=medicamento_id)
        if operacion == 'incremento':
            medicamento.stock_actual += cantidad
        elif operacion == 'decremento':
            medicamento.stock_actual = max(0, medicamento.stock_actual - cantidad)
        elif operacion == 'ajuste':
            medicamento.stock_actual = cantidad
        medicamento.save()
        return medicamento


class Query(graphene.ObjectType):
    medicamentos = graphene.List(
        MedicamentoType,
        busqueda=graphene.String(),
        solo_alertas=graphene.Boolean()
    )

    @login_required
    def resolve_medicamentos(self, info, busqueda=None, solo_alertas=None):
        qs = Medicamento.objects.filter(activo=True)
        if busqueda:
            qs = qs.filter(Q(nombre__icontains=busqueda) | Q(presentacion__icontains=busqueda))
        if solo_alertas:
            today = date.today()
            qs = qs.filter(
                Q(stock_actual=0) |
                Q(stock_actual__lte=F('stock_minimo')) |
                Q(fecha_vencimiento__lt=today)
            )
        return qs


class Mutation(graphene.ObjectType):
    registrar_medicamento = RegistrarMedicamento.Field()
    actualizar_stock = ActualizarStock.Field()
