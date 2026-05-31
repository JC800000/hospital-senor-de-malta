import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.utils import timezone
from django.db import transaction
from .models import Receta, ItemReceta


class ItemRecetaType(DjangoObjectType):
    class Meta:
        model = ItemReceta
        fields = ('id', 'medicamento_nombre', 'cantidad', 'frecuencia', 'tiempo_uso',
                  'via_administracion', 'cantidad_recetada', 'cantidad_dispensada', 'valor_unitario')


class RecetaType(DjangoObjectType):
    items = graphene.List(ItemRecetaType)

    class Meta:
        model = Receta
        fields = ('id', 'consulta', 'paciente', 'medico', 'estado',
                  'fecha_emision', 'fecha_despacho', 'despachado_por')
        convert_choices_to_enum = False

    def resolve_items(self, info):
        return self.items.all()


class ItemRecetaInput(graphene.InputObjectType):
    medicamento_nombre = graphene.String(required=True)
    cantidad = graphene.String()
    frecuencia = graphene.String()
    tiempo_uso = graphene.String()
    via_administracion = graphene.String()


class ItemDespachoInput(graphene.InputObjectType):
    item_id = graphene.ID(required=True)
    cantidad_recetada = graphene.Int()
    cantidad_dispensada = graphene.Int()
    valor_unitario = graphene.Float()


class EmitirReceta(graphene.Mutation):
    class Arguments:
        consulta_id = graphene.ID(required=True)
        items = graphene.List(graphene.NonNull(ItemRecetaInput), required=True)

    Output = RecetaType

    @login_required
    def mutate(self, info, consulta_id, items):
        from consultas.models import Consulta
        with transaction.atomic():
            consulta = Consulta.objects.get(pk=consulta_id)
            receta = Receta.objects.create(
                consulta=consulta,
                paciente=consulta.paciente,
                medico=info.context.user,
            )
            for item in items:
                ItemReceta.objects.create(receta=receta, **item)
        return receta


class DespacharReceta(graphene.Mutation):
    class Arguments:
        receta_id = graphene.ID(required=True)
        items = graphene.List(ItemDespachoInput)

    Output = RecetaType

    @login_required
    def mutate(self, info, receta_id, items=None):
        with transaction.atomic():
            receta = Receta.objects.get(pk=receta_id)
            if items:
                for item_data in items:
                    item = ItemReceta.objects.get(pk=item_data.item_id)
                    if item_data.cantidad_recetada is not None:
                        item.cantidad_recetada = item_data.cantidad_recetada
                    if item_data.cantidad_dispensada is not None:
                        item.cantidad_dispensada = item_data.cantidad_dispensada
                    if item_data.valor_unitario is not None:
                        item.valor_unitario = item_data.valor_unitario
                    item.save()
            receta.estado = 'despachada'
            receta.fecha_despacho = timezone.now()
            receta.despachado_por = info.context.user
            receta.save()
        return receta


class Query(graphene.ObjectType):
    recetas_por_paciente = graphene.List(RecetaType, paciente_id=graphene.ID(required=True))
    recetas_pendientes = graphene.List(RecetaType)

    @login_required
    def resolve_recetas_por_paciente(self, info, paciente_id):
        return Receta.objects.filter(paciente_id=paciente_id).order_by('-fecha_emision')

    @login_required
    def resolve_recetas_pendientes(self, info):
        return Receta.objects.filter(estado='pendiente').order_by('fecha_emision')


class Mutation(graphene.ObjectType):
    emitir_receta = EmitirReceta.Field()
    despachar_receta = DespacharReceta.Field()
