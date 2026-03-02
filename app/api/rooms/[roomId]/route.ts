import { NextResponse } from "next/server"

import { applyGameAction, getRoom, updatePlayer } from "@/lib/server/rooms-store"

export const runtime = "nodejs"

type Params = {
  params: Promise<{ roomId: string }>
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { roomId } = await params
    const url = new URL(request.url)
    const playerId = url.searchParams.get("playerId") ?? undefined

    return NextResponse.json(getRoom(roomId, playerId))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 404 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { roomId } = await params
    const body = await request.json()

    const roomView = updatePlayer({
      roomId,
      playerId: body.playerId,
      targetPlayerId: body.targetPlayerId,
      name: body.name,
      team: body.team,
      role: body.role,
      blueTeamName: body.blueTeamName,
      redTeamName: body.redTeamName,
      gridSize: body.gridSize,
    })

    return NextResponse.json(roomView)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 }
    )
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { roomId } = await params
    const body = await request.json()

    const roomView = applyGameAction({
      ...body,
      roomId,
    })

    return NextResponse.json(roomView)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 }
    )
  }
}
