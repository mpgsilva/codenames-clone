"use client"

import { Check } from "lucide-react"

import { useGame, type CardType } from "@/lib/game-context"
import { cn } from "@/lib/utils"

function getCardColors(type: CardType, revealed: boolean, spymasterMode: boolean) {
  if (revealed) {
    switch (type) {
      case "blue":
        return "bg-game-blue text-white border-blue-600"
      case "red":
        return "bg-game-red text-white border-red-600"
      case "neutral":
        return "bg-game-neutral text-foreground/60 border-game-neutral-dark"
      case "assassin":
        return "bg-game-assassin text-white border-gray-800"
    }
  }

  if (spymasterMode) {
    switch (type) {
      case "blue":
        return "bg-game-blue-light border-game-blue text-game-blue ring-2 ring-game-blue/30"
      case "red":
        return "bg-game-red-light border-game-red text-game-red ring-2 ring-game-red/30"
      case "neutral":
        return "bg-muted border-border text-muted-foreground"
      case "assassin":
        return "bg-game-assassin/20 border-game-assassin text-foreground ring-2 ring-game-assassin/30"
    }
  }

  return "bg-card text-card-foreground border-border"
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

interface GameCardProps {
  index: number
}

export function GameCardComponent({ index }: GameCardProps) {
  const {
    cards,
    players,
    me,
    revealCard,
    toggleCardMark,
    spymasterMode,
    gameOver,
    canMarkCards,
    canRevealCards,
  } = useGame()

  const card = cards[index]
  const markedByIds = card.markedByPlayerIds ?? []
  const markedPlayers = markedByIds
    .map((playerId) => players.find((player) => player.id === playerId))
    .filter((player): player is NonNullable<typeof player> => !!player)

  const markedByMe = !!me && markedByIds.includes(me.id)

  const canToggleMark = !card.revealed && !gameOver && !spymasterMode && canMarkCards
  const canConfirmCard = !card.revealed && !gameOver && !spymasterMode && canRevealCards && markedByMe

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 transition-all duration-300",
        "h-14 sm:h-16 md:h-20",
        getCardColors(card.type, card.revealed, spymasterMode),
        card.revealed && "scale-[0.97] shadow-inner",
        markedPlayers.length > 0 && !card.revealed && "ring-2 ring-primary/30"
      )}
    >
      <button
        onClick={() => void toggleCardMark(index)}
        disabled={!canToggleMark}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-md p-1 text-xs font-semibold transition-all select-none sm:text-sm md:text-base",
          canToggleMark ? "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5" : "cursor-default"
        )}
        aria-label={`Carta: ${card.word}`}
      >
        <span className={cn("truncate px-1 text-balance text-center leading-tight", card.revealed && "opacity-90")}>{card.word}</span>
      </button>

      {canConfirmCard && (
        <button
          onClick={() => void revealCard(index)}
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90"
          aria-label="Confirmar carta"
        >
          <Check className="h-3 w-3" />
        </button>
      )}

      {markedPlayers.length > 0 && !card.revealed && (
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1">
          {markedPlayers.slice(0, 4).map((player) => (
            <div
              key={`${card.word}-${player.id}`}
              title={player.name}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/85 text-[10px] font-semibold text-background"
            >
              {getInitial(player.name)}
            </div>
          ))}
          {markedPlayers.length > 4 && (
            <div className="rounded-full bg-foreground/70 px-1.5 text-[10px] font-semibold text-background">+{markedPlayers.length - 4}</div>
          )}
        </div>
      )}

      {card.revealed && <div className="pointer-events-none absolute inset-0 rounded-lg bg-white/5" />}
    </div>
  )
}

export function GameBoard() {
  const { cards, gridSize, me, hasActiveClue, guessesRemaining, currentTurn, gameOver } = useGame()

  const gridCols = gridSize === 4 ? "grid-cols-4" : "grid-cols-5"
  const blockedForOperative =
    !gameOver && me?.role === "operative" && me.team === currentTurn && !hasActiveClue
  const limitReachedForOperative =
    !gameOver && me?.role === "operative" && me.team === currentTurn && hasActiveClue && guessesRemaining <= 0

  return (
    <div className="w-full max-w-4xl px-2 sm:px-4">
      {blockedForOperative && (
        <div className="mb-2 rounded-lg border border-border bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
          Aguardando o espião mestre enviar a dica para liberar o tabuleiro.
        </div>
      )}
      {limitReachedForOperative && (
        <div className="mb-2 rounded-lg border border-border bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
          Limite de palpites desta dica atingido. Passe o turno.
        </div>
      )}

      <div className={cn("grid gap-2 sm:gap-3", gridCols)} role="grid" aria-label="Tabuleiro do jogo">
        {cards.map((card, index) => (
          <GameCardComponent key={`${card.word}-${index}`} index={index} />
        ))}
      </div>
    </div>
  )
}
