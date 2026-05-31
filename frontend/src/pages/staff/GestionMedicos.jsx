import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faEdit, faToggleOn, faToggleOff,
  faSearch, faUsers, faFilter
} from '@fortawesome/free-solid-svg-icons'
import { USUARIOS, CREAR_USUARIO, ACTUALIZAR_USUARIO, TOGGLE_USUARIO_ACTIVO } from '../../graphql/queries/auth'
import { Spinner } from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'

const ROL_CFG = {
  director:      { label: 'Director',      bg: 'bg-blue-100',   text: 'text-blue-700'   },
  administrativo:{ label: 'Administrativo',bg: 'bg-purple-100', text: 'text-purple-700' },
  medico:        { label: 'Médico',        bg: 'bg-emerald-100',text: 'text-emerald-700'},
  especialista:  { label: 'Especialista',  bg: 'bg-amber-100',  text: 'text-amber-700'  },
  farmacia:      { label: 'Farmacia',      bg: 'bg-pink-100',   text: 'text-pink-700'   },
}

const TURNO_LABELS = { manana: 'Mañana', tarde: 'Tarde', ambos: 'Ambos' }

const EMPTY_FORM = {
  ci: '', nombres: '', apellidos: '',
  rol: 'medico', especialidad: '', turno: 'manana', password: ''
}

function RolBadge({ rol }) {
  const cfg = ROL_CFG[rol] || { label: rol, bg: 'bg-gray-100', text: 'text-gray-600' }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

export default function GestionMedicos() {
  const [busqueda, setBusqueda]   = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [modal, setModal]         = useState(false)
  const [editando, setEditando]   = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const { data, loading, refetch } = useQuery(USUARIOS, { variables: {} })

  const [crearUsuario,    { loading: creando }]    = useMutation(CREAR_USUARIO,    { onCompleted: () => { setModal(false); refetch() }, onError: e => setFormError(e.message) })
  const [actualizarUsuario,{ loading: actualizando }] = useMutation(ACTUALIZAR_USUARIO, { onCompleted: () => { setModal(false); refetch() }, onError: e => setFormError(e.message) })
  const [toggleActivo] = useMutation(TOGGLE_USUARIO_ACTIVO, { onCompleted: () => refetch() })

  const usuarios = data?.usuarios || []

  const filtrados = useMemo(() => {
    return usuarios.filter(u => {
      const matchBusqueda = !busqueda || u.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) || u.ci.includes(busqueda)
      const matchRol = !filtroRol || u.rol === filtroRol
      return matchBusqueda && matchRol
    })
  }, [usuarios, busqueda, filtroRol])

  const abrirNuevo = () => {
    setForm(EMPTY_FORM)
    setEditando(null)
    setFormError('')
    setModal(true)
  }

  const abrirEditar = (u) => {
    setForm({ ci: u.ci, nombres: u.nombres, apellidos: u.apellidos, rol: u.rol, especialidad: u.especialidad || '', turno: u.turno || 'manana', password: '' })
    setEditando(u)
    setFormError('')
    setModal(true)
  }

  const handleGuardar = () => {
    setFormError('')
    if (!form.ci || !form.nombres || !form.apellidos) { setFormError('CI, nombres y apellidos son obligatorios'); return }
    if (!editando && !form.password) { setFormError('La contraseña es obligatoria para nuevos usuarios'); return }
    const input = {
      ...form,
      especialidad: form.especialidad || undefined,
      password: form.password || undefined,
    }
    if (editando) {
      actualizarUsuario({ variables: { id: editando.id, input } })
    } else {
      crearUsuario({ variables: { input } })
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50'
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1'

  const conteos = Object.keys(ROL_CFG).reduce((acc, rol) => {
    acc[rol] = usuarios.filter(u => u.rol === rol).length
    return acc
  }, {})

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Personal</h1>
          <p className="text-gray-400 text-sm mt-0.5">{usuarios.length} usuarios en el sistema</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-4 py-2.5 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1A4F8A 0%, #2563EB 100%)' }}
        >
          <FontAwesomeIcon icon={faPlus} /> Nuevo Usuario
        </button>
      </div>

      {/* Chips de conteo por rol */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROL_CFG).map(([rol, cfg]) => (
          <button
            key={rol}
            onClick={() => setFiltroRol(filtroRol === rol ? '' : rol)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filtroRol === rol
                ? `${cfg.bg} ${cfg.text} border-transparent`
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {cfg.label}
            <span className={`${filtroRol === rol ? cfg.text : 'text-gray-400'} font-bold`}>
              {conteos[rol] || 0}
            </span>
          </button>
        ))}
        {filtroRol && (
          <button onClick={() => setFiltroRol('')} className="text-xs text-gray-400 hover:text-gray-600 px-2">
            × Limpiar filtro
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Buscar por nombre o CI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Nombre</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">CI</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Rol</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Especialidad</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Turno</th>
                <th className="text-center py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Activo</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">No se encontraron usuarios</td></tr>
              )}
              {filtrados.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                        {u.nombres?.[0]}{u.apellidos?.[0]}
                      </div>
                      <span className="font-medium text-gray-800">{u.nombreCompleto}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs">{u.ci}</td>
                  <td className="py-3 px-4"><RolBadge rol={u.rol} /></td>
                  <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{u.especialidad || <span className="text-gray-300">—</span>}</td>
                  <td className="py-3 px-4 text-gray-500 hidden lg:table-cell">{TURNO_LABELS[u.turno] || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleActivo({ variables: { id: u.id } })}
                      className={`transition-colors ${u.activo ? 'text-emerald-500 hover:text-emerald-700' : 'text-gray-300 hover:text-gray-500'}`}
                      title={u.activo ? 'Desactivar' : 'Activar'}
                    >
                      <FontAwesomeIcon icon={u.activo ? faToggleOn : faToggleOff} className="text-2xl" />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => abrirEditar(u)}
                      className="text-blue-500 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className={labelCls}>CI *</label>
              <input className={inputCls} value={form.ci} disabled={!!editando}
                onChange={e => setForm(f => ({ ...f, ci: e.target.value }))}
                placeholder="Ej: 10000006" />
            </div>

            <div>
              <label className={labelCls}>Rol *</label>
              <select className={inputCls} value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                {Object.entries(ROL_CFG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Nombres *</label>
              <input className={inputCls} value={form.nombres}
                onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))}
                placeholder="Ej: Roberto" />
            </div>

            <div>
              <label className={labelCls}>Apellidos *</label>
              <input className={inputCls} value={form.apellidos}
                onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
                placeholder="Ej: Vasquez Torres" />
            </div>

            <div>
              <label className={labelCls}>Especialidad</label>
              <input className={inputCls} value={form.especialidad}
                onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
                placeholder="Ej: Cardiología" />
            </div>

            <div>
              <label className={labelCls}>Turno</label>
              <select className={inputCls} value={form.turno} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}>
                <option value="manana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>
                {editando ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
              </label>
              <input type="password" className={inputCls} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" />
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-sm flex items-start gap-2">
              <span>⚠</span><span>{formError}</span>
            </div>
          )}

          <button
            onClick={handleGuardar}
            disabled={creando || actualizando}
            className="w-full py-2.5 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #1A4F8A 0%, #2563EB 100%)' }}
          >
            {creando || actualizando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </Modal>

    </div>
  )
}
