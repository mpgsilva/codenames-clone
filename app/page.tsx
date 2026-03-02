"use client"

import { ThemeProvider } from "next-themes"

import { ClueHistoryPanel } from "@/components/clue-history-panel"
import { GameBoard } from "@/components/game-board"
import { GameHeader } from "@/components/game-header"
import { StartScreen } from "@/components/start-screen"
import { VictoryModal } from "@/components/victory-modal"
import { GameProvider, useGame } from "@/lib/game-context"

function GameContent() {
  const { gameStarted, isConnected } = useGame()

  if (!isConnected || !gameStarted) {
    return <StartScreen />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader />
      <main className="flex flex-1 justify-center pb-6 pt-2">
        <div className="flex w-full max-w-7xl flex-col gap-4 px-2 sm:px-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <GameBoard />
          </div>
          <ClueHistoryPanel />
        </div>
      </main>
      <VictoryModal />
    </div>
  )
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </ThemeProvider>
  )
}
