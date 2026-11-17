export const Colors = {
  primary: '#1A5C38',       // Verde escuro (floresta)
  primaryLight: '#2D8A57',  // Verde médio
  primaryPale: '#E8F5EE',   // Verde muito claro
  accent: '#F4A228',        // Laranja (sol/aventura)
  accentLight: '#FEF3DC',
  danger: '#E53E3E',        // Vermelho perigo
  dangerLight: '#FEE8E8',
  warning: '#F6AD55',
  easy: '#38A169',           // Verde (fácil)
  moderate: '#F4A228',       // Laranja (moderada)
  hard: '#E53E3E',           // Vermelho (difícil)
  background: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#1A202C',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
  starFilled: '#F4A228',
  starEmpty: '#E2E8F0',
};

export const DifficultyColors: Record<string, string> = {
  'fácil': Colors.easy,
  'moderada': Colors.moderate,
  'difícil': Colors.hard,
};
