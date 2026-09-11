/**
 * BUSER INFO - Tailwind CSS Central Configuration
 * Digunakan bersama https://cdn.tailwindcss.com
 */
const buserTailwindConfig = {
  theme: {
    extend: {
      colors: {
        buser: {
          // Brand colors: Hitam, Merah, Biru, Kuning
          black: '#0B0B0B',
          red: '#D71920',
          redHover: '#B80F15',
          blue: '#1D4ED8',
          blueHover: '#1E40AF',
          yellow: '#F59E0B',
          yellowHover: '#D97706',
          dark: '#222222',
          light: '#F5F5F5',
          border: '#E5E7EB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif']
      }
    }
  }
};

if (typeof tailwind !== 'undefined') {
  tailwind.config = buserTailwindConfig;
} else {
  window.tailwind = { config: buserTailwindConfig };
}
