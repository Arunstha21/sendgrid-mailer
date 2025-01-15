"use server";

import connect from "@/lib/database/connect";
import { EventDB, GroupDB, PlayerDB, ScheduleDB, StageDB, TeamDB } from "@/lib/database/schema";

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

      let stage = await StageDB.findOne({ name: entry.stage, event: event._id });
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

      if (
        entry.players.length < 3 ||
        entry.players.length > 6
      ) {
        throw new Error(
          `Team '${entry.team}' must have between 4 and 6 players. Found: ${entry.players.length}`
        );
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
  } else if (type === "schedule") {
    const scheduleData = data as ScheduleData[];

    for (const entry of scheduleData) {
      const event = await EventDB.findOne({ name: entry.event });
      if (!event) {
        throw new Error(`Event '${entry.event}' does not exist.`);
      }

      const stage = await StageDB.findOne({ name: entry.stage, event: event._id });
      if (!stage) {
        throw new Error(
          `Stage '${entry.stage}' does not exist for event '${entry.event}'.`
        );
      }

      const group = await GroupDB.findOne({
        name: entry.group,
        stage: stage._id,
        event: event._id,
      });
      if (!group) {
        throw new Error(
          `Group '${entry.group}' does not exist for stage '${stage.name}' and event '${event.name}'.`
        );
      }

      const schedule = await ScheduleDB.create({
        event: event._id,
        stage: stage._id,
        group: group._id,
        matchNo: entry.matchNo,
        map: entry.map,
        startTime: entry.startTime,
        date: entry.date,
      });

      group.schedule.push(schedule._id);
      await group.save();

      console.log(`Inserted schedule data for match number: ${entry.matchNo}`);
    }
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

export type Group = {
    id: string;
    name: string;
    data: { slot: number; team: string; email: string }[];
  };
  
  export async function getGroupData(stageId: string): Promise<Group[]> {
    try {
      // Fetch the stage and populate groups
      const stage = await StageDB.findById(stageId).populate({
        path: "group",
        populate: {
          path: "event stage",
        },
      });
  
      if (!stage || !stage.group) {
        throw new Error("Stage or groups not found.");
      }
  
      // Extract all group IDs
      const groupIds = stage.group.map((group: {_id: object}) => group._id);
  
      // Fetch all teams for these groups in one go
      const teams = await TeamDB.find({ group: { $in: groupIds } });
  
      // Organize teams by group ID
      const teamsByGroupId: Record<string, any[]> = {};
      for (const team of teams) {
        if (!teamsByGroupId[team.group]) {
          teamsByGroupId[team.group] = [];
        }
        teamsByGroupId[team.group].push({
          slot: team.slot,
          team: team.name,
          email: team.email,
        });
      }
  
      // Map groups to include their teams
      const groups: Group[] = stage.group.map((group: {_id: object; name: string}) => ({
        id: group._id.toString(),
        name: group.name,
        data: teamsByGroupId[group._id.toString()] || [],
      }));
  
      return groups;
    } catch (error) {
      console.log("Error fetching group data:", error);
      throw new Error("Failed to fetch group data.");
    }
  }
  
  

    export type Schedule = {
        id: string;
        matchNo: number;
        map: string;
        startTime: string;
        date: string;
    };
  
    export async function getScheduleData(groupId: string): Promise<Schedule[]> {
        try {
          const group = await GroupDB.findById(groupId).populate({
            path: "schedule",
            populate: {
              path: "event stage group",
            },
          });
      
          if (!group || !group.schedule) {
            throw new Error("Group or schedules not found.");
          }
      
          // Map schedule data into the required structure
          const schedules: Schedule[] = group.schedule.map((schedule: any) => ({
            id: schedule._id.toString(),
            matchNo: schedule.matchNo,
            map: schedule.map,
            startTime: schedule.startTime,
            date: schedule.date,
          }));
      
          return schedules;
        } catch (error) {
          console.log("Error fetching schedule data:", error);
          throw new Error("Failed to fetch schedule data.");
        }
      }