/**
 * Edge Runtime proxy for asset uploads.
 *
 * Why this exists:
 *  - Vercel's /api/* rewrite has a hard 4.5 MB body limit → breaks large .obj uploads.
 *  - Calling the backend directly from the browser requires CORS → fragile.
 *  - This Edge Route Handler sits on the same origin as the FE (no CORS),
 *    then streams the body server-to-server (no size limit, no CORS check).
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const BACKEND =
  (process.env.NEXT_PUBLIC_API_URL ?? '').trim() ||
  'https://api.immersivevisionary.name.vn'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  try {
    const backendRes = await fetch(`${BACKEND}/api/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      // Stream body directly — avoids buffering the entire payload in memory
      // and sidesteps Vercel's 4.5 MB serverless body limit.
      body: request.body,
      // @ts-expect-error duplex is required when body is a ReadableStream (Node fetch spec)
      duplex: 'half',
    })

    const text = await backendRes.text()
    return new NextResponse(text, {
      status: backendRes.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[proxy/assets POST] upstream error:', err)
    return NextResponse.json(
      { success: false, message: 'Upload proxy error — please try again.' },
      { status: 502 }
    )
  }
}
