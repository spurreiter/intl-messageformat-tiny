import globals from 'globals'
import pluginPrettier from 'eslint-plugin-prettier/recommended'

const config = [
  { languageOptions: { globals: { ...globals.node, ...globals.mocha } } },
  pluginPrettier,
  {
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_$',
          argsIgnorePattern: '^_'
        }
      ]
    }
  },
  {
    ignores: ['coverage/', 'docs/', 'dist/', 'lib/', 'tmp/']
  }
]

export default config
