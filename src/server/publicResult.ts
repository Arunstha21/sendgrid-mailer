"use server";
import connect from "@/lib/database/connect";
import { EventDB, ScheduleDB } from "@/lib/database/schema";
import mongoose, { ObjectId } from "mongoose";
import { getOverallResults as rawGetOverallResults, getPerMatchResults as rawGetPerMatchResults, PlayerResult, TeamResult } from "./match";
import { cache } from "react";

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
    teamResults: TeamResult[];
    playerResults: PlayerResult[];
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
}

const getPerMatchResults = cache(rawGetPerMatchResults);
const getOverallResults = cache(rawGetOverallResults);

export const getEventData = cache(async (): Promise<EventData[]> => {
  const events = await EventDB.find({ isPublic: true })
    .populate({
      path: "stage",
      populate: {
        path: "group",
      },
    });

  return events.map((event: any) => ({
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
  })) as EventData[];
});

export const getData = cache(async (): Promise<{ groups: { isMultiGroup: boolean; groups: GroupAndSchedule[] }[] }> => {
  const scheduleData = await ScheduleDB.aggregate([
    { $lookup: { from: "groups", localField: "group", foreignField: "_id", as: "groups" } },
    { $lookup: { from: "events", localField: "event", foreignField: "_id", as: "eventData" } },
    { $unwind: "$eventData" },
    { $match: { "eventData.isPublic": true } },
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
    { $sort: { matchNo: 1 } },
  ]).exec();

  const grouped = new Map<string, { id: string; name: string; matchIds: string[]; schedules: any[] }>();

  for (const schedule of scheduleData) {
    const groupKey = schedule.groups.length === 1
      ? schedule.groups[0]._id.toString()
      : schedule.groups.map((g: any) => g._id.toString()).join(";");

    const groupName = schedule.groups.length === 1
      ? schedule.groups[0].name
      : schedule.groups.map((g: any) => g.name).join(" vs ");

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        id: groupKey,
        name: groupName,
        matchIds: [],
        schedules: [],
      });
    }

    if (schedule.match) {
      grouped.get(groupKey)!.matchIds.push(schedule.match);
      grouped.get(groupKey)!.schedules.push(schedule);
    }
  }

  const result: { isMultiGroup: boolean; groups: GroupAndSchedule[] }[] = [];

  for (const [groupKey, { id, name, matchIds, schedules }] of grouped.entries()) {
    try {
      const matchResults = await Promise.all(matchIds.map(getPerMatchResults));
      const afterMatchResults = await Promise.all(matchIds.map((_, i) => getOverallResults(matchIds.slice(0, i + 1))));

      const scheduleList = matchIds.map((matchId, index) => {
        const s = schedules.find(s => s.match === matchId);
        if (!s) return null;
        return {
          id: s._id.toString(),
          matchNo: s.matchNo,
          map: s.map,
          matchData: matchResults[index],
          afterMatchData: afterMatchResults[index],
        };
      }).filter(Boolean) as Schedule[];

      result.push({
        isMultiGroup: name.includes(" vs "),
        groups: [{ id, name, schedule: scheduleList }],
      });
    } catch (e) {
      console.error(`Failed to process group ${groupKey}`, e);
    }
  }

  return { groups: result };
});

const getGroupDataCached = cache(async (groupId: string): Promise<{ isMultiGroup: boolean; groups: GroupAndSchedule[] }> => {
  const scheduleData = await ScheduleDB.aggregate([
    { $match: { group: { $in: [new mongoose.Types.ObjectId(groupId)] } } },
    { $lookup: { from: "groups", localField: "group", foreignField: "_id", as: "groups" } },
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
            in: { _id: "$$g._id", name: "$$g.name" },
          },
        },
      },
    },
    { $sort: { matchNo: 1 } },
  ]);

  if (!scheduleData.length) throw new Error("No schedule data");

  const groupName = scheduleData[0].groups.length === 1
    ? scheduleData[0].groups[0].name
    : scheduleData[0].groups.map((g: any) => g.name).join(" vs ");

  const matches = scheduleData.filter(s => s.match).map(s => s.match);

  if (!matches.length) throw new Error("No matches found");

  const matchResults = await Promise.all(matches.map(getPerMatchResults));
  const afterMatchResults = await Promise.all(matches.map((_, i) => getOverallResults(matches.slice(0, i + 1))));

  const scheduleList = matches.map((matchId, index) => {
    const s = scheduleData.find(s => s.match && s.match.toString() === matchId.toString());
    if (!s) return null;
    return {
      id: s._id.toString(),
      matchNo: s.matchNo,
      map: s.map,
      matchData: matchResults[index],
      afterMatchData: afterMatchResults[index],
    };
  }).filter(Boolean) as Schedule[];

  return {
    isMultiGroup: scheduleData[0].groups.length > 1,
    groups: [{ id: groupId, name: groupName, schedule: scheduleList }],
  };
});

export async function getGroupData(groupId: string): Promise<
  { status: "Success"; isMultiGroup: boolean; groups: GroupAndSchedule[] } |
  { status: "Error"; message: string; isMultiGroup: false; groups: [] }
> {
  try {
    const result = await getGroupDataCached(groupId);
    return { status: "Success", ...result };
  } catch (error: any) {
    console.error("getGroupData error", error);
    return { status: "Error", message: error.message, isMultiGroup: false, groups: [] };
  }
}

export const getMissingGroups = cache(async (): Promise<string[]> => {
  const allData = await getData();
  return allData.groups.filter(g => !g.groups.length).map(g => g.groups[0].id);
});
