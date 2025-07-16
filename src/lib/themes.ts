
export interface Theme {
  name: string;
  label: string;
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  accent: string;
  accentForeground: string;
}

export const themes: Theme[] = [
  {
    name: 'default',
    label: 'Default',
    primary: '207 90% 54%', // Calming Blue
    primaryForeground: '0 0% 100%',
    background: '0 0% 96%',
    foreground: '210 40% 10%',
    accent: '174 100% 29%', // Teal
    accentForeground: '0 0% 100%',
  },
  {
    name: 'forest',
    label: 'Forest',
    primary: '142 76% 36%', // Forest Green
    primaryForeground: '0 0% 100%',
    background: '120 10% 97%',
    foreground: '120 25% 15%',
    accent: '45 80% 55%', // Amber
    accentForeground: '45 100% 10%',
  },
  {
    name: 'sunset',
    label: 'Sunset',
    primary: '24 95% 53%', // Orange
    primaryForeground: '0 0% 100%',
    background: '20 20% 97%',
    foreground: '20 40% 10%',
    accent: '330 85% 60%', // Rose
    accentForeground: '0 0% 100%',
  },
  {
    name: 'ocean',
    label: 'Ocean',
    primary: '221 83% 53%', // Royal Blue
    primaryForeground: '0 0% 100%',
    background: '210 40% 98%',
    foreground: '220 25% 20%',
    accent: '190 80% 60%', // Cyan
    accentForeground: '190 100% 15%',
  },
];
