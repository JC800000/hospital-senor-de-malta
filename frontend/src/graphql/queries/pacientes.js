import { gql } from '@apollo/client'

export const PACIENTES = gql`
  query Pacientes($busqueda: String, $limite: Int) {
    pacientes(busqueda: $busqueda, limite: $limite) {
      id ci nombreCompleto nombres apellidos fechaNac edad sexo
      telefono direccion tipoSangre alergias activo fechaRegistro
    }
  }
`

export const PACIENTE_POR_CI = gql`
  query PacientePorCi($ci: String!) {
    pacientePorCi(ci: $ci) {
      id ci nombreCompleto nombres apellidos fechaNac edad sexo
      estadoCivil ocupacion departamento municipio direccion telefono
      idiomaPrincipal tipoSangre alergias observaciones activo
    }
  }
`

export const PACIENTE_POR_ID = gql`
  query PacientePorId($id: ID!) {
    pacientePorId(id: $id) {
      id ci nombreCompleto nombres apellidos fechaNac edad sexo
      estadoCivil ocupacion departamento municipio direccion telefono
      idiomaPrincipal tipoSangre alergias observaciones activo
    }
  }
`

export const REGISTRAR_PACIENTE = gql`
  mutation RegistrarPaciente($input: PacienteInput!) {
    registrarPaciente(input: $input) {
      id ci nombreCompleto fechaNac edad sexo
    }
  }
`

export const ACTUALIZAR_PACIENTE = gql`
  mutation ActualizarPaciente($id: ID!, $input: PacienteInput!) {
    actualizarPaciente(id: $id, input: $input) {
      id ci nombreCompleto
    }
  }
`
