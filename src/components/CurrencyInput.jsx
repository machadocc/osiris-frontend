import { useEffect, useRef } from 'react'

const MAX_DIGITS = 12

function format(value) {
  if (value === '' || value === null || value === undefined) return ''

  return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CurrencyInput({ value, onChange, required, className, ...rest }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const invalid = value !== '' && Number(value) <= 0
    ref.current.setCustomValidity(invalid ? 'Informe um valor maior que zero.' : '')
  }, [value])

  function handleChange(event) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS)

    onChange(digits === '' ? '' : (Number(digits) / 100).toFixed(2))
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      required={required}
      value={format(value)}
      onChange={handleChange}
      className={className}
      {...rest}
    />
  )
}
