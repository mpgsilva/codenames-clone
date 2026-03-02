"use client"

import { useMemo, useState } from "react"
import { Crosshair, Users, Wifi } from "lucide-react"

import { useGame } from "@/lib/game-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function TeamSection({
  title,
  players,
  color,
}: {
  title: string
  players: Array<{ id: string; name: string; role: string }>
  color: "blue" | "red" | "neutral"
}) {
  const colorClass =
    color === "blue"
      ? "bg-game-blue/10 border-game-blue/25"
      : color === "red"
        ? "bg-game-red/10 border-game-red/25"
        : "bg-muted border-border"

  return (
    <div className={cn("rounded-xl border p-3", colorClass)}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-1.5">
        {players.length === 0 && <div className="text-xs text-muted-foreground">Nenhum jogador</div>}
        {players.map((player) => (
          <div key={player.id} className="flex items-center justify-between rounded-lg bg-background/80 px-2.5 py-1.5 text-sm">
            <span>{player.name}</span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {player.role === "spymaster" ? "Mestre" : "Operativo"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StartScreen() {
  const {
    roomId,
    players,
    me,
    isHost,
    loading,
    error,
    blueTeamName,
    redTeamName,
    gridSize,
    canStartGame,
    startBlockedReason,
    createRoom,
    joinRoom,
    updateMySetup,
    updateRoomSettings,
    startGame,
    clearError,
  } = useGame()

  const [playerName, setPlayerName] = useState("")
  const [createBlueTeam, setCreateBlueTeam] = useState("Time Azul")
  const [createRedTeam, setCreateRedTeam] = useState("Time Vermelho")
  const [createGridSize, setCreateGridSize] = useState(5)
  const [joinCode, setJoinCode] = useState("")
  const isJoinCodeValid = /^\d{6}$/.test(joinCode.trim())

  const grouped = useMemo(() => {
    return {
      blue: players.filter((player) => player.team === "blue"),
      red: players.filter((player) => player.team === "red"),
      spectator: players.filter((player) => player.team === "spectator"),
    }
  }, [players])

  const currentTeam = me?.team ?? "spectator"
  const currentRole = me?.role ?? "operative"

  const handleCreateRoom = async () => {
    await createRoom({
      playerName: playerName.trim() || "Jogador",
      blueTeamName: createBlueTeam.trim() || "Time Azul",
      redTeamName: createRedTeam.trim() || "Time Vermelho",
      gridSize: createGridSize,
    })
  }

  const handleJoinRoom = async () => {
    await joinRoom({
      roomId: joinCode,
      playerName: playerName.trim() || "Jogador",
    })
  }

  const handleTeamChange = async (team: "blue" | "red" | "spectator") => {
    const nextRole = team === "spectator" ? "operative" : currentRole
    await updateMySetup(team, nextRole)
  }

  const handleRoleChange = async (role: "spymaster" | "operative") => {
    if (currentTeam === "spectator") {
      return
    }
    await updateMySetup(currentTeam, role)
  }

  if (!roomId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Crosshair className="h-8 w-8" />
            </div>
            <h1 className="text-center font-sans text-4xl font-bold tracking-tight text-foreground">Codinomes</h1>
            <p className="text-center text-muted-foreground">Crie uma sala online e jogue com seu time em tempo real.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Seu nome</Label>
                <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Digite seu nome" />
              </div>

              <div className="space-y-3 rounded-xl border border-border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wifi className="h-4 w-4" />
                  Criar sala
                </div>
                <div className="space-y-2">
                  <Input value={createBlueTeam} onChange={(e) => setCreateBlueTeam(e.target.value)} placeholder="Time Azul" />
                  <Input value={createRedTeam} onChange={(e) => setCreateRedTeam(e.target.value)} placeholder="Time Vermelho" />
                </div>
                <div className="flex gap-2">
                  {[4, 5].map((size) => (
                    <button
                      key={size}
                      onClick={() => setCreateGridSize(size)}
                      className={cn(
                        "flex-1 rounded-lg border-2 px-3 py-2 text-sm",
                        createGridSize === size ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
                      )}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
                <Button onClick={handleCreateRoom} disabled={loading} className="w-full">
                  Criar e entrar
                </Button>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Entrar em sala
                </div>
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Codigo de 6 digitos"
                  maxLength={6}
                />
                <Button onClick={handleJoinRoom} disabled={loading || !isJoinCodeValid} variant="outline" className="w-full">
                  Entrar
                </Button>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-4xl space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Sala online</div>
              <h1 className="font-sans text-3xl font-bold tracking-tight">Codigo: {roomId}</h1>
            </div>
            <div className="text-sm text-muted-foreground">Compartilhe este codigo para os outros entrarem.</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 text-sm font-semibold">Sua configuracao</div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Time</Label>
                <div className="flex gap-2">
                  <Button onClick={() => handleTeamChange("blue")} variant={currentTeam === "blue" ? "default" : "outline"} className="flex-1">
                    Azul
                  </Button>
                  <Button onClick={() => handleTeamChange("red")} variant={currentTeam === "red" ? "default" : "outline"} className="flex-1">
                    Vermelho
                  </Button>
                  <Button onClick={() => handleTeamChange("spectator")} variant={currentTeam === "spectator" ? "default" : "outline"} className="flex-1">
                    Plateia
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Papel</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRoleChange("spymaster")}
                    disabled={currentTeam === "spectator"}
                    variant={currentRole === "spymaster" ? "default" : "outline"}
                    className="flex-1"
                  >
                    Espiao Mestre
                  </Button>
                  <Button
                    onClick={() => handleRoleChange("operative")}
                    disabled={currentTeam === "spectator"}
                    variant={currentRole === "operative" ? "default" : "outline"}
                    className="flex-1"
                  >
                    Operativo
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 text-sm font-semibold">Config da partida</div>
            <div className="space-y-3">
              <Input
                value={blueTeamName}
                onChange={(e) => {
                  if (isHost) {
                    void updateRoomSettings({ blueTeamName: e.target.value })
                  }
                }}
                disabled={!isHost}
                placeholder="Nome do time azul"
              />
              <Input
                value={redTeamName}
                onChange={(e) => {
                  if (isHost) {
                    void updateRoomSettings({ redTeamName: e.target.value })
                  }
                }}
                disabled={!isHost}
                placeholder="Nome do time vermelho"
              />
              <div className="flex gap-2">
                {[4, 5].map((size) => (
                  <Button
                    key={size}
                    variant={gridSize === size ? "default" : "outline"}
                    className="flex-1"
                    disabled={!isHost}
                    onClick={() => {
                      if (isHost) {
                        void updateRoomSettings({ gridSize: size })
                      }
                    }}
                  >
                    Grade {size}x{size}
                  </Button>
                ))}
              </div>
              {!isHost && <div className="text-xs text-muted-foreground">Somente o anfitriao altera configuracoes.</div>}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TeamSection title={`${blueTeamName}`} players={grouped.blue} color="blue" />
          <TeamSection title={`${redTeamName}`} players={grouped.red} color="red" />
          <TeamSection title="Plateia" players={grouped.spectator} color="neutral" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Pronto para comecar?</div>
              <div className="text-sm text-muted-foreground">{startBlockedReason ?? "Tudo certo. Pode iniciar."}</div>
            </div>
            <Button onClick={() => void startGame()} disabled={!isHost || !canStartGame || loading}>
              Iniciar Partida
            </Button>
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">
              <div className="flex items-center justify-between gap-3">
                <span>{error}</span>
                <Button size="sm" variant="ghost" onClick={clearError}>
                  fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
