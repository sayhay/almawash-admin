import { theme, themeDark } from '@/theme';
import { createPaperTheme } from '@/theme/paper';

export const lightTheme = createPaperTheme('light', theme);
export const darkTheme = createPaperTheme('dark', themeDark);
