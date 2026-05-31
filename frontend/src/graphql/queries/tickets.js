import { gql } from '@apollo/client'

export const TICKETS = gql`
  query Tickets($estado: String, $turno: String) {
    tickets(estado: $estado, turno: $turno) {
      id numero tipo turno estado fechaEmision tiempoEsperaEst posicionCola franjaHoraria fechaSlot
      paciente { id ci nombreCompleto telefono }
      emitidoPor { id ci nombreCompleto }
    }
  }
`

export const COLA_ESTADO = gql`
  query ColaEstado {
    colaEstado {
      totalEspera tiempoPromedioMin ticketActual medicosActivos
    }
  }
`

export const MIS_TICKETS_ACTIVOS = gql`
  query MisTicketsActivos {
    misTicketsActivos {
      id numero tipo turno estado posicionCola tiempoEsperaEst fechaEmision franjaHoraria
      paciente { nombreCompleto }
    }
  }
`

export const SLOTS_DIA = gql`
  query SlotsDia {
    slotsDia {
      franja
      tomado
      turno
      pasado
    }
  }
`

export const EMITIR_TICKET = gql`
  mutation EmitirTicket($pacienteId: ID!, $tipo: String!, $turno: String, $franjaHoraria: String) {
    emitirTicket(pacienteId: $pacienteId, tipo: $tipo, turno: $turno, franjaHoraria: $franjaHoraria) {
      id numero estado posicionCola tiempoEsperaEst fechaEmision franjaHoraria
      paciente { id ci nombreCompleto }
    }
  }
`

export const LLAMAR_SIGUIENTE_TICKET = gql`
  mutation LlamarSiguienteTicket($medicoId: ID!) {
    llamarSiguienteTicket(medicoId: $medicoId) {
      id numero estado fechaLlamado
      paciente { id ci nombreCompleto }
    }
  }
`

export const MARCAR_TICKET_ATENDIDO = gql`
  mutation MarcarTicketAtendido($ticketId: ID!) {
    marcarTicketAtendido(ticketId: $ticketId) {
      id numero estado
    }
  }
`

export const CANCELAR_TICKET = gql`
  mutation CancelarTicket($ticketId: ID!) {
    cancelarTicket(ticketId: $ticketId) {
      exito mensaje
    }
  }
`
