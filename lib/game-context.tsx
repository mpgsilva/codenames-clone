"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import {
  type CardType,
  type ClueHistoryEntry,
  type GameCard,
  type Player,
  type PlayerRole,
  type PlayerTeam,
  type RoomSnapshot,
  type Team,
} from "@/lib/game-types"

interface GameContextType {
  cards: GameCard[]
  currentTurn: Team
  blueRemaining: number
  redRemaining: number
  firstTeam: Team
  gameOver: boolean
  winner: Team | null
  gameStarted: boolean
  blueTeamName: string
  redTeamName: string
  gridSize: number
  turnTimer: number | null
  currentClue: string
  currentClueNumber: number | null
  clueHistory: ClueHistoryEntry[]

  roomId: string | null
  players: Player[]
  me: Player | null
  isHost: boolean
  canSeeKey: boolean
  spymasterMode: boolean
  canRevealCards: boolean
  hasActiveClue: boolean
  canMarkCards: boolean
  canGiveClue: boolean
  canEndTurn: boolean
  guessesRemaining: number
  canStartGame: boolean
  startBlockedReason: string | null
  isConnected: boolean
  loading: boolean
  error: string | null

  createRoom: (input: {
    playerName: string
    blueTeamName: string
    redTeamName: string
    gridSize: number
  }) => Promise<void>
  joinRoom: (input: { roomId: string; playerName: string }) => Promise<void>
  leaveRoom: () => void
  refreshRoom: () => Promise<void>
  clearError: () => void

  updateMySetup: (team: PlayerTeam, role: PlayerRole) => Promise<void>
  updateRoomSettings: (input: { blueTeamName?: string; redTeamName?: string; gridSize?: number }) => Promise<void>

  startGame: () => Promise<void>
  revealCard: (index: number) => Promise<void>
  toggleCardMark: (index: number) => Promise<void>
  endTurn: () => Promise<void>
  newRound: () => Promise<void>
  resetGame: () => Promise<void>
  setClue: (clue: string, clueNumber: number | null) => Promise<void>
  toggleSpymasterMode: () => void
}

const GameContext = createContext<GameContextType | null>(null)

const PLAYER_ID_STORAGE = "codenames-player-id"
const POLL_INTERVAL_MS = 1500

