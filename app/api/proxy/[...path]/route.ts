/**
 * Edge Runtime catch-all proxy for large uploads (POST & PUT).
 *
 * Why this exists:
 *  - Vercel's /api/* rewrite has a hard 4.5 MB body limit → breaks large .obj uploads.
 *  - Calling the backend directly from the browser requires CORS and can fail due to Nginx settings.
 *  - This Edge Route Handler sits on the same origin as the FE (no CORS),
 *    then streams the body server-to-server (no size limit, no CORS check).
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const BACKEND =
  (process.env.NEXT_PUBLIC_API_URL ?? '').trim() ||
  'https://api.immersivevisionary.name.vn'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest('POST', request, params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest('PUT', request, params)
}

async function handleRequest(
  method: string,
  request: NextRequest,
  params: Promise<{ path: string[] }>
) {
  const authHeader = request.headers.get('Authorization')
  // Reconstruct the upstream route path (e.g., ['assets'] -> 'assets', ['orders', '1', 'attachments'] -> 'orders/1/attachments')
  const { path: pathParts } = await params
  const path = pathParts.join('/')

  try {
    const backendRes = await fetch(`${BACKEND}/api/${path}`, {
      method,
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
    console.error(`[proxy/${path} ${method}] upstream error:`, err)
    return NextResponse.json(
      { success: false, message: 'Upload proxy error — please try again.' },
      { status: 502 }
    )
  }
}
