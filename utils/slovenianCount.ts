export type SlovenianCountForms = {
  one: string
  two: string
  few: string
  other: string
}

/** Vrne ustrezno slovensko obliko samostalnika glede na zadnji dve števki. */
export function slovenianCountForm(count: number, forms: SlovenianCountForms): string {
  const integer = Math.abs(Math.trunc(count))
  const lastTwo = integer % 100
  const last = integer % 10

  if (lastTwo === 1) return forms.one
  if (lastTwo === 2) return forms.two
  if (lastTwo === 3 || lastTwo === 4) return forms.few
  return forms.other
}

export function formatSlovenianCount(count: number, forms: SlovenianCountForms): string {
  return `${count} ${slovenianCountForm(count, forms)}`
}

export const slovenianCountForms = {
  tour: { one: 'tura', two: 'turi', few: 'ture', other: 'tur' },
  result: { one: 'rezultat', two: 'rezultata', few: 'rezultati', other: 'rezultatov' },
  route: { one: 'trasa', two: 'trasi', few: 'trase', other: 'tras' },
  event: { one: 'dogodek', two: 'dogodka', few: 'dogodki', other: 'dogodkov' },
  runner: { one: 'tekač', two: 'tekača', few: 'tekači', other: 'tekačev' },
  article: { one: 'članek', two: 'članka', few: 'članki', other: 'člankov' },
} satisfies Record<string, SlovenianCountForms>