function createPlayerId() {
  return `p-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

function getStoredPlayerId() {
  if (typeof window === "undefined") {
    return ""
  }
  const existing = window.localStorage.getItem(PLAYER_ID_STORAGE)
  if (existing) {
    return existing
  }
  const generated = createPlayerId()
  window.localStorage.setItem(PLAYER_ID_STORAGE, generated)
  return generated
}

async function readJsonOrThrow(response: Response) {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "Falha na requisicao")
  }
  return data
}

function useTurnTimer(deadline: number | null) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

  if (!deadline) {
    return null
  }

  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

function getStartValidation(players: Player[]) {
  const blueSpy = players.filter((player) => player.team === "blue" && player.role === "spymaster").length
  const redSpy = players.filter((player) => player.team === "red" && player.role === "spymaster").length
  const blueOps = players.filter((player) => player.team === "blue" && player.role === "operative").length
  const redOps = players.filter((player) => player.team === "red" && player.role === "operative").length

  if (blueSpy !== 1 || redSpy !== 1) {
    return {
      canStart: false,
      reason: "Cada time precisa de exatamente 1 espiao mestre.",
    }
  }

  if (blueOps < 1 || redOps < 1) {
    return {
      canStart: false,
      reason: "Cada time precisa de ao menos 1 agente operacional.",
    }
  }

  return { canStart: true, reason: null }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [playerId, setPlayerId] = useState("")
  const [room, setRoom] = useState<RoomSnapshot | null>(null)
  const [me, setMe] = useState<Player | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spymasterMode, setSpymasterMode] = useState(true)

  useEffect(() => {
    setPlayerId(getStoredPlayerId())
  }, [])

  const roomId = room?.id ?? null

  const syncRoomView = useCallback((data: { room: RoomSnapshot; me: Player | null }) => {
    setRoom(data.room)
    setMe(data.me)
  }, [])

  const refreshRoom = useCallback(async () => {
    if (!roomId || !playerId) {
      return
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}?playerId=${playerId}`, { cache: "no-store" })
      const data = await readJsonOrThrow(response)
      syncRoomView(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar sala")
    }
  }, [roomId, playerId, syncRoomView])

  useEffect(() => {
    if (!roomId || !playerId) {
      return
    }
    const interval = window.setInterval(() => {
      void refreshRoom()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [roomId, playerId, refreshRoom])

  useEffect(() => {
    if (me?.role !== "spymaster") {
      setSpymasterMode(false)
      return
    }
    if (me.team === "spectator") {
      setSpymasterMode(false)
      return
    }
    setSpymasterMode(true)
  }, [me?.role, me?.team])

  const createRoom = useCallback(
    async (input: {
      playerName: string
      blueTeamName: string
      redTeamName: string
      gridSize: number
    }) => {
      if (!playerId) {
        return
      }

      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "create",
            playerId,
            playerName: input.playerName,
            blueTeamName: input.blueTeamName,
            redTeamName: input.redTeamName,
            gridSize: input.gridSize,
          }),
        })
        const data = await readJsonOrThrow(response)
        syncRoomView(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao criar sala")
      } finally {
        setLoading(false)
      }
    },
    [playerId, syncRoomView]
  )

  const joinRoom = useCallback(
    async (input: { roomId: string; playerName: string }) => {
      if (!playerId) {
        return
      }

      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "join",
            roomId: input.roomId.trim(),
            playerId,
            playerName: input.playerName,
          }),
        })
        const data = await readJsonOrThrow(response)
        syncRoomView(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao entrar na sala")
      } finally {
        setLoading(false)
      }
    },
    [playerId, syncRoomView]
  )

  const sendRoomPatch = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!roomId || !playerId) {
        return
      }
      setError(null)
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          ...payload,
        }),
      })
      const data = await readJsonOrThrow(response)
      syncRoomView(data)
    },
    [playerId, roomId, syncRoomView]
  )

  const sendGameAction = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!roomId || !playerId) {
        return
      }
      setError(null)
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          ...payload,
        }),
      })
      const data = await readJsonOrThrow(response)
      syncRoomView(data)
    },
    [playerId, roomId, syncRoomView]
  )

  const updateMySetup = useCallback(
    async (team: PlayerTeam, role: PlayerRole) => {
      try {
        await sendRoomPatch({ team, role })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao atualizar jogador")
      }
    },
    [sendRoomPatch]
  )

  const updateRoomSettings = useCallback(
    async (input: { blueTeamName?: string; redTeamName?: string; gridSize?: number }) => {
      try {
        await sendRoomPatch(input)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao atualizar sala")
      }
    },
    [sendRoomPatch]
  )

  const startGame = useCallback(async () => {
    try {
      await sendGameAction({ kind: "start-game" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar partida")
    }
  }, [sendGameAction])

  const revealCard = useCallback(
    async (index: number) => {
      try {
        await sendGameAction({ kind: "reveal-card", index })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao revelar carta")
      }
    },
    [sendGameAction]
  )

  const toggleCardMark = useCallback(
    async (index: number) => {
      try {
        await sendGameAction({ kind: "toggle-card-mark", index })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao marcar carta")
      }
    },
    [sendGameAction]
  )

  const endTurn = useCallback(async () => {
    try {
      await sendGameAction({ kind: "end-turn" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao encerrar turno")
    }
  }, [sendGameAction])

  const newRound = useCallback(async () => {
    try {
      await sendGameAction({ kind: "new-round" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar nova rodada")
    }
  }, [sendGameAction])

  const resetGame = useCallback(async () => {
    try {
      await sendGameAction({ kind: "reset-game" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao resetar sala")
    }
  }, [sendGameAction])

  const leaveRoom = useCallback(() => {
    setRoom(null)
    setMe(null)
    setError(null)
  }, [])

  const canSeeKey = me?.role === "spymaster" && me.team !== "spectator"
  const effectiveSpymasterMode = canSeeKey && spymasterMode
  const turnTimer = useTurnTimer(room?.game.turnDeadline ?? null)

  const hasActiveClue =
    !!room?.game.gameStarted &&
    !room.game.gameOver &&
    room.game.clueTeam === room.game.currentTurn &&
    room.game.currentClue.trim().length > 0

  const activeClueEntry = useMemo(() => {
    const history = room?.game.clueHistory ?? []
    const latest = history.length > 0 ? history[history.length - 1] : null
    if (!latest || latest.team !== room?.game.currentTurn) {
      return null
    }
    return latest
  }, [room?.game.clueHistory, room?.game.currentTurn])

  const guessLimit = room?.game.currentClueNumber ? room.game.currentClueNumber + 1 : 0
  const guessesUsed = activeClueEntry?.selections.length ?? 0
  const guessesRemaining = hasActiveClue ? Math.max(0, guessLimit - guessesUsed) : 0

  const canRevealCards =
    !!room?.game.gameStarted &&
    !room.game.gameOver &&
    hasActiveClue &&
    guessesRemaining > 0 &&
    !!me &&
    me.team === room.game.currentTurn &&
    me.role === "operative"

  const canMarkCards = canRevealCards

  const canGiveClue =
    !!room?.game.gameStarted &&
    !room.game.gameOver &&
    !!me &&
    me.team === room.game.currentTurn &&
    me.role === "spymaster"

  const canEndTurn =
    !!room?.game.gameStarted &&
    !room.game.gameOver &&
    !!me &&
    me.team === room.game.currentTurn &&
    room.game.clueTeam === room.game.currentTurn &&
    room.game.currentClue.trim().length > 0

  const validation = useMemo(() => getStartValidation(room?.players ?? []), [room?.players])

  const setClue = useCallback(
    async (clue: string, clueNumber: number | null) => {
      try {
        await sendGameAction({ kind: "set-clue", clue, clueNumber })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao enviar dica")
      }
    },
    [sendGameAction]
  )

  const value: GameContextType = {
    cards: room?.game.cards ?? [],
    currentTurn: room?.game.currentTurn ?? "blue",
    blueRemaining: room?.game.blueRemaining ?? 0,
    redRemaining: room?.game.redRemaining ?? 0,
    firstTeam: room?.game.firstTeam ?? "blue",
    gameOver: room?.game.gameOver ?? false,
    winner: room?.game.winner ?? null,
    gameStarted: room?.game.gameStarted ?? false,
    blueTeamName: room?.game.blueTeamName ?? "Time Azul",
    redTeamName: room?.game.redTeamName ?? "Time Vermelho",
    gridSize: room?.game.gridSize ?? 5,
    turnTimer,
    currentClue: room?.game.currentClue ?? "",
    currentClueNumber: room?.game.currentClueNumber ?? null,
    clueHistory: room?.game.clueHistory ?? [],

    roomId,
    players: room?.players ?? [],
    me,
    isHost: !!room && room.hostPlayerId === me?.id,
    canSeeKey,
    spymasterMode: effectiveSpymasterMode,
    canRevealCards,
    hasActiveClue,
    canMarkCards,
    canGiveClue,
    canEndTurn,
    guessesRemaining,
    canStartGame: validation.canStart,
    startBlockedReason: validation.reason,
    isConnected: !!room,
    loading,
    error,

    createRoom,
    joinRoom,
    leaveRoom,
    refreshRoom,
    clearError: () => setError(null),

    updateMySetup,
    updateRoomSettings,

    startGame,
    revealCard,
    toggleCardMark,
    endTurn: async () => {
      if (!canEndTurn) {
        return
      }
      await endTurn()
    },
    newRound,
    resetGame,
    setClue,
    toggleSpymasterMode: () => {
      if (!canSeeKey) {
        return
      }
      setSpymasterMode((prev) => !prev)
    },
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

export type { CardType }
