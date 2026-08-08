export const motion = {
  keyframes: {
    shake: {
      '0%, 100%': { transform: 'translateX(0)' },
      '25%': { transform: 'translateX(-4px)' },
      '50%': { transform: 'translateX(4px)' },
      '75%': { transform: 'translateX(-4px)' },
    },
    'reveal-up': {
      from: { opacity: '0', transform: 'translateY(10px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    }
  },
  animation: {
    shake: 'shake 0.4s ease-in-out',
    'reveal-up': 'reveal-up 0.5s ease-out forwards',
  }
};
