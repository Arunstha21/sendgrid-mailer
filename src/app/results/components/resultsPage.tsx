
import { Checkbox } from "@/components/ui/checkbox"
import ResultTypeSelector from "./result-type-selector"
import StageGroupHeader from "./stage-group-header"
import { GroupAndSchedule } from "@/server/publicResult";
import MatchSelector from "./match-selector";
import { useEffect, useState } from "react";
import { TournamentResults } from "@/app/dashboard/components/resultView/columns";
import { PlayerResult, TeamResult } from "@/server/match";

export default function ResultsPage({eventName, stageName, groupName, data}: { eventName: string; stageName: string; groupName: string; data: GroupAndSchedule }) {
  return (
    <div className="flex h-screen flex-col">
        <main className="flex-1 p-4">
          <div className="space-y-4">
            <StageGroupHeader eventName={eventName} groupName={groupName} stageName={stageName} />

            <ResultsContent matchDetails={data.schedule}/>
          </div>
        </main>
      </div>
  )
}

// Client component to handle conditional rendering
function ResultsContent({matchDetails}: { matchDetails: GroupAndSchedule['schedule']}) {
'use client'
    const [teams, setTeams] = useState<string[]>([])
    const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
    const [selectedTeam, setSelectedTeam] = useState<string>("All Teams")
    const [afterMatch, setAfterMatch] = useState(false)
    const [selectedResultType, setSelectedResultType] = useState("Team Stats")
    const [resultData, setResultData] = useState<{ teamResults: TeamResult[]; playerResults: PlayerResult[] } |null>(null)

    useEffect(()=>{
        const results = matchDetails.find((match)=>match.id === selectedMatch)
        if (results) {
            if (afterMatch) {
                if(selectedResultType === "Player Stats") {
                    setResultData({teamResults:[], playerResults: results.afterMatchData.playerResults})
                    setSelectedTeam("All Teams")
                }else{
                    setResultData({teamResults: results.afterMatchData.teamResults, playerResults: []})
                }
                setTeams(results.afterMatchData.teamResults.map((team: TeamResult) => team.team))
            } else {
                if(selectedResultType === "Player Stats") {
                    setResultData({teamResults:[], playerResults: results.matchData.playerResults})
                    setSelectedTeam("All Teams")
                }else{
                    setResultData({teamResults: results.matchData.teamResults, playerResults: []})
                }
                setTeams(results.matchData.teamResults.map((team: TeamResult) => team.team))
            }
        }
    },[selectedMatch, afterMatch, selectedResultType, matchDetails])

    useEffect(()=>{
        if(selectedTeam === "All Teams") {
            setResultData((prevData) => {
                if (prevData) {
                    return {
                        teamResults: prevData.teamResults,
                        playerResults: prevData.playerResults,
                    }
                }
                return null
            })
        }else{
            setResultData((prevData) => {
                if (prevData) {
                    return {
                        teamResults: prevData.teamResults.filter((team: TeamResult) => team.team === selectedTeam),
                        playerResults: prevData.playerResults.filter((player: PlayerResult) => player.teamName === selectedTeam),
                    }
                }
                return null
            })
        }
    },[selectedTeam])

  return (
    <>
      <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
          <MatchSelector listOfMatches={matchDetails.map((match)=>({id: match.id, matchNo: match.matchNo}))} setSelectedMatch={setSelectedMatch} match={selectedMatch} isAfterMatch={afterMatch}/>
          <div className="flex items-center gap-2">
            <Checkbox id="after-match" checked={afterMatch} onCheckedChange={(checked)=>setAfterMatch(checked === true)} />
            <label htmlFor="after-match" className="text-sm">
              After Match
            </label>
          </div>
        </div>
        {selectedMatch? <ResultTypeSelector teams={teams} setResultType={setSelectedResultType} resultType={selectedResultType} setTeam={setSelectedTeam} selectedTeam={selectedTeam} /> : null}
      </div>

      {resultData ? <TournamentResults data={resultData} isLoading={false}/> : <p className="text-muted-foreground">Select a match to view results</p>}
    </>
  )
}
