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

    for (const entry of eventData) {
      let event = await EventDB.findOne({ name: entry.event });
      if (!event) {
        event = await EventDB.create({ name: entry.event, stage: [] });
      }

      let stage = await StageDB.findOne({
        name: entry.stage,
        event: event._id,
      });
      if (!stage) {
        stage = await StageDB.create({
          name: entry.stage,
          event: event._id,
          group: [],
        });
        event.stage.push(stage._id);
      }

      let group = await GroupDB.findOne({
        name: entry.group,
        stage: stage._id,
        event: event._id,
      });
      if (!group) {
        group = await GroupDB.create({
          event: event._id,
          stage: stage._id,
          name: entry.group,
          schedule: [],
        });
        stage.group.push(group._id);
      }

      const team = await TeamDB.create({
        event: event._id,
        stage: stage._id,
        group: group._id,
        slot: entry.slot,
        name: entry.team,
        email: entry.email,
      });
      group.team.push(team._id);

      if (entry.players.length < 3 || entry.players.length > 6) {
        return {
          status: "error",
          message: `Team '${entry.team}' must have between 4 and 6 players. Found: ${entry.players.length}`,
        };
      }

      for (const player of entry.players) {
        const playerEntry = await PlayerDB.create({
          team: team._id,
          name: player.name,
          uid: player.uid,
          email: player.email,
        });
        team.player.push(playerEntry._id);
        console.log(
          `Inserted player '${player.name}' with UID '${player.uid}' for team '${team.name}'`
        );
      }

      await team.save();
      await group.save();
      await event.save();
      await stage.save();
    }
    return { status: "success", message: "Event Data imported successfully" };
  } else if (type === "schedule") {
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
