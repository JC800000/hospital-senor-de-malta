const colorMap = {
  pendiente:   'bg-yellow-100 text-yellow-800',
  despachada:  'bg-green-100 text-green-800',
  activa:      'bg-blue-100 text-blue-800',
  finalizada:  'bg-gray-100 text-gray-600',
  esperando:   'bg-yellow-100 text-yellow-800',
  llamado:     'bg-blue-100 text-blue-800',
  atendiendo:  'bg-emerald-100 text-emerald-800',
  atendido:    'bg-gray-100 text-gray-500',
  cancelado:   'bg-red-100 text-red-700',
  ok:          'bg-green-100 text-green-800',
  bajo:        'bg-yellow-100 text-yellow-800',
  agotado:     'bg-red-100 text-red-800',
  vencido:     'bg-purple-100 text-purple-800',
  aceptada:    'bg-blue-100 text-blue-800',
  presencial:  'bg-indigo-100 text-indigo-700',
  remoto:      'bg-cyan-100 text-cyan-700',
  general:     'bg-gray-100 text-gray-700',
  especialidad:'bg-violet-100 text-violet-700',
}

export default function Badge({ estado, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[estado] || 'bg-gray-100 text-gray-600'} ${className}`}>
      {estado}
    </span>
  )
}
