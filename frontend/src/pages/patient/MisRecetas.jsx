import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPills, faChevronDown, faChevronUp, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons'
import { RECETAS_POR_PACIENTE } from '../../graphql/queries/recetas'
import { useAuth } from '../../context/AuthContext'

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'despachada', label: 'Despachadas' },
]

export default function MisRecetas() {
  const { usuario } = useAuth()
  const [filtro, setFiltro] = useState('todas')
  const [expandedId, setExpandedId] = useState(null)

  // pacienteId is stored in especialidad field by loginPaciente mutation
  const pacienteId = usuario?.especialidad

  const { data, loading } = useQuery(RECETAS_POR_PACIENTE, {
    variables: { pacienteId },
    skip: !pacienteId,
    pollInterval: 10000,
    fetchPolicy: 'network-only',
  })

  const todasRecetas = data?.recetasPorPaciente || []
  const recetas = filtro === 'todas'
    ? todasRecetas
    : todasRecetas.filter(r => r.estado === filtro)

  return (
    <div className="space-y-5 pb-8">
      <div className="pt-1">
        <p className="text-blue-300 text-sm font-medium">Historial de medicamentos</p>
        <h1 className="text-2xl font-black text-white">Mis Recetas</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filtro === f.value
                ? 'bg-white text-blue-700 shadow'
                : 'bg-white/15 text-blue-100 hover:bg-white/25'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white/10 rounded-2xl p-8 text-center">
          <p className="text-blue-100 text-sm">Cargando recetas...</p>
        </div>
      ) : recetas.length === 0 ? (
        <div className="bg-white/10 rounded-2xl p-8 text-center border border-white/20">
          <FontAwesomeIcon icon={faPills} className="text-white/40 text-4xl mb-3" />
          <p className="text-white font-semibold">Sin recetas</p>
          <p className="text-blue-200 text-sm mt-1">
            {filtro === 'todas' ? 'No tienes recetas registradas' : `No tienes recetas ${filtro === 'pendiente' ? 'pendientes' : 'despachadas'}`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recetas.map(receta => (
            <div key={receta.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header row */}
              <button
                className="w-full p-4 text-left flex items-center gap-3"
                onClick={() => setExpandedId(expandedId === receta.id ? null : receta.id)}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  receta.estado === 'despachada' ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                  <FontAwesomeIcon
                    icon={receta.estado === 'despachada' ? faCheckCircle : faClock}
                    className={receta.estado === 'despachada' ? 'text-green-500' : 'text-yellow-500'}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {receta.items?.length} medicamento{receta.items?.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dr. {receta.medico?.nombreCompleto} · {new Date(receta.fechaEmision).toLocaleDateString('es-BO', { dateStyle: 'medium' })}
                  </p>
                </div>

                {/* Badge + chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    receta.estado === 'despachada'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {receta.estado === 'despachada' ? 'Despachada' : 'Pendiente'}
                  </span>
                  <FontAwesomeIcon
                    icon={expandedId === receta.id ? faChevronUp : faChevronDown}
                    className="text-gray-300 text-xs"
                  />
                </div>
              </button>

              {/* Expanded content */}
              {expandedId === receta.id && (
                <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-2">
                  {receta.items?.map(item => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                      <p className="font-semibold text-gray-800 text-sm">{item.medicamentoNombre}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {item.cantidad && (
                          <p className="text-xs text-gray-500">Cantidad: <span className="text-gray-700">{item.cantidad}</span></p>
                        )}
                        {item.frecuencia && (
                          <p className="text-xs text-gray-500">Frecuencia: <span className="text-gray-700">{item.frecuencia}</span></p>
                        )}
                        {item.tiempoUso && (
                          <p className="text-xs text-gray-500">Tiempo de uso: <span className="text-gray-700">{item.tiempoUso}</span></p>
                        )}
                        {item.viaAdministracion && (
                          <p className="text-xs text-gray-500">Vía: <span className="text-gray-700">{item.viaAdministracion}</span></p>
                        )}
                      </div>
                    </div>
                  ))}

                  {receta.estado === 'despachada' && receta.fechaDespacho && (
                    <p className="text-xs text-gray-400 text-right pt-1">
                      Despachada el {new Date(receta.fechaDespacho).toLocaleDateString('es-BO', { dateStyle: 'medium' })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
