"use client"

import { useMemo } from "react"

import { useGame } from "@/lib/game-context"
import { cn } from "@/lib/utils"

function selectionColor(type: "blue" | "red" | "neutral" | "assassin") {
  switch (type) {
    case "blue":
      return "bg-game-blue/15 text-game-blue border-game-blue/30"
    case "red":
      return "bg-game-red/15 text-game-red border-game-red/30"
    case "neutral":
      return "bg-muted text-muted-foreground border-border"
    case "assassin":
      return "bg-game-assassin/15 text-foreground border-game-assassin/30"
  }
}

export function ClueHistoryPanel() {
  const { clueHistory, blueTeamName, redTeamName } = useGame()

  const entries = useMemo(() => [...clueHistory].reverse(), [clueHistory])
  const hasEntries = entries.length > 0

  return (
    <aside className="w-full rounded-2xl border border-border bg-card p-3 shadow-sm lg:w-[320px] lg:flex-shrink-0">
      <div className="mb-3 text-sm font-semibold text-foreground">Historico de Dicas</div>

      <div
        className={cn(
          "max-h-[65vh] space-y-2 overflow-y-auto pr-1",
          !hasEntries && "pointer-events-none select-none"
        )}
      >
        {!hasEntries && (
          <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Sem dicas nesta partida ainda.
          </div>
        )}

        {hasEntries && entries.map((entry) => {
          const teamName = entry.team === "blue" ? blueTeamName : redTeamName

          return (
            <div key={entry.id} className="rounded-lg border border-border/70 bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    entry.team === "blue" ? "bg-game-blue/15 text-game-blue" : "bg-game-red/15 text-game-red"
                  )}
                >
                  {teamName}
                </span>
                <span className="text-xs text-muted-foreground">{entry.clueNumber ?? "-"}</span>
              </div>

              <div className="mb-2 text-sm font-semibold text-foreground">{entry.clue}</div>

              <div className="space-y-1.5">
                {entry.selections.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma palavra selecionada.</div>}

                {entry.selections.map((selection, index) => (
                  <div
                    key={`${entry.id}-${selection.word}-${index}`}
                    className={cn("rounded-md border px-2 py-1 text-xs font-medium", selectionColor(selection.type))}
                  >
                    {selection.word}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
