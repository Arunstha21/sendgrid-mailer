'use client'
import { useEffect, useState } from "react";
import { Event, EventDataE, Stage } from "./event";
import { getEventData, getGroupAndSchedule, GroupAndSchedule, Schedule } from "@/server/database";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CheckPlayerData from "./checkPlayerData";
import { MatchData } from "@/server/match";

export default function CheckMatchData(){
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [event, setEvent] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined);

  const [eventData, setEventData] = useState<EventDataE[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [stageList, setStageList] = useState<Stage[]>([]);
  const [groupList, setGroupList] = useState<GroupAndSchedule[]>([]);
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);


  useEffect(() => {
    async function fetchEventList() {
      const eventData = await getEventData();
      if (!eventData || !eventData.length) {
        return;
      }
      setEventData(eventData);

      const events = eventData.map((event: any) => ({
        id: event.id,
        name: event.name,
      }));
      setEventList(events);
    }
    fetchEventList();
  }, []);

  useEffect(() => {
    const stages = eventData.find((e) => e.id === event)?.stages || [];
    setStageList(stages);
  }, [event, eventData]);


  useEffect(() => {
    async function fetchGroupData() {
      if (stage === "") {
        return;
      }
      const groupAndScheduleData = await getGroupAndSchedule(stage);
      const { groups, isMultiGroup } = groupAndScheduleData;
      if (isMultiGroup) {
       groups.push({
          id: "all",
          name: "All",
          data: groups.flatMap((g) => g.data),
          schedule: groups.flatMap((g) => g.schedule).sort((a,b)=> a.matchNo - b.matchNo),
       })
        setGroupList(groups);
      }else{
        setGroupList(groups);
      }
    }
    fetchGroupData();
  }, [stage]);

  const handleGroupChange = async (groupId: string) => {
    setGroup(groupId);
    const group = groupList.find((g) => g.id === groupId);
    if (!group) {
      return;
    }
    setScheduleList(group.schedule);
  };


  const getMatchData = async () => {
    setFetching(true);
    fetch("/api/matchInfo",{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    }).then(async (response) => {
        if (!response.ok) {
            if(response.status === 400) {
                toast.error("Match data is not set");
                return;
            }
            toast.error("Failed to fetch match data");
        }
        const data = await response.json();
        setMatchData(data as MatchData);
    }).catch((error) => {
        console.error("Error fetching match data:", error);
        toast.error("Error fetching match data");
    }).finally(() => {
        setFetching(false);
    });
  }

    return (
    <div className="w-full max-w-[1400px] mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
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
          <Select value={matchNo} onValueChange={setMatchNo}>
            <SelectTrigger id="matchNo">
              <SelectValue placeholder="Select Match Number" />
            </SelectTrigger>
            <SelectContent>
              {scheduleList.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {`Match ${
                    schedule.matchNo
                  }`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
            <Button onClick={getMatchData} disabled={!event || !stage || !group || !matchNo || fetching}>
                Get Match Data
            </Button>
            <span className="m-2 text-sm text-muted-foreground">
                  {matchData ? matchData.allinfo.TotalPlayerList.length + " players loaded" : "No file chosen"}
            </span>
        </div>
        <div className="space-y-2">
            <CheckPlayerData matchData={matchData} setMatchData={setMatchData} matchNo={matchNo} checking={true}/>
        </div>
    </div>
    </div>
    );
}