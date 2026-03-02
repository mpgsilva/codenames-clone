import "server-only"

import { getRandomWords } from "@/lib/words"
import {
  type CardType,
  type ClueHistoryEntry,
  type GameCard,
  type GameSnapshot,
  type Player,
  type PlayerRole,
  type PlayerTeam,
  type RoomSnapshot,
  type RoomView,
  type Team,
} from "@/lib/game-types"

const TURN_DURATION_SECONDS = 120
const STALE_ROOM_MS = 1000 * 60 * 60 * 8

type InternalRoom = Omit<RoomSnapshot, "players"> & {
  players: Map<string, Player>
}

type CreateRoomInput = {
  playerId: string
  playerName: string
  blueTeamName: string
  redTeamName: string
  gridSize: number
}

type JoinRoomInput = {
  roomId: string
  playerId: string
  playerName: string
}

type UpdatePlayerInput = {
  roomId: string
  playerId: string
  targetPlayerId?: string
  name?: string
  team?: PlayerTeam
  role?: PlayerRole
  blueTeamName?: string
  redTeamName?: string
  gridSize?: number
}

type GameActionInput =
  | {
      kind: "start-game"
      roomId: string
      playerId: string
    }
  | {
      kind: "toggle-card-mark"
      roomId: string
      playerId: string
      index: number
    }
  | {
      kind: "reveal-card"
      roomId: string
      playerId: string
      index: number
    }
  | {
      kind: "end-turn"
      roomId: string
      playerId: string
    }
  | {
      kind: "new-round"
      roomId: string
      playerId: string
    }
  | {
      kind: "set-clue"
      roomId: string
      playerId: string
      clue: string
      clueNumber: number | null
    }
  | {
      kind: "reset-game"
      roomId: string
      playerId: string
    }

const globalState = globalThis as typeof globalThis & {
  __codenamesRooms?: Map<string, InternalRoom>
}

const rooms = globalState.__codenamesRooms ?? new Map<string, InternalRoom>()
globalState.__codenamesRooms = rooms

function now() {
  return Date.now()
}

function defaultGame(blueTeamName: string, redTeamName: string, gridSize: number): GameSnapshot {
  return {
    cards: [],
    currentTurn: "blue",
    blueRemaining: 0,
    redRemaining: 0,
    firstTeam: "blue",
    gameOver: false,
    winner: null,
    gameStarted: false,
    blueTeamName: blueTeamName || "Time Azul",
    redTeamName: redTeamName || "Time Vermelho",
    gridSize,
    turnDeadline: null,
    turnDurationSeconds: TURN_DURATION_SECONDS,
    currentClue: "",
    currentClueNumber: null,
    clueTeam: null,
    clueHistory: [],
  }
}

function pushSelectionToLatestClue(room: InternalRoom, team: Team, card: GameCard) {
  const latest = room.game.clueHistory[room.game.clueHistory.length - 1]
  if (!latest) {
    return
  }
  if (latest.team !== team) {
    return
  }
  latest.selections.push({
    word: card.word,
    type: card.type,
  })
}

function getLatestClueForTeam(room: InternalRoom, team: Team) {
  const latest = room.game.clueHistory[room.game.clueHistory.length - 1]
  if (!latest || latest.team !== team) {
    return null
  }
  return latest
}

function roomToSnapshot(room: InternalRoom): RoomSnapshot {
  return {
    id: room.id,
    hostPlayerId: room.hostPlayerId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    players: Array.from(room.players.values()).sort((a, b) => a.joinedAt - b.joinedAt),
    game: room.game,
  }
}

function buildView(room: InternalRoom, playerId?: string): RoomView {
  return {
    room: roomToSnapshot(room),
    me: playerId ? room.players.get(playerId) ?? null : null,
  }
}

function randomRoomId() {
  const chars = "0123456789"
  let id = ""
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  if (rooms.has(id)) {
    return randomRoomId()
  }
  return id
}

function generateCards(gridSize: number): { cards: GameCard[]; firstTeam: Team } {
  const totalCards = gridSize === 4 ? 16 : 25
  const words = getRandomWords(totalCards)
  const firstTeam: Team = Math.random() < 0.5 ? "blue" : "red"

  const blueCount = totalCards === 25 ? (firstTeam === "blue" ? 9 : 8) : firstTeam === "blue" ? 6 : 5
  const redCount = totalCards === 25 ? (firstTeam === "red" ? 9 : 8) : firstTeam === "red" ? 6 : 5
  const neutralCount = totalCards === 25 ? 7 : 4

  const types: CardType[] = [
    ...Array(blueCount).fill("blue"),
    ...Array(redCount).fill("red"),
    ...Array(neutralCount).fill("neutral"),
    "assassin",
  ]

  const shuffledTypes = [...types].sort(() => Math.random() - 0.5)

  return {
    firstTeam,
    cards: words.map((word, index) => ({
      word,
      type: shuffledTypes[index],
      revealed: false,
      markedByPlayerIds: [],
    })),
  }
}

