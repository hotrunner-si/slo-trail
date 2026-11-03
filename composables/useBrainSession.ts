export async function useBrainSession() {
  const saving = useState('brain-save-content', () => true)
  const request = useRequestFetch()
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const responseCookies = useResponseHeader('set-cookie')
  const { data, refresh } = await useAsyncData('brain-session', async () => {
    return request('/api/brain/session', {
      headers,
      onResponse({ response }) {
        if (import.meta.server && response.headers.getSetCookie().length)
          responseCookies.value = response.headers.getSetCookie()
      },
    })
  })
  return {
    session: data,
    refresh,
    saving,
    signedIn: computed(() => Boolean(data.value?.user)),
    admin: computed(() => Boolean(data.value?.account?.admin)),
  }
}
export function brainError(error: unknown) {
  const e = error as { data?: { statusMessage?: string }; statusMessage?: string }
  return e?.data?.statusMessage || e?.statusMessage || 'Zahteva ni uspela. Poskusi znova.'
}
