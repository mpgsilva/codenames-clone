import { NextResponse } from "next/server"

import { getStorageHealth } from "@/lib/server/rooms-store"

export const runtime = "nodejs"

export async function GET() {
  const health = await getStorageHealth()
  return NextResponse.json({
    ok: health.storageMode === "memory" ? true : health.redisOk,
    ...health,
  })
}