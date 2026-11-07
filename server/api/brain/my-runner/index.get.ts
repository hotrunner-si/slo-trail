import handler from '../admin-runners/[slug].get'
export default defineEventHandler((event) => {
  // Internal route context: ownership is resolved from the authenticated account, never the body.
  event.context.runnerEditorOwner = true
  return handler(event)
})
