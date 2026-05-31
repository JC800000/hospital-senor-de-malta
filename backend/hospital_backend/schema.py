import graphene
import graphql_jwt

import autenticacion.schema
import pacientes.schema
import tickets.schema
import consultas.schema
import recetas.schema
import farmacia.schema
import reportes.schema


class Query(
    autenticacion.schema.Query,
    pacientes.schema.Query,
    tickets.schema.Query,
    consultas.schema.Query,
    recetas.schema.Query,
    farmacia.schema.Query,
    reportes.schema.Query,
    graphene.ObjectType
):
    pass


class Mutation(
    autenticacion.schema.Mutation,
    pacientes.schema.Mutation,
    tickets.schema.Mutation,
    consultas.schema.Mutation,
    recetas.schema.Mutation,
    farmacia.schema.Mutation,
    graphene.ObjectType
):
    refresh_token = graphql_jwt.Refresh.Field()
    verify_token = graphql_jwt.Verify.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
