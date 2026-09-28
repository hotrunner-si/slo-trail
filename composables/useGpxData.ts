const requestCaches = new WeakMap<object, Map<string, Promise<unknown>>>()

/** Share static GPX requests within one Nuxt app without serializing large tracks. */
export function useGpxData() {
  const app = useNuxtApp()
  let cache = requestCaches.get(app)
  if (!cache) {
    cache = new Map()
    requestCaches.set(app, cache)
  }
  return function loadGpx<T>(file: string): Promise<T> {
    let request = cache!.get(file)
    if (!request) {
      request = $fetch(file).catch((error) => {
        cache!.delete(file)
        throw error
      })
      cache!.set(file, request)
    }
    return request as Promise<T>
  }
}
