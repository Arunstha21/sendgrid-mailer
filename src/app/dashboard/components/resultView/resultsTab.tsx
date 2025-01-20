import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Event, EventDataE, Stage } from "../event";
import {
  Group,
  Schedule,
  getEventData,
  getGroupData,
  getScheduleData,
} from "@/server/database";
import {
  PlayerResult,
  TeamResult,
  getMatchData,
} from "@/server/match";
import { Checkbox } from "@/components/ui/checkbox";
import { TournamentResults } from "./columns";

export default function ResultTabs() {
  const [event, setEvent] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [eventData, setEventData] = useState<EventDataE[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [stageList, setStageList] = useState<Stage[]>([]);
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [resultData, setResultData] = useState<{
    teamResults: TeamResult[];
    playerResults: PlayerResult[];
  } | null>(null);
  const [afterMatch, setAfterMatch] = useState<boolean>(false);
  const [showResultData, setShowResultData] = useState<{
    teamResults: TeamResult[];
    playerResults: PlayerResult[];
  }>({ teamResults: [], playerResults: [] });
  const [resultType, setResultType] = useState<"team" | "player">("team");

  useEffect(() => {
    async function fetchEventList() {
      const eventData = await getEventData();
      if (!eventData.length) {
        return;
      }
      setEventData(eventData);

      const events = eventData.map((event) => ({
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
    if (resultData) {
      if (resultType === "team") {
        setShowResultData({
          teamResults: resultData.teamResults,
          playerResults: [],
        });
      } else if (resultType === "player") {
        setShowResultData({
          teamResults: [],
          playerResults: resultData.playerResults,
        });
      } else {
        setShowResultData({ teamResults: [], playerResults: [] });
      }
    }
  }, [resultType, resultData]);

  useEffect(() => {
    async function fetchGroupData() {
      if (stage === "") {
        return;
      }
      const groupData = await getGroupData(stage);
      setGroupList(groupData);
    }
    fetchGroupData();
  }, [stage]);

  const handleGroupChange = async (groupId: string) => {
    setGroup(groupId);
    const scheduleData = await getScheduleData(groupId);
    setScheduleList(scheduleData);
  };


  const handleMatchChange = async (matchId: string) => {
    setError(null);
    setLoading(true);
    setResultData(null);
    setMatchNo(matchId);

    let scheduleIds: string[] = [];
    if (afterMatch) {
      // Get all match ids including & before the selected match
      const index = scheduleList.findIndex((s) => s.id === matchId);
      scheduleIds = scheduleList.slice(0, index + 1).map((s) => s.id);
    } else {
      scheduleIds = [matchId];
    }

    const resultsData = await getMatchData(scheduleIds);
    if (resultsData.data === null) {
      setError("No data found");
      setLoading(false);
      return;
    }
    setResultData(resultsData.data);
    setShowResultData({
      teamResults: resultsData.data.teamResults,
      playerResults: [],
    });
    setLoading(false);
  };

  useEffect(() => {
    if(matchNo){
      handleMatchChange(matchNo || "");
    }
  }, [afterMatch]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
                  {`${afterMatch ? "After Match" : "Match"} ${
                    schedule.matchNo
                  }`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex mt-6 items-center space-x-2">
          <Checkbox
            checked={afterMatch}
            onCheckedChange={(c) => setAfterMatch(Boolean(c))}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            After Match
          </label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Result Type</Label>
          <Select
            value={resultType}
            onValueChange={(v) => setResultType(v as "team" | "player")}
          >
            <SelectTrigger id="resultType">
              <SelectValue placeholder="Select Result Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={"team"} value={"team"}>
                Team Stats
              </SelectItem>
              <SelectItem key={"player"} value={"player"}>
                Player Stats
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center">
           <TournamentResults data={showResultData} isLoading={loading}/>
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
