import Badge from '../ui/Badge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faClock } from '@fortawesome/free-solid-svg-icons'

export default function TicketCard({ ticket, actions }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <span className="text-blue-700 font-bold text-sm">{ticket.numero}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge estado={ticket.estado} />
            <Badge estado={ticket.tipo} />
          </div>
          <p className="text-gray-800 font-medium text-sm flex items-center gap-1">
            <FontAwesomeIcon icon={faUser} className="text-gray-400 text-xs" />
            {ticket.paciente?.nombreCompleto}
          </p>
          {ticket.posicionCola && (
            <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
              <FontAwesomeIcon icon={faClock} className="text-xs" />
              Posición #{ticket.posicionCola} · ~{ticket.tiempoEsperaEst} min
            </p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
