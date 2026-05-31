import { useState, useEffect } from 'react'
import { useLazyQuery } from '@apollo/client'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch, faChevronDown, faChevronUp, faUser, faPills,
  faShare, faStethoscope
} from '@fortawesome/free-solid-svg-icons'
import { PACIENTE_POR_CI } from '../../graphql/queries/pacientes'
import { HISTORIAL_PACIENTE } from '../../graphql/queries/consultas'
import Badge from '../../components/ui/Badge'
import PacienteCard from '../../components/shared/PacienteCard'
import EmptyState from '../../components/ui/EmptyState'

export default function HistorialMedico() {
  const location = useLocation()
  const [ci, setCi] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [paciente, setPaciente] = useState(null)

  const [buscarPaciente, { loading: buscando }] = useLazyQuery(PACIENTE_POR_CI, {
    fetchPolicy: 'network-only',
    onCompleted: (d) => { setPaciente(d.pacientePorCi); buscarHistorial({ variables: { pacienteId: d.pacientePorCi?.id } }) }
  })

  const [buscarHistorial, { data: historialData, loading: loadingH }] = useLazyQuery(HISTORIAL_PACIENTE)

  // Si se navega desde la lista de pacientes con un CI preseleccionado
  useEffect(() => {
    const ciPre = location.state?.ci
    if (ciPre) {
      setCi(ciPre)
      buscarPaciente({ variables: { ci: ciPre } })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const historial = historialData?.historialPaciente || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Historial Médico</h1>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <form onSubmit={e => { e.preventDefault(); buscarPaciente({ variables: { ci: ci.trim() } }) }} className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar por CI del paciente..."
            value={ci}
            onChange={e => setCi(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={buscando || !ci} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <FontAwesomeIcon icon={faSearch} />
            Buscar
          </button>
        </form>
      </div>

      {paciente && <PacienteCard paciente={paciente} />}

      {/* Timeline */}
      {loadingH ? (
        <p className="text-center text-gray-500 py-8">Cargando historial...</p>
      ) : historial.length > 0 ? (
        <div className="space-y-3">
          {historial.map(consulta => (
            <div key={consulta.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === consulta.id ? null : consulta.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faStethoscope} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {new Date(consulta.fechaInicio).toLocaleDateString('es-BO', { dateStyle: 'long' })}
                    </p>
                    <p className="text-gray-500 text-xs">Dr. {consulta.medico?.nombreCompleto} · {consulta.tipo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge estado={consulta.estado} />
                  <FontAwesomeIcon icon={expandedId === consulta.id ? faChevronUp : faChevronDown} className="text-gray-400" />
                </div>
              </button>

              {expandedId === consulta.id && (
                <div className="border-t border-gray-50 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Motivo</p>
                      <p className="text-sm text-gray-800">{consulta.motivo}</p>
                    </div>
                    {consulta.diagnostico && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Diagnóstico</p>
                        <p className="text-sm text-gray-800">{consulta.diagnostico}</p>
                      </div>
                    )}
                  </div>
                  {consulta.signosVitales && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Signos Vitales</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {consulta.signosVitales.temperatura && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Temp.</p><p className="font-semibold text-sm">{consulta.signosVitales.temperatura}°C</p></div>}
                        {consulta.signosVitales.presionSistolica && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Presión</p><p className="font-semibold text-sm">{consulta.signosVitales.presionSistolica}/{consulta.signosVitales.presionDiastolica}</p></div>}
                        {consulta.signosVitales.peso && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Peso</p><p className="font-semibold text-sm">{consulta.signosVitales.peso} kg</p></div>}
                        {consulta.signosVitales.saturacionOxigeno && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">SpO₂</p><p className="font-semibold text-sm">{consulta.signosVitales.saturacionOxigeno}%</p></div>}
                      </div>
                    </div>
                  )}
                  {consulta.derivacion && (
                    <div className="bg-violet-50 rounded-lg p-3">
                      <p className="text-xs text-violet-600 font-medium flex items-center gap-1"><FontAwesomeIcon icon={faShare} /> Derivado a {consulta.derivacion.especialidadDestino}</p>
                      <Badge estado={consulta.derivacion.estado} className="mt-1" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : paciente ? (
        <EmptyState icon={faStethoscope} title="Sin historial" description="Este paciente no tiene consultas registradas" />
      ) : null}
    </div>
  )
}
