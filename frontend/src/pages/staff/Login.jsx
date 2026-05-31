import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faIdCard, faLock, faEye, faEyeSlash, faArrowRightToBracket,
  faInfoCircle, faBuilding, faClipboard, faStethoscope, faHospital, faPills
} from '@fortawesome/free-solid-svg-icons'
import { LOGIN } from '../../graphql/queries/auth'
import { useAuth } from '../../context/AuthContext'

const ROLES_RAPIDOS = [
  { ci: '10000001', pwd: 'director123', label: 'Director',  icon: faBuilding,    color: '#3B82F6' },
  { ci: '10000002', pwd: 'admin123',    label: 'Adm.',      icon: faClipboard,   color: '#8B5CF6' },
  { ci: '10000003', pwd: 'medico123',   label: 'Médico',    icon: faStethoscope, color: '#10B981' },
  { ci: '10000004', pwd: 'espec123',    label: 'Espec.',    icon: faHospital,    color: '#F59E0B' },
  { ci: '10000005', pwd: 'farma123',    label: 'Farmacia',  icon: faPills,       color: '#EC4899' },
]

export default function Login() {
  const [ci, setCi]                     = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [loginMutation, { loading }]    = useMutation(LOGIN, { errorPolicy: 'all' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
    try {
      const result = await loginMutation({ variables: { ci: ci.trim(), password } })
      const data   = result?.data
      if (!data?.login) { setError(result?.errors?.[0]?.message || 'Error del servidor'); return }
      if (data.login.exito) {
        login(data.login.token, data.login.usuario)
        navigate(data.login.usuario.panelDestino)
      } else {
        setError(data.login.mensaje || 'Credenciales incorrectas')
      }
    } catch (err) {
      setError(err?.networkError?.message || err?.message || 'Sin conexión con el servidor')
    }
  }

  const fillRol = (rolCi, rolPwd) => { setCi(rolCi); setPassword(rolPwd); setError('') }

  const inputCls = `w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800
    placeholder-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6"
      style={{ background: `
        linear-gradient(rgba(255,255,255,0.03) 2px, transparent 2px) 0 0 / 38px 38px fixed,
        linear-gradient(90deg, rgba(255,255,255,0.03) 2px, transparent 2px) 0 0 / 38px 38px fixed,
        #1A1A1A
      ` }}
    >
      <div className="w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">

        {/* ── Cabecera azul con patrón ── */}
        <div
          className="flex flex-col items-center pt-6 pb-5 px-5 sm:pt-8 sm:pb-6 sm:px-6"
          style={{ background: `
            linear-gradient(rgba(255,255,255,0.04) 3px, transparent 3px) 0 0 / 38px 38px fixed,
            linear-gradient(90deg, rgba(255,255,255,0.04) 3px, transparent 3px) 0 0 / 38px 38px fixed,
            linear-gradient(160deg, #0F2D5E 0%, #1A4F8A 60%, #2563EB 100%)
          ` }}
        >
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-2.5 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7 sm:w-8 sm:h-8">
              <path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              <path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
            </svg>
          </div>
          <p className="text-white/55 text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase mb-0.5">Sistema Hospitalario</p>
          <h1 className="text-xl sm:text-2xl font-black text-white text-center leading-tight">Señor de Malta</h1>
          <p className="text-white/50 text-[11px] sm:text-xs mt-0.5 text-center">Gestión Hospitalaria Integral</p>
        </div>

        {/* ── Cuerpo blanco ── */}
        <div className="bg-white px-5 py-5 sm:px-7 sm:py-5">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-0.5">Bienvenido</h2>
          <p className="text-gray-400 text-xs mb-4">Ingrese sus credenciales para acceder</p>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* CI */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CI / Código de Empleado</label>
              <div className="relative">
                <FontAwesomeIcon icon={faIdCard} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text" value={ci}
                  onChange={e => { setCi(e.target.value); setError('') }}
                  placeholder="Ej: 12345678 o EMP-001"
                  required autoComplete="username"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  required autoComplete="current-password"
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs" />
                </button>
              </div>
            </div>

            {/* Recordar + Olvidé */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600" />
                <span className="text-xs text-gray-500">Recordar sesión</span>
              </label>
              <span className="text-xs font-semibold text-blue-600">¿Olvidó su contraseña?</span>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-sm flex items-start gap-2">
                <span>⚠</span><span>{error}</span>
              </div>
            )}

            {/* Botón principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-md"
              style={{ background: 'linear-gradient(135deg, #1A4F8A 0%, #2563EB 100%)' }}
            >
              <FontAwesomeIcon icon={faArrowRightToBracket} />
              {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>

          {/* Info box */}
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 text-sm mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Será redirigido automáticamente según su{' '}
              <span className="font-bold text-blue-700">rol asignado</span>
            </p>
          </div>

          {/* Acceso rápido demo */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-gray-300 text-[9px] text-center mb-2.5 uppercase tracking-wider font-medium">Acceso rápido · demo</p>
            <div className="flex justify-around">
              {ROLES_RAPIDOS.map(r => (
                <button
                  key={r.ci}
                  type="button"
                  onClick={() => fillRol(r.ci, r.pwd)}
                  className="flex flex-col items-center gap-1 group"
                  title={`${r.label} · ${r.ci}`}
                >
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm"
                    style={{ background: r.color + '15', border: `1px solid ${r.color}25` }}
                  >
                    <FontAwesomeIcon icon={r.icon} style={{ color: r.color }} className="text-sm" />
                  </div>
                  <p className="text-gray-400 text-[9px] font-medium">{r.label}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center mt-3">
            <a href="/portal" className="text-gray-300 text-xs hover:text-gray-500 transition-colors">
              Portal paciente →
            </a>
          </p>
          <p className="text-center text-gray-200 text-[10px] mt-1 pb-1">
            © {new Date().getFullYear()} Hospital Señor de Malta · v2.1.0
          </p>
        </div>
      </div>
    </div>
  )
}