function hasActiveClue(room: InternalRoom) {
  return room.game.clueTeam === room.game.currentTurn && room.game.currentClue.trim().length > 0
}

function requireRoom(roomId: string): InternalRoom {
  const room = rooms.get(roomId)
  if (!room) {
    throw new Error("Sala não encontrada.")
  }
  return room
}

function requirePlayer(room: InternalRoom, playerId: string): Player {
  const player = room.players.get(playerId)
  if (!player) {
    throw new Error("Jogador não encontrado nesta sala.")
  }
  return player
}

function cleanupRooms() {
  const threshold = now() - STALE_ROOM_MS
  for (const [id, room] of rooms.entries()) {
    if (room.updatedAt < threshold) {
      rooms.delete(id)
    }
  }
}

function tickTurnTimer(room: InternalRoom) {
  if (!room.game.gameStarted || room.game.gameOver || !room.game.turnDeadline) {
    return
  }
  if (room.game.turnDeadline > now()) {
    return
  }
  switchTurn(room)
}

function switchTurn(room: InternalRoom) {
  room.game.currentTurn = room.game.currentTurn === "blue" ? "red" : "blue"
  room.game.turnDeadline = now() + TURN_DURATION_SECONDS * 1000
  room.game.currentClue = ""
  room.game.currentClueNumber = null
  room.game.clueTeam = null
  for (const card of room.game.cards) {
    if (!card.revealed) {
      card.markedByPlayerIds = []
    }
  }
}

function countSpymasters(room: InternalRoom, team: Team) {
  return Array.from(room.players.values()).filter(
    (player) => player.team === team && player.role === "spymaster"
  ).length
}

function assertReadyToStart(room: InternalRoom) {
  if (countSpymasters(room, "blue") !== 1 || countSpymasters(room, "red") !== 1) {
    throw new Error("Defina exatamente 1 espião mestre por time para iniciar.")
  }

  const blueOperatives = Array.from(room.players.values()).filter(
    (player) => player.team === "blue" && player.role === "operative"
  ).length
  const redOperatives = Array.from(room.players.values()).filter(
    (player) => player.team === "red" && player.role === "operative"
  ).length

  if (blueOperatives < 1 || redOperatives < 1) {
    throw new Error("Cada time precisa de pelo menos 1 agente operacional.")
  }
}

export function createRoom(input: CreateRoomInput): RoomView {
  cleanupRooms()

  const roomId = randomRoomId()
  const createdAt = now()

  const creator: Player = {
    id: input.playerId,
    name: input.playerName || "Jogador",
    team: "spectator",
    role: "operative",
    joinedAt: createdAt,
    lastSeenAt: createdAt,
  }

  const room: InternalRoom = {
    id: roomId,
    hostPlayerId: input.playerId,
    createdAt,
    updatedAt: createdAt,
    players: new Map([[creator.id, creator]]),
    game: defaultGame(input.blueTeamName, input.redTeamName, input.gridSize),
  }

  rooms.set(room.id, room)
  return buildView(room, creator.id)
}

export function joinRoom(input: JoinRoomInput): RoomView {
  cleanupRooms()

  const roomId = input.roomId.trim()
  const room = requireRoom(roomId)

  const existing = room.players.get(input.playerId)
  const currentTime = now()

  if (existing) {
    existing.name = input.playerName || existing.name
    existing.lastSeenAt = currentTime
  } else {
    room.players.set(input.playerId, {
      id: input.playerId,
      name: input.playerName || "Jogador",
      team: "spectator",
      role: "operative",
      joinedAt: currentTime,
      lastSeenAt: currentTime,
    })
  }

  room.updatedAt = currentTime
  tickTurnTimer(room)
  return buildView(room, input.playerId)
}

export function getRoom(roomId: string, playerId?: string): RoomView {
  cleanupRooms()

  const room = requireRoom(roomId.toUpperCase().trim())
  tickTurnTimer(room)

  if (playerId) {
    const player = room.players.get(playerId)
    if (player) {
      player.lastSeenAt = now()
    }
  }

  room.updatedAt = now()
  return buildView(room, playerId)
}

