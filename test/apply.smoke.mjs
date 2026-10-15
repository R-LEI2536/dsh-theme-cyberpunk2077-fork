#!/usr/bin/env node
/**
 * Browser-half smoke test for lib/client.js.
 *
 * The bundle is a plain script that registers itself through
 * `window.__ModuleLoader__.load({ id, factory })`, exactly as the DSH client
 * module table loads it. This test executes that body inside jsdom, runs the
 * returned plugin against a stubbed Cordis context, and pins the two things an
 * upgrade can silently break:
 *
 *   - the theme registration contract (`ctx.theme.register/setTheme`), and
 *   - the injected token stylesheet (the color authority the theme ships).
 *
 * Run: `node --test test/`
 * jsdom is resolved from a local node_modules or the sibling deepseek-harness
 * checkout; set `DSH_DEPS_DIR` to point at another node_modules directory.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUNDLE = resolve(HERE, '../lib/client.js')
const THEME_ID = 'cyberpunk2077'
const MENU_FILL = 'rgba(13, 19, 34, 0.72)'

/** Directory whose node_modules backs the dev-time dependencies. */
function fallbackDepsDir() {
  return process.env.DSH_DEPS_DIR ?? resolve(HERE, '../../deepseek-harness/node_modules')
}

/** Import a dev-time dependency, else resolve it from the sibling checkout. */
async function requireDep(name) {
  try {
    const loaded = await import(name)
    return loaded.default ?? loaded
  } catch {
    return createRequire(resolve(fallbackDepsDir(), 'noop.js'))(name)
  }
}

/** `requireDep` for optional tooling: returns undefined when absent. */
async function optionalDep(name) {
  try {
    return await requireDep(name)
  } catch {
    return undefined
  }
}

/** `import('jsdom')` when installed, else the sibling checkout's copy. */
async function jsdomModule() {
  return requireDep('jsdom')
}

/**
 * Execute the bundle against a fresh jsdom document and pull out its plugin.
 * @returns {Promise<{win: object, plugin: object, errors: string[], restore: () => void}>}
 */
async function boot() {
  const { JSDOM } = await jsdomModule()
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'http://127.0.0.1:3080/',
    pretendToBeVisual: true,
  })
  const win = dom.window
  win.matchMedia = query => ({
    matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  })

  const saved = new Map()
  const install = (key, value) => {
    saved.set(key, Object.hasOwn(globalThis, key) ? globalThis[key] : undefined)
    globalThis[key] = value
  }
  // The bundle runs in this realm: take the DOM globals from jsdom (not the
  // timers — jsdom's Window.setTimeout re-enters the global setTimeout, so
  // swapping them in recurses). Timers stay Node's and are tracked here so a
  // one-shot the plugin scheduled can never keep the test process alive.
  for (const key of ['window', 'document', 'MutationObserver', 'localStorage', 'sessionStorage', 'getComputedStyle']) {
    install(key, key === 'window' ? win : key === 'document' ? win.document : win[key])
  }
  const pending = new Set()
  const nodeTimers = { setTimeout, clearTimeout, setInterval, clearInterval }
  const originalSetTimeout = setTimeout
  const originalSetInterval = setInterval
  const originalClearTimeout = clearTimeout
  const originalClearInterval = clearInterval
  globalThis.setTimeout = (fn, ms, ...rest) => {
    const id = originalSetTimeout(fn, ms, ...rest)
    pending.add(id)
    return id
  }
  globalThis.setInterval = (fn, ms, ...rest) => {
    const id = originalSetInterval(fn, ms, ...rest)
    pending.add(id)
    return id
  }
  globalThis.clearTimeout = id => { pending.delete(id); originalClearTimeout(id) }
  globalThis.clearInterval = id => { pending.delete(id); originalClearInterval(id) }

  let registration
  win.__ModuleLoader__ = { load: r => { registration = r } }
  const errors = []
  const originalError = console.error
  console.error = (...args) => { errors.push(args.map(String).join(' ')) }
  await import(`${pathToFileURL(BUNDLE).href}?smoke=${String(Math.random())}`)

  return {
    win,
    errors,
    plugin: registration.factory(() => { throw new Error('client bundle requires no externals') }),
    restore() {
      console.error = originalError
      for (const id of pending) {
        nodeTimers.clearTimeout(id)
        nodeTimers.clearInterval(id)
      }
      pending.clear()
      globalThis.setTimeout = nodeTimers.setTimeout
      globalThis.clearTimeout = nodeTimers.clearTimeout
      globalThis.setInterval = nodeTimers.setInterval
      globalThis.clearInterval = nodeTimers.clearInterval
      for (const [key, value] of saved) {
        if (value === undefined) delete globalThis[key]
        else globalThis[key] = value
      }
      win.close()
    },
  }
}

/**
 * Stub Cordis context: `effect` runs its callback immediately (returning the
 * plugin's disposer), `theme` is a minimal registry whose `register` hands back
 * a disposer like the real ThemeRuntime.
 * @param {{themes?: object[]}} [options] - pre-seeded registry entries.
 */
