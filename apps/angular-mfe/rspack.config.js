// apps/angular-mfe/rspack.config.js
const path = require('path')
const { ModuleFederationPlugin } = require('@module-federation/enhanced/rspack')
const { AngularWebpackPlugin } = require('@ngtools/webpack')
const { getRemotes, getMode } = require('../../config/remotes')
const { shared } = require('../../config/federation')

const MODE    = getMode()
const remotes = getRemotes()
const isLocal = MODE === 'local'

console.log(`\n[angular-mfe] MFE_MODE=${MODE} | Federation: ${isLocal ? 'OFF (aliases)' : 'ON'}\n`)

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  entry: './src/main.ts',

  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: isLocal ? '/' : 'auto',
    uniqueName: 'angularMfe',
  },

  resolve: {
    extensions: ['.ts', '.js'],

    // ── LOCAL ONLY: alias workspace packages directly ─────────────────────
    alias: isLocal
      ? {
          '@mfe-demo/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
        }
      : {},
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            // Angular compiler — handles decorators, templates, etc.
            loader: '@ngtools/webpack',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    new AngularWebpackPlugin({
      tsconfig: path.resolve(__dirname, 'tsconfig.app.json'),
      jitMode: false,
    }),

    // ── FEDERATION: skipped entirely in local mode ────────────────────────
    ...(!isLocal
      ? [
          new ModuleFederationPlugin({
            name: 'angularMfe',
            filename: 'remoteEntry.js',

            exposes: {
              './AppComponent': './src/app.component',
            },

            remotes: remotes ?? {},

            shared: {
              ...shared,
              // Angular-specific singletons
              '@angular/core': { singleton: true, requiredVersion: '^17.3.0' },
              '@angular/common': { singleton: true, requiredVersion: '^17.3.0' },
              '@angular/router': { singleton: true, requiredVersion: '^17.3.0' },
              '@angular/platform-browser': { singleton: true, requiredVersion: '^17.3.0' },
            },
          }),
        ]
      : []),
  ],

  devServer: {
    port: 4200,
    hot: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  builtins: {
    html: [{ template: './src/index.html' }],
  },
}
