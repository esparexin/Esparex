/* eslint-disable @typescript-eslint/no-require-imports */
// Runtime path alias registration for compiled dist.
// tsconfig-paths/register uses tsconfig.json paths which point to TS source (../shared/*).
// At runtime we need to point to the compiled JS in dist/shared/ instead.
const { register } = require('tsconfig-paths');

register({
  baseUrl: __dirname,
  paths: {
    '@shared/*': ['./dist/shared/*'],
  },
});
