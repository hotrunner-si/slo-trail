// Explicit one-time owner instruction only. No credentials or account records are printed.
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { validAccountPassword } from '../utils/account-password.ts'
const option = (name) =>
  process.argv.find((v) => v.startsWith(`--${name}=`))?.slice(name.length + 3)
const project = 'favatadzmmqsdocrstti'
assert.equal(option('project'), project)
assert.ok(process.argv.includes('--apply'))
assert.equal(process.env.NUXT_PUBLIC_SUPABASE_URL, `https://${project}.supabase.co`)
const adminEmail = option('admin-email')?.trim().toLowerCase()
const memberEmail = option('member-email')?.trim().toLowerCase()
const memberName = option('member-name')
const runnerSlug = option('runner')
const password = process.env.BRAIN_SETUP_ADMIN_PASSWORD || ''
assert.ok(adminEmail && memberEmail && adminEmail !== memberEmail && memberName && runnerSlug)
assert.ok(validAccountPassword(password))
const url = process.env.NUXT_PUBLIC_SUPABASE_URL
const service = createClient(url, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
function must(r) {
  if (r.error)
    throw new Error(
      `Account setup operation failed (${r.error.code || r.error.status || 'unknown'})`,
    )
  return r.data
}
const users = must(await service.auth.admin.listUsers({ page: 1, perPage: 1000 })).users
assert.ok(users.length < 1000, 'Account inventory needs pagination before changing anything')
const source = users.find((u) => u.email?.toLowerCase() === adminEmail)
const existingMember = users.find((u) => u.email?.toLowerCase() === memberEmail)
assert.ok(source, 'Expected source account missing; nothing changed')
assert.ok(!existingMember, 'Target member account already exists; nothing changed')
assert.ok(
  source.user_metadata?.display_name === memberName,
  'Source name mismatch; nothing changed',
)
assert.equal(
  must(await service.from('brain_admins').select('user_id').eq('user_id', source.id)).length,
  0,
)
must(await service.from('runners').select('slug').eq('slug', runnerSlug).single())
const owners = must(
  await service
    .from('brain_runner_links')
    .select('user_id,runner_slug')
    .or(`user_id.eq.${source.id},runner_slug.eq.${runnerSlug}`),
)
assert.ok(
  owners.every((l) => l.user_id === source.id && l.runner_slug === runnerSlug),
  'Existing runner ownership differs; nothing changed',
)

// Keep the member UUID, password and all dependent records. Never recreate this account.
must(
  await service.auth.admin.updateUserById(source.id, { email: memberEmail, email_confirm: true }),
)
console.log('PASS existing member account moved; UUID and password preserved')
const admin = must(
  await service.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: 'Admin' },
  }),
).user
assert.notEqual(admin.id, source.id)
must(await service.from('brain_admins').insert({ user_id: admin.id }))
if (!owners.length)
  must(
    await service
      .from('brain_runner_links')
      .insert({ user_id: source.id, runner_slug: runnerSlug }),
  )
must(
  await service
    .from('brain_link_requests')
    .update({ status: 'approved' })
    .eq('user_id', source.id)
    .eq('runner_slug', runnerSlug)
    .eq('status', 'pending'),
)
assert.equal(
  must(await service.from('brain_admins').select('user_id').eq('user_id', source.id)).length,
  0,
)
const client = createClient(url, process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
must(await client.auth.signInWithPassword({ email: adminEmail, password }))
assert.equal(must(await client.rpc('brain_account')).admin, true)
must(await client.auth.signOut({ scope: 'global' }))
console.log('PASS distinct administrator created; password login and database role verified')
console.log('PASS member remains non-admin and has the explicitly approved runner link')
