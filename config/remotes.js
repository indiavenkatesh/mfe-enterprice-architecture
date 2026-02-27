/**
 * config/remotes.js
 *
 * Central map of all MFE remotes per MFE_MODE.
 *
 * MFE_MODE=local       → no federation, rspack aliases used instead
 * MFE_MODE=fed-local   → real Module Federation, localhost dev servers
 * MFE_MODE=prod        → real Module Federation, CDN/remote URLs
 */

const MODE = process.env.MFE_MODE || 'local'

const remotes = {
  'fed-local': {
    reactMfe:   'reactMfe@http://localhost:5173/remoteEntry.js',
    angularMfe: 'angularMfe@http://localhost:4200/remoteEntry.js',
  },
  prod: {
    reactMfe:   'reactMfe@https://cdn.your-org.com/react-mfe/remoteEntry.js',
    angularMfe: 'angularMfe@https://cdn.your-org.com/angular-mfe/remoteEntry.js',
  },
}

/**
 * Returns the remote map for the current mode.
 * Returns null in local mode — federation is skipped entirely.
 */
function getRemotes() {
  if (MODE === 'local') return null
  return remotes[MODE] ?? remotes['fed-local']
}

/**
 * Returns the current MFE_MODE.
 */
function getMode() {
  return MODE
}

module.exports = { getRemotes, getMode, MODE }
