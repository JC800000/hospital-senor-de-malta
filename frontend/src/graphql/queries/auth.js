import { gql } from '@apollo/client'

export const LOGIN = gql`
  mutation Login($ci: String!, $password: String!) {
    login(ci: $ci, password: $password) {
      exito
      mensaje
      token
      usuario {
        id ci nombreCompleto nombres apellidos rol rolDisplay especialidad panelDestino activo
      }
    }
  }
`

export const LOGIN_PACIENTE = gql`
  mutation LoginPaciente($ci: String!) {
    loginPaciente(ci: $ci) {
      exito
      mensaje
      token
      usuario {
        id ci nombreCompleto especialidad
      }
    }
  }
`

export const YO = gql`
  query Yo {
    yo {
      id ci nombreCompleto rol rolDisplay especialidad panelDestino activo
    }
  }
`

export const CAMBIAR_PASSWORD = gql`
  mutation CambiarPassword($passwordActual: String!, $passwordNuevo: String!) {
    cambiarPassword(passwordActual: $passwordActual, passwordNuevo: $passwordNuevo) {
      exito mensaje
    }
  }
`

export const USUARIOS = gql`
  query Usuarios($rol: String, $activo: Boolean) {
    usuarios(rol: $rol, activo: $activo) {
      id ci nombreCompleto nombres apellidos rol rolDisplay especialidad turno activo fechaCreacion ultimoAcceso
    }
  }
`

export const USUARIO_POR_CI = gql`
  query UsuarioPorCi($ci: String!) {
    usuarioPorCi(ci: $ci) {
      id ci nombreCompleto rol especialidad turno activo
    }
  }
`

export const CREAR_USUARIO = gql`
  mutation CrearUsuario($input: UsuarioInput!) {
    crearUsuario(input: $input) {
      id ci nombreCompleto rol especialidad turno activo
    }
  }
`

export const ACTUALIZAR_USUARIO = gql`
  mutation ActualizarUsuario($id: ID!, $input: UsuarioInput!) {
    actualizarUsuario(id: $id, input: $input) {
      id ci nombreCompleto rol especialidad turno activo
    }
  }
`

export const TOGGLE_USUARIO_ACTIVO = gql`
  mutation ToggleUsuarioActivo($id: ID!) {
    toggleUsuarioActivo(id: $id) {
      id ci nombreCompleto activo
    }
  }
`
