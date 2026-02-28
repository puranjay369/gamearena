export default function InputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-muted mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-muted" />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-surface-alt border border-edge rounded-lg px-4 py-3 text-foreground placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-danger focus:ring-danger' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
