export type CardType = "blue" | "red" | "neutral" | "assassin"
export type Team = "blue" | "red"
export type PlayerTeam = Team | "spectator"
export type PlayerRole = "spymaster" | "operative"

export interface GameCard {
  word: string
  type: CardType
  revealed: boolean
  markedByPlayerIds: string[]
}

export interface ClueSelection {
  word: string
  type: CardType
}

export interface ClueHistoryEntry {
  id: string
  team: Team
  clue: string
  clueNumber: number | null
  selections: ClueSelection[]
}

export interface Player {
  id: string
  name: string
  team: PlayerTeam
  role: PlayerRole
  joinedAt: number
  lastSeenAt: number
}

export interface GameSnapshot {
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
  turnDeadline: number | null
  turnDurationSeconds: number
  currentClue: string
  currentClueNumber: number | null
  clueTeam: Team | null
  clueHistory: ClueHistoryEntry[]
}

export interface RoomSnapshot {
  id: string
  hostPlayerId: string
  createdAt: number
  updatedAt: number
  players: Player[]
  game: GameSnapshot
}

export interface RoomView {
  room: RoomSnapshot
  me: Player | null
}
