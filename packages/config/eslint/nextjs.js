/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
