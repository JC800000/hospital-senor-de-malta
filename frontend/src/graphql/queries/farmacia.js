import { gql } from '@apollo/client'

export const MEDICAMENTOS = gql`
  query Medicamentos($busqueda: String, $soloAlertas: Boolean) {
    medicamentos(busqueda: $busqueda, soloAlertas: $soloAlertas) {
      id nombre presentacion stockActual stockMinimo unidad
      fechaVencimiento proveedor activo alertaStock
    }
  }
`

export const REGISTRAR_MEDICAMENTO = gql`
  mutation RegistrarMedicamento($input: MedicamentoInput!) {
    registrarMedicamento(input: $input) {
      id nombre presentacion stockActual stockMinimo alertaStock
    }
  }
`

export const ACTUALIZAR_STOCK = gql`
  mutation ActualizarStock($medicamentoId: ID!, $cantidad: Int!, $operacion: String!) {
    actualizarStock(medicamentoId: $medicamentoId, cantidad: $cantidad, operacion: $operacion) {
      id nombre stockActual alertaStock
    }
  }
`
