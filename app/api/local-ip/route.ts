import { NextResponse } from "next/server";
import os from "os";

/**
 * /api/local-ip
 *
 * Returns the machine's local network IPv4 address so that ARQRButton can
 * generate a QR code that points to the local dev server instead of
 * 'localhost' (which phones cannot reach over WiFi).
 *
 * Only used during local development — on Vercel, window.location.origin
 * is already a public HTTPS URL and this endpoint is never called.
 */
export async function GET() {
  const nets = os.networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(nets)) {
    const nameLower = name.toLowerCase();
    // Ignore virtual host adapters, WSL, virtualbox, vmware, loopbacks
    if (
      nameLower.includes("virtual") ||
      nameLower.includes("wsl") ||
      nameLower.includes("vbox") ||
      nameLower.includes("vmware") ||
      nameLower.includes("hyper-v") ||
      nameLower.includes("loopback")
    ) {
      continue;
    }

    const interfaces = nets[name];
    if (!interfaces) continue;
    for (const net of interfaces) {
      // Skip loopback and non-IPv4
      if (net.family === "IPv4" && !net.internal) {
        candidates.push(net.address);
      }
    }
  }

  // Prioritize typical home/office network ranges (192.168.x.x or 10.x.x.x)
  let localIp = candidates.find(ip => ip.startsWith("192.168.") || ip.startsWith("10.")) || candidates[0] || "";

  return NextResponse.json({ localIp: localIp || null });
}
