interface CompassWidgetProps {
  heading: number
}

export function CompassWidget({ heading }: CompassWidgetProps) {
  return (
    <div className="compass-shell" aria-label={`Vehicle heading ${Math.round(heading)} degrees`}>
      <div className="compass-ticks" style={{ transform: `rotate(${-heading}deg)` }}>
        <span className="compass-n">N</span>
        <span className="compass-e">E</span>
        <span className="compass-s">S</span>
        <span className="compass-w">W</span>
      </div>
      <svg className="compass-needle" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <filter id="needleGlow"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d="M50 20 61 54 50 48 39 54Z" fill="#f6b94a" filter="url(#needleGlow)" />
        <path d="M50 80 39 46 50 52 61 46Z" fill="#303530" />
        <circle cx="50" cy="50" r="4" fill="#f6b94a" />
      </svg>
      <div className="compass-heading">{Math.round(heading).toString().padStart(3, '0')}°</div>
    </div>
  )
}
