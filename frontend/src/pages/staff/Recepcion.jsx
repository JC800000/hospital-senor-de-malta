import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useLazyQuery, useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch, faUserPlus, faTicket, faUsers, faClock,
  faStethoscope, faCheckCircle, faBolt, faExclamationCircle, faPrint
} from '@fortawesome/free-solid-svg-icons'
import { PACIENTE_POR_CI, REGISTRAR_PACIENTE } from '../../graphql/queries/pacientes'
import { TICKETS, COLA_ESTADO, EMITIR_TICKET } from '../../graphql/queries/tickets'
import { LoadingScreen } from '../../components/ui/Spinner'
import TicketCard from '../../components/shared/TicketCard'
import Modal from '../../components/ui/Modal'

const EMPTY_QUICK = { ci: '', nombres: '', apellidos: '', fechaNac: '', sexo: '', telefono: '' }

export default function Recepcion() {
  const navigate = useNavigate()

  // Búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState('')

  // Registro rápido
  const [modalRegistro, setModalRegistro] = useState(false)
  const [quickForm, setQuickForm] = useState(EMPTY_QUICK)
  const [ciDuplicado, setCiDuplicado] = useState(false)
  const [ciVerificado, setCiVerificado] = useState(false)
  const [errorRegistro, setErrorRegistro] = useState('')

  // Emisión de ticket (inline, sin navegar)
  const [emitirPara, setEmitirPara] = useState(null) // { id, nombreCompleto }
  const [turnoEmision, setTurnoEmision] = useState('manana')
  const [ticketEmitido, setTicketEmitido] = useState(null)

  // ── Queries ──
  const { data: colaData, refetch: refetchCola } = useQuery(COLA_ESTADO, {
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  })

  const { data: ticketsData, loading: loadingTickets, refetch: refetchTickets } = useQuery(TICKETS, {
    variables: { estado: 'esperando' },
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  })

  // ── Lazy queries ──
  const [buscarPaciente, { loading: buscando }] = useLazyQuery(PACIENTE_POR_CI, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      setPacienteEncontrado(data.pacientePorCi)
      setBusquedaRealizada(true)
      setErrorBusqueda('')
    },
    onError: (err) => {
      setErrorBusqueda(err.message || 'Error al buscar paciente')
      setBusquedaRealizada(false)
    },
  })

  const [verificarCi, { loading: verificando }] = useLazyQuery(PACIENTE_POR_CI, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data.pacientePorCi) { setCiDuplicado(true); setCiVerificado(true) }
    },
    onError: () => { setCiDuplicado(false); setCiVerificado(true) },
  })

  // ── Mutations ──
  const [registrarPaciente, { loading: registrando }] = useMutation(REGISTRAR_PACIENTE)

  const [emitirTicket, { loading: emitiendo }] = useMutation(EMITIR_TICKET, {
    onCompleted: (data) => {
      setTicketEmitido(data.emitirTicket)
      // Actualizar cola inmediatamente
      refetchTickets()
      refetchCola()
    },
    onError: (err) => alert('Error al emitir ticket: ' + err.message),
  })

  // ── Handlers búsqueda ──
  const handleBuscar = (e) => {
    e.preventDefault()
    if (!busqueda.trim()) return
    setBusquedaRealizada(false)
    setPacienteEncontrado(null)
    setErrorBusqueda('')
    buscarPaciente({ variables: { ci: busqueda.trim() } })
  }

  // ── Handlers registro rápido ──
  const updateQuick = (field) => (e) => {
    setQuickForm(f => ({ ...f, [field]: e.target.value }))
    if (field === 'ci') { setCiDuplicado(false); setCiVerificado(false) }
  }

  const handleCiBlur = () => {
    const ci = quickForm.ci.trim()
    if (ci.length < 5) return
    setCiDuplicado(false); setCiVerificado(false)
    verificarCi({ variables: { ci } })
  }

  const handleRegistroRapido = async (e) => {
    e.preventDefault()
    setErrorRegistro('')
    if (ciDuplicado) { setErrorRegistro('Este número de carnet ya está registrado en el sistema.'); return }
    try {
      const { data } = await registrarPaciente({
        variables: {
          input: {
            ci: quickForm.ci.trim(),
            nombres: quickForm.nombres.trim(),
            apellidos: quickForm.apellidos.trim(),
            fechaNac: quickForm.fechaNac,
            sexo: quickForm.sexo,
            telefono: quickForm.telefono.trim() || undefined,
          },
        },
      })
      // Cerrar registro y abrir emisión directamente
      setModalRegistro(false)
      setQuickForm(EMPTY_QUICK)
      setCiDuplicado(false); setCiVerificado(false); setErrorRegistro('')
      setEmitirPara({ id: data.registrarPaciente.id, nombreCompleto: data.registrarPaciente.nombreCompleto })
      setTicketEmitido(null)
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('ci') || msg.toLowerCase().includes('unique')) {
        setErrorRegistro('Este número de carnet ya está registrado en el sistema.')
      } else {
        setErrorRegistro('Error al registrar: ' + msg)
      }
    }
  }

  const cerrarRegistro = () => {
    setModalRegistro(false)
    setQuickForm(EMPTY_QUICK)
    setCiDuplicado(false); setCiVerificado(false); setErrorRegistro('')
  }

  // ── Handlers emisión ──
  const handleEmitir = () => {
    if (!emitirPara) return
    emitirTicket({ variables: { pacienteId: emitirPara.id, tipo: 'presencial', turno: turnoEmision } })
  }

  const cerrarEmision = () => {
    setEmitirPara(null)
    setTurnoEmision('manana')
    setTicketEmitido(null)
  }

  // ── Computed ──
  const cola = colaData?.colaEstado
  const formValido = quickForm.ci.trim().length >= 5
    && quickForm.nombres.trim() && quickForm.apellidos.trim()
    && quickForm.fechaNac && quickForm.sexo && !ciDuplicado

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recepción</h1>
          <p className="text-gray-500 text-sm">Gestión de cola y emisión de tickets</p>
        </div>
        <button
          onClick={() => setModalRegistro(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 shadow-sm"
        >
          <FontAwesomeIcon icon={faBolt} />
          Registro Rápido
        </button>
      </div>

      {/* Estado de la cola */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'En Espera', value: cola?.totalEspera ?? 0, icon: faUsers, color: 'text-blue-600 bg-blue-50' },
          { label: 'Ticket Actual', value: cola?.ticketActual || '—', icon: faTicket, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Médicos Activos', value: cola?.medicosActivos ?? 0, icon: faStethoscope, color: 'text-violet-600 bg-violet-50' },
          { label: 'Espera Estimada', value: `~${cola?.tiempoPromedioMin ?? 0} min`, icon: faClock, color: 'text-orange-600 bg-orange-50' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
              <FontAwesomeIcon icon={item.icon} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Buscar Paciente por CI</h2>
        <form onSubmit={handleBuscar} className="flex gap-3">
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Ingrese la Cédula de Identidad..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={buscando}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faSearch} />
            Buscar
          </button>
        </form>

        {errorBusqueda && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <span>⚠</span><span>{errorBusqueda}</span>
          </div>
        )}

        {busquedaRealizada && (
          <div className="mt-4">
            {pacienteEncontrado ? (
              <div className="border border-green-100 bg-green-50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{pacienteEncontrado.nombreCompleto}</p>
                    <p className="text-sm text-gray-500">
                      CI: {pacienteEncontrado.ci} · {pacienteEncontrado.edad} años · {pacienteEncontrado.sexo === 'M' ? 'Masculino' : 'Femenino'}
                    </p>
                    {pacienteEncontrado.telefono && <p className="text-sm text-gray-500">Tel: {pacienteEncontrado.telefono}</p>}
                  </div>
                  <button
                    onClick={() => {
                      setEmitirPara({ id: pacienteEncontrado.id, nombreCompleto: pacienteEncontrado.nombreCompleto })
                      setTicketEmitido(null)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shrink-0"
                  >
                    <FontAwesomeIcon icon={faTicket} />
                    Emitir Ticket
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-yellow-100 bg-yellow-50 rounded-xl p-4 flex items-center justify-between">
                <p className="text-yellow-800 text-sm">Paciente no encontrado con CI: <strong>{busqueda}</strong></p>
                <button
                  onClick={() => navigate('/registro-paciente', { state: { ci: busqueda } })}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Registrar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cola actual */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} className="text-blue-500" />
          Cola de Espera ({ticketsData?.tickets?.length ?? 0})
        </h2>
        {loadingTickets && !ticketsData ? (
          <LoadingScreen />
        ) : ticketsData?.tickets?.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay pacientes en espera</p>
        ) : (
          <div className="space-y-3">
            {ticketsData?.tickets?.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal: Emisión de Ticket ── */}
      <Modal
        open={!!emitirPara}
        onClose={cerrarEmision}
        title="Emitir Ticket"
        maxWidth="max-w-sm"
      >
        {!ticketEmitido ? (
          <div className="space-y-4">
            {/* Paciente */}
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-500 font-medium mb-0.5">Paciente</p>
              <p className="font-semibold text-gray-800">{emitirPara?.nombreCompleto}</p>
            </div>

            {/* Turno */}
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
              <button
                onClick={cerrarEmision}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmitir}
                disabled={emitiendo}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faTicket} />
                {emitiendo ? 'Emitiendo...' : 'Emitir'}
              </button>
            </div>
          </div>
        ) : (
          /* Ticket emitido con éxito */
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto bg-blue-600">
              <span className="text-white font-black text-3xl">{ticketEmitido.numero}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{ticketEmitido.numero}</p>
              <p className="text-gray-500 text-sm mt-1">{ticketEmitido.paciente?.nombreCompleto}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faClock} className="text-gray-400" />
              Posición #{ticketEmitido.posicionCola} · Espera estimada: ~{ticketEmitido.tiempoEsperaEst} min
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <FontAwesomeIcon icon={faPrint} /> Imprimir
              </button>
              <button
                onClick={cerrarEmision}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faCheckCircle} /> Listo
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Registro Rápido ── */}
      <Modal
        open={modalRegistro}
        onClose={cerrarRegistro}
        title="Registro Rápido de Paciente"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRegistroRapido} className="space-y-4">

          <div>
            <label className={labelCls}>Carnet de Identidad *</label>
            <div className="relative">
              <input
                className={`${inputCls} pr-10 ${ciDuplicado ? 'border-red-400 focus:ring-red-400' : ciVerificado ? 'border-green-400 focus:ring-green-400' : ''}`}
                value={quickForm.ci}
                onChange={updateQuick('ci')}
                onBlur={handleCiBlur}
                placeholder="Ej: 12345678"
                required
              />
              {verificando && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              )}
              {!verificando && ciVerificado && !ciDuplicado && (
                <FontAwesomeIcon icon={faCheckCircle} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm" />
              )}
              {!verificando && ciDuplicado && (
                <FontAwesomeIcon icon={faExclamationCircle} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm" />
              )}
            </div>
            {ciDuplicado && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <FontAwesomeIcon icon={faExclamationCircle} />
                Este carnet ya está registrado. Usa la búsqueda para encontrarlo.
              </p>
            )}
            {ciVerificado && !ciDuplicado && (
              <p className="mt-1.5 text-xs text-green-600">CI disponible</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nombres *</label>
              <input className={inputCls} value={quickForm.nombres} onChange={updateQuick('nombres')} required />
            </div>
            <div>
              <label className={labelCls}>Apellidos *</label>
              <input className={inputCls} value={quickForm.apellidos} onChange={updateQuick('apellidos')} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha de Nacimiento *</label>
              <input type="date" className={inputCls} value={quickForm.fechaNac} onChange={updateQuick('fechaNac')} required />
            </div>
            <div>
              <label className={labelCls}>Sexo *</label>
              <select className={inputCls} value={quickForm.sexo} onChange={updateQuick('sexo')} required>
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input className={inputCls} value={quickForm.telefono} onChange={updateQuick('telefono')} placeholder="Ej: 70000000" />
          </div>

          {errorRegistro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationCircle} />
              {errorRegistro}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={cerrarRegistro}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={registrando || !formValido}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faUserPlus} />
              {registrando ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
