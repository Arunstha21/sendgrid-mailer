"use server";

import connect from "@/lib/database/connect";
import {
  EventDB,
  GroupDB,
  PlayerDB,
  ScheduleDB,
  StageDB,
  TeamDB,
} from "@/lib/database/schema";

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
};

connect();

export async function ImportDataDB(
  data: EventData[] | ScheduleData[],
  type: "event" | "schedule"
) {
    if (type === "event") {
      const eventData = data as EventData[];
      const failedTeams: string[] = [];

      for (const entry of eventData) {
        try {
          // Validate Player Count Before Creating a Team
          if (entry.players.length < 4 || entry.players.length > 6) {
            failedTeams.push(entry.team);
            continue;
          }
      
          // Find or Create Event
          const event = await EventDB.findOneAndUpdate(
            { name: entry.event },
            { $setOnInsert: { name: entry.event, stage: [] } },
            { new: true, upsert: true }
          );
      
          // Find or Create Stage
          const stage = await StageDB.findOneAndUpdate(
            { name: entry.stage, event: event._id },
            { $setOnInsert: { name: entry.stage, event: event._id, group: [] } },
            { new: true, upsert: true }
          );
      
          // Find or Create Group
          const group = await GroupDB.findOneAndUpdate(
            { name: entry.group, stage: stage._id, event: event._id },
            { $setOnInsert: { name: entry.group, stage: stage._id, event: event._id, schedule: [] } },
            { new: true, upsert: true }
          );
      
          // Ensure Team Name is Unique Within the Group
          const existingTeam = await TeamDB.findOne({
            name: entry.team,
            group: group._id,
          });
      
          if (existingTeam) {
            failedTeams.push(entry.team);
            continue;
          }
      
          // Create Team
          const team = await TeamDB.create({
            event: event._id,
            stage: stage._id,
            group: group._id,
            slot: entry.slot,
            name: entry.team,
            email: entry.email,
          });
      
          // Update Event, Stage, and Group Relationships
          await Promise.all([
            EventDB.updateOne({ _id: event._id }, { $addToSet: { stage: stage._id } }),
            StageDB.updateOne({ _id: stage._id }, { $addToSet: { group: group._id } }),
            GroupDB.updateOne({ _id: group._id }, { $addToSet: { team: team._id } }),
          ]);
      
          // Insert Players
          const playerDocs = entry.players.map(player => ({
            team: team._id,
            name: player.name,
            uid: player.uid,
            email: player.email,
          }));
          const players = await PlayerDB.insertMany(playerDocs);
      
          // Update Team with Player References
          await TeamDB.updateOne(
            { _id: team._id },
            { $push: { player: { $each: players.map(p => p._id) } } }
          );
      
          console.log(`Inserted team '${entry.team}' with ${players.length} players`);
        } catch (error : any) {
          console.error(`Error processing team '${entry.team}': ${error.message}`);
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

export async function getEventData() {
  const events = await EventDB.find({}).populate("stage");

  const data = events.map((event) => {
    return {
      id: event._id.toString(),
      name: event.name,
      stages: event.stage.map((stage: any) => {
        return {
          id: stage._id.toString(),
          name: stage.name,
        };
      }),
    };
  });
  return data || [];
}

export type GroupAndSchedule = {
  id: string;
  name: string;
  data: { slot: number; team: string; email: string }[];
  schedule: Schedule[];
};


export type Schedule = {
  id: string;
  matchNo: number;
  map: string;
  startTime: string;
  date: string;
};

export async function getGroupAndSchedule(stageId: string): Promise<{ isMultiGroup: boolean; groups: GroupAndSchedule[] }> {
  try {
    const scheduleData = await ScheduleDB.find({ stage: stageId }).populate({
      path: "group",
      populate: { path: "team" },
    });

    const teamsByGroupId: Record<string, GroupAndSchedule> = {};
    let isMultiGroup = false;

    for (const schedule of scheduleData) {
      const groups = schedule.group;

      if (groups.length > 1) {
        isMultiGroup = true;
      }

      if (groups.length === 1) {
        // Single group case
        const group = groups[0];

        if (!teamsByGroupId[group._id]) {
          teamsByGroupId[group._id] = {
            id: group._id.toString(),
            name: group.name,
            data: [],
            schedule: [],
          };
        }

        const teamMap = new Map<string, { slot: number; team: string; email: string }>();
        for (const team of group.team) {
          if (!teamMap.has(team.name)) {
            teamMap.set(team.name, {
              slot: team.slot,
              team: team.name,
              email: team.email,
            });
          }
        }

        teamsByGroupId[group._id].data = Array.from(teamMap.values()).sort((a, b) => a.slot - b.slot);


        teamsByGroupId[group._id].schedule.push({
          id: schedule._id.toString(),
          matchNo: schedule.matchNo,
          map: schedule.map,
          startTime: schedule.startTime,
          date: schedule.date,
        });
      } else if (groups.length >= 2) {
        // Multiple groups case: Combine group names and set data
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

        const teamMap = new Map<string, { slot: number; team: string; email: string }>();
        for (const group of groups) {
          for (const team of group.team) {
            if (!teamMap.has(team.name)) {
              teamMap.set(team.name, {
                slot: team.slot,
                team: team.name,
                email: team.email,
              });
            }
          }
        }

        teamsByGroupId[combinedGroupId].data = Array.from(teamMap.values()).sort((a, b) => a.slot - b.slot);

        teamsByGroupId[combinedGroupId].schedule.push({
          id: schedule._id.toString(),
          matchNo: schedule.matchNo,
          map: schedule.map,
          startTime: schedule.startTime,
          date: schedule.date,
        });
      }
    }

    return {
      isMultiGroup,
      groups: Object.values(teamsByGroupId),
    };
  } catch (error) {
    console.error("Error fetching group and schedule:", error);
    throw error;
  }
}
