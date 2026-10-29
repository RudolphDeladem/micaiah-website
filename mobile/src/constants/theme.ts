/** Micaiah brand palette — mirrors the landing page (index.html :root variables). */
export const Colors = {
  indigo: '#3d3a8c',
  indigoMid: '#4c55b6',
  indigoLight: '#8c95fb',
  indigoPale: '#dde1ff',
  indigoGhost: '#eef0ff',
  gold: '#b8965a',
  goldLight: '#e8d5a3',
  goldPale: '#f7f0e4',
  cream: '#faf8f4',
  ink: '#1a1830',
  inkMid: '#3d3952',
  inkSoft: '#6b6782',
  white: '#ffffff',
  border: 'rgba(61,58,140,0.10)',
  danger: '#b3261e',
  dangerPale: '#fdecea',
} as const;

export const Gradients = {
  primary: ['#4c55b6', '#8c95fb'] as const,
  night: ['#1a1830', '#3d3a8c'] as const,
  gold: ['#b8965a', '#e8d5a3'] as const,
  dawn: ['#3d3a8c', '#6b5fb5', '#c9a77c'] as const,
};

/** Soft accents that give each reflection path its own colour, within the brand's warm palette. */
export const Accents = {
  sunrise: { tint: '#fbefe0', icon: '#c27c3a' },
  lavender: { tint: '#eeeaff', icon: '#5b4fc4' },
  sage: { tint: '#e7f1ea', icon: '#4d8a64' },
  rose: { tint: '#fbe9ee', icon: '#b5536f' },
} as const;

export const Fonts = {
  serif: 'CormorantGaramond_500Medium',
  serifItalic: 'CormorantGaramond_400Regular_Italic',
  serifBold: 'CormorantGaramond_600SemiBold',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_600SemiBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 640;
