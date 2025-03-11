module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'import/no-unresolved': ['error', { ignore: ['^@/'] }],
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        paths: ['src', 'app'], // Make sure to include both `src` and `app` if using Expo Router
      },
    },
  },
};
