import { gql } from '@apollo/client'

export const REPORTE_RESUMEN = gql`
  query ReporteResumen($fechaInicio: Date!, $fechaFin: Date!) {
    reporteResumen(fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      totalPacientes totalConsultas totalTickets ticketsHoy
      consultasFinalizadas recetasPendientes recetasDespachadas
    }
  }
`

export const REPORTE_TICKETS = gql`
  query ReporteTickets($fechaInicio: Date!, $fechaFin: Date!) {
    reporteTickets(fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      hoy semana mes periodo
      manana tarde atendidos cancelados activos
      porDia { fecha total atendidos cancelados }
    }
  }
`
