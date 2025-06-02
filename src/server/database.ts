"use server";

import {
  EventDB,
  GroupDB,
  PlayerDB,
  PointDB,
  ScheduleDB,
  StageDB,
  TeamDB,
  UserDB,
} from "@/lib/database/schema";
import { GetProfileData } from "./user";

export type EventData = {
  event: string;
  stage: string;
  group: string;
  slot: string;
  team: string;
  email: string;
  players: { name: string; uid: string; email?: string }[];
};
export type ScheduleData = {
  event: string;
  stage: string;
  group: string;
  matchNo: number;
  map: string;
  startTime: string;
  date: string;
  omNo?: number | null;
};

export async function ImportDataDB(
  data: EventData[] | ScheduleData[],
  type: "event" | "schedule"
) {
    if (type === "event") {
      const eventData = data as EventData[];
      const failedTeams: string[] = [];

      for (const entry of eventData) {
      try {
        if (entry.players.length < 4 || entry.players.length > 6) {
          failedTeams.push(entry.team);
          continue;
        }

        const event = await EventDB.findOneAndUpdate(
          { name: entry.event },
          { $setOnInsert: { name: entry.event, stage: [] } },
          { new: true, upsert: true }
        );

        const stage = await StageDB.findOneAndUpdate(
          { name: entry.stage, event: event._id },
          { $setOnInsert: { name: entry.stage, event: event._id, group: [] } },
          { new: true, upsert: true }
        );

        const group = await GroupDB.findOneAndUpdate(
          { name: entry.group, stage: stage._id, event: event._id },
          { $setOnInsert: { name: entry.group, stage: stage._id, event: event._id, schedule: [] } },
          { new: true, upsert: true }
        );

        const existingTeam = await TeamDB.findOne({ name: entry.team, stage: stage._id });

        if (existingTeam) {
          const updates: {email?: string; slot?: string} = {};
          if (existingTeam.email !== entry.email) updates.email = entry.email;
          if (existingTeam.slot !== entry.slot) updates.slot = entry.slot;

          if (Object.keys(updates).length > 0) {
            await TeamDB.updateOne({ _id: existingTeam._id }, { $set: updates });
          }

          const existingPlayers = await PlayerDB.find({ team: existingTeam._id }, { uid: 1 });
          const existingUIDs = new Set(existingPlayers.map(p => p.uid));

          const newPlayers = entry.players.filter(p => !existingUIDs.has(p.uid));

          if (newPlayers.length > 0) {
            const playerDocs = newPlayers.map(p => ({
              team: existingTeam._id,
              name: p.name,
              uid: p.uid,
              email: p.email,
            }));

            const insertedPlayers = await PlayerDB.insertMany(playerDocs);

            await TeamDB.updateOne(
              { _id: existingTeam._id },
              { $push: { player: { $each: insertedPlayers.map(p => p._id) } } }
            );
          }

          // Ensure the team is added to the new group if it's not already present
          await GroupDB.updateOne(
            { _id: group._id },
            { $addToSet: { team: existingTeam._id } }
          );

          console.log(`Updated existing team '${entry.team}' with ${newPlayers.length} new players`);
          continue;
        }

        const team = await TeamDB.create({
          event: event._id,
          stage: stage._id,
          group: group._id,
          slot: entry.slot,
          name: entry.team,
          email: entry.email,
        });

        await Promise.all([
          EventDB.updateOne({ _id: event._id }, { $addToSet: { stage: stage._id } }),
          StageDB.updateOne({ _id: stage._id }, { $addToSet: { group: group._id } }),
          GroupDB.updateOne({ _id: group._id }, { $addToSet: { team: team._id } }),
        ]);

        const playerDocs = entry.players.map(player => ({
          team: team._id,
          name: player.name,
          uid: player.uid,
          email: player.email,
        }));

        const players = await PlayerDB.insertMany(playerDocs);

        await TeamDB.updateOne(
          { _id: team._id },
          { $push: { player: { $each: players.map(p => p._id) } } }
        );

        console.log(`Inserted team '${entry.team}' with ${players.length} players`);
      } catch (err) {
        console.error(`Error processing team '${entry.team}':`, err);
        failedTeams.push(entry.team);
      }


      }
      
      if (failedTeams.length > 0) {
        return { 
          status: "error", 
          message: `Some teams could not be processed: ${failedTeams.join(", ")}` 
        };
      }
      
      return { status: "success", message: "Event Data imported successfully" };
    
    } else if (type === "schedule") {
    try {
      const scheduleData = data as ScheduleData[];
  
      for (const entry of scheduleData) {
        const event = await EventDB.findOne({ name: entry.event });
        if (!event) {
          return {
            status: "error",
            message: `Event '${entry.event}' does not exist.`,
          };
        }
  
        const stage = await StageDB.findOne({
          name: entry.stage,
          event: event._id,
        });
        if (!stage) {
          return {
            status: "error",
            message: `Stage '${entry.stage}' does not exist for event '${event.name}'.`,
          };
        }
  
        const groups = entry.group.includes("&")
          ? entry.group.split("&")
          : [entry.group];
        const groupIds: string[] = [];
        for (const groupName of groups) {
          const group = await GroupDB.findOne({
            name: groupName.trim(),
            stage: stage._id,
            event: event._id,
          });
  
          if (!group) {
            return {
              status: "error",
              message: `Group '${groupName}' does not exist for stage '${stage.name}' in event '${event.name}'.`,
            };
          }
  
          groupIds.push(group._id);
        }
  
        const schedule = await ScheduleDB.create({
          event: event._id,
          stage: stage._id,
          group: groupIds,
          matchNo: entry.matchNo,
          map: entry.map,
          startTime: entry.startTime,
          date: entry.date,
          omNo: entry.omNo || null,
        });
  
        for (const groupId of groupIds) {
          const group = await GroupDB.findById(groupId);
          if (group) {
            group.schedule.push(schedule._id);
            await group.save();
          }
        }
  
        console.log(`Inserted schedule data for match number: ${entry.matchNo}`);
      }
      return {
        status: "success",
        message: "Schedule Data imported successfully",
      };
    } catch (error : any) {
      return {
        status: "error",
        message: error.message
      };
      
    }
    }else{
      return { status: "error", message: "Invalid data type" };
    }
}

