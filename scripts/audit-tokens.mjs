#!/usr/bin/env node
/**
 * Token-coverage guard for the Cyberpunk 2077 theme.
 *
 * The theme is a pure token override layer: every key in `TOKENS` is pushed
 * both through `ctx.theme.register({ tokens })` and through an injected
 * `body { --dsw-*: … !important }` stylesheet. DSH renames/drops tokens between
 * releases, so this script answers two questions against a DSH source tree:
 *
 *   1. Does the plugin set a token DSH no longer declares?  (dead override)
 *   2. Does DSH declare an alias/specific token the plugin forgets?  (leak)
 *
 * Usage:
 *   node scripts/audit-tokens.mjs [--dsh-source <path/to/deepseek-harness/packages/client>]
 *
 * Defaults to the sibling checkout `../deepseek-harness/packages/client`;
 * override with the flag or `DSH_SOURCE`.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUNDLE = resolve(HERE, '../lib/client.js')

/** Token namespaces an override layer is expected to cover completely. */
const REQUIRED_PREFIXES = ['--dsw-alias-', '--dsw-specific-']

/**
 * Aliases this theme inherits on purpose (they derive from tokens it does
 * override, so re-stating them would only duplicate values). Keep this empty
 * while the theme aims for full alias coverage.
 */
const INHERITED = new Set([])

const argv = process.argv.slice(2)
const sourceFlag = argv.indexOf('--dsh-source')
const DSH_SOURCE = resolve(
  sourceFlag >= 0 && argv[sourceFlag + 1] !== undefined
    ? argv[sourceFlag + 1]
    : (process.env.DSH_SOURCE ?? resolve(HERE, '../../deepseek-harness/packages/client')),
)

/**
 * Return the object-literal text starting at the first `{` after `marker`,
 * quote- and comment-aware so nested braces inside values cannot truncate it.
 * @param {string} source - file text.
 * @param {string} marker - text preceding the literal, e.g. `const TOKENS = `.
 * @returns {string} the literal including its braces.
 */
function objectLiteralAfter(source, marker) {
  const at = source.indexOf(marker)
  if (at < 0) throw new Error(`marker not found in ${BUNDLE}: ${marker}`)
  const start = source.indexOf('{', at)
  let depth = 0
  let quote = null
  let line = false
  let block = false
  for (let i = start; i < source.length; i++) {
    const c = source[i]
    const next = source[i + 1]
    if (line) { if (c === '\n') line = false; continue }
    if (block) { if (c === '*' && next === '/') { block = false; i++ } continue }
    if (quote !== null) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = null
      continue
    }
    if (c === '/' && next === '/') { line = true; i++; continue }
    if (c === '/' && next === '*') { block = true; i++; continue }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue }
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) return source.slice(start, i + 1) }
  }
  throw new Error(`unterminated object literal in ${BUNDLE}`)
}

/**
 * Recursively list `*.css` files under a directory.
 * @param {string} dir - directory to walk.
 * @returns {string[]} absolute file paths.
 */
function cssFiles(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...cssFiles(path))
    else if (entry.name.endsWith('.css')) found.push(path)
  }
  return found
}

const literal = objectLiteralAfter(readFileSync(BUNDLE, 'utf8'), 'const TOKENS = ')
const pluginTokens = new Set(Object.keys(Function(`"use strict";return (${literal})`)()))

let files = []
try {
  files = cssFiles(DSH_SOURCE)
} catch (error) {
  console.error(`audit-tokens: cannot read DSH source at ${DSH_SOURCE}\n  ${error.message}`)
  console.error('  pass --dsh-source <path/to/deepseek-harness/packages/client>')
  process.exit(2)
}

const declared = new Set()
for (const file of files) {
  for (const match of readFileSync(file, 'utf8').matchAll(/(--dsw-[a-z0-9-]+)\s*:/g)) declared.add(match[1])
}

const dead = [...pluginTokens].filter(name => !declared.has(name)).sort()
const missing = [...declared]
  .filter(name => REQUIRED_PREFIXES.some(prefix => name.startsWith(prefix)))
  .filter(name => !pluginTokens.has(name) && !INHERITED.has(name))
  .sort()

console.log(`audit-tokens: ${String(pluginTokens.size)} plugin tokens · ${String(declared.size)} declared tokens · ${String(files.length)} CSS files`)
console.log(`  source: ${DSH_SOURCE}`)

if (dead.length > 0) {
  console.error(`\nDEAD OVERRIDES (${String(dead.length)}) — set by the plugin, no longer declared by DSH:`)
  for (const name of dead) console.error(`  - ${name}`)
}
if (missing.length > 0) {
  console.error(`\nMISSING ALIASES (${String(missing.length)}) — declared by DSH, not overridden (light-theme leak):`)
  for (const name of missing) console.error(`  - ${name}`)
}
if (dead.length === 0 && missing.length === 0) {
  console.log('OK — no dead overrides, full alias/specific coverage.')
  process.exit(0)
}
process.exit(1)
