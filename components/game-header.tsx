"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Crosshair, Eye, EyeOff, Moon, RotateCcw, Shuffle, SkipForward, Sun, Timer, Wifi } from "lucide-react"
import { useTheme } from "next-themes"

import { ConfirmActionButton } from "@/components/confirm-action-button"
import { Button } from "@/components/ui/button"
import { useGame } from "@/lib/game-context"
import { cn } from "@/lib/utils"

export function GameHeader() {
  const {
    currentTurn,
    blueRemaining,
    redRemaining,
    blueTeamName,
    redTeamName,
    gameOver,
    spymasterMode,
    canSeeKey,
    roomId,
    me,
    isHost,
    turnTimer,
    currentClue,
    currentClueNumber,
    canGiveClue,
    canEndTurn,
    toggleSpymasterMode,
    endTurn,
    newRound,
    resetGame,
    setClue,
    leaveRoom,
  } = useGame()

  const { theme, setTheme } = useTheme()
  const [clueText, setClueText] = useState("")
  const [clueNumber, setClueNumber] = useState<string>("-")

  useEffect(() => {
    if (canGiveClue) {
      setClueText(currentClue || "")
      setClueNumber(currentClueNumber ? String(currentClueNumber) : "-")
      return
    }
    setClueText("")
    setClueNumber("-")
  }, [canGiveClue, currentClue, currentClueNumber])

  const clueLetterCount = (clueText.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? []).length
  const canSendClue = clueLetterCount >= 2 && clueNumber !== "-"

  const formatTime = (seconds: number | null) => {
    if (seconds === null) {
      return "--:--"
    }
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <header className="w-full">
      <div className="flex items-center justify-between px-3 py-3 sm:px-6">
        <ConfirmActionButton
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          title="Sair da sala"
          description="Tem certeza que deseja sair da sala atual?"
          confirmText="Sair"
          onConfirm={leaveRoom}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden text-sm font-medium sm:inline">Sair da sala</span>
        </ConfirmActionButton>

        <div className="flex items-center gap-1.5">
          <Crosshair className="h-5 w-5 text-primary" />
          <span className="font-sans text-lg font-bold tracking-tight text-foreground">Codinomes</span>
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 px-3 pb-2 text-xs text-muted-foreground sm:gap-4">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
          <Wifi className="h-3 w-3" /> Sala {roomId}
        </span>
        <span className="rounded-md bg-muted px-2 py-1">
          {me?.name} | {me?.team === "spectator" ? "Plateia" : me?.team === "blue" ? "Azul" : "Vermelho"}
          {" - "}
          {me?.role === "spymaster" ? "Mestre" : "Operativo"}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 px-3 py-2 sm:gap-6 sm:px-6">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 transition-all sm:gap-3 sm:px-5 sm:py-2.5",
            currentTurn === "blue" && !gameOver
              ? "bg-game-blue text-white shadow-lg shadow-game-blue/25 ring-2 ring-game-blue/30"
              : "bg-game-blue/10 text-game-blue"
          )}
        >
          <span className="text-sm font-medium sm:text-base">{blueTeamName}</span>
          <span className="text-xl font-bold tabular-nums sm:text-2xl">{blueRemaining}</span>
        </div>

        <div className="flex flex-col items-center">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums",
              turnTimer !== null && turnTimer <= 15
                ? "bg-destructive/10 text-destructive animate-pulse"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Timer className="h-3.5 w-3.5" />
            {formatTime(turnTimer)}
          </div>
          {!gameOver && (
            <div className={cn("mt-1 text-[10px] font-medium uppercase tracking-widest", currentTurn === "blue" ? "text-game-blue" : "text-game-red")}>
              Vez de jogar
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 transition-all sm:gap-3 sm:px-5 sm:py-2.5",
            currentTurn === "red" && !gameOver
              ? "bg-game-red text-white shadow-lg shadow-game-red/25 ring-2 ring-game-red/30"
              : "bg-game-red/10 text-game-red"
          )}
        >
          <span className="text-sm font-medium sm:text-base">{redTeamName}</span>
          <span className="text-xl font-bold tabular-nums sm:text-2xl">{redRemaining}</span>
        </div>
      </div>

      <div className="px-3 pb-2 sm:px-6">
        {canGiveClue ? (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
            <input
              value={clueText}
              onChange={(event) => setClueText(event.target.value)}
              placeholder="Digite a dica"
              className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
            <select
              value={clueNumber}
              onChange={(event) => setClueNumber(event.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none ring-primary/30 focus:ring-2"
            >
              <option value="-">-</option>
              {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={() => void setClue(clueText, clueNumber === "-" ? null : Number(clueNumber))}
              disabled={!canSendClue}
            >
              Enviar dica
            </Button>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Dica atual:</span>{" "}
            {currentClue ? `${currentClue} (${currentClueNumber ?? "-"})` : "-"}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 px-3 pb-3 sm:px-6">
        {canSeeKey && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSpymasterMode}
            className={cn("gap-1.5 text-xs", spymasterMode && "border-primary bg-primary/10 text-primary")}
          >
            {spymasterMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{spymasterMode ? "Ocultar mapa" : "Mostrar mapa"}</span>
          </Button>
        )}

        {!gameOver && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void endTurn()}
            className="gap-1.5 text-xs"
            disabled={!canEndTurn}
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Passar turno</span>
          </Button>
        )}

        {isHost && (
          <>
            <ConfirmActionButton
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              title="Gerar nova grade"
              description="Tem certeza que deseja gerar uma nova grade? A rodada atual será perdida."
              confirmText="Gerar grade"
              onConfirm={() => void newRound()}
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nova grade</span>
            </ConfirmActionButton>

            <ConfirmActionButton
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              title="Voltar ao lobby"
              description="Tem certeza que deseja voltar ao lobby? A rodada atual será encerrada."
              confirmText="Voltar"
              onConfirm={() => void resetGame()}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Voltar lobby</span>
            </ConfirmActionButton>
          </>
        )}
      </div>
    </header>
  )
}
