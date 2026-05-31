import { gql } from '@apollo/client'

const ITEM_FIELDS = `id medicamentoNombre cantidad frecuencia tiempoUso viaAdministracion cantidadRecetada cantidadDispensada valorUnitario`

export const RECETAS_POR_PACIENTE = gql`
  query RecetasPorPaciente($pacienteId: ID!) {
    recetasPorPaciente(pacienteId: $pacienteId) {
      id estado fechaEmision fechaDespacho
      medico { id ci nombreCompleto }
      items { ${ITEM_FIELDS} }
    }
  }
`

export const RECETAS_PENDIENTES = gql`
  query RecetasPendientes {
    recetasPendientes {
      id estado fechaEmision
      paciente { id ci nombreCompleto }
      medico { id ci nombreCompleto }
      items { ${ITEM_FIELDS} }
    }
  }
`

export const EMITIR_RECETA = gql`
  mutation EmitirReceta($consultaId: ID!, $items: [ItemRecetaInput!]!) {
    emitirReceta(consultaId: $consultaId, items: $items) {
      id estado fechaEmision
      items { ${ITEM_FIELDS} }
    }
  }
`

export const DESPACHAR_RECETA = gql`
  mutation DespacharReceta($recetaId: ID!, $items: [ItemDespachoInput]) {
    despacharReceta(recetaId: $recetaId, items: $items) {
      id estado fechaDespacho
      paciente { ci nombreCompleto }
    }
  }
`
