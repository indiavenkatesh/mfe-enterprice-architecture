/**
 * config/federation.js
 *
 * Shared Module Federation config fragments.
 * Each MFE merges this with its own exposes/remotes.
 */

/**
 * Shared singletons — must be the same instance across all MFEs.
 * Domain signals-core MUST be singleton or the reactive graph breaks.
 */
const shared = {
  '@preact/signals-core': {
    singleton: true,
    requiredVersion: '^1.5.0',
    eager: false,
  },
  '@mfe-demo/domain': {
    singleton: true,
    requiredVersion: '*',
    eager: false,
  },
  react: {
    singleton: true,
    requiredVersion: '^18.2.0',
    eager: false,
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '^18.2.0',
    eager: false,
  },
}

module.exports = { shared }
