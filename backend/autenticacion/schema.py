import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from graphql_jwt.shortcuts import get_token
from django.utils import timezone
from .models import Usuario


class UsuarioType(DjangoObjectType):
    nombre_completo = graphene.String()
    rol_display = graphene.String()
    panel_destino = graphene.String()
    rol = graphene.String()

    class Meta:
        model = Usuario
        fields = ('id', 'ci', 'nombres', 'apellidos', 'especialidad',
                  'turno', 'activo', 'is_staff', 'fecha_creacion', 'ultimo_acceso')
        convert_choices_to_enum = False

    def resolve_rol(self, info):
        return self.rol

    def resolve_nombre_completo(self, info):
        return f'{self.nombres} {self.apellidos}'

    def resolve_rol_display(self, info):
        return self.get_rol_display()

    def resolve_panel_destino(self, info):
        mapping = {
            'director': '/dashboard',
            'administrativo': '/recepcion',
            'medico': '/medico',
            'especialista': '/especialista',
            'farmacia': '/farmacia',
        }
        return mapping.get(self.rol, '/login')


class LoginResult(graphene.ObjectType):
    exito = graphene.Boolean()
    mensaje = graphene.String()
    token = graphene.String()
    usuario = graphene.Field(UsuarioType)


class ResultadoType(graphene.ObjectType):
    exito = graphene.Boolean()
    mensaje = graphene.String()


class UsuarioInput(graphene.InputObjectType):
    ci = graphene.String(required=True)
    nombres = graphene.String(required=True)
    apellidos = graphene.String(required=True)
    rol = graphene.String(required=True)
    especialidad = graphene.String()
    turno = graphene.String()
    password = graphene.String()


class Login(graphene.Mutation):
    class Arguments:
        ci = graphene.String(required=True)
        password = graphene.String(required=True)

    Output = LoginResult

    def mutate(self, info, ci, password):
        try:
            user = Usuario.objects.get(ci=ci)
        except Usuario.DoesNotExist:
            return LoginResult(exito=False, mensaje='Credenciales incorrectas')

        if not user.check_password(password):
            return LoginResult(exito=False, mensaje='Credenciales incorrectas')

        if not user.activo:
            return LoginResult(exito=False, mensaje='Usuario inactivo')

        user.ultimo_acceso = timezone.now()
        user.save(update_fields=['ultimo_acceso'])
        token = get_token(user)
        return LoginResult(exito=True, mensaje='Login exitoso', token=token, usuario=user)


class LoginPaciente(graphene.Mutation):
    """Login simplificado para portal de pacientes (solo CI)."""
    class Arguments:
        ci = graphene.String(required=True)

    Output = LoginResult

    def mutate(self, info, ci):
        from pacientes.models import Paciente
        try:
            paciente = Paciente.objects.get(ci=ci, activo=True)
        except Paciente.DoesNotExist:
            return LoginResult(exito=False, mensaje='Paciente no encontrado')

        # Buscamos o creamos un usuario de sistema para el paciente
        usuario_ci = f'pac_{ci}'
        try:
            user = Usuario.objects.get(ci=usuario_ci)
            # Garantizar que especialidad apunta al ID correcto del paciente
            if user.especialidad != str(paciente.id):
                user.especialidad = str(paciente.id)
                user.save(update_fields=['especialidad'])
        except Usuario.DoesNotExist:
            user = Usuario.objects.create_user(
                ci=usuario_ci,
                nombres=paciente.nombres,
                apellidos=paciente.apellidos,
                rol='paciente_portal',
                especialidad=str(paciente.id),
                password=ci,
            )

        token = get_token(user)
        return LoginResult(exito=True, mensaje='Login exitoso', token=token, usuario=user)


class CambiarPassword(graphene.Mutation):
    class Arguments:
        password_actual = graphene.String(required=True)
        password_nuevo = graphene.String(required=True)

    Output = ResultadoType

    @login_required
    def mutate(self, info, password_actual, password_nuevo):
        user = info.context.user
        if not user.check_password(password_actual):
            return ResultadoType(exito=False, mensaje='Contraseña actual incorrecta')
        user.set_password(password_nuevo)
        user.save()
        return ResultadoType(exito=True, mensaje='Contraseña actualizada')


class CrearUsuario(graphene.Mutation):
    class Arguments:
        input = UsuarioInput(required=True)

    Output = UsuarioType

    @login_required
    def mutate(self, info, input):
        if info.context.user.rol != 'director':
            raise Exception('Sin permiso')
        password = input.pop('password', None) or input.ci
        usuario = Usuario(**{k: v for k, v in input.items() if v is not None})
        usuario.set_password(password)
        usuario.save()
        return usuario


class ActualizarUsuario(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        input = UsuarioInput(required=True)

    Output = UsuarioType

    @login_required
    def mutate(self, info, id, input):
        if info.context.user.rol != 'director':
            raise Exception('Sin permiso')
        usuario = Usuario.objects.get(pk=id)
        password = input.pop('password', None)
        for k, v in input.items():
            if v is not None:
                setattr(usuario, k, v)
        if password:
            usuario.set_password(password)
        usuario.save()
        return usuario


class ToggleUsuarioActivo(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    Output = UsuarioType

    @login_required
    def mutate(self, info, id):
        if info.context.user.rol != 'director':
            raise Exception('Sin permiso')
        usuario = Usuario.objects.get(pk=id)
        usuario.activo = not usuario.activo
        usuario.save()
        return usuario


class Query(graphene.ObjectType):
    yo = graphene.Field(UsuarioType)
    usuarios = graphene.List(UsuarioType, rol=graphene.String(), activo=graphene.Boolean())
    usuario_por_ci = graphene.Field(UsuarioType, ci=graphene.String(required=True))

    @login_required
    def resolve_yo(self, info):
        return info.context.user

    @login_required
    def resolve_usuarios(self, info, rol=None, activo=None):
        qs = Usuario.objects.all()
        if rol:
            qs = qs.filter(rol=rol)
        if activo is not None:
            qs = qs.filter(activo=activo)
        return qs

    @login_required
    def resolve_usuario_por_ci(self, info, ci):
        try:
            return Usuario.objects.get(ci=ci)
        except Usuario.DoesNotExist:
            return None


class Mutation(graphene.ObjectType):
    login = Login.Field()
    login_paciente = LoginPaciente.Field()
    cambiar_password = CambiarPassword.Field()
    crear_usuario = CrearUsuario.Field()
    actualizar_usuario = ActualizarUsuario.Field()
    toggle_usuario_activo = ToggleUsuarioActivo.Field()
