import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') return nextResolve('next/server.js', context)
    if (specifier.startsWith('@/')) return { url: new URL(specifier.slice(2) + '.ts', root).href, shortCircuit: true }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith(root.href) && !url.includes('/node_modules/') && /\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
      }).outputText
      return { format: 'module', source, shortCircuit: true }
    }
    return nextLoad(url, context)
  }
})

const users = { 'qa-a': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'qa-b': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }
let failingTable = null
let policyValue = '12'
const calls = []
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://fixture')
  const token = req.headers.authorization?.replace('Bearer ', '')
  calls.push({ path: url.pathname, token, query: url.searchParams })
  res.setHeader('Content-Type', 'application/json')
  if (url.pathname === '/auth/v1/user') {
    if (!users[token]) { res.writeHead(401); return res.end(JSON.stringify({ message: 'Invalid token' })) }
    return res.end(JSON.stringify({ id: users[token], email: `${token}@example.com` }))
  }
  if (url.pathname === `/rest/v1/${failingTable}`) {
    res.writeHead(500); return res.end(JSON.stringify({ message: 'Fixture database error' }))
  }
  if (url.pathname === '/rest/v1/settings') {
    assert.equal(token, 'qa-service')
    assert.equal(url.searchParams.get('select'), 'value')
    assert.equal(url.searchParams.get('key'), 'eq.cancellation_window_hours')
    return res.end(JSON.stringify(policyValue === undefined ? [] : [{ value: policyValue }]))
  }
  // Mimic RLS: validating a token at /auth does not authenticate later database calls.
  if (!users[token] || url.searchParams.get('user_id') !== `eq.${users[token]}`) return res.end('[]')
  if (url.pathname === '/rest/v1/user_purchases') {
    return res.end(JSON.stringify([{ id: users[token], classes_remaining: token === 'qa-a' ? 1 : 4, total_classes: 4, expiry_date: '2099-12-31', class_packages: { name: 'QA package' } }]))
  }
  if (url.pathname === '/rest/v1/class_bookings') return res.end('[]')
  res.writeHead(404); res.end('{}')
})
let dashboard, policy
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${server.address().port}`
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'qa-anon'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'qa-service'
  dashboard = await import('../app/api/dashboard/data/route.ts')
  policy = await import('../app/api/studio/booking-policy/route.ts')
})
after(() => new Promise(resolve => server.close(resolve)))
const request = token => new Request('https://studio.example/api/dashboard/data', { headers: token ? { Authorization: `Bearer ${token}` } : {} })

test('dashboard sends the caller token on database queries and returns the real one-credit balance', async () => {
  const response = await dashboard.GET(request('qa-a'))
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /private, no-store/)
  assert.equal((await response.json()).purchases[0].classes_remaining, 1)
  assert.equal(calls.filter(c => c.path.startsWith('/rest/') && c.token === 'qa-a').length, 2)
})
test('concurrent callers keep separate auth and balances', async () => {
  const results = await Promise.all(['qa-a', 'qa-b'].map(async token => (await (await dashboard.GET(request(token))).json()).purchases[0]))
  assert.deepEqual(results.map(p => p.classes_remaining), [1, 4])
  assert.deepEqual(results.map(p => p.id), Object.values(users))
})
test('missing and invalid tokens cannot read dashboard data', async () => {
  assert.equal((await dashboard.GET(request())).status, 401)
  assert.equal((await dashboard.GET(request('invalid'))).status, 401)
})
test('database failures return an error instead of a false zero balance', async () => {
  for (const table of ['user_purchases', 'class_bookings']) {
    failingTable = table
    const response = await dashboard.GET(request('qa-a'))
    assert.equal(response.status, 503)
    assert.equal((await response.json()).purchases, undefined)
  }
  failingTable = null
})
test('public cancellation policy returns only the current numeric rule, including zero', async () => {
  for (const value of ['12', 24, '0', 1, 1.5]) {
    policyValue = value
    const response = await policy.GET()
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), { cancellationWindowHours: Number(value) })
  }
})
test('missing policy uses the server default; failed or corrupt policy does not invent a deadline', async () => {
  policyValue = undefined
  assert.deepEqual(await (await policy.GET()).json(), { cancellationWindowHours: 24 })
  for (const value of ['', 'invalid', -1, true, 9000]) {
    policyValue = value
    assert.equal((await policy.GET()).status, 503)
  }
  failingTable = 'settings'
  assert.equal((await policy.GET()).status, 503)
  failingTable = null
})
