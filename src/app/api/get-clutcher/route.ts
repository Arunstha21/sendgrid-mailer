import { getPlayerInfoList } from '@/server/database'
import { NextRequest, NextResponse } from 'next/server'

type Kill = {
  CauserName: string
  CauserUID: string
  VictimName: string
  VictimUID: string
  ItemID: string
  ResultHealthStatus: string
  CurGameTime: string
  VictimTeam?: string
}

type Clutch = {
  clutcherName: string
  clutcherUID: string
  clutcherTeam: string
  victimTeam: string
  victimUIDs: string[]
  victimNames: string[]
  timestamps: number[]
}

function getTeamMap(players: { uid: string; team: string | null }[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const p of players) {
    if (p.team) map[p.uid] = p.team
  }
  return map
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const killInfo: Kill[] = body.killInfo
    const stageId: string = body.stage

    if (!Array.isArray(killInfo) || typeof stageId !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const playerInfo = await getPlayerInfoList(stageId)
    const teamMap = getTeamMap(playerInfo)

    const knockMap: Record<string, Kill> = {} // victimUID => knock

    for (const k of killInfo) {
      if (k.ResultHealthStatus === '1') {
        knockMap[k.VictimUID] = k
      }
    }

    const killsByPlayer: Record<string, Kill[]> = {}

    for (const kill of killInfo) {
      if (kill.ResultHealthStatus !== '2') continue

      const victimUID = kill.VictimUID
      const killerUID = kill.CauserUID
      const knock = knockMap[victimUID]

      if (!knock) continue

      const killerTeam = teamMap[killerUID]
      const knockTeam = teamMap[knock.CauserUID]
      const victimTeam = teamMap[victimUID]

      const validKill =
        (knock.CauserUID === killerUID) ||
        (knock.CauserUID === '0' || !knockTeam || knockTeam !== killerTeam)

      if (!validKill || !victimTeam || killerTeam === victimTeam) continue

      if (!killsByPlayer[killerUID]) {
        killsByPlayer[killerUID] = []
      }

      killsByPlayer[killerUID].push({
        ...kill,
        VictimTeam: playerInfo.find(p => p.uid === victimUID)?.team || 'Unknown',
      })
    }

    const clutches1v4: Clutch[] = []
    const clutches1v3: Clutch[] = []

    for (const [killerUID, kills] of Object.entries(killsByPlayer)) {
      const killsByTeam: Record<string, Kill[]> = {}

      for (const k of kills) {
        const team = k.VictimTeam
        if (!team) continue
        if (!killsByTeam[team]) killsByTeam[team] = []
        killsByTeam[team].push(k)
      }

      for (const [, teamKills] of Object.entries(killsByTeam)) {
        const uniqueVictims = [...new Set(teamKills.map(k => k.VictimUID))]

        if (uniqueVictims.length >= 3) {
          const clutch: Clutch = {
            clutcherUID: killerUID,
            clutcherName: teamKills[0].CauserName,
            clutcherTeam: playerInfo.find(p=> p.uid === killerUID)?.teamName || 'Unknown',
            victimTeam: playerInfo.find(p=> p.uid === uniqueVictims[0])?.teamName || 'Unknown',
            victimUIDs: uniqueVictims,
            victimNames: [...new Set(teamKills.map(k => k.VictimName))],
            timestamps: teamKills.map(k => Number(k.CurGameTime))
          }

          if (uniqueVictims.length >= 4) clutches1v4.push(clutch)
          else clutches1v3.push(clutch)
        }
      }
    }

    return NextResponse.json({ clutches1v4, clutches1v3 }, { status: 200 })

  } catch (err) {
    console.error("Error in clutch detection:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