function createCtx(options = {}) {
  const calls = { register: [], setTheme: [], on: [], disposed: 0 }
  const registry = [...(options.themes ?? [])]
  const cleanups = []
  const ctx = {
    effect(fn) {
      const cleanup = fn()
      cleanups.push(cleanup)
      return cleanup
    },
    on(type) { calls.on.push(type) },
    theme: {
      getTheme() {
        return {
          preference: 'system',
          fontSize: 14,
          revision: 0,
          active: { id: 'dark', colorScheme: 'dark', tokens: {} },
          themes: [...registry],
        }
      },
      register(definition) {
        calls.register.push(definition)
        registry.push(definition)
        let done = false
        return () => {
          if (done) return
          done = true
          calls.disposed++
          const at = registry.indexOf(definition)
          if (at >= 0) registry.splice(at, 1)
        }
      },
      setTheme(id) { calls.setTheme.push(id) },
      overrideTokens() { throw new Error('overrideTokens is not used by this theme') },
    },
  }
  return { ctx, calls, registry, cleanups }
}

test('apply registers the dark theme, injects the token sheet and disposes cleanly', async () => {
  const booted = await boot()
  try {
    assert.equal(booted.plugin.isPlugin, true)
    assert.deepEqual(booted.plugin.inject, ['theme'])

    const { ctx, calls, cleanups } = createCtx()
    booted.plugin.apply(ctx)

    assert.equal(calls.register.length, 1)
    const definition = calls.register[0]
    assert.equal(definition.id, THEME_ID)
    assert.equal(definition.colorScheme, 'dark')
    assert.ok(Object.keys(definition.tokens).length >= 180, 'alias/specific layer stays complete')
    assert.equal(definition.tokens['--dsw-menu-surface-fill'], MENU_FILL)
    assert.equal(definition.tokens['--dsw-alias-file-diff-added-marker'], '#00f5a0')
    assert.deepEqual(calls.setTheme, [THEME_ID])

    const style = booted.win.document.querySelector('style[data-cyberpunk-theme]')
    assert.ok(style, 'token stylesheet is injected')
    assert.match(style.textContent, /--dsw-menu-surface-fill: rgba\(13, 19, 34, 0\.72\) !important;/)
    assert.match(style.textContent, /:root \{/)
    assert.match(style.textContent, /--dsw-font-family-brand:/)
    assert.equal(booted.win.document.documentElement.style.colorScheme, 'dark')
    assert.equal(booted.win.document.body.hasAttribute('data-ds-dark-theme'), true)

    // Regression guard: [role='dialog'] also matches full-size containers (the
    // settings panel carries it), and clip-path — unlike overflow — clips
    // position:fixed descendants, so a modal portaled into that container
    // (archive-manager → .dsham_settings) is cut down to the container's box.
    const dialogRule = /\[role='dialog'\][^{]*\{([^}]*)\}/u.exec(style.textContent)
    assert.ok(dialogRule, "dialog rule is still injected")
    assert.doesNotMatch(dialogRule[1], /clip-path/u, "dialogs must not clip portaled fixed children")

    assert.equal(cleanups.length, 1)
    cleanups[0]()
    assert.equal(calls.disposed, 1)
    assert.deepEqual(booted.errors, [])
  } finally {
    booted.restore()
  }
})

test('a second apply adopts an already-registered theme instead of throwing', async () => {
  const booted = await boot()
  try {
    const first = createCtx()
    booted.plugin.apply(first.ctx)

    // Client HMR re-applies the plugin while ui-theme's registry still holds
    // the first fiber's theme; register() is single-occupant and must not run.
    const second = createCtx({ themes: first.calls.register })
    booted.plugin.apply(second.ctx)

    assert.equal(second.calls.register.length, 0)
    assert.deepEqual(second.calls.setTheme, [THEME_ID])
    assert.equal(second.registry.length, 1)
    assert.deepEqual(booted.errors, [])

    for (const cleanup of first.cleanups) cleanup()
    for (const cleanup of second.cleanups) cleanup()
  } finally {
    booted.restore()
  }
})

test('the injected token sheet parses as CSS', async t => {
  const lightningcss = await optionalDep('lightningcss')
  if (lightningcss === undefined) {
    t.skip('lightningcss not resolvable — set DSH_DEPS_DIR to a checkout that has it')
    return
  }
  const booted = await boot()
  try {
    const { ctx, cleanups } = createCtx()
    booted.plugin.apply(ctx)
    const css = booted.win.document.querySelector('style[data-cyberpunk-theme]').textContent
    // transform() throws on a parse error; the dead rules of an upgrade usually
    // show up as a typo in an injected declaration, which this catches.
    const { code } = lightningcss.transform({ filename: 'cyberpunk.css', code: Buffer.from(css) })
    assert.ok(code.length > 0, 'stylesheet round-trips')
    assert.match(code.toString(), /--dsw-menu-surface-fill/)
    cleanups[0]()
  } finally {
    booted.restore()
  }
})
