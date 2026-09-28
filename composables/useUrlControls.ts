import { watch, type Ref } from 'vue'
import type { LocationQueryRaw } from 'vue-router'

type Control = {
  value: Ref<string | boolean>
  options?: readonly (string | boolean)[]
}

/** The URL is the source of truth, including the first server render. */
export function useUrlControls(controls: Record<string, Control>) {
  const route = useRoute()
  const router = useRouter()
  const path = route.path
  const defaults = Object.fromEntries(
    Object.entries(controls).map(([name, control]) => [name, control.value.value]),
  )
  let writing = false
  let pending = false

  function restore() {
    for (const [name, control] of Object.entries(controls)) {
      const raw = route.query[name]
      const fallback = defaults[name]!
      const value =
        typeof fallback === 'boolean'
          ? raw === '1'
            ? true
            : raw === '0'
              ? false
              : fallback
          : typeof raw === 'string'
            ? raw
            : fallback
      control.value.value = control.options && !control.options.includes(value) ? fallback : value
    }
  }

  function queryForControls(): LocationQueryRaw {
    const query: LocationQueryRaw = { ...route.query }
    for (const [name, control] of Object.entries(controls)) {
      const value = control.value.value
      if (value === defaults[name]) delete query[name]
      else query[name] = typeof value === 'boolean' ? (value ? '1' : '0') : value
    }
    return query
  }

  async function updateUrl() {
    if (import.meta.server || route.path !== path) return
    pending = true
    if (writing) return
    writing = true
    try {
      while (pending && route.path === path) {
        pending = false
        const query = queryForControls()
        if (router.resolve({ path, query, hash: route.hash }).fullPath !== route.fullPath) {
          await router.replace({ path, query, hash: route.hash })
        }
      }
    } finally {
      writing = false
    }
  }

  restore()
  watch(
    () => route.fullPath,
    () => {
      if (route.path === path && !writing) restore()
    },
    { flush: 'sync' },
  )
  watch(() => Object.values(controls).map((control) => control.value.value), updateUrl, {
    flush: 'post',
  })
}
