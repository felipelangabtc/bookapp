module.exports = {
  root: true,
  extends: ['@bookapp/config/eslint/nextjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
