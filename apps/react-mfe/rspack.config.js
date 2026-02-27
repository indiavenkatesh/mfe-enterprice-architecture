// apps/react-mfe/rspack.config.js
const path = require('path')
const { ModuleFederationPlugin } = require('@module-federation/enhanced/rspack')
const { getRemotes, getMode } = require('../../config/remotes')
const { shared } = require('../../config/federation')

const MODE    = getMode()
const remotes = getRemotes()
const isLocal = MODE === 'local'

console.log(`\n[react-mfe] MFE_MODE=${MODE} | Federation: ${isLocal ? 'OFF (aliases)' : 'ON'}\n`)

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  entry: './src/main.tsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isLocal ? '/' : 'auto',
    uniqueName: 'reactMfe',
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],

    // ── LOCAL ONLY: alias workspace packages directly ─────────────────────
    // In fed-local/prod, @mfe-demo/domain is shared via Module Federation.
    alias: isLocal
      ? {
          '@mfe-demo/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
        }
      : {},
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'builtin:swc-loader',
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    // ── FEDERATION: skipped entirely in local mode ────────────────────────
    ...(!isLocal
      ? [
          new ModuleFederationPlugin({
            name: 'reactMfe',
            filename: 'remoteEntry.js',

            // What this MFE exposes to the shell
            exposes: {
              './App': './src/App',
            },

            // Other MFEs this one consumes
            remotes: remotes ?? {},

            shared,
          }),
        ]
      : []),
  ],

  devServer: {
    port: 5173,
    hot: true,
    historyApiFallback: true,
    headers: {
      // Required for Module Federation cross-origin loading
      'Access-Control-Allow-Origin': '*',
    },
  },

  builtins: {
    html: [{ template: './index.html' }],
  },
}
