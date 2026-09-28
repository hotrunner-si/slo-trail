/** Prevent delayed requests/imports from creating UI after a component is closed. */
export function useComponentLifetime() {
  const lifetime = { active: true }
  onBeforeUnmount(() => {
    lifetime.active = false
  })
  return lifetime
}
