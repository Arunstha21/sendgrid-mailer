"use server";
import connect from "@/lib/database/connect";
import { EventDB, ScheduleDB } from "@/lib/database/schema";
import mongoose, { ObjectId } from "mongoose";
import { getOverallResults, getPerMatchResults, PlayerResult, TeamResult } from "./match";

connect();

export type GroupAndSchedule = {
  id: string;
  name: string;
  schedule: Schedule[];
};
  
export type Schedule = {
  id: string;
  matchNo: number;
  matchData: {
      teamResults: TeamResult[], 
      playerResults: PlayerResult[]
  };
  afterMatchData: {
    teamResults: TeamResult[];
    playerResults: PlayerResult[];
  };
  map: string;
};

export interface Event {
  _id: ObjectId;
  name: string;
  stage: ObjectId[];
  __v: number;
  pointSystem: ObjectId;
}

export interface Stage {
  _id: ObjectId;
  name: string;
  event: ObjectId; 
  group: ObjectId[];
  __v: number;
}

export interface ScheduleDoc {
  _id: ObjectId;
  event: Event;
  stage: Stage;
  match: ObjectId;
}

export interface EventData {
    id: string;
    name: string;
    stages: {
        id: string;
        name: string;
        groups: {
            id: string;
            name: string;
        }[];
        }[];
};

export async function getEventData(): Promise<EventData[]> {
    const events = await EventDB.find({isPublic: true})
      .populate({
        path: "stage",
        populate: {
          path: "group",
        },
      });
  
    const data = events.map((event: any) => {
      return {
        id: event._id.toString(),
        name: event.name,
        stages: event.stage.map((stage: any) => ({
          id: stage._id.toString(),
          name: stage.name,
          groups: stage.group.map((group: any) => ({
            id: group._id.toString(),
            name: group.name,
          })),
        })),
      };
    });
    getData();
    return data as EventData[];
}  

const groupDataCache = new Map<string, { isMultiGroup: boolean; groups: GroupAndSchedule[] }>();
const missingGroupIds = new Set<string>();

export async function getData(): Promise<{ groups: { isMultiGroup: boolean; groups: GroupAndSchedule[] }[] }> {
  try {
    const scheduleData = await ScheduleDB.aggregate([
        // Lookup groups
        {
          $lookup: {
            from: "groups",
            localField: "group",
            foreignField: "_id",
            as: "groups",
          },
        },
        // Lookup event
        {
          $lookup: {
            from: "events",
            localField: "event",
            foreignField: "_id",
            as: "eventData",
          },
        },
        {
          $unwind: "$eventData"
        },
        {
          $match: {
            "eventData.isPublic": true,
          },
        },
        {
          $project: {
            _id: 1,
            matchNo: 1,
            map: 1,
            match: 1,
            "groups._id": 1,
            "groups.name": 1,
          },
        },
        {
          $sort: { matchNo: 1 },
        },
      ]).exec();
      

    const teamsByGroupId: Record<string, GroupAndSchedule> = {};
    const groupMatchMap: Record<string, string[]> = {};

    const checkedMissingGroups = new Set<string>();

    for (const schedule of scheduleData) {
      const groups = schedule.groups;

      const groupKey = groups.length === 1
        ? groups[0]._id.toString()
        : groups.map((g: { _id: object }) => g._id.toString()).join(";");
        
      const groupName = groups.length === 1
        ? groups[0].name
        : groups.map((g: { name: string }) => g.name).join(" vs ");

      if (!teamsByGroupId[groupKey]) {
        teamsByGroupId[groupKey] = {
          id: groupKey,
          name: groupName,
          schedule: [],
        };
        groupMatchMap[groupKey] = [];
      }

      if (!schedule.match && !checkedMissingGroups.has(groupKey)) {
        missingGroupIds.add(groupKey);
        checkedMissingGroups.add(groupKey);
      } else if (schedule.match) {
        groupMatchMap[groupKey].push(schedule.match);
      }
    }

    for (const groupKey in groupMatchMap) {
      if (groupDataCache.has(groupKey)) {
        continue;
      }

      try {
        const matches = groupMatchMap[groupKey];

        const matchPromises = matches.map((matchId) => getPerMatchResults(matchId));
        const afterMatchPromises = matches.map((_matchId, index) => getOverallResults(matches.slice(0, index + 1)));

        const [matchResults, afterMatchResults] = await Promise.all([
          Promise.all(matchPromises),
          Promise.all(afterMatchPromises)
        ]);

        const groupSchedules = matches.map((matchId, index) => {
          const schedule = scheduleData.find((s) => s.match && s.match === matchId);
          if (!schedule) return null;
          return {
            id: schedule._id.toString(),
            matchNo: schedule.matchNo,
            map: schedule.map,
            matchData: {
                teamResults: matchResults[index].teamResults,
                playerResults: matchResults[index].playerResults
            },
            afterMatchData: {
              teamResults: afterMatchResults[index].teamResults,
              playerResults: afterMatchResults[index].playerResults,
            },
          };
        }).filter(Boolean);

        const isMultiGroup = teamsByGroupId[groupKey].name.includes(" vs ");

        groupDataCache.set(groupKey, {
          isMultiGroup,
          groups: [{
            id: groupKey,
            name: teamsByGroupId[groupKey].name,
            schedule: groupSchedules.filter((schedule): schedule is Schedule => schedule !== null),
          }]
        });
        missingGroupIds.delete(groupKey);
        
      } catch (error) {
        console.error(`Failed to fetch data for group ${groupKey}:`, error);
        missingGroupIds.add(groupKey);
      }
    }

    console.log('Fetching data completed');
    return {
      groups: Array.from(groupDataCache.values()),
    };
  } catch (error) {
    console.error("Error fetching group and schedule data:", error);
    throw error;
  }
}

