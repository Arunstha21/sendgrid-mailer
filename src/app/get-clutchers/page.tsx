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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Target, Trophy, Eye, EyeOff } from "lucide-react"
import { getEventData } from "@/server/database"
import type { Event, EventDataE, Stage } from "../dashboard/components/event"

type Clutch = {
  clutcherName: string
  clutcherUID: string
  clutcherIGN: string
  clutcherTeam: string
  victimTeam: string
  victimUIDs: string[]
  victimNames: string[]
  timestamps: number[]
}

export default function ClutchDetector() {
  const [killInfo, setKillInfo] = useState<any[]>([])
  const [stage, setStage] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [clutches1v4, setClutches1v4] = useState<Clutch[]>([])
  const [clutches1v3, setClutches1v3] = useState<Clutch[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [showRawData, setShowRawData] = useState(false)

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
        setClutches1v4(data.clutches1v4 || [])
        setClutches1v3(data.clutches1v3 || [])

        const total1v4 = data.clutches1v4?.length || 0
        const total1v3 = data.clutches1v3?.length || 0
        const totalClutches = total1v4 + total1v3

        if (totalClutches > 0) {
          toast.success(
            `Found ${total1v4} 1v4 clutch${total1v4 === 1 ? "" : "es"} and ${total1v3} 1v3 clutch${total1v3 === 1 ? "" : "es"}.`,
          )
        } else {
          toast.success("No clutches found.")
        }
      } else {
        toast.error(data.error || "Something went wrong.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to send data to API.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetData = () => {
    setKillInfo([])
    setClutches1v4([])
    setClutches1v3([])
    setFileName("")
    setStage("")
    setShowRawData(false)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getStatusBadge = (status: string) => {
    if (status === "1") {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          Knock
        </Badge>
      )
    } else if (status === "2") {
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          Finish
        </Badge>
      )
    }
    return <Badge variant="outline">Unknown</Badge>
  }

  const totalClutches = clutches1v4.length + clutches1v3.length

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Clutch Detector</h1>
        <p className="text-muted-foreground">Upload match data to detect 1v3 and 1v4 clutch situations</p>
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
            {killInfo.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowRawData(!showRawData)}
                className="flex items-center gap-2"
              >
                {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showRawData ? "Hide Data" : "View Data"}
              </Button>
            )}
            <Button variant="outline" onClick={resetData}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {showRawData && killInfo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Raw Kill Data ({killInfo.length} entries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Causer</TableHead>
                    <TableHead>Victim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {killInfo.map((kill, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{kill.CauserName}</div>
                          <div className="text-xs text-muted-foreground">{kill.CauserUID}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{kill.VictimName}</div>
                          <div className="text-xs text-muted-foreground">{kill.VictimUID}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(kill.ResultHealthStatus)}</TableCell>
                      <TableCell className="font-mono">{formatTime(Number(kill.CurGameTime))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {clutches1v4.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              1v4 Clutches ({clutches1v4.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clutches1v4.map((clutch, index) => (
                <ClutchCard key={`1v4-${index}`} clutch={clutch} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {clutches1v3.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-500" />
              1v3 Clutches ({clutches1v3.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clutches1v3.map((clutch, index) => (
                <ClutchCard key={`1v3-${index}`} clutch={clutch} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && killInfo.length > 0 && totalClutches === 0 && (
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

function ClutchCard({ clutch }: { clutch: Clutch;}) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const clutchType = `1v${clutch.victimNames.length}`
  const badgeColor = clutch.victimNames.length >= 4 ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">{clutch.clutcherName}</h3>
            <p className="text-sm text-muted-foreground">{clutch.clutcherUID}</p>
          </div>
          <Badge className={badgeColor}>{clutchType}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <span className="text-muted-foreground">Team: </span>
            <span className="font-medium">{clutch.clutcherTeam}</span>
          </div>
          <div>
            <span className="text-muted-foreground">vs </span>
            <span className="font-medium">{clutch.victimTeam}</span>
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
