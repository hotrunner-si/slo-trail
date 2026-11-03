export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname.toLowerCase()
  if (path === '/mozgan' || path.startsWith('/mozgan/') || path.startsWith('/api/brain/')) {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    setResponseHeader(event, 'Vary', 'Cookie')
    setResponseHeader(event, 'Referrer-Policy', 'same-origin')
  }
})
