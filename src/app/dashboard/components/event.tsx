"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactDOMServer from 'react-dom/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiEmailInput } from "./MultiEmailInput";
import { from, getEmailList, sendEmail } from "@/server/sendgrid";
import EventMessage, { Grouping, IDPass } from "./message";
import { Group, Schedule, getEventData, getGroupData, getScheduleData } from "@/server/database";

export type Event = {
  id: string;
  name: string;
};

export type Stage = {
  id: string;
  name: string;
};

export type EventDataE = {
  id: string;
  name: string;
  stages: Stage[];
};


const subjectTemplate = {
  idPass : "Lobby Credentials for ${event} - ${stage} - ${group} - Match ${matchNo}",
  groupings : "Groupings and Timings for ${event} - ${stage} - ${group}"
}

const interpolateTemplate = (
  template: string,
  data: Record<string, string | number | undefined>
): string => {
  return template.replace(/\${(.*?)}/g, (_, key) => {
    const value = data[key.trim()];
    return value !== undefined ? String(value) : "";
  });
};

const defaultSelectedSender = { email: "", name: "" };
const mapList = ["Erangel", "Miramar", "Sanhok"];

export default function Event() {
  const formRef = useRef<HTMLFormElement>(null);
  const [to, setTo] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [emailList, setEmailList] = useState<from[]>([]);
  const [selectedSender, setSelectedSender] = useState<from>(
    defaultSelectedSender
  );
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"ID Pass" | "Groupings">(
    "ID Pass"
  );
  const [messageData, setMessageData] = useState<IDPass | Grouping | null>(
    null
  );

  // State for editable fields
  const [event, setEvent] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined);
  const [map, setMap] = useState<string>("");
  const [matchId, setMatchId] = useState<number | undefined>(undefined);
  const [password, setPassword] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const [groupings, setGroupings] = useState<{ slot: string; team: string }[]>(
    []
  );
  const [matches, setMatches] = useState<
    { map: string; date: string; startTime: string }[]
  >([]);

  const [eventData, setEventData] = useState<EventDataE[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [stageList, setStageList] = useState<Stage[]>([]);
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);

  useEffect(() => {
    if (error) {
      shakeForm();
    }
  }, [error]);

  function shakeForm() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }


  useEffect(() => {
    async function fetchEmailList() {
      const list = await getEmailList();
      setEmailList(list);
      const eventData = await getEventData();
      if (!eventData.length) {
        return;
      }
      setEventData(eventData);

      const event = eventData.map((event) => {
        return {
          id: event.id,
          name: event.name,
        };
      });
      setEventList(event);
    }
    fetchEmailList();
  }, []);

  useEffect(() => {
    const stages = eventData.find((e) => e.id === event)?.stages || [];
    setStageList(stages);
  }, [event]);

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

  function formatDate(date: string) {
    const [day , month, year] = date.split("-");
    const dayInt = parseInt(day);
    const suffix = ["th", "st", "nd", "rd"][
      dayInt % 10 > 3 || [11, 12, 13].includes(dayInt % 100) ? 0 : dayInt % 10
    ];
    const formattedDate = `${day}${suffix} ${new Date(`${year}-${month}-${day}`).toLocaleString("en-GB", { month: "short" })}`;
    return formattedDate;
  }

  function formatTime(time: string) {
    const formattedTime = new Date(`1970-01-01T${time}`).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return formattedTime;
  }


  useEffect(()=>{
    const match = scheduleList.find((s) => s.id === matchNo);
    if (match) {

      const formattedDate = formatDate(match.date);

      const formattedTime = formatTime(match.startTime);
  
      setStartTime(formattedTime || "");
      setDate(formattedDate || "");
      setMap(match.map || "");
    }


  },[matchNo])


  useEffect(() => {
    const eventDetails = {
      event: eventList.find((e) => e.id === event)?.name,
      stage: stageList.find((s) => s.id === stage)?.name,
      matchNo: scheduleList.find((s) => s.id === matchNo)?.matchNo,
      groupName: groupList.find((g) => g.id === group)?.name,
    }

    if (messageType === "ID Pass") {
      setSubject(interpolateTemplate(subjectTemplate.idPass, {event: eventDetails.event, stage: eventDetails.stage, group: eventDetails.groupName, matchNo: eventDetails.matchNo}));
      setMessageData({
        event: eventDetails.event,
        stage: eventDetails.stage,
        matchNo: eventDetails.matchNo,
        map,
        matchId: matchId || 0,
        password,
        startTime,
        date,
        group,
        groupName: eventDetails.groupName,
        groupings,
      } as IDPass);
    } else {
      setSubject(interpolateTemplate(subjectTemplate.groupings, {event: eventDetails.event, stage: eventDetails.stage, group: eventDetails.groupName}));
      setMessageData({
        event: eventDetails.event,
        stage: eventDetails.stage,
        group,
        groupName: eventDetails.groupName,
        matches,
        groupings,
      } as Grouping);
    }
    
  }, [
    messageType,
    event,
    stage,
    matchNo,
    map,
    matchId,
    password,
    startTime,
    date,
    group,
    groupings,
    matches,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (selectedSender.email === "") {
      shakeForm();
      setError("Sender is required");
      setLoading(false);
      return;
    }

    if (bcc.length === 0) {
      shakeForm();
      setError("Recipient is required");
      setLoading(false);
      return;
    }

    if (messageType=== "ID Pass" && (!matchId || matchId <= 0)) {
      shakeForm();
      setError("Match ID is invalid");
      setLoading(false);
      return;
    }

    if (messageType=== "ID Pass" && password === "") {
      shakeForm();
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (messageType=== "ID Pass" && (!map || !date || !startTime)) {
      shakeForm();
      setError("Match details are missing");
      setLoading(false);
      return;
    }

    if (!messageData) {
      shakeForm();
      setError("Message data is missing");
      setLoading(false);
      return;
    }

    const emailContent = <EventMessage type={messageType} data={messageData} />;
    const emailData = {
      from: selectedSender.email,
      tos: to,
      bccs: bcc,
      subject,
      message: ReactDOMServer.renderToStaticMarkup(emailContent),
    };


    try {
      await sendEmail(emailData);
      setSuccess("Email sent successfully!");
    } catch (error: any) {
      setError(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = async (groupId: string) => {
    setGroup(groupId);
    const scheduleData = await getScheduleData(groupId);
    const matches = scheduleData.map((schedule) => {
      return {
        map: schedule.map,
        date: formatDate(schedule.date),
        startTime: formatTime(schedule.startTime),
      };
    });

    setMatches(matches);
    
    setScheduleList(scheduleData)

    const selectedGroupEmails =
      groupList
        .find((g) => g.id === groupId)
        ?.data.map((g) => {
          return g.email;
        }) || [];

    const groupings =
      groupList
        .find((g) => g.id === groupId)
        ?.data.map((g) => {
          return { slot: g.slot.toString(), team: g.team };
        }) || [];

    setGroupings(groupings);
    setBcc(selectedGroupEmails);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className={`w-full max-w-6xl mx-auto ${shake ? 'animate-shake' : ''}`}>
        <CardHeader>
          <CardTitle>Send Event Email</CardTitle>
          <CardDescription>
            Compose and send emails for esports events
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-3">
              <div>
                <Label htmlFor="from">From</Label>
                <Select
                  onValueChange={(email) =>
                    setSelectedSender(
                      emailList.find((sender) => sender.email === email) ||
                        defaultSelectedSender
                    )
                  }
                >
                  <SelectTrigger id="from">
                    <SelectValue placeholder="Select sender" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailList.map((sender) => (
                      <SelectItem key={sender.email} value={sender.email}>
                        {sender.name
                          ? `${sender.name} <${sender.email}>`
                          : sender.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <MultiEmailInput
                  id="to"
                  value={to}
                  onChange={setTo}
                  placeholder="Enter email addresses..."
                />
              </div>
              <div>
                <Label htmlFor="bcc">BCC</Label>
                <MultiEmailInput
                  id="bcc"
                  value={bcc}
                  onChange={setBcc}
                  placeholder="Enter BCC email addresses..."
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="messageType">Message Type</Label>
                <Select
                  value={messageType}
                  onValueChange={(value) =>
                    setMessageType(value as "ID Pass" | "Groupings")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ID Pass">ID Pass</SelectItem>
                    <SelectItem value="Groupings">Groupings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="event">Event</Label>
                  <Select value={event} onValueChange={setEvent}>
                    <SelectTrigger>
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
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
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
                <div>
                  <Label htmlFor="group">Group</Label>
                  <Select
                    value={group}
                    onValueChange={handleGroupChange}
                  >
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
              </div>

              {messageType === "ID Pass" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="matchNo">Match Number</Label>
                    <Select
                    value={matchNo}
                    onValueChange={setMatchNo}
                  >
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
                  <div>
                    <Label htmlFor="matchId">Match ID</Label>
                    <Input
                      id="matchId"
                      type="number"
                      value={matchId || ""}
                      onChange={(e) =>
                        setMatchId(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {messageType === "Groupings" && (
                <div>
                  <Label>Matches</Label>
                  {matches.map((match, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Select
                        value={match.map}
                        onValueChange={(newMap) => {
                          const newMatches = [...matches];
                          newMatches[index].map = newMap;
                          setMatches(newMatches);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Map" />
                        </SelectTrigger>
                        <SelectContent>
                          {mapList.map((map) => (
                            <SelectItem key={map} value={map}>
                              {map}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={match.date}
                        onChange={(e) => {
                          const newMatches = [...matches];
                          newMatches[index].date = e.target.value;
                          setMatches(newMatches);
                        }}
                        placeholder="Date"
                      />
                      <Input
                        value={match.startTime}
                        onChange={(e) => {
                          const newMatches = [...matches];
                          newMatches[index].startTime = e.target.value;
                          setMatches(newMatches);
                        }}
                        placeholder="Start Time"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setMatches(matches.filter((_, i) => i !== index))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() =>
                      setMatches([
                        ...matches,
                        { map: "", date: "", startTime: "" },
                      ])
                    }
                    className="mt-2 ml-2"
                  >
                    Add Match
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>
        <div>
              <Label>Message Preview</Label>
              <div className="mt-2 p-4 border rounded-md bg-gray-50 h-full overflow-auto">
                {messageData && (
                  <EventMessage type={messageType} data={messageData} />
                )}
              </div>
            </div>
          </div>

        <div className="mt-10 flex justify-end">
        <Button onClick={() => formRef.current?.requestSubmit()} disabled={loading}>
          {loading ? "Sending..." : "Send Email"}
        </Button>
      </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
    </div>
  );
}
