"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { PlayerResult, TeamResult } from "@/server/match"

const teamColumns: ColumnDef<TeamResult>[] = [
  {
    accessorKey: "cRank",
    header: "Rank",
  },
  {
    accessorKey: "team",
    header: "Team",
  },
  {
    accessorKey: "kill",
    header: "Kills",
    sortingFn: "basic",
  },
  {
    accessorKey: "damage",
    header: "Damage",
    sortingFn: "basic",
  },
  {
    accessorKey: "placePoint",
    header: "Place Points",
    sortingFn: "basic",
  },
  {
    accessorKey: "totalPoint",
    header: "Total Points",
    sortingFn: "basic",
  },
  {
    accessorKey: "wwcd",
    header: "WWCD",
  },
  {
    accessorKey: "matchesPlayed",
    header: "Matches",
  },
]

const playerColumns: ColumnDef<PlayerResult>[] = [
  {
    accessorKey: "cRank",
    header: "Rank",
  },
  {
    accessorKey: "inGameName",
    header: "Player",
  },
  {
    accessorKey: "teamName",
    header: "Team",
  },
  {
    accessorKey: "kill",
    header: "Kills",
    sortingFn: "basic",
  },
  {
    accessorKey: "damage",
    header: "Damage",
    sortingFn: "basic",
  },
  {
    accessorKey: "survivalTime",
    header: "Survival Time",
    sortingFn: "basic",
    cell: ({ row }) => {
      const seconds = row.original.survivalTime
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    },
  },
  {
    accessorKey: "assists",
    header: "Assists",
  },
  {
    accessorKey: "heal",
    header: "Healing",
    sortingFn: "basic",
  },
]

interface TournamentResultsProps {
  data: { teamResults: TeamResult[]; playerResults: PlayerResult[] }
}

export function TournamentResults({ data }: TournamentResultsProps) {
  return (
    <div className="space-y-8 ">
      {data.teamResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Team Results</h2>
          <DataTable columns={teamColumns} data={data.teamResults} />
        </div>
      )}
      {data.playerResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Player Results</h2>
          <DataTable columns={playerColumns} data={data.playerResults} />
        </div>
      )}
    </div>
  )
}

