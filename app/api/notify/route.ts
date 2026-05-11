import { NextRequest, NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

let lastNotification = 0
const COOLDOWN_MS = 5_000

export async function POST(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return NextResponse.json({ ok: false, error: "Telegram not configured" }, { status: 500 })
  }

  const now = Date.now()
  if (now - lastNotification < COOLDOWN_MS) {
    return NextResponse.json({ ok: true, throttled: true })
  }
  lastNotification = now

  try {
    const body = await req.json().catch(() => ({}))
    const referrer = body.referrer || "direct"
    const ua = req.headers.get("user-agent") || "unknown"
    const isMobile = /mobile|android|iphone/i.test(ua)
    const device = isMobile ? "Mobile" : "Desktop"
    const city = req.headers.get("x-vercel-ip-city") || ""
    const region = req.headers.get("x-vercel-ip-country-region") || ""
    const country = req.headers.get("x-vercel-ip-country") || ""
    const location = [city, region, country].filter(Boolean).join(", ") || "Unknown"
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" })

    const message = `New visitor on Hippocratic AI presentation\n\nDevice: ${device}\nLocation: ${location}\nReferrer: ${referrer}\nTime: ${timestamp} ET`

    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
      }
    )
    const tgData = await tgRes.json()
    return NextResponse.json({ ok: tgData.ok })
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 500 })
  }
}
