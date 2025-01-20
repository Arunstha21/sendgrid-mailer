'use client'

import { useEffect, useState } from "react"
import { Event, EventDataE, Stage } from "./event"
import { Group, Schedule, getEventData, getGroupData, getScheduleData } from "@/server/database"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, Check } from 'lucide-react'
import { MatchData, PlayerResult, TeamResult, getMatchData, updateGameData } from "@/server/match"
import { MatchDataDialog } from "./resultView/match-data-dialogue"

export default function MatchDataUploader({setErrorMessage}: {setErrorMessage: (message: string | null) => void}) {
  const [event, setEvent] = useState<string>("")
  const [stage, setStage] = useState<string>("")
  const [group, setGroup] = useState<string>("")
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState<boolean>(false)

  const [eventData, setEventData] = useState<EventDataE[]>([])
  const [eventList, setEventList] = useState<Event[]>([])
  const [stageList, setStageList] = useState<Stage[]>([])
  const [groupList, setGroupList] = useState<Group[]>([])
  const [scheduleList, setScheduleList] = useState<Schedule[]>([])
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [resultData, setResultData] = useState<{teamResults: TeamResult[]; playerResults: PlayerResult[]} | null>(null)
  const [isMatchDataUploaded, setIsMatchDataUploaded] = useState<boolean>(false)

  const handleMatchDataUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const result = e.target?.result
          if (typeof result === "string") {
            const jsonData: MatchData = JSON.parse(result)
            setMatchData(jsonData)
          } else {
            setErrorMessage("Error parsing JSON file")
            return;
          }
        } catch (err) {
          console.log("Error parsing JSON file:", (err as Error).message)
          setErrorMessage(`Error parsing JSON file ${(err as Error).message}`)
          setIsMatchDataUploaded(false)
        }
      }
      reader.readAsText(file)
    }
  }

  const uploadMatchData = (): void => {
    if (matchData) {
      sendMatchData(matchData)
    } else {
      setErrorMessage("No match data found")
    }
  }

  const sendMatchData = async (data: MatchData): Promise<void> => {
    if(matchNo){
        setUploading(true);
        await updateGameData(data, matchNo).then((res) => {
          if(res.status === "error"){
            setErrorMessage(res.message)
            setIsMatchDataUploaded(false)
          }else if(res.status === "success"){
            setIsMatchDataUploaded(true)
          }
        }).catch((err) => {
          setErrorMessage(err.message)
          setIsMatchDataUploaded(false)
        }).finally(() => {
        handleMatchChange(matchNo)
        setUploading(false);
        })
    }
  }


  useEffect(() => {
    async function fetchEventList() {
      const eventData = await getEventData()
      if (!eventData.length) {
        return
      }
      setEventData(eventData)

      const events = eventData.map((event) => ({
        id: event.id,
        name: event.name,
      }))
      setEventList(events)
    }
    fetchEventList()
  }, [])

  useEffect(() => {
    const stages = eventData.find((e) => e.id === event)?.stages || []
    setStageList(stages)
  }, [event, eventData])

  useEffect(() => {
    async function fetchGroupData() {
      if (stage === "") {
        return
      }
      const groupData = await getGroupData(stage)
      setGroupList(groupData)
    }
    fetchGroupData()
  }, [stage])

  const handleGroupChange = async (groupId: string) => {
    setGroup(groupId)
    const scheduleData = await getScheduleData(groupId)
    setScheduleList(scheduleData)
  }

  const handleMatchChange = async (matchId: string) => {
    setResultData(null)
    setErrorMessage(null)
    setMatchNo(matchId)
    
    const resultsData = await getMatchData([matchId]);
    if(!resultsData){
        return
    }
    
    if(resultsData.matchExists){
        setResultData(resultsData.data)
    }
  }

  useEffect(() => {
    if (matchNo && resultData) {
      setIsMatchDataUploaded(true)
    } else {
      setIsMatchDataUploaded(false)
    }
  }, [matchNo, resultData])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Match Data Uploader</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="event">Event</Label>
            <Select value={event} onValueChange={setEvent}>
              <SelectTrigger id="event">
                <SelectValue placeholder="Select Event" />
              </SelectTrigger>
              <SelectContent>
                {eventList.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger id="stage">
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent>
                {stageList.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            <Select value={group} onValueChange={handleGroupChange}>
              <SelectTrigger id="group">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groupList.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="matchNo">Match Number</Label>
            <Select value={matchNo} onValueChange={handleMatchChange}>
              <SelectTrigger id="matchNo">
                <SelectValue placeholder="Select Match Number" />
              </SelectTrigger>
              <SelectContent>
                {scheduleList.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {`Match ${schedule.matchNo}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {matchNo ? ( <div className="space-y-4">
          <Label>Match Data</Label>
          {!isMatchDataUploaded ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleMatchDataUpload}
                  id="file-upload"
                  className="hidden"
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose file
                </Label>
                <span className="text-sm text-muted-foreground">
                  {matchData ? matchData.allinfo.TotalPlayerList.length + " players loaded" : "No file chosen"}
                </span>
              </div>
              <Button onClick={uploadMatchData} disabled={!matchData}>
                <Upload className="mr-2 h-4 w-4" /> {uploading? "Uploading....." :"Upload Match Data"}
              </Button>
            </div>
          ) : (
            <>
            {resultData ?  <MatchDataDialog data={resultData} loading={uploading}/>: null}
            </>
            )}
        </div>) : null}
        {isMatchDataUploaded && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md flex items-center">
            <Check className="mr-2 h-5 w-5" />
            <span>Match data successfully uploaded!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

