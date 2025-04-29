"use server";
import connect from "@/lib/database/connect";
import { EventDB, MatchDB, PlayerStatsDB, PointDB, ScheduleDB, TeamStatsDB } from "@/lib/database/schema";
import mongoose, { ObjectId } from "mongoose";

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


export interface TeamResult {
    team: string;
    kill: number;
    damage: number;
    placePoint: number;
    totalPoint: number;
    wwcd: number;
    matchesPlayed: number;
    cRank?: number;
    lastMatchRank?: number;
}
  
export interface PlayerResult {
inGameName: string;
uId: string;
teamName: string;
kill: number;
damage: number;
survivalTime: number;
avgSurvivalTime: number;
assists: number;
heal: number;
matchesPlayed: number;
cRank?: number;
mvp: number;
}

export const getPerMatchResults = async (
    matchId: string
    ): Promise<{status: string; message: string; teamResults: TeamResult[]; playerResults: PlayerResult[] }> => {
    try {
      const objectId = matchId;
  
      // Fetch schedule document to retrieve match number
      const scheduleDoc : ScheduleDoc | null = await ScheduleDB.findOne({ match: objectId })
        .populate("group stage event")
        .lean<ScheduleDoc>();
      if (!scheduleDoc) {
        return {status: "error", message: "Schedule not found for the match", teamResults: [], playerResults: []};
      }
  
      const pointId = scheduleDoc.event.pointSystem;
  
      const pointSystem = await PointDB.findById(pointId);
      
      // Fetch team and player stats for the match
      const [teamStats, playerStats] = await Promise.all([
        TeamStatsDB.find({ match: objectId })
          .populate({ path: "team", select: "name group slot dq", strictPopulate: false })
          .lean(),
          PlayerStatsDB.find({ match: objectId })
          .populate({
            path: "player",
            select: "name uid team",
            populate: {
              path: "team",
              select: "name group",
              strictPopulate: false,
            },
            strictPopulate: false,
          })
          .lean()
      ]);
  
      // Aggregate team stats
      const teamResultsMap: Record<string, TeamResult> = {};
  
      for (const stat of teamStats) {
        const teamId = stat.team.slot;
        if(stat.team.dq === true){
          continue;
        }
        if (!teamResultsMap[teamId]) {
          teamResultsMap[teamId] = {
            team: textDecoder(stat.team.name) || "Unknown Team",
            kill: 0,
            damage: 0,
            placePoint: 0,
            totalPoint: 0,
            wwcd: 0,
            matchesPlayed: 0,
          };
        }
  
        const teamData = teamResultsMap[teamId];
        teamData.kill += stat.killNum;
        teamData.damage += stat.damage;
        teamData.wwcd += stat.rank === 1 ? 1 : 0;
        teamData.matchesPlayed += 1;
  
        teamData.placePoint = pointSystem.pointSystem.find((point: {rank:number; point: number; _id: ObjectId}) => point.rank === stat.rank)?.point || 0;
        teamData.totalPoint = teamData.placePoint + teamData.kill;
      }
  
      const teamResults = Object.values(teamResultsMap);
  
      // Sort and rank team results
      teamResults.sort((a, b) => {
        if (a.totalPoint !== b.totalPoint) return b.totalPoint - a.totalPoint;
        if (a.placePoint !== b.placePoint) return b.placePoint - a.placePoint;
        if (a.kill !== b.kill) return b.kill - a.kill;
        return a.team.localeCompare(b.team);
      });
  
      teamResults.forEach((item, index) => {
        item.cRank = index + 1;
      });
  
      let totalSurvivalTime = 0;
      let totalDamage = 0;
      let totalKills = 0;
  
      // Aggregate player stats
      const playerResultsMap: Record<string, PlayerResult> = {};
  
      for (const stat of playerStats) {
        const playerId = stat.player._id.toString();
        if (!playerResultsMap[playerId]) {
          playerResultsMap[playerId] = {
            inGameName: textDecoder(stat.player.name) || "Unknown Player",
            uId: stat.player.uid || "N/A",
            teamName: textDecoder(stat.player.team.name) || "Unknown Team",
            kill: 0,
            damage: 0,
            survivalTime: 0,
            avgSurvivalTime: 0,
            assists: 0,
            heal: 0,
            matchesPlayed: 0,
            mvp: 0,
          };
        }
  
        const playerData = playerResultsMap[playerId];
        playerData.kill += stat.killNum;
        playerData.damage += stat.damage;
        playerData.survivalTime += stat.survivalTime;
        playerData.assists += stat.assists;
        playerData.heal += stat.heal;
        playerData.matchesPlayed += 1;
  
        totalSurvivalTime += stat.survivalTime;
        totalDamage += stat.damage;
        totalKills += stat.killNum;
      }
      for (const playerId in playerResultsMap) {
        const playerSurvivalTimeRatio = playerResultsMap[playerId].survivalTime / totalSurvivalTime;
        const playerDamageRatio = playerResultsMap[playerId].damage / totalDamage;
        const playerKillRatio = playerResultsMap[playerId].kill / totalKills;
  
        playerResultsMap[playerId].avgSurvivalTime = playerResultsMap[playerId].survivalTime / playerResultsMap[playerId].matchesPlayed;
        playerResultsMap[playerId].mvp = parseFloat((
            (playerSurvivalTimeRatio * 0.4 +
              playerDamageRatio * 0.4 +
              playerKillRatio * 0.2) *
            100
          ).toFixed(3));
      }
      const playerResults = Object.values(playerResultsMap);
  
      // Sort and rank player results
      playerResults.sort((a, b) => {
        if(a.mvp !== b.mvp) return b.mvp - a.mvp;
        if (a.kill !== b.kill) return b.kill - a.kill;
        if (a.damage !== b.damage) return b.damage - a.damage;
        return b.survivalTime - a.survivalTime;
      });
  
      playerResults.forEach((item, index) => {
        item.cRank = index + 1;
      });
  
      return {status: "success", message: "Successfull", teamResults, playerResults };
    } catch (error) {
      console.log("Error fetching per-match results:", error);
      return {status: "error", message: "Error fetching per-match results", teamResults: [], playerResults: []};
    }
};

