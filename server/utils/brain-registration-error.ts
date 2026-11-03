// Map only stable provider codes. Never return raw SMTP errors, addresses or credentials.
export function brainRegistrationError(error: { code?: string; status?: number }) {
  const code = error.code || ''
  if (
    ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(code) ||
    error.status === 429
  )
    return {
      statusCode: 429,
      statusMessage: 'Preveč poskusov ali poslanih sporočil. Počakaj nekaj minut in poskusi znova.',
    }
  if (code === 'weak_password')
    return {
      statusCode: 400,
      statusMessage:
        'Prijavna storitev je zavrnila geslo. Skrbnik naj preveri, ali so pravila gesel v Supabase usklajena z obrazcem.',
    }
  if (['email_exists', 'user_already_exists'].includes(code))
    return {
      statusCode: 400,
      statusMessage:
        'Registracija s tem naslovom ni uspela. Če račun že imaš, izberi Prijava ali Pozabljeno geslo.',
    }
  if (['signup_disabled', 'email_provider_disabled'].includes(code))
    return {
      statusCode: 503,
      statusMessage:
        'Registracija novih računov trenutno ni omogočena. Skrbnik naj preveri nastavitve prijave.',
    }
  if (code === 'email_address_invalid')
    return {
      statusCode: 400,
      statusMessage: 'Prijavna storitev tega e-poštnega naslova ne sprejme. Preveri naslov.',
    }
  if (
    code === 'email_address_not_authorized' ||
    code === 'unexpected_failure' ||
    (error.status || 0) >= 500
  )
    return {
      statusCode: 503,
      statusMessage:
        'Registracija trenutno ni uspela zaradi napake prijavne storitve ali pošiljanja potrditvene e-pošte. Skrbnik naj preveri nastavitve SMTP. Gesla ni treba spreminjati.',
    }
  return {
    statusCode: 503,
    statusMessage:
      'Registracija trenutno ni uspela. Poskusi pozneje; če se napaka ponovi, naj skrbnik preveri prijavno storitev.',
  }
}
