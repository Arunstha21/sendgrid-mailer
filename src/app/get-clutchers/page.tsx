"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Target, Trophy } from "lucide-react"
import { getEventData } from "@/server/database"
import type { Event, EventDataE, Stage } from "../dashboard/components/event"

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

export default function ClutchDetector() {
  const [killInfo, setKillInfo] = useState<any[]>([])
  const [stage, setStage] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [clutches, setClutches] = useState<Clutch[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [clutchersFetched, setClutchersFetched] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        if (!json.killInfo || !Array.isArray(json.killInfo)) {
          toast.error("Invalid JSON structure. Must contain `killInfo` array.")
          return
        }
        setKillInfo(json.killInfo)
        toast.success("File uploaded successfully.")
      } catch {
        toast.error("Failed to parse JSON.")
      }
    }
    reader.readAsText(file)
  }

  const handleStageChange = (s: string) => {
    setStage(s)
  }

  const handleSubmit = async () => {
    if (!killInfo.length || !stage) {
      toast.error("Please select a stage and upload a valid file.")
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch("/api/get-clutcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ killInfo, stage }),
      })

      const data = await res.json()
      if (res.ok) {
        setClutches(data.clutches || [])
        toast.success(`Found ${data.clutches?.length || 0} clutch${data.clutches?.length === 1 ? "" : "es"}.`)
      } else {
        toast.error(data.error || "Something went wrong.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to send data to API.")
    } finally {
      setIsLoading(false)
      setClutchersFetched(true)
    }
  }

  const resetData = () => {
    setKillInfo([])
    setClutches([])
    setFileName("")
    setStage("")
    setClutchersFetched(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Clutch Detector</h1>
        <p className="text-muted-foreground">Upload match data to detect 1v4 clutch situations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MatchDataSelector stage={stage} setStage={handleStageChange} />

          <div className="space-y-2">
            <Label>Upload KillInfo JSON</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <Input type="file" accept=".json" onChange={handleFileUpload} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                {fileName ? <span className="text-green-600">{fileName}</span> : <span>Click to upload JSON file</span>}
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isLoading || !killInfo.length || !stage} className="flex-1">
              {isLoading ? "Detecting..." : "Detect Clutches"}
            </Button>
            <Button variant="outline" onClick={resetData}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {clutches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Clutches Found ({clutches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clutches.map((clutch, index) => (
                <ClutchCard key={index} clutch={clutch} index={index + 1} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && clutchersFetched && killInfo.length > 0 && clutches.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>No clutches found in the uploaded data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ClutchCard({ clutch }: { clutch: Clutch; index: number }) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">{clutch.clutcherName}</h3>
            <p className="text-sm text-muted-foreground">{clutch.clutcherIGN}</p>
          </div>
          <Badge variant="secondary">1v{clutch.victimNames.length}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <span className="text-muted-foreground">Team: </span>
            <span className="font-medium">{clutch.clutcherTeam}</span>
          </div>
          <div>
            <span className="text-muted-foreground">vs </span>
            <span className="font-medium">{clutch.enemyTeam}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Victims:</p>
          <div className="space-y-1">
            {clutch.victimNames.map((victim, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                <span>{victim} - {clutch.victimUIDs[idx]}</span>
                {clutch.timestamps[idx] && (
                  <span className="font-mono text-muted-foreground">{formatTime(clutch.timestamps[idx])}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MatchDataSelector({
  stage,
  setStage,
}: {
  stage: string
  setStage: (stage: string) => void
}) {
  const [event, setEvent] = useState<string>("")
  const [eventData, setEventData] = useState<EventDataE[]>([])
  const [eventList, setEventList] = useState<Event[]>([])
  const [stageList, setStageList] = useState<Stage[]>([])

  useEffect(() => {
    async function fetchEventList() {
      const eventData = await getEventData()
      if (!eventData.length) {
        return
      }
      setEventData(eventData)
      const events = eventData.map((event: any) => ({
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
    setStage("")
  }, [event, eventData])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Select value={stage} onValueChange={setStage} disabled={!event}>
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
    </div>
  )
}
