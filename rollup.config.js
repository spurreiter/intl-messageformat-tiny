import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'

export default [
  {
    input: 'src/format.js',
    plugins: [babel({ babelHelpers: 'bundled' })],
    output: [
      {
        file: 'lib/format.cjs',
        format: 'cjs'
      },
      {
        file: 'lib/format.min.cjs',
        format: 'cjs',
        plugins: [terser()]
      }
    ]
  }
]