export interface Event {
  id: string;
  name: string;
  discordLink: string;
  organizer: string;
  isPublic: boolean;
  stages: {id: string; name: string}[];
  pointSystem: string;
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const eventData = await getEventData();
  const eventExists = eventData.find((event: any) => event.id === eventId);
  if(eventExists){
    return eventExists;
  }else{
    return null;
  }
}

export interface PointSystem {
  id: string;
  name: string;
}

export async function getPointSystemList(): Promise<PointSystem[]> {
  const getPointSystemList = await PointDB.find({});
  const data = getPointSystemList.map((point: any) => {
    return {
      id: point._id.toString(),
      name: point.name,
    };
  }
  );
  return data || [];
}

export async function getEventData() {
  const user = await GetProfileData();
  let events
  if(user.superUser){
    const userEvents = await EventDB.find({}).populate("stage");
    events = userEvents;
  }else{
    const userEvents = await UserDB.findOne({ userName: user.userName })
    .populate({
      path: "events",
      populate: {
        path: "stage",
      }
    });
    events = userEvents.events;
  }

  const data = events.map((event: any) => {
    return {
      id: event._id.toString(),
      name: event.name,
      discordLink: event.discordLink,
      organizer: event.organizer,
      isPublic: event.isPublic,
      stages: event.stage.map((stage: any) => {
        return {
          id: stage._id.toString(),
          name: stage.name,
        };
      }),
      pointSystem: event.pointSystem.toString(),
    };
  });
  return data || [];
}

export type GroupAndSchedule = {
  id: string;
  name: string;
  data: { id: string, slot: number; team: string; email: string; playerEmails: string[] | null }[];
  schedule: Schedule[];
};

export type Schedule = {
  id: string;
  matchNo: number;
  map: string;
  startTime: string;
  date: string;
  match?: string;
};

