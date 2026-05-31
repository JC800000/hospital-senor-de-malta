import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FontAwesomeIcon icon={icon} className="text-gray-400 text-2xl" />
        </div>
      )}
      <h3 className="text-gray-700 font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
