import { getPlayerInfoList } from '@/server/database'
import { NextRequest, NextResponse } from 'next/server'

type Kill = {
  CauserName: string
  CauserUID: string
  VictimName: string
  VictimUID: string
  ResultHealthStatus: string
  CurGameTime: string
}

type Clutch = {
  clutcherName: string
  clutcherUID: string
  clutcherIGN: string
  clutcherTeam: string
  enemyTeam: string
  victimUIDs: string[]
  victimNames: string[]
  timestamps: number[]
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const killInfo = body.killInfo
  const stageId = body.stage
  

  if (!Array.isArray(killInfo)) {
    return NextResponse.json({error: "Invalid killInfo format. Expected an array."}, { status: 400 })
  }

  const playerInfo = await getPlayerInfoList(stageId)
  
  if (!Array.isArray(killInfo)) {
    return NextResponse.json({error: "Invalid killInfo format. Expected an array."}, { status: 400 })
  }

  const killsByPlayer: Record<string, Kill[]> = {}

  // Filter only confirmed kills
  for (const kill of killInfo) {
    if (kill.ResultHealthStatus !== "2") continue

    const victimTeam = playerInfo.find(player => player.uid === kill.VictimUID)?.team
    if (!victimTeam) continue

    if (!killsByPlayer[kill.CauserUID]) {
      killsByPlayer[kill.CauserUID] = []
    }

    killsByPlayer[kill.CauserUID].push({
      ...kill,
      VictimUID: kill.VictimUID,
      VictimName: kill.VictimName,
    })
  }

  const clutches: Clutch[] = []

  for (const [causerUID, kills] of Object.entries(killsByPlayer)) {
    const killsByTeam: Record<string, Kill[]> = {}

    for (const kill of kills) {
      const victimTeam = playerInfo.find(player => player.uid === kill.VictimUID)?.team
        if (!victimTeam) continue
      if (!killsByTeam[victimTeam]) killsByTeam[victimTeam] = []
      killsByTeam[victimTeam].push(kill)
    }

    for (const [, teamKills] of Object.entries(killsByTeam)) {
      const uniqueVictims = Array.from(new Set(teamKills.map(k => k.VictimUID)))
      if (uniqueVictims.length >= 4) {
        clutches.push({
          clutcherName: teamKills[0].CauserName,
          clutcherIGN: playerInfo.find(player => player.uid === causerUID)?.name || '',
          clutcherTeam: playerInfo.find(player => player.uid === causerUID)?.teamName || '',
          clutcherUID: causerUID,
          enemyTeam: playerInfo.find(player => player.uid === teamKills[0].VictimUID)?.teamName || '',
          victimUIDs: uniqueVictims,
          victimNames: Array.from(new Set(teamKills.map(k => k.VictimName))),
          timestamps: teamKills.map(k => Number(k.CurGameTime)),
        })
      }
    }
  }

  return NextResponse.json({ clutches }, { status: 200 })
}
