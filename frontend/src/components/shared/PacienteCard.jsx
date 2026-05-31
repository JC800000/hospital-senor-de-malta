import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faDroplet, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

export default function PacienteCard({ paciente, compact = false }) {
  if (!paciente) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faUser} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{paciente.nombreCompleto}</p>
          <p className="text-gray-500 text-sm">CI: {paciente.ci} · {paciente.edad} años · {paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
          {!compact && (
            <div className="flex flex-wrap gap-3 mt-2">
              {paciente.tipoSangre && (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <FontAwesomeIcon icon={faDroplet} />
                  {paciente.tipoSangre}
                </span>
              )}
              {paciente.alergias && (
                <span className="text-xs text-orange-600 flex items-center gap-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {paciente.alergias}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
