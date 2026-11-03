import nodemailer from 'nodemailer'
import process from 'node:process'

export const brainWelcomeMessage = {
  subject: 'Dobrodošli na slovensko digitalno trail središče.',
  text: 'Dobrodošli na slovensko digitalno trail središče.\n\nVeseli smo, da ste se nam pridružili.\n\nTrail Slovenija',
  html: '<!doctype html><html lang="sl"><body style="margin:0;background:#f4f5ef;font-family:Arial,sans-serif;color:#193c31"><div style="max-width:560px;margin:32px auto;padding:32px;background:#fff;border-top:4px solid #266358"><p style="font-size:12px;letter-spacing:2px">TRAIL SLOVENIJA</p><h1 style="font-size:26px;line-height:1.3">Dobrodošli na slovensko digitalno trail središče.</h1><p style="font-size:16px;line-height:1.7">Veseli smo, da ste se nam pridružili.</p><p style="margin-top:32px;font-size:13px">Trail Slovenija</p></div></body></html>',
}

// Server-only credentials, read at request time. Supabase never exposes its SMTP password.
export async function brainSendWelcome(to: string): Promise<'sent' | 'unconfigured' | 'failed'> {
  const user = process.env.MAIL_SMTP_USER || ''
  const pass = process.env.MAIL_SMTP_PASSWORD || ''
  if (!user || !pass) return 'unconfigured'
  const port = Number(process.env.MAIL_SMTP_PORT || '465')
  if (![465, 587].includes(port)) return 'unconfigured'
  const transport = nodemailer.createTransport({
    host: process.env.MAIL_SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  })
  try {
    const result = await transport.sendMail({
      from: { name: 'Trail Slovenija', address: user },
      to: { address: to, name: '' },
      ...brainWelcomeMessage,
    })
    return result.accepted.length ? 'sent' : 'failed'
  } catch {
    // Signup remains successful. No SMTP payloads, addresses or credentials in logs.
    return 'failed'
  } finally {
    transport.close()
  }
}
