import { NextResponse } from "next/server"

import { createRoom, joinRoom } from "@/lib/server/rooms-store"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.kind === "create") {
      const roomView = createRoom({
        playerId: body.playerId,
        playerName: body.playerName,
        blueTeamName: body.blueTeamName,
        redTeamName: body.redTeamName,
        gridSize: body.gridSize,
      })

      return NextResponse.json(roomView)
    }

    if (body.kind === "join") {
      const roomView = joinRoom({
        roomId: body.roomId,
        playerId: body.playerId,
        playerName: body.playerName,
      })

      return NextResponse.json(roomView)
    }

    return NextResponse.json({ error: "Operação inválida." }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 }
    )
  }
}
