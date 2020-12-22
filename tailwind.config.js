module.exports = {
  purge: ['./pages/**/*.js', './components/**/*.js'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      spacing: {
        100: '30rem',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
