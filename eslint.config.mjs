import js from '@eslint/js';
import ts from 'typescript-eslint';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/test-results/**',
      '**/coverage/**',
      'package-lock.json',
      'scripts/**'
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      'no-restricted-imports': ['error', {
        'patterns': [
          {
            'group': ['../../../../**', '../../../../../**'],
            'message': 'Direct cross-package relative imports are forbidden. Use @esparex/ core or shared instead.'
          }
        ]
      }],
    },
  }
);