export function updatePlayer(input: UpdatePlayerInput): RoomView {
  const room = requireRoom(input.roomId.toUpperCase().trim())
  const actor = requirePlayer(room, input.playerId)
  const target = requirePlayer(room, input.targetPlayerId ?? input.playerId)

  if (input.name) {
    target.name = input.name.trim().slice(0, 24) || target.name
  }

  if (input.team) {
    target.team = input.team
    if (target.team === "spectator") {
      target.role = "operative"
    }
  }

  if (input.role) {
    if (target.team === "spectator") {
      throw new Error("Escolha um time antes de definir o papel.")
    }
    if (input.role === "spymaster") {
      const alreadyHasSpymaster = Array.from(room.players.values()).some(
        (player) => player.id !== target.id && player.team === target.team && player.role === "spymaster"
      )
      if (alreadyHasSpymaster) {
        throw new Error("Este time já tem um espião mestre.")
      }
    }
    target.role = input.role
  }

  const actorIsHost = actor.id === room.hostPlayerId
  if (!actorIsHost && (input.blueTeamName || input.redTeamName || input.gridSize)) {
    throw new Error("Somente o anfitrião pode alterar configurações da sala.")
  }

  if (input.blueTeamName) {
    room.game.blueTeamName = input.blueTeamName.trim().slice(0, 24) || room.game.blueTeamName
  }
  if (input.redTeamName) {
    room.game.redTeamName = input.redTeamName.trim().slice(0, 24) || room.game.redTeamName
  }
  if (input.gridSize) {
    room.game.gridSize = input.gridSize === 4 ? 4 : 5
  }

  room.updatedAt = now()
  return buildView(room, input.playerId)
}

