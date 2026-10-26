import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('/lib/apple-auth.ts')) {
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
      }).outputText }
    }
    return nextLoad(url, context)
  }
})
const { signInWithApple, appleErrorMessage, safeAuthDestination, APPLE_CLIENT_ID } = await import('../lib/apple-auth.ts')

function fixture({ mismatch = false, missingToken = false, sdkError, backendError, missingSession = false } = {}) {
  const calls = []
  let options
  const session = { user: { id: 'existing-member' }, access_token: 'test-session' }
  return {
    calls, session,
    apple: { auth: {
      init(value) { options = value },
      async signIn() {
        if (sdkError) throw sdkError
        return { authorization: { state: mismatch ? 'wrong-state' : options.state, id_token: missingToken ? '' : 'signed-apple-token' } }
      }
    } },
    client: { auth: { async signInWithIdToken(value) {
      calls.push(value)
      return { data: { session: missingSession ? null : session }, error: backendError }
    } } },
    get options() { return options }
  }
}

test('Apple sign-in verifies state and exchanges signed token with the raw nonce', async () => {
  const f = fixture()
  assert.equal(await signInWithApple(f.client, f.apple, 'https://www.talasofiliapilates.com'), f.session)
  assert.equal(f.options.clientId, APPLE_CLIENT_ID)
  assert.equal(f.options.redirectURI, 'https://www.talasofiliapilates.com/login')
  assert.equal(f.options.usePopup, true)
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].provider, 'apple')
  assert.equal(f.calls[0].token, 'signed-apple-token')
  const hash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(f.calls[0].nonce))).toString('hex')
  assert.equal(f.options.nonce, hash)
  assert.notEqual(f.options.state, f.calls[0].nonce)
})
test('each authorization uses a fresh state and nonce', async () => {
  const f = fixture()
  await signInWithApple(f.client, f.apple, 'https://studio.example')
  const first = f.options
  await signInWithApple(f.client, f.apple, 'https://studio.example')
  assert.notEqual(first.state, f.options.state)
  assert.notEqual(first.nonce, f.options.nonce)
})
test('mismatched state or missing token never reaches Supabase', async () => {
  for (const setting of [{ mismatch: true }, { missingToken: true }]) {
    const f = fixture(setting)
    await assert.rejects(signInWithApple(f.client, f.apple, 'https://studio.example'))
    assert.equal(f.calls.length, 0)
  }
})
test('cancellation leaves email sign-in available and does not send credentials', async () => {
  const error = { error: 'popup_closed_by_user' }
  const f = fixture({ sdkError: error })
  await assert.rejects(signInWithApple(f.client, f.apple, 'https://studio.example'), value => value === error)
  assert.equal(f.calls.length, 0)
  assert.equal(appleErrorMessage(error), null)
  assert.match(appleErrorMessage({ error: 'popup_blocked_by_browser' }), /allow.*popup/)
})
test('backend rejection and absent session do not report success', async () => {
  for (const setting of [{ backendError: new Error('rejected') }, { missingSession: true }]) {
    const f = fixture(setting)
    await assert.rejects(signInWithApple(f.client, f.apple, 'https://studio.example'))
  }
})
test('login destinations stay on the website', () => {
  for (const value of [null, 'https://evil.example', '//evil.example', '/\\evil.example', '/ /evil.example', 'javascript:alert(1)']) {
    assert.equal(safeAuthDestination(value), '/dashboard')
  }
  assert.equal(safeAuthDestination('/dashboard/book-class?class=123'), '/dashboard/book-class?class=123')
})
