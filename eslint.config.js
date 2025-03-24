// eslint.config.js
import js from '@eslint/js';
import vuePlugin from 'eslint-plugin-vue';

export default [
  js.configs.recommended,
  ...vuePlugin.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        process: 'readonly',
        import: 'readonly',
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Base ESLint rules
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      
      // Vue-specific rules
      'vue/multi-word-component-names': 'warn',
      'vue/require-default-prop': 'warn',
      'vue/attributes-order': ['error', {
        order: [
          'DEFINITION',
          'LIST_RENDERING',
          'CONDITIONALS',
          'RENDER_MODIFIERS',
          'GLOBAL',
          ['UNIQUE', 'SLOT'],
          'TWO_WAY_BINDING',
          'OTHER_DIRECTIVES',
          'OTHER_ATTR',
          'EVENTS',
          'CONTENT'
        ],
      }],
      'vue/order-in-components': ['error', {
        order: [
          'el',
          'name',
          'key',
          'parent',
          'functional',
          ['delimiters', 'comments'],
          ['components', 'directives', 'filters'],
          'extends',
          'mixins',
          ['provide', 'inject'],
          'ROUTER_GUARDS',
          'layout',
          'middleware',
          'validate',
          'scrollToTop',
          'transition',
          'loading',
          'inheritAttrs',
          'model',
          ['props', 'propsData'],
          'emits',
          'setup',
          'asyncData',
          'data',
          'fetch',
          'head',
          'computed',
          'watch',
          'watchQuery',
          'LIFECYCLE_HOOKS',
          'methods',
          ['template', 'render'],
          'renderError'
        ],
      }],
      'vue/no-unused-components': 'warn',
      'vue/component-tags-order': ['error', {
        order: ['script', 'template', 'style'],
      }],
      
      // FormKit-specific rules
      'vue/no-mutating-props': 'warn', // Relaxed for FormKit's v-model usage
      
      // XState-specific rules
      'no-empty-pattern': 'error',
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'indent': 'off', // Let vue plugin handle the indentation
    },
  },
  {
    files: ['**/machines/**/*.js'],
    rules: {
      // Rules specific to XState machine definitions
      'complexity': ['warn', 15],
    },
  }
];