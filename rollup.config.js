import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json'

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'margo-js',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [resolve(), commonjs({transformMixedEsModules:true})],
  },
  {
    input: 'src/index.js',
    external: [],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
    plugins: [resolve(), commonjs({transformMixedEsModules:true})]
  },
]
