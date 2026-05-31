import { gql } from '@apollo/client'

const SIGNOS_VITALES_FRAGMENT = gql`
  fragment SignosVitalesFields on SignosVitalesType {
    temperatura presionSistolica presionDiastolica peso talla
    frecuenciaCardiaca saturacionOxigeno glucosa frecuenciaRespiratoria
  }
`

export const HISTORIAL_PACIENTE = gql`
  query HistorialPaciente($pacienteId: ID!) {
    historialPaciente(pacienteId: $pacienteId) {
      id fechaInicio fechaFin motivo diagnostico observaciones tipo especialidad estado
      sintomas nivelDolor
      medico { id ci nombreCompleto especialidad }
      signosVitales { ...SignosVitalesFields }
      derivacion { id especialidadDestino estado }
    }
  }
  ${SIGNOS_VITALES_FRAGMENT}
`

export const CONSULTA_POR_ID = gql`
  query ConsultaPorId($id: ID!) {
    consultaPorId(id: $id) {
      id fechaInicio fechaFin motivo diagnostico observaciones tipo especialidad estado
      sintomas nivelDolor
      ticket { id numero estado }
      paciente { id ci nombreCompleto edad sexo alergias tipoSangre observaciones }
      medico { id ci nombreCompleto especialidad }
      signosVitales { ...SignosVitalesFields }
      derivacion {
        id especialidadDestino estado motivo
        medicoDestino { id ci nombreCompleto especialidad }
      }
    }
  }
  ${SIGNOS_VITALES_FRAGMENT}
`

export const CONSULTA_ACTIVA = gql`
  query ConsultaActiva($medicoId: ID!) {
    consultaActiva(medicoId: $medicoId) {
      id fechaInicio motivo estado
      ticket { id numero }
      paciente { id ci nombreCompleto edad }
    }
  }
`

export const DERIVACIONES = gql`
  query Derivaciones($medicoDestinoId: ID, $estado: String) {
    derivaciones(medicoDestinoId: $medicoDestinoId, estado: $estado) {
      id especialidadDestino motivo estado fechaDerivacion notasEspecialista
      paciente {
        id ci nombreCompleto edad sexo tipoSangre alergias observaciones
      }
      medicoOrigen { id nombreCompleto especialidad }
      medicoDestino { id nombreCompleto }
      consultaOrigen {
        id motivo diagnostico observaciones
        signosVitales { ...SignosVitalesFields }
      }
    }
  }
  ${SIGNOS_VITALES_FRAGMENT}
`

export const INICIAR_CONSULTA = gql`
  mutation IniciarConsulta($ticketId: ID!, $motivo: String!) {
    iniciarConsulta(ticketId: $ticketId, motivo: $motivo) {
      id fechaInicio motivo estado
      ticket { id numero }
      paciente { id ci nombreCompleto edad }
    }
  }
`

export const FINALIZAR_CONSULTA = gql`
  mutation FinalizarConsulta(
    $consultaId: ID!, $diagnostico: String!, $observaciones: String,
    $signosVitales: SignosVitalesInput, $sintomas: String, $nivelDolor: Int
  ) {
    finalizarConsulta(
      consultaId: $consultaId, diagnostico: $diagnostico, observaciones: $observaciones,
      signosVitales: $signosVitales, sintomas: $sintomas, nivelDolor: $nivelDolor
    ) {
      id estado fechaFin diagnostico sintomas nivelDolor
    }
  }
`

export const DERIVAR_PACIENTE = gql`
  mutation DerivarPaciente($consultaId: ID!, $especialidadDestino: String!, $medicoDestinoId: ID, $motivo: String!) {
    derivarPaciente(consultaId: $consultaId, especialidadDestino: $especialidadDestino, medicoDestinoId: $medicoDestinoId, motivo: $motivo) {
      id especialidadDestino estado motivo
      medicoDestino { id nombreCompleto especialidad }
    }
  }
`

export const ACEPTAR_DERIVACION = gql`
  mutation AceptarDerivacion($derivacionId: ID!) {
    aceptarDerivacion(derivacionId: $derivacionId) {
      id estado fechaAtencion
      paciente { id ci nombreCompleto }
    }
  }
`

export const FINALIZAR_DERIVACION = gql`
  mutation FinalizarDerivacion($derivacionId: ID!, $notasEspecialista: String!) {
    finalizarDerivacion(derivacionId: $derivacionId, notasEspecialista: $notasEspecialista) {
      id estado notasEspecialista fechaAtencion
    }
  }
`
