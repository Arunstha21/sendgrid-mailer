"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  GroupAndSchedule,
  Schedule,
  getEventData,
  getGroupAndSchedule,
} from "@/server/database";
import ScheduleData from "@/components/scheduleData";
import { toast } from "sonner";

function textDecoder(text: string) {
  return new TextDecoder().decode(new Uint8Array([...text].map(char => char.charCodeAt(0))));
}

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
  discordLink: string;
  organizer: string;
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
  const [loading, setLoading] = useState(false);
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
  const [matches, setMatches] = useState<Schedule[]>([]);

  const [eventData, setEventData] = useState<EventDataE[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [stageList, setStageList] = useState<Stage[]>([]);
  const [groupList, setGroupList] = useState<GroupAndSchedule[]>([]);
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);

  const editableRef = useRef<HTMLDivElement>(null);

  const getEmailContent = async () => {
    if (editableRef.current) {
      // Capture raw HTML from the editable div
      let capturedContent = editableRef.current.innerHTML;
  
      // Remove unnecessary attributes and wrappers
      capturedContent = capturedContent
        .replace(/contenteditable="[^"]*"/gi, '') // Remove contentEditable
        .replace(/suppresscontenteditablewarning="[^"]*"/gi, '') // Remove warnings
        .replace(/\sstyle=""/gi, '') // Remove empty styles
        .trim(); // Trim whitespace
  
      // Define a base template for the email
      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          ${capturedContent}
        </div>
      `;
  
      return emailTemplate;
    }
    return '';
  };

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

      const event = eventData.map((event: any) => {
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
    if(event != ""){
    const stages = eventData.find((e) => e.id === event)?.stages || [];
    setStageList(stages);
    }
  }, [event, eventData]);

  useEffect(() => {
    async function fetchGroupData() {
      if (stage === "") {
        return;
      }
      const groupAndScheduleData = await getGroupAndSchedule(stage);
      const { groups } = groupAndScheduleData;
      setGroupList(groups);
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
    if(!matchNo) return
    const match = scheduleList.find((s) => s.id === matchNo);
    if (match) {
      const formattedDate = formatDate(match.date);
      const formattedTime = formatTime(match.startTime);
  
      setStartTime(formattedTime || "");
      setDate(formattedDate || "");
      setMap(match.map || "");
    }
  },[matchNo, scheduleList])


  useEffect(() => {
    const eventDetails = {
      event: eventList.find((e) => e.id === event)?.name,
      discordLink: eventData.find((e) => e.id === event)?.discordLink,
      organizer: eventData.find((e) => e.id === event)?.organizer,
      stage: stageList.find((s) => s.id === stage)?.name,
      matchNo: scheduleList.find((s) => s.id === matchNo)?.matchNo,
      groupName: groupList.find((g) => g.id === group)?.name,
    }
    
    if (messageType === "ID Pass") {
      setSubject(interpolateTemplate(subjectTemplate.idPass, {event: eventDetails.event, stage: eventDetails.stage, group: eventDetails.groupName, matchNo: eventDetails.matchNo}));
      setMessageData({
        event: eventDetails.event,
        discordLink: eventDetails.discordLink,
        organizer: eventDetails.organizer,
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
        discordLink: eventDetails.discordLink,
        organizer: eventDetails.organizer,
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
    const toastLoadingId = toast.loading("Sending email...");
    setLoading(true);

    if (selectedSender.email === "") {
      shakeForm();
      toast.error("Sender is required");
      toast.dismiss(toastLoadingId);
      setLoading(false);
      return;
    }

    if (bcc.length === 0) {
      shakeForm();
      toast.error("At least one BCC recipient is required");
      toast.dismiss(toastLoadingId);
      setLoading(false);
      return;
    }

    if (messageType=== "ID Pass" && (!matchId || matchId <= 0)) {
      shakeForm();
      toast.error("Match ID is required");
      toast.dismiss(toastLoadingId);
      setLoading(false);
      return;
    }

    if (messageType=== "ID Pass" && password === "") {
      shakeForm();
      toast.error("Password is required");
      toast.dismiss(toastLoadingId);
      setLoading(false);
      return;
    }

    if (messageType=== "ID Pass" && (!map || !date || !startTime)) {
      shakeForm();
      toast.error("Match details are missing");
      toast.dismiss(toastLoadingId);
      setLoading(false);
      return;
    }

    if (!messageData) {
      shakeForm();
      toast.error("Message data is missing");
      toast.dismiss(toastLoadingId);
      setLoading(false);
      return;
    }

    const emailContent = await getEmailContent();;
    const emailData = {
      from: selectedSender.email,
      tos: to,
      bccs: bcc,
      subject,
      message: emailContent,
    };
    
    try {
      await sendEmail(emailData);
      toast.success("Email sent successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    } finally {
      toast.dismiss(toastLoadingId);
      setLoading(false);
    }
  };

  const handleGroupChange = async (groupId: string) => {
    setGroup(groupId);
    const scheduleData = groupList.find((g) => g.id === groupId)?.schedule || [];
    const matches = scheduleData.map((schedule) => {
      return {
        id: schedule.id,
        matchNo: schedule.matchNo,
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

          const team = textDecoder(g.team);
          return { slot: g.slot.toString(), team };
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
                <ScheduleData matches={matches} setMatches={setMatches} isEditing={true} />
              )}
            </div>
          </form>
        </div>
        <div>
              <Label>Message Preview</Label>
              <div className="mt-2 p-4 border rounded-md bg-gray-50 h-full overflow-auto">
                {messageData && (
                  <div ref={editableRef}>
                  <EventMessage type={messageType} data={messageData} />
                  </div>
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
    </div>
  );
}
