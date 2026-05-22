import eslintConfig from '@electron-toolkit/eslint-config'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import fs from 'node:fs'

const autoImportGlobals = JSON.parse(
  fs.readFileSync(new URL('./.eslintrc-auto-import.json', import.meta.url), 'utf-8')
).globals

export default [
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  eslintConfig,
  ...eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      globals: autoImportGlobals,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        extraFileExtensions: ['.vue']
      }
    }
  },
  {
    files: ['**/*.{js,jsx,vue}'],
    languageOptions: {
      globals: autoImportGlobals
    },
    rules: {
      'no-empty': 'off',
      'no-constant-condition': 'off',
      'no-undef': 'off',
      'no-prototype-builtins': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'no-unused-labels': 'off',
      'no-useless-escape': 'off',
      'vue/require-default-prop': 'off',
      'vue/require-valid-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-mutating-props': 'off',
      'vue/valid-define-emits': 'off',
      'vue/no-side-effects-in-computed-properties': 'off',
      'vue/no-deprecated-filter': 'off',
      'vue/no-dupe-v-else-if': 'off',
      'vue/no-ref-as-operand': 'off',
      'vue/no-deprecated-slot-attribute': 'off',
      'vue/no-dupe-keys': 'off',
      'vue/no-unused-vars': 'off'
    }
  },
  eslintConfigPrettier
]
