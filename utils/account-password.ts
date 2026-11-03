export const passwordHint = 'Vsaj 6 znakov, vsaj ena črka in ena številka.'

export function accountPasswordIssues(value: string) {
  const issues: string[] = []
  if (value.length < 6) issues.push('Geslo mora imeti vsaj 6 znakov.')
  if (!/\p{L}/u.test(value)) issues.push('Geslo mora vsebovati vsaj eno črko.')
  if (!/[0-9]/.test(value)) issues.push('Geslo mora vsebovati vsaj eno številko.')
  if (value.length > 128) issues.push('Geslo je lahko dolgo največ 128 znakov.')
  return issues
}

export function validAccountPassword(value: string) {
  return value.length >= 6 && value.length <= 128 && /\p{L}/u.test(value) && /[0-9]/.test(value)
}