export async function getGroupData(groupId: string): Promise<{ status: "Success" | "Error"; isMultiGroup: boolean; groups: GroupAndSchedule[]; message?: string }> {
  if (groupDataCache.has(groupId)) {
    const data = groupDataCache.get(groupId) as { isMultiGroup: boolean; groups: GroupAndSchedule[] };
    return {status: "Success", ...data};
  }

  try {
    const scheduleData = await ScheduleDB.aggregate([
        { $match: { group: { $in: [new mongoose.Types.ObjectId(groupId)] } } },
        {
          $lookup: {
            from: "groups",
            localField: "group",
            foreignField: "_id",
            as: "groups",
          },
        },
        {
          $project: {
            _id: 1,
            matchNo: 1,
            map: 1,
            match: 1,
            groups: {
              $map: {
                input: "$groups",
                as: "g",
                in: {
                  _id: "$$g._id",
                  name: "$$g.name",
                },
              },
            },
          },
        },
        { $sort: { matchNo: 1 } },
      ]);      

    if (!scheduleData.length) return { status: "Error", message: "Schedule data doesn't exists",isMultiGroup: false, groups: [] };
    
    const groupName = scheduleData[0].groups.length === 1
      ? scheduleData[0].groups.name
      : scheduleData[0].groups.map((g: { name: string }) => g.name).join(" vs ");

    const isMultiGroup = scheduleData[0].groups.length > 1;

    const matches = scheduleData.filter(s => s.match).map((s) => s.match);

    if (!matches.length) {
      missingGroupIds.add(groupId);
      return { status: "Error", message: "Matches data doesn't exists",isMultiGroup: false, groups: [] };
    }

    const matchPromises = matches.map((matchId) => getPerMatchResults(matchId));
    const afterMatchPromises = matches.map((_matchId, index) => getOverallResults(matches.slice(0, index + 1)));

    const [matchResults, afterMatchResults] = await Promise.all([
      Promise.all(matchPromises),
      Promise.all(afterMatchPromises)
    ]);

    const groupSchedules = matches.map((matchId, index) => {
      const schedule = scheduleData.find((s) => s.match && s.match.toString() === matchId.toString());
      if (!schedule) return null;
      return {
        id: schedule._id.toString(),
        matchNo: schedule.matchNo,
        map: schedule.map,
        matchData: {
            teamResults: matchResults[index].teamResults,
            playerResults: matchResults[index].playerResults
        },
        afterMatchData: {
          teamResults: afterMatchResults[index].teamResults,
          playerResults: afterMatchResults[index].playerResults,
        },
      };
    }).filter(Boolean);

    const groupResult = {
      isMultiGroup,
      groups: [{
        id: groupId,
        name: groupName,
        schedule: groupSchedules.filter((schedule): schedule is Schedule => schedule !== null),
      }]
    };

    groupDataCache.set(groupId, groupResult);
    missingGroupIds.delete(groupId);

    return { status: "Success", ...groupResult };
  } catch (error) {
    console.error("Error fetching group data:", error);
    missingGroupIds.add(groupId);
    return { status: "Error", message: "Error fetching group data", isMultiGroup: false, groups: [] };
  }
}

export async function getMissingGroups(): Promise<string[]> {
  return Array.from(missingGroupIds);
}