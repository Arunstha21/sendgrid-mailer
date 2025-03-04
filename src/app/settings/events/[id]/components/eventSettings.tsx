"use client"

import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Event, getGroupAndSchedule, getPointSystemList, GroupAndSchedule, PointSystem, Schedule, updateEventData, updateGroupAndScheduleData } from "@/server/database"
import ScheduleData from "@/components/scheduleData"
import TeamList from "./teamList"

async function fetchPointSystems(): Promise<PointSystem[]> {
    return await getPointSystemList();
}

async function fetchGroupAndSchedule(stageId: string): Promise<GroupAndSchedule[]> {
    return (await getGroupAndSchedule(stageId)).groups;
}

type Props = {
    eventData: Event
}

export default function EventSettingsPage({ eventData }: Props) {
    const [eventName, setEventName] = useState(eventData.name)
    const [pointSystem, setPointSystem] = useState(eventData.pointSystem)
    const [pointSystemList, setPointSystemList] = useState<PointSystem[]>([])

    const [isEditing, setIsEditing] = useState(false)
    const [isGroupScheduleEditing, setIsGroupScheduleEditing] = useState(false)

    const [stageId, setStageId] = useState<string>("")
    const [groupId, setGroupId] = useState<string>("")

    const [groupAndSchedule, setGroupAndSchedule] = useState<GroupAndSchedule[]>([])
    const [matches, setMatches] = useState<Schedule[]>([])
    const [stageName, setStageName] = useState<string>("")
    const [groupName, setGroupName] = useState<string>("")
    const [teamData, setTeamData] = useState<GroupAndSchedule["data"]>([])

    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        fetchPointSystems().then(setPointSystemList)
    }, [])

    useEffect(() => {
        if (!stageId) return
        fetchGroupAndSchedule(stageId).then(setGroupAndSchedule);
        const stage = eventData.stages.find(stage => stage.id === stageId)
        if (stage) setStageName(stage.name)
    }, [stageId])

    useEffect(() => {
        const group = groupAndSchedule.find(group => group.id === groupId)
        if (group) {
            setGroupName(group.name)
            setMatches(group.schedule)
            setTeamData(group.data)
        }
    }, [groupId, groupAndSchedule])

    const handleSaveEventSettings = async () => {
        setLoading(true)
        try {
            const res = await updateEventData(eventData.id, { name: eventName, pointSystem })
            if (res.status === "success") {
                setSuccess(res.message)
                setIsEditing(false)
            } else {
                setError(res.message)
            }
        } catch (err: any) {
            setError(err.message)
        }
        setLoading(false)
    }

    const handleSaveGroupSettings = async () => {
        if (!stageId || !groupId) return
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {

            const response = await updateGroupAndScheduleData(stageId, {
                stageName,
                group: {
                    id: groupId,
                    name: groupName,
                    schedule: matches
                },
                teamData: teamData
            })

            if (response.status === "success") {
                setSuccess("Group and schedule data updated successfully.")
                setIsGroupScheduleEditing(false)
            } else {
                setError(response.message)
            }
        } catch (err: any) {
            setError(err.message)
        }
        setLoading(false)
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Event Configuration</h1>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Event Settings</CardTitle>
                    <Button disabled={loading} onClick={() => (isEditing ? handleSaveEventSettings() : setIsEditing(true))}>
                        {isEditing ? <><Save className="mr-2 h-4 w-4" />Save</> : "Edit"}
                    </Button>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Input value={eventName} onChange={(e) => setEventName(e.target.value)} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                    <Label>Point System</Label>
                    <Select value={pointSystem} onValueChange={setPointSystem} disabled={!isEditing}>
                        <SelectTrigger><SelectValue placeholder="Select point system" /></SelectTrigger>
                        <SelectContent>{pointSystemList.map(ps => <SelectItem key={ps.id} value={ps.id}>{ps.name}</SelectItem>)}</SelectContent>
                        
                    </Select>
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Stage & Group Settings</CardTitle>
                    <Button
                        disabled={loading || !stageId}
                        onClick={() => (isGroupScheduleEditing ? handleSaveGroupSettings() : setIsGroupScheduleEditing(true))}
                    >
                        {isGroupScheduleEditing ? <><Save className="mr-2 h-4 w-4" />Save</> : "Edit"}
                    </Button>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label>Stage</Label>
                    <Select value={stageId} onValueChange={setStageId} disabled={isGroupScheduleEditing}>
                        <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                        <SelectContent>
                            {eventData.stages.map(stage => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-2">

                    <Label>Group</Label>
                    <Select value={groupId} onValueChange={setGroupId} disabled={isGroupScheduleEditing}>
                        <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                        <SelectContent>
                            {groupAndSchedule.map(group => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    </div>
                </div>

                    <ScheduleData matches={matches} setMatches={setMatches} disabled={!isGroupScheduleEditing} isEditing={isGroupScheduleEditing} />
                    <TeamList teamData={teamData} setTeamData={setTeamData} isEditing={isGroupScheduleEditing} />

                    {error && <p className="text-red-500">{error}</p>}
                    {success && <p className="text-green-500">{success}</p>}
                </CardContent>
            </Card>
        </div>
    )
}
