module.exports = {
  root: true,
  extends: [require.resolve('@bookapp/config/eslint/nextjs')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