export const getOverallResults = async (
    matchIds: string[]
  ): Promise<{ status: string; message: string; teamResults: TeamResult[]; playerResults: PlayerResult[] }> => {
    try {
      const objectIds = matchIds.map((id) => id);
      const validMatches = await MatchDB.find({ _id: { $in: objectIds } });
      const scheduleDoc : ScheduleDoc | null = await ScheduleDB.findOne({ match: objectIds[0] })
      .populate("group stage event")
      .lean<ScheduleDoc>();
    if (!scheduleDoc) {
      return {status: "error", message: "Schedule not found for the match", teamResults: [], playerResults: []};
    }
      const pointId = scheduleDoc.event.pointSystem;
      const pointSystem = await PointDB.findById(pointId);

      if (validMatches.length !== objectIds.length) {
        return {status: "error", message: "Invalid match IDs provided", teamResults: [], playerResults: []};
      }

      const validMatchIds = validMatches.map((match) => match._id);
      
      const [teamStats, playerStats] = await Promise.all([
        TeamStatsDB.find({ match: { $in: validMatchIds } })
            .populate({ path: "team", select: "name group slot dq", strictPopulate: false })
            .lean(),
        PlayerStatsDB.find({ match: { $in: validMatchIds } })
            .populate({
                path: "player",
                select: "name uid team",
                populate: {
                    path: "team",
                    select: "name group",
                    strictPopulate: false,
                },
                strictPopulate: false,
            })
            .lean()
    ]);
    
  
      // Aggregate team stats
      const teamResultsMap: Record<string, TeamResult> = {};
  
      for (const stat of teamStats) {        
        const teamId = stat.team._id.toString();
        if(stat.team.dq === true){
          continue;
        }
        if (!teamResultsMap[teamId]) {
          teamResultsMap[teamId] = {
            team: textDecoder(stat.team.name) || "Unknown Team",
            kill: 0,
            damage: 0,
            placePoint: 0,
            totalPoint: 0,
            wwcd: 0,
            matchesPlayed: 0,
            lastMatchRank: stat.rank,
          };
        }
  
        const teamData = teamResultsMap[teamId];
        teamData.kill += stat.killNum;
        teamData.damage += stat.damage;
        teamData.placePoint += pointSystem.pointSystem.find((point: {rank:number; point: number; _id: ObjectId}) => point.rank === stat.rank)?.point || 0;
        teamData.totalPoint = teamData.placePoint + teamData.kill;
        teamData.wwcd += stat.rank === 1 ? 1 : 0;
        teamData.matchesPlayed += 1;
        teamData.lastMatchRank = stat.rank;
      }
  
      const teamResults = Object.values(teamResultsMap);
  
      // Sort and rank team results
      teamResults.sort((a, b) => {
        if (a.totalPoint !== b.totalPoint) return b.totalPoint - a.totalPoint;
        if (a.wwcd !== b.wwcd) return b.wwcd - a.wwcd;
        if (a.placePoint !== b.placePoint) return b.placePoint - a.placePoint;
        if (a.kill !== b.kill) return b.kill - a.kill;
        if (a.lastMatchRank && b.lastMatchRank && a.lastMatchRank !== b.lastMatchRank) return a.lastMatchRank - b.lastMatchRank;
        if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
        return a.team.localeCompare(b.team);
      });
  
      teamResults.forEach((item, index) => {
        item.cRank = index + 1;
      });

      const playerResultsMap: Record<string, PlayerResult> = {};
      const matchTotals: Record<string, { survivalTime: number, damage: number, kills: number }> = {};
      const playerMatchStats: Record<string, Record<string, { survivalTime: number, damage: number, kills: number }>> = {};

      for (const stat of playerStats) {
          const playerId = stat.player._id.toString();
          const matchId = stat.match.toString();

          if (!playerResultsMap[playerId]) {
              playerResultsMap[playerId] = {
                  inGameName: textDecoder(stat.player.name) || "Unknown Player",
                  uId: stat.player.uid || "N/A",
                  teamName: textDecoder(stat.player.team.name) || "Unknown Team",
                  kill: 0,
                  damage: 0,
                  survivalTime: 0,
                  avgSurvivalTime: 0,
                  assists: 0,
                  heal: 0,
                  matchesPlayed: 0,
                  mvp: 0,
              };
          }

          // Track per-match totals (for later MVP calculation)
          if (!matchTotals[matchId]) {
              matchTotals[matchId] = { survivalTime: 0, damage: 0, kills: 0 };
          }
          matchTotals[matchId].survivalTime += stat.survivalTime;
          matchTotals[matchId].damage += stat.damage;
          matchTotals[matchId].kills += stat.killNum;

          // Track per-player per-match stats (for ratios)
          if (!playerMatchStats[matchId]) playerMatchStats[matchId] = {};
          if (!playerMatchStats[matchId][playerId]) {
              playerMatchStats[matchId][playerId] = { survivalTime: 0, damage: 0, kills: 0 };
          }
          playerMatchStats[matchId][playerId].survivalTime += stat.survivalTime;
          playerMatchStats[matchId][playerId].damage += stat.damage;
          playerMatchStats[matchId][playerId].kills += stat.killNum;

          const playerData = playerResultsMap[playerId];
          playerData.kill += stat.killNum;
          playerData.damage += stat.damage;
          playerData.survivalTime += stat.survivalTime;
          playerData.assists += stat.assists;
          playerData.heal += stat.heal;
          playerData.matchesPlayed += 1;
      }

      // Calculate MVP for each player in each match
      for (const matchId in playerMatchStats) {
          const matchTotal = matchTotals[matchId];

          for (const playerId in playerMatchStats[matchId]) {
              const playerStat = playerMatchStats[matchId][playerId];

              const survivalRatio = playerStat.survivalTime / matchTotal.survivalTime;
              const damageRatio = playerStat.damage / matchTotal.damage;
              const killRatio = playerStat.kills / matchTotal.kills;

              const mvpRating = survivalRatio * 0.4 + damageRatio * 0.4 + killRatio * 0.2;

              // Add MVP score to player's total
              playerResultsMap[playerId].mvp += mvpRating;
          }
      }

      for (const playerId in playerResultsMap) {
          playerResultsMap[playerId].avgSurvivalTime = playerResultsMap[playerId].survivalTime / playerResultsMap[playerId].matchesPlayed;
          playerResultsMap[playerId].mvp = parseFloat((playerResultsMap[playerId].mvp * 10).toFixed(3));
      }

      const playerResults = Object.values(playerResultsMap);
      
      // Sort and rank player results
      playerResults.sort((a, b) => {
        if(a.mvp !== b.mvp) return b.mvp - a.mvp;
        if (a.kill !== b.kill) return b.kill - a.kill;
        if (a.damage !== b.damage) return b.damage - a.damage;
        return b.survivalTime - a.survivalTime;
      });
  
      playerResults.forEach((item, index) => {
        item.cRank = index + 1;
      });
  
      return {status: "success", message: "Successfull", teamResults, playerResults };
    } catch (error) {
      console.log("Error fetching overall results:", error);
      return {status: "error", message: "Error fetching overall results", teamResults: [], playerResults: []};
    }
};
  
function textDecoder(text: string) {
return new TextDecoder().decode(new Uint8Array([...text].map(char => char.charCodeAt(0))));
}