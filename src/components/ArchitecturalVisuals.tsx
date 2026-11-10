import React, { useState } from 'react';

interface StudioPhotoProps {
  src: string;
  alt: string;
  badge: string;
  caption: string;
  renderFallbackArt: () => React.ReactNode;
  aspectClass?: string;
}

const ResilientStudioPhoto: React.FC<StudioPhotoProps> = ({
  src,
  alt,
  badge,
  caption,
  renderFallbackArt,
  aspectClass = 'h-64',
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative w-full ${aspectClass} bg-[#0B0B0E] border-b border-white/[0.08] overflow-hidden group`}
    >
      {/* Underlying Studio Lighting & Anatomical / Machine Render (Always present, zero-broken-image guarantee) */}
      <div className="absolute inset-0">{renderFallbackArt()}</div>

      {/* Real Bodybuilder / Machine Photograph Layer */}
      {!imgError && (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85 group-hover:scale-[1.03] transition-transform duration-500"
        />
      )}

      {/* Measured Contrast Scrim for Text Legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/35 to-transparent" />

      {/* Top & Bottom Metadata */}
      <div className="pointer-events-none absolute top-3.5 left-4 right-4 flex items-center justify-between text-[11px] text-neutral-300">
        <span className="font-medium text-[#D4AF37]">{badge}</span>
        <span className="font-mono text-white/70">21 Fitness</span>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-4 right-4 text-xs text-neutral-300 font-medium">
        {caption}
      </div>
    </div>
  );
};

export const BodybuilderPhysiqueVisual: React.FC = () => (
  <ResilientStudioPhoto
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Bodybuilder_posing_on_stage.jpg/1024px-Bodybuilder_posing_on_stage.jpg"
    alt="Muscular bodybuilder performing a classic physique pose under dramatic gym lighting at 21 Fitness"
    badge="Hypertrophy & Classic Physique"
    caption="Progressive Overload · Muscle Symmetry · Competition Prep"
    renderFallbackArt={() => (
      <svg
        viewBox="0 0 640 320"
        className="w-full h-full object-cover"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bbSpotlight" cx="50%" cy="20%" r="65%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.32" />
            <stop offset="55%" stopColor="#1A1815" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="skinRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E6B87D" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#6E4E2E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#141210" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect width="640" height="320" fill="url(#bbSpotlight)" />
        {/* Background Dumbbell Rack Silhouette */}
        <g opacity="0.22" stroke="#ffffff" strokeWidth="2">
          <line x1="60" y1="220" x2="580" y2="220" />
          <line x1="80" y1="265" x2="560" y2="265" />
        </g>
        {/* Chiaroscuro Rim-Lit Bodybuilder Double Biceps / Lat Spread Silhouette */}
        <g transform="translate(320, 175)">
          {/* Head & Traps */}
          <circle cx="0" cy="-92" r="22" fill="url(#skinRim)" />
          <path d="M -38 -68 Q 0 -82, 38 -68 L 58 -54 L -58 -54 Z" fill="url(#skinRim)" />
          {/* V-Taper Torso, Pectorals, Lats & 6-Pack Abs */}
          <path
            d="M -64 -54 L 64 -54 L 46 28 L 28 85 L -28 85 L -46 28 Z"
            fill="url(#skinRim)"
            stroke="#D4AF37"
            strokeOpacity="0.4"
            strokeWidth="1.2"
          />
          {/* Pectoral & Abdominal Striation Highlights */}
          <path
            d="M -52 -22 Q -25 -10, -3 -22 M 52 -22 Q 25 -10, 3 -22"
            stroke="#D4AF37"
            strokeOpacity="0.55"
            strokeWidth="1.8"
          />
          <line x1="0" y1="-22" x2="0" y2="70" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
          <path
            d="M -20 2 L 20 2 M -18 24 L 18 24 M -16 46 L 16 46"
            stroke="rgba(0,0,0,0.45)"
            strokeWidth="2"
          />
          {/* Left & Right Deltoids, Biceps & Forearms (Double Biceps Pose) */}
          <path
            d="M -60 -54 Q -105 -58, -122 -72 Q -138 -95, -112 -125 Q -95 -115, -98 -85 Q -82 -78, -60 -36 Z"
            fill="url(#skinRim)"
          />
          <path
            d="M 60 -54 Q 105 -58, 122 -72 Q 138 -95, 112 -125 Q 95 -115, 98 -85 Q 82 -78, 60 -36 Z"
            fill="url(#skinRim)"
          />
        </g>
      </svg>
    )}
  />
);

export const HeavyBarbellTrainingVisual: React.FC = () => (
  <ResilientStudioPhoto
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Deadlift_barbell.jpg/1024px-Deadlift_barbell.jpg"
    alt="Strength athlete performing a heavy Olympic barbell deadlift at 21 Fitness"
    badge="Compound Strength & Powerlifting"
    caption="Deadlift, Squat & Bench Press · High-Tensile 20kg Olympic Bars"
    renderFallbackArt={() => (
      <svg
        viewBox="0 0 640 320"
        className="w-full h-full object-cover"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="dlLight" cx="50%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="640" height="320" fill="url(#dlLight)" />
        {/* Loaded Olympic Barbell */}
        <line x1="70" y1="210" x2="570" y2="210" stroke="#E5E7EB" strokeWidth="6" />
        {/* Left Plates */}
        <rect x="115" y="135" width="16" height="150" rx="3" fill="#18181C" stroke="#D4AF37" strokeWidth="2" />
        <rect x="135" y="140" width="14" height="140" rx="3" fill="#18181C" stroke="#F4F4F6" strokeWidth="1.5" />
        <rect x="153" y="148" width="12" height="124" rx="2" fill="#18181C" stroke="#D4AF37" strokeWidth="1.5" />
        {/* Right Plates */}
        <rect x="509" y="135" width="16" height="150" rx="3" fill="#18181C" stroke="#D4AF37" strokeWidth="2" />
        <rect x="491" y="140" width="14" height="140" rx="3" fill="#18181C" stroke="#F4F4F6" strokeWidth="1.5" />
        <rect x="475" y="148" width="12" height="124" rx="2" fill="#18181C" stroke="#D4AF37" strokeWidth="1.5" />
        {/* Athlete Pulling Stance Silhouette */}
        <path
          d="M 275 88 Q 320 68, 365 88 L 355 165 L 368 255 L 342 255 L 335 180 L 305 180 L 298 255 L 272 255 L 285 165 Z"
          fill="rgba(212,175,55,0.22)"
          stroke="#D4AF37"
          strokeWidth="1.5"
        />
        <circle cx="320" cy="56" r="18" fill="rgba(212,175,55,0.3)" />
      </svg>
    )}
  />
);

export const CableCrossoverMachineVisual: React.FC = () => (
  <ResilientStudioPhoto
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Gym_equipment_in_fitness_center.jpg/1024px-Gym_equipment_in_fitness_center.jpg"
    alt="Commercial Dual Adjustable Pulley Cable Crossover and Lat Pulldown Machine at 21 Fitness"
    badge="Original Machine · Cable Crossover & Lat Tower"
    caption="Dual 100kg Steel Weight Stacks · Constant Muscle Tension"
    renderFallbackArt={() => (
      <svg
        viewBox="0 0 480 320"
        className="w-full h-full object-cover"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="480" height="320" fill="#0B0B0F" />
        {/* Dual Cable Tower Columns & Top Bridge */}
        <rect x="75" y="42" width="330" height="18" rx="2" fill="#1A1A20" stroke="#D4AF37" strokeWidth="1.5" />
        <rect x="82" y="60" width="44" height="215" fill="#141418" stroke="rgba(255,255,255,0.2)" />
        <rect x="354" y="60" width="44" height="215" fill="#141418" stroke="rgba(255,255,255,0.2)" />
        {/* Pin-Selected Weight Stacks */}
        {Array.from({ length: 10 }).map((_, i) => (
          <React.Fragment key={i}>
            <rect x="88" y={145 + i * 11} width="32" height="8" fill="#26262E" stroke="#D4AF37" strokeOpacity="0.4" />
            <rect x="360" y={145 + i * 11} width="32" height="8" fill="#26262E" stroke="#D4AF37" strokeOpacity="0.4" />
          </React.Fragment>
        ))}
        {/* Tension Cables & Stirrup Handles */}
        <line x1="126" y1="88" x2="210" y2="165" stroke="#D4AF37" strokeWidth="1.8" />
        <line x1="354" y1="88" x2="270" y2="165" stroke="#D4AF37" strokeWidth="1.8" />
        <circle cx="210" cy="168" r="8" stroke="#F4F4F6" strokeWidth="2" />
        <circle cx="270" cy="168" r="8" stroke="#F4F4F6" strokeWidth="2" />
      </svg>
    )}
  />
);

export const LegPressMachineVisual: React.FC = () => (
  <ResilientStudioPhoto
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Leg_press_machine.jpg/1024px-Leg_press_machine.jpg"
    alt="45-Degree Plate-Loaded Linear Leg Press and Hack Squat Machine at 21 Fitness"
    badge="Original Machine · 45° Linear Leg Press"
    caption="600kg Sled Capacity · Quad, Glute & Hamstring Hypertrophy"
    renderFallbackArt={() => (
      <svg
        viewBox="0 0 480 320"
        className="w-full h-full object-cover"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="480" height="320" fill="#0B0B0F" />
        {/* Base Frame */}
        <line x1="65" y1="265" x2="415" y2="265" stroke="#3F3F46" strokeWidth="8" />
        {/* 45-Degree Guide Rails */}
        <line x1="110" y1="265" x2="315" y2="85" stroke="#E4E4E7" strokeWidth="5" />
        <line x1="135" y1="265" x2="340" y2="85" stroke="#A1A1AA" strokeWidth="4" />
        {/* Sled & Loaded 25kg Plates */}
        <polygon points="210,145 275,88 305,120 240,178" fill="#18181B" stroke="#D4AF37" strokeWidth="2" />
        <circle cx="258" cy="128" r="38" fill="#121215" stroke="#D4AF37" strokeWidth="4" />
        <circle cx="258" cy="128" r="12" fill="#D4AF37" />
        {/* Angled Back Pad */}
        <polygon points="85,255 145,255 110,185 70,195" fill="#27272A" stroke="#D4AF37" strokeWidth="1.5" />
      </svg>
    )}
  />
);
