const ICON_SIZES = {
  sm: 28,
  md: 36,
  lg: 56,
}

const LOGO_HEIGHTS = {
  sm: 48,
  md: 40,
  lg: 64,
}

export default function Logo({ size = 'md', withText = true, className = '' }) {
  if (!withText) {
    const iconSize = ICON_SIZES[size]

    return (
      <img
        src="/icon-mark.png"
        alt="Osiris"
        width={iconSize}
        height={iconSize}
        className={`shrink-0 object-contain invert dark:invert-0 ${className}`}
        style={{ width: iconSize, height: iconSize }}
      />
    )
  }

  return (
    <img
      src="/logo-mark.png"
      alt="Osiris"
      className={`w-auto object-contain invert dark:invert-0 ${className}`}
      style={{ height: LOGO_HEIGHTS[size] }}
    />
  )
}
