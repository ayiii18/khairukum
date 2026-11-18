/**
 * Decorative backdrop for the landing hero.
 *
 * A mosque arcade (pointed arches with softly lit niches), an eight-point star
 * lattice and dawn light — an abstract picture of the project's idea: Quran
 * study circles inside mosques. Pure SVG so it stays crisp at any size, needs
 * no network request and keeps the warm bronze/beige identity.
 */
export default function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCFBF8" />
            <stop offset="16%" stopColor="#F4EDDF" />
            <stop offset="55%" stopColor="#FBF7EF" />
            <stop offset="100%" stopColor="#F7F4EE" />
          </linearGradient>

          <radialGradient id="hero-glow" cx="50%" cy="2%" r="72%">
            <stop offset="0%" stopColor="#FFF4DA" stopOpacity="1" />
            <stop offset="50%" stopColor="#FBEBCF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FBEBCF" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="hero-arch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A87B41" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8C6D46" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="hero-niche" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF3D8" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#F3E3C6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#D9C3A0" stopOpacity="0.35" />
          </linearGradient>

          <linearGradient id="hero-ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDF4" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFDF4" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="hero-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8DAC0" stopOpacity="0" />
            <stop offset="45%" stopColor="#E8DAC0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F7F4EE" stopOpacity="1" />
          </linearGradient>

          {/* Eight-point star (khatam) lattice */}
          <pattern id="hero-geo" width="96" height="96" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#8C6D46" strokeWidth="1" strokeOpacity="0.22">
              <path d="M48 8 L60 36 L88 48 L60 60 L48 88 L36 60 L8 48 L36 36 Z" />
              <rect x="20" y="20" width="56" height="56" transform="rotate(45 48 48)" />
              <circle cx="48" cy="48" r="3.5" />
              <circle cx="0" cy="0" r="3.5" />
              <circle cx="96" cy="0" r="3.5" />
              <circle cx="0" cy="96" r="3.5" />
              <circle cx="96" cy="96" r="3.5" />
            </g>
          </pattern>
        </defs>

        {/* Warm dawn wash */}
        <rect width="1440" height="900" fill="url(#hero-sky)" />

        {/* Geometric Islamic lattice */}
        <rect width="1440" height="900" fill="url(#hero-geo)" opacity="0.9" />

        {/* Sunrise glow behind the headline */}
        <rect width="1440" height="900" fill="url(#hero-glow)" />

        {/* Light rays falling from the top of the hall */}
        <g fill="url(#hero-ray)">
          <polygon points="520,0 640,0 340,660 260,660" opacity="0.6" />
          <polygon points="700,0 790,0 700,660 640,660" opacity="0.55" />
          <polygon points="880,0 990,0 1080,660 1010,660" opacity="0.5" />
        </g>

        {/* Mosque arcade: softly lit niches behind pointed arches */}
        <g>
          {/* Niches (light panels) */}
          <g fill="url(#hero-niche)" opacity="0.55">
            <path d="M 40 830 L 40 700 C 40 636 118 592 150 470 C 182 592 260 636 260 700 L 260 830 Z" />
            <path d="M 330 830 L 330 664 C 330 596 400 548 430 400 C 460 548 530 596 530 664 L 530 830 Z" />
            <path d="M 560 830 L 560 620 C 560 548 640 494 720 300 C 800 494 880 548 880 620 L 880 830 Z" />
            <path d="M 910 830 L 910 664 C 910 596 980 548 1010 400 C 1040 548 1110 596 1110 664 L 1110 830 Z" />
            <path d="M 1180 830 L 1180 700 C 1180 636 1258 592 1290 470 C 1322 592 1400 636 1400 700 L 1400 830 Z" />
          </g>

          {/* Arch outlines */}
          <g fill="none" stroke="url(#hero-arch)" strokeLinejoin="round">
            <path
              d="M 40 900 L 40 700 C 40 636 118 592 150 470 C 182 592 260 636 260 700 L 260 900"
              strokeWidth="2"
            />
            <path
              d="M 330 900 L 330 664 C 330 596 400 548 430 400 C 460 548 530 596 530 664 L 530 900"
              strokeWidth="2.4"
            />
            <path
              d="M 560 900 L 560 620 C 560 548 640 494 720 300 C 800 494 880 548 880 620 L 880 900"
              strokeWidth="3"
            />
            <path
              d="M 594 900 L 594 634 C 594 570 654 526 720 372 C 786 526 846 570 846 634 L 846 900"
              strokeWidth="1.2"
              strokeOpacity="0.7"
            />
            <path
              d="M 910 900 L 910 664 C 910 596 980 548 1010 400 C 1040 548 1110 596 1110 664 L 1110 900"
              strokeWidth="2.4"
            />
            <path
              d="M 1180 900 L 1180 700 C 1180 636 1258 592 1290 470 C 1322 592 1400 636 1400 700 L 1400 900"
              strokeWidth="2"
            />

            {/* Column capitals */}
            <g strokeWidth="1.2" strokeOpacity="0.6">
              <path d="M 26 700 L 274 700" />
              <path d="M 316 664 L 544 664" />
              <path d="M 546 620 L 894 620" />
              <path d="M 896 664 L 1124 664" />
              <path d="M 1166 700 L 1414 700" />
            </g>
          </g>
        </g>

        {/* Sand floor of the prayer hall */}
        <rect y="600" width="1440" height="300" fill="url(#hero-floor)" />
        <path d="M 0 812 L 1440 812" stroke="#B38E5D" strokeWidth="1" strokeOpacity="0.35" fill="none" />
      </svg>

      {/* Gentle vignette so the centred Arabic text keeps full contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_36%,rgba(252,251,249,0.78)_0%,rgba(252,251,249,0.34)_48%,rgba(252,251,249,0)_78%)]" />
    </div>
  );
}
