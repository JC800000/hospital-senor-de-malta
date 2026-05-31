import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIdCard, faArrowRightToBracket, faInfoCircle, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { LOGIN_PACIENTE } from '../../graphql/queries/auth'
import { useAuth } from '../../context/AuthContext'

export default function LoginPaciente() {
  const [ci, setCi]       = useState('')
  const [error, setError] = useState('')
  const { login }         = useAuth()
  const navigate          = useNavigate()

  const [loginPaciente, { loading }] = useMutation(LOGIN_PACIENTE, { errorPolicy: 'all' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!ci.trim()) return setError('Ingresa tu número de CI')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
    try {
      const result = await loginPaciente({ variables: { ci: ci.trim() } })
      const data   = result?.data
      if (!data?.loginPaciente) { setError(result?.errors?.[0]?.message || 'Error del servidor'); return }
      if (data.loginPaciente.exito) {
        login(data.loginPaciente.token, { ...data.loginPaciente.usuario, rol: 'paciente_portal', panelDestino: '/portal/inicio' })
        navigate('/portal/inicio')
      } else {
        setError(data.loginPaciente.mensaje || 'CI no encontrado')
      }
    } catch (err) {
      setError(err?.networkError?.message || err?.message || 'Sin conexión con el servidor')
    }
  }

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
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-white/55 text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase mb-0.5">Portal Digital</p>
          <h1 className="text-xl sm:text-2xl font-black text-white text-center leading-tight">Portal Paciente</h1>
          <p className="text-white/50 text-[11px] sm:text-xs mt-0.5 text-center">Hospital Señor de Malta</p>
        </div>

        {/* ── Cuerpo blanco ── */}
        <div className="bg-white px-5 py-5 sm:px-7 sm:py-5">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-0.5">Bienvenido</h2>
          <p className="text-gray-400 text-xs mb-4">Ingresa tu cédula de identidad para acceder</p>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* CI */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cédula de Identidad</label>
              <div className="relative">
                <FontAwesomeIcon icon={faIdCard} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={ci}
                  onChange={e => { setCi(e.target.value); setError('') }}
                  placeholder="Ej: 12345678"
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-sm flex items-start gap-2">
                <span>⚠</span><span>{error}</span>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || !ci.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-md"
              style={{ background: 'linear-gradient(135deg, #1A4F8A 0%, #2563EB 100%)' }}
            >
              {loading
                ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                : <><FontAwesomeIcon icon={faArrowRightToBracket} /> Ingresar al Portal</>
              }
            </button>
          </form>

          {/* Info box */}
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 text-sm mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Solo necesitas tu <span className="font-bold text-blue-700">número de CI</span> para consultar tus tickets y recetas.
            </p>
          </div>

          <p className="text-center mt-4">
            <a href="/login" className="text-gray-300 text-xs hover:text-gray-500 transition-colors">
              Acceso para personal del hospital →
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
