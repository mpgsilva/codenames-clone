"use client"

import { useEffect, useRef } from "react"
import { ArrowLeft, RotateCcw, Skull, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useGame } from "@/lib/game-context"
import { cn } from "@/lib/utils"

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const drawCanvas = canvas

    drawCanvas.width = window.innerWidth
    drawCanvas.height = window.innerHeight

    const colors = ["#3B82F6", "#EF4444", "#F59E0B", "#10B981", "#EC4899"]
    const pieces: Array<{
      x: number
      y: number
      w: number
      h: number
      color: string
      vx: number
      vy: number
      rotation: number
      rotSpeed: number
      opacity: number
    }> = []

    for (let i = 0; i < 130; i++) {
      pieces.push({
        x: Math.random() * drawCanvas.width,
        y: -Math.random() * drawCanvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 12 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        opacity: 1,
      })
    }

    let animationId = 0

    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height)

      let activePieces = 0
      for (const piece of pieces) {
        piece.x += piece.vx
        piece.y += piece.vy
        piece.vy += 0.05
        piece.rotation += piece.rotSpeed

        if (piece.y > drawCanvas.height) {
          piece.opacity -= 0.02
        }

        if (piece.opacity <= 0) {
          continue
        }

        activePieces += 1

        ctx.save()
        ctx.globalAlpha = piece.opacity
        ctx.translate(piece.x, piece.y)
        ctx.rotate(piece.rotation)
        ctx.fillStyle = piece.color
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h)
        ctx.restore()
      }

      if (activePieces > 0) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" aria-hidden="true" />
}

export function VictoryModal() {
  const { gameOver, winner, blueTeamName, redTeamName, cards, newRound, resetGame, isHost } = useGame()

  const wasAssassin = gameOver && cards.some((card) => card.type === "assassin" && card.revealed)

  if (!gameOver || !winner) {
    return null
  }

  const winnerName = winner === "blue" ? blueTeamName : redTeamName
  const winnerColor = winner === "blue" ? "text-game-blue" : "text-game-red"
  const bgGlow = winner === "blue" ? "shadow-game-blue/20 border-game-blue/30" : "shadow-game-red/20 border-game-red/30"

  return (
    <>
      {!wasAssassin && <Confetti />}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
        <div className={cn("w-full max-w-sm rounded-2xl border-2 bg-card p-8 text-center shadow-2xl", bgGlow)}>
          <div className="flex flex-col items-center gap-4">
            {wasAssassin ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-game-assassin text-white">
                <Skull className="h-8 w-8" />
              </div>
            ) : (
              <div className={cn("flex h-16 w-16 items-center justify-center rounded-full text-white", winner === "blue" ? "bg-game-blue" : "bg-game-red")}>
                <Trophy className="h-8 w-8" />
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-foreground">{wasAssassin ? "Carta assassina!" : "Vitoria!"}</h2>
              <p className="mt-1 text-muted-foreground">
                {wasAssassin ? (
                  <>
                    O time adversario revelou o assassino. <span className={cn("font-semibold", winnerColor)}>{winnerName}</span> vence!
                  </>
                ) : (
                  <>
                    <span className={cn("font-semibold", winnerColor)}>{winnerName}</span> encontrou todas as palavras!
                  </>
                )}
              </p>
            </div>

            {isHost ? (
              <div className="flex w-full flex-col gap-2 pt-2">
                <Button onClick={() => void newRound()} className={cn("w-full gap-2 text-white", winner === "blue" ? "bg-game-blue hover:bg-game-blue/90" : "bg-game-red hover:bg-game-red/90")}>
                  <RotateCcw className="h-4 w-4" />
                  Nova rodada
                </Button>
                <Button variant="outline" onClick={() => void resetGame()} className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao lobby
                </Button>
              </div>
            ) : (
              <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">Aguardando o anfitriao iniciar a proxima rodada.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
