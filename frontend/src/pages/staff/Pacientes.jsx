import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch, faUserPlus, faTicket, faUsers, faClock,
  faClipboardList, faCheckCircle, faPrint, faIdCard
} from '@fortawesome/free-solid-svg-icons'
import { PACIENTES } from '../../graphql/queries/pacientes'
import { EMITIR_TICKET } from '../../graphql/queries/tickets'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'
import { LoadingScreen } from '../../components/ui/Spinner'

const BLOOD_COLORS = {
  'A+': 'bg-red-100 text-red-700', 'A-': 'bg-red-100 text-red-700',
  'B+': 'bg-orange-100 text-orange-700', 'B-': 'bg-orange-100 text-orange-700',
  'O+': 'bg-blue-100 text-blue-700', 'O-': 'bg-blue-100 text-blue-700',
  'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-100 text-purple-700',
}

function getInitials(name) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

export default function Pacientes() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('')
  const [filtro, setFiltro] = useState('activos')

  // Emisión inline
  const [emitirPara, setEmitirPara] = useState(null)
  const [turnoEmision, setTurnoEmision] = useState('manana')
  const [ticketEmitido, setTicketEmitido] = useState(null)

  const puedeEmitir = ['director', 'administrativo'].includes(usuario?.rol)

  // Debounce 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusqueda(busqueda.trim()), 400)
    return () => clearTimeout(t)
  }, [busqueda])

  const { data, loading } = useQuery(PACIENTES, {
    variables: { busqueda: debouncedBusqueda || undefined, limite: 300 },
    fetchPolicy: 'cache-and-network',
  })

  const pacientes = useMemo(() => {
    const all = data?.pacientes || []
    if (filtro === 'activos')   return all.filter(p => p.activo)
    if (filtro === 'inactivos') return all.filter(p => !p.activo)
    return all
  }, [data, filtro])

  const [emitirTicket, { loading: emitiendo }] = useMutation(EMITIR_TICKET, {
    onCompleted: d => setTicketEmitido(d.emitirTicket),
    onError: err => alert('Error al emitir ticket: ' + err.message),
  })

  const handleEmitir = () => {
    if (!emitirPara) return
    emitirTicket({ variables: { pacienteId: emitirPara.id, tipo: 'presencial', turno: turnoEmision } })
  }

  const cerrarEmision = () => {
    setEmitirPara(null)
    setTurnoEmision('manana')
    setTicketEmitido(null)
  }

  const abrirEmision = (p) => {
    setEmitirPara({ id: p.id, nombreCompleto: p.nombreCompleto })
    setTicketEmitido(null)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>
          <p className="text-gray-500 text-sm">
            {loading && !data ? 'Cargando...' : `${pacientes.length} paciente${pacientes.length !== 1 ? 's' : ''}`}
            {filtro !== 'todos' && !loading && ` · filtro: ${filtro}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/registro-paciente')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm shrink-0"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          Nuevo Paciente
        </button>
      </div>

      {/* Búsqueda + filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, apellido o CI..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {loading && debouncedBusqueda && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {[
              { value: 'todos',     label: 'Todos' },
              { value: 'activos',   label: 'Activos' },
              { value: 'inactivos', label: 'Inactivos' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filtro === f.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading && !data ? (
        <LoadingScreen />
      ) : pacientes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-14 text-center">
          <FontAwesomeIcon icon={faIdCard} className="text-gray-200 text-5xl mb-4" />
          <p className="font-semibold text-gray-500">No se encontraron pacientes</p>
          {busqueda && <p className="text-gray-400 text-sm mt-1">Intenta con otro nombre o CI</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cabecera de tabla */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>Paciente</span>
            <span>Datos</span>
            <span className="text-right pr-16">Sangre</span>
            <span></span>
          </div>

          <div className="divide-y divide-gray-50">
            {pacientes.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                  p.activo ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {getInitials(p.nombreCompleto)}
                </div>

                {/* Nombre + CI */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm truncate">{p.nombreCompleto}</p>
                    {!p.activo && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full font-medium shrink-0">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">{p.ci}</span>
                    {p.telefono && (
                      <span className="text-xs text-gray-400 hidden sm:inline">· {p.telefono}</span>
                    )}
                  </div>
                </div>

                {/* Edad + sexo */}
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-sm font-medium text-gray-700">{p.edad} años</p>
                  <p className="text-xs text-gray-400">{p.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                </div>

                {/* Tipo sangre */}
                <div className="shrink-0 w-12 text-center">
                  {p.tipoSangre ? (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${BLOOD_COLORS[p.tipoSangre] || 'bg-gray-100 text-gray-600'}`}>
                      {p.tipoSangre}
                    </span>
                  ) : (
                    <span className="text-gray-200 text-xs">—</span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => navigate('/historiales', { state: { ci: p.ci } })}
                    title="Ver historial médico"
                    className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faClipboardList} className="text-sm" />
                  </button>
                  {puedeEmitir && (
                    <button
                      onClick={() => abrirEmision(p)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTicket} />
                      Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer con conteo */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-right">
            {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''}
            {filtro !== 'todos' && ` ${filtro}`}
          </div>
        </div>
      )}

      {/* Modal emisión de ticket */}
      <Modal open={!!emitirPara} onClose={cerrarEmision} title="Emitir Ticket" maxWidth="max-w-sm">
        {!ticketEmitido ? (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-500 font-medium mb-0.5">Paciente</p>
              <p className="font-semibold text-gray-800">{emitirPara?.nombreCompleto}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Turno de atención</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'manana', label: 'Mañana', sub: '08:00 – 12:00' },
                  { value: 'tarde',  label: 'Tarde',  sub: '14:00 – 18:00' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTurnoEmision(t.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      turnoEmision === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-semibold text-sm ${turnoEmision === t.value ? 'text-blue-700' : 'text-gray-700'}`}>{t.label}</p>
                    <p className={`text-xs mt-0.5 ${turnoEmision === t.value ? 'text-blue-400' : 'text-gray-400'}`}>{t.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={cerrarEmision}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleEmitir} disabled={emitiendo}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faTicket} />
                {emitiendo ? 'Emitiendo...' : 'Emitir'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto">
              <span className="text-white font-black text-3xl">{ticketEmitido.numero}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{ticketEmitido.numero}</p>
              <p className="text-gray-500 text-sm mt-1">{ticketEmitido.paciente?.nombreCompleto}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faClock} className="text-gray-400" />
              Posición #{ticketEmitido.posicionCola} · ~{ticketEmitido.tiempoEsperaEst} min
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.print()}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-50">
                <FontAwesomeIcon icon={faPrint} /> Imprimir
              </button>
              <button onClick={cerrarEmision}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} /> Listo
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