export async function getGroupAndSchedule(stageId: string, reqFrom?: string): Promise<{ isMultiGroup: boolean; groups: GroupAndSchedule[] }> {
  try {
    const scheduleData = await ScheduleDB.find({ stage: stageId }).populate({
      path: "group",
      populate: { path: "team",
        populate: {
        path: "player",
      } },
    }).populate('stage');

    const teamsByGroupId: Record<string, GroupAndSchedule> = {};
    let isMultiGroup = false;

    for (const schedule of scheduleData) {
      const groups = schedule.group;

      isMultiGroup = schedule.stage.isMultiGroup || false;

      if (groups.length > 1) {
        isMultiGroup = true;
      }

      if (groups.length === 1) {
        const group = groups[0];

        if (!teamsByGroupId[group._id]) {
          teamsByGroupId[group._id] = {
            id: group._id.toString(),
            name: group.name,
            data: [],
            schedule: [],
          };
        }

        const teamMap = new Map<string, { id: string; slot: number; team: string; email: string; playerEmails: string[] | null}>();
        for (const team of group.team) {
          if (!teamMap.has(team.name)) {
            teamMap.set(team.name, {
              id: team._id.toString(),
              slot: team.slot,
              team: team.name,
              email: team.email,
              playerEmails: (() => {
                    const emails = Array.from(
                      new Set(
                        team.player
                          .map((player: { email: string }) => player.email.trim().toLowerCase())
                          .filter((email: string) => email !== "")
                      )
                    ) as string[];

                    return emails.length > 0 ? emails : null;
                  })()
            });
          }
        }

        teamsByGroupId[group._id].data = Array.from(teamMap.values()).sort((a, b) => a.slot - b.slot);
      if(reqFrom === "resultView") {
      if(schedule.match && schedule.match.toString() !== "null") {
        teamsByGroupId[group._id].schedule.push({
          id: schedule._id.toString(),
          matchNo: schedule.stage.isMultiGroup ? schedule.omNo || schedule.matchNo  : schedule.matchNo,
          map: schedule.map,
          startTime: schedule.startTime,
          date: schedule.date,
          match: schedule.match ? schedule.match.toString() : null
        });
      }
    } else {
        teamsByGroupId[group._id].schedule.push({
          id: schedule._id.toString(),
          matchNo: schedule.matchNo,
          map: schedule.map,
          startTime: schedule.startTime,
          date: schedule.date,
        });
      }
      } else if (groups.length >= 2) {
      const combinedGroupId = groups.map((g: {_id: object}) => g._id.toString()).join("_");
      const combinedGroupName = groups.map((g: {name: string}) => g.name).join(" vs ");
      
      if (!teamsByGroupId[combinedGroupId]) {
        teamsByGroupId[combinedGroupId] = {
          id: combinedGroupId,
          name: combinedGroupName,
          data: [],
          schedule: [],
        };
      }

      // First pass: determine if dynamic slots are needed
      const useDynamicSlot: boolean = groups.some((group: { team: { slot: number }[] }) => 
        group.team.some((team: { slot: number }) => team.slot < 0)
      );

      const teamMap = new Map<string, { id: string; slotRef: number; slot: number; team: string; email: string;  playerEmails: string[] | null}>();

      // Second pass: process teams with the flag already determined
      for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
        const group = groups[groupIndex];
        for (const team of group.team) {
          if (!teamMap.has(team.name)) {
            teamMap.set(team.name, {
              id: team._id.toString(),
              team: team.name,
              email: team.email,
              slotRef: useDynamicSlot ? -team.slot : team.slot,
              slot: useDynamicSlot ? 5 + groupIndex : Math.abs(team.slot),
              playerEmails: (() => {
                const emails = Array.from(
                  new Set(
                    team.player
                      .map((p: { email: string }) => p.email.trim().toLowerCase())
                      .filter((email: string) => email !== "")
                  )
                ) as string[];
                return emails.length > 0 ? emails : null;
              })(),
            });
          }
        }
      }

      const sortedTeams = Array.from(teamMap.values()).sort((a, b) => {
        if (a.slotRef !== b.slotRef) return a.slotRef - b.slotRef;
        return Math.abs(a.slotRef) - Math.abs(b.slotRef);
      });

      teamsByGroupId[combinedGroupId].data = sortedTeams;
      teamsByGroupId[combinedGroupId].schedule.push({
        id: schedule._id.toString(),
        matchNo: schedule.matchNo,
        map: schedule.map,
        startTime: schedule.startTime,
        date: schedule.date,
      });
    }}

    return {
      isMultiGroup,
      groups: Object.values(teamsByGroupId),
    };
  } catch (error) {
    console.error("Error fetching group and schedule:", error);
    throw error;
  }
}

export async function updateEventData(eventId: string, data: { name: string; pointSystem?: string ; discordLink?: string; organizer?: string; isPublic?: boolean }) {
  try {
    await EventDB.findByIdAndUpdate(eventId, data, { new: true });
    return { status: "success", message: "Successfully updated the event data" };
  } catch (error : any) {
    console.error("Error updating event data:", error.message);
    return { status: "error", message: error.message };
  }
}

interface GroupAndScheduleUpdateData {
  stageName: string;
  group: {
      id: string;
      name: string;
      schedule: Schedule[];
  };
  teamData: {id: string; team: string; email: string}[];
}

export async function updateGroupAndScheduleData(stageId: string, data: GroupAndScheduleUpdateData) {
  try {
      await StageDB.findByIdAndUpdate(stageId, { name: data.stageName }, { new: true });

      await GroupDB.findByIdAndUpdate(data.group.id, { name: data.group.name }, { new: true });

      const teams = await TeamDB.find({ group: data.group.id });
      const teamDataPromises = data.teamData.map(async (team) => {
          const existingTeam = teams.find((t) => t._id.toString() === team.id);
          if (existingTeam) {
              return TeamDB.findByIdAndUpdate(team.id, {
                  name: team.team,
                  email: team.email,
              }, { new: true });
          }
      });

      const schedules = await ScheduleDB.find({ group: data.group.id });
      const scheduleDataPromises = data.group.schedule.map(async (scheduleItem) => {
          const existingSchedule = schedules.find((s) => s._id.toString() === scheduleItem.id);
          if (existingSchedule) {
              return ScheduleDB.findByIdAndUpdate(scheduleItem.id, {
                  matchNo: scheduleItem.matchNo,
                  map: scheduleItem.map,
                  startTime: scheduleItem.startTime,
                  date: scheduleItem.date,
              }, { new: true });
          }
      });

      await Promise.all([...teamDataPromises, ...scheduleDataPromises]);

      return { status: "success", message: "Group and schedule data updated successfully." };
  } catch (error: any) {
      return { status: "error", message: error.message };
  }
}