export function applyGameAction(input: GameActionInput): RoomView {
  const room = requireRoom(input.roomId.toUpperCase().trim())
  const actor = requirePlayer(room, input.playerId)

  tickTurnTimer(room)

  if (input.kind === "start-game") {
    if (actor.id !== room.hostPlayerId) {
      throw new Error("Somente o anfitrião pode iniciar a partida.")
    }

    assertReadyToStart(room)

    const { cards, firstTeam } = generateCards(room.game.gridSize)
    room.game.cards = cards
    room.game.firstTeam = firstTeam
    room.game.currentTurn = firstTeam
    room.game.blueRemaining = cards.filter((card) => card.type === "blue").length
    room.game.redRemaining = cards.filter((card) => card.type === "red").length
    room.game.gameOver = false
    room.game.winner = null
    room.game.gameStarted = true
    room.game.turnDeadline = now() + TURN_DURATION_SECONDS * 1000
    room.game.currentClue = ""
    room.game.currentClueNumber = null
    room.game.clueTeam = null
    room.game.clueHistory = []
  }

  if (input.kind === "reveal-card") {
    if (!room.game.gameStarted || room.game.gameOver) {
      throw new Error("A partida não está ativa.")
    }
    if (!hasActiveClue(room)) {
      throw new Error("Aguarde o mestre enviar uma dica antes de confirmar uma carta.")
    }
    if (actor.team !== room.game.currentTurn) {
      throw new Error("Apenas jogadores do time da vez podem abrir cartas.")
    }
    if (actor.role === "spymaster") {
      throw new Error("Espiões mestres não podem abrir cartas.")
    }

    const actingTeam = room.game.currentTurn
    const latestClue = getLatestClueForTeam(room, actingTeam)
    if (!latestClue || latestClue.clueNumber === null) {
      throw new Error("Não há dica ativa para confirmar cartas.")
    }
    const maxGuesses = latestClue.clueNumber + 1
    if (latestClue.selections.length >= maxGuesses) {
      throw new Error("Limite de palpites atingido para esta dica.")
    }

    const card = room.game.cards[input.index]
    if (!card) {
      throw new Error("Carta inválida.")
    }
    if (card.revealed) {
      throw new Error("Essa carta já foi revelada.")
    }
    if (!(card.markedByPlayerIds ?? []).includes(actor.id)) {
      throw new Error("Marque a carta como possibilidade antes de confirmar.")
    }

    card.revealed = true
    card.markedByPlayerIds = []
    pushSelectionToLatestClue(room, actingTeam, card)

    if (card.type === "assassin") {
      room.game.gameOver = true
      room.game.winner = room.game.currentTurn === "blue" ? "red" : "blue"
      room.game.turnDeadline = null
    } else if (card.type === "blue") {
      room.game.blueRemaining -= 1
      if (room.game.blueRemaining <= 0) {
        room.game.gameOver = true
        room.game.winner = "blue"
        room.game.turnDeadline = null
      } else if (room.game.currentTurn !== "blue") {
        switchTurn(room)
      } else if (!room.game.gameOver && latestClue.selections.length >= maxGuesses) {
        switchTurn(room)
      }
    } else if (card.type === "red") {
      room.game.redRemaining -= 1
      if (room.game.redRemaining <= 0) {
        room.game.gameOver = true
        room.game.winner = "red"
        room.game.turnDeadline = null
      } else if (room.game.currentTurn !== "red") {
        switchTurn(room)
      } else if (!room.game.gameOver && latestClue.selections.length >= maxGuesses) {
        switchTurn(room)
      }
    } else {
      switchTurn(room)
    }
  }

  if (input.kind === "end-turn") {
    if (!room.game.gameStarted || room.game.gameOver) {
      throw new Error("A partida não está ativa.")
    }
    if (actor.team !== room.game.currentTurn) {
      throw new Error("Apenas o time da vez pode encerrar o turno.")
    }
    if (room.game.clueTeam !== room.game.currentTurn || !room.game.currentClue.trim()) {
      throw new Error("Envie uma dica antes de encerrar o turno.")
    }
    switchTurn(room)
  }

  if (input.kind === "new-round") {
    if (actor.id !== room.hostPlayerId) {
      throw new Error("Somente o anfitrião pode iniciar nova rodada.")
    }
    assertReadyToStart(room)

    const { cards, firstTeam } = generateCards(room.game.gridSize)
    room.game.cards = cards
    room.game.firstTeam = firstTeam
    room.game.currentTurn = firstTeam
    room.game.blueRemaining = cards.filter((card) => card.type === "blue").length
    room.game.redRemaining = cards.filter((card) => card.type === "red").length
    room.game.gameOver = false
    room.game.winner = null
    room.game.gameStarted = true
    room.game.turnDeadline = now() + TURN_DURATION_SECONDS * 1000
    room.game.currentClue = ""
    room.game.currentClueNumber = null
    room.game.clueTeam = null
    room.game.clueHistory = []
  }

  if (input.kind === "set-clue") {
    if (!room.game.gameStarted || room.game.gameOver) {
      throw new Error("A partida não está ativa.")
    }
    if (actor.team !== room.game.currentTurn) {
      throw new Error("A dica só pode ser enviada pelo time da vez.")
    }
    if (actor.role !== "spymaster") {
      throw new Error("Somente o espião mestre pode enviar dica.")
    }

    const clue = (input.clue ?? "").trim().slice(0, 32)
    const letterCount = (clue.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? []).length
    if (letterCount < 2) {
      throw new Error("A dica deve ter pelo menos 2 letras.")
    }

    if (input.clueNumber === null || !Number.isInteger(input.clueNumber) || input.clueNumber < 1 || input.clueNumber > 9) {
      throw new Error("Selecione um número de dicas entre 1 e 9.")
    }

    room.game.currentClue = clue.toUpperCase()
    room.game.currentClueNumber = input.clueNumber
    room.game.clueTeam = room.game.currentTurn
    for (const card of room.game.cards) {
      if (!card.revealed) {
        card.markedByPlayerIds = []
      }
    }
    const entry: ClueHistoryEntry = {
      id: `${now()}-${Math.random().toString(36).slice(2, 8)}`,
      team: room.game.currentTurn,
      clue: room.game.currentClue,
      clueNumber: room.game.currentClueNumber,
      selections: [],
    }
    room.game.clueHistory.push(entry)
  }

  if (input.kind === "toggle-card-mark") {
    if (!room.game.gameStarted || room.game.gameOver) {
      throw new Error("A partida não está ativa.")
    }
    if (!hasActiveClue(room)) {
      throw new Error("Aguarde o mestre enviar uma dica antes de marcar cartas.")
    }
    if (actor.team !== room.game.currentTurn) {
      throw new Error("Apenas jogadores do time da vez podem marcar cartas.")
    }
    if (actor.role !== "operative") {
      throw new Error("Somente agentes operativos podem marcar cartas.")
    }

    const card = room.game.cards[input.index]
    if (!card) {
      throw new Error("Carta inválida.")
    }
    if (card.revealed) {
      throw new Error("Essa carta já foi revelada.")
    }

    const currentMarks = card.markedByPlayerIds ?? []
    const alreadyMarked = currentMarks.includes(actor.id)
    card.markedByPlayerIds = alreadyMarked
      ? currentMarks.filter((id) => id !== actor.id)
      : [...currentMarks, actor.id]
  }

  if (input.kind === "reset-game") {
    if (actor.id !== room.hostPlayerId) {
      throw new Error("Somente o anfitrião pode reiniciar a sala.")
    }

    room.game = {
      ...defaultGame(room.game.blueTeamName, room.game.redTeamName, room.game.gridSize),
    }
  }

  room.updatedAt = now()
  return buildView(room, input.playerId)
}
