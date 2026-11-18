/**
 * Decorative layers shared by the landing sections below the hero.
 *
 * Keeps the visual language of the hero (mosque arches + eight-point star
 * lattice, warm bronze on ivory) so the page reads as one continuous scene.
 * All layers are inert: aria-hidden and pointer-events-none.
 */
type Mode = 'lattice' | 'arches' | 'three-arches' | 'strip';

export default function SectionBackdrop({
  id,
  mode = 'lattice',
  flip = false,
}: {
  /** Unique suffix for SVG ids so multiple instances never collide. */
  id: string;
  mode?: Mode;
  /** Mirror the arches horizontally for visual variety. */
  flip?: boolean;
}) {
  const geoId = `${id}-geo`;
  const strokeId = `${id}-stroke`;
  const fadeId = `${id}-fade`;

  if (mode === 'strip') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden">
        <svg
          className="h-4 w-full text-accent"
          viewBox="0 0 600 16"
          preserveAspectRatio="none"
          role="presentation"
          focusable="false"
        >
          <defs>
            <pattern id={geoId} width="40" height="16" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35">
                <path d="M20 2 L24 6 L20 10 L16 6 Z" />
                <path d="M20 6 L24 10 L20 14 L16 10 Z" opacity="0.5" />
              </g>
            </pattern>
          </defs>
          <rect width="600" height="16" fill={`url(#${geoId})`} />
        </svg>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
        focusable="false"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
      >
        <defs>
          <pattern id={geoId} width="96" height="96" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#8C6D46" strokeWidth="1" strokeOpacity="0.2">
              <path d="M48 8 L60 36 L88 48 L60 60 L48 88 L36 60 L8 48 L36 36 Z" />
              <rect x="20" y="20" width="56" height="56" transform="rotate(45 48 48)" />
              <circle cx="48" cy="48" r="3.5" />
            </g>
          </pattern>

          <linearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B38E5D" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#8C6D46" stopOpacity="0.12" />
          </linearGradient>

          <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7F4EE" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#F7F4EE" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F7F4EE" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        <rect width="1200" height="600" fill={`url(#${geoId})`} opacity="0.55" />

        {mode === 'lattice' && (
          <rect width="1200" height="600" fill={`url(#${fadeId})`} />
        )}

        {mode === 'arches' && (
          <g fill="none" stroke={`url(#${strokeId})`} strokeLinejoin="round">
            <path
              d="M -40 600 L -40 400 C -40 330 60 288 96 150 C 132 288 232 330 232 400 L 232 600"
              strokeWidth="2"
            />
            <path
              d="M 950 600 L 950 380 C 950 306 1040 262 1080 120 C 1120 262 1210 306 1210 380 L 1210 600"
              strokeWidth="2.4"
            />
            <path
              d="M 986 600 L 986 392 C 986 330 1060 294 1080 196 C 1100 294 1174 330 1174 392 L 1174 600"
              strokeWidth="1"
              strokeOpacity="0.6"
            />
            <path d="M 0 470 L 1200 470" strokeWidth="1" strokeOpacity="0.35" />
          </g>
        )}

        {mode === 'three-arches' && (
          <g fill="none" stroke={`url(#${strokeId})`} strokeLinejoin="round">
            <path
              d="M 60 600 L 60 470 C 60 414 138 378 200 250 C 262 378 340 414 340 470 L 340 600"
              strokeWidth="2"
            />
            <path
              d="M 400 600 L 400 470 C 400 414 478 378 540 250 C 602 378 680 414 680 470 L 680 600"
              strokeWidth="2.4"
            />
            <path
              d="M 740 600 L 740 470 C 740 414 818 378 880 250 C 942 378 1020 414 1020 470 L 1020 600"
              strokeWidth="2"
            />
            <path d="M 0 500 L 1200 500" strokeWidth="1" strokeOpacity="0.3" />
          </g>
        )}
      </svg>
    </div>
  );
}
