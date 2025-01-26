"use server";

import {
    EventDB,
  MatchDB,
  PlayerDB,
  PlayerStatsDB,
  PointDB,
  ScheduleDB,
  TeamStatsDB,
} from "@/lib/database/schema";
import { ObjectId } from "mongoose";

interface Location {
  x: number;
  y: number;
  z: number;
}

interface Player {
  uId: number;
  playerName: string;
  playerOpenId: string;
  picUrl: string;
  showPicUrl: boolean;
  teamId: number;
  teamName: string;
  character: string;
  isFiring: boolean;
  bHasDied: boolean;
  location: Location;
  health: number;
  healthMax: number;
  liveState: number;
  killNum: number;
  killNumBeforeDie: number;
  playerKey: number;
  gotAirDropNum: number;
  maxKillDistance: number;
  damage: number;
  killNumInVehicle: number;
  killNumByGrenade: number;
  AIKillNum: number;
  BossKillNum: number;
  rank: number;
  isOutsideBlueCircle: boolean;
  inDamage: number;
  heal: number;
  headShotNum: number;
  survivalTime: number;
  driveDistance: number;
  marchDistance: number;
  assists: number;
  outsideBlueCircleTime: number;
  knockouts: number;
  rescueTimes: number;
  useSmokeGrenadeNum: number;
  useFragGrenadeNum: number;
  useBurnGrenadeNum: number;
  useFlashGrenadeNum: number;
  PoisonTotalDamage: number;
  UseSelfRescueTime: number;
  UseEmergencyCallTime: number;
}

interface Team {
    teamId: number,
    teamName: string,
    isShowLogo: boolean,
    logoPicUrl: string, 
    killNum: number,
    liveMemberNum: number
}

export interface MatchData {
  allinfo: {
    TotalPlayerList: Player[];
    GameID: string;
    GameStartTime: string;
    FightingStartTime: string;
    FinishedStartTime: string;
    CurrentTime: string;
    TeamInfoList: Team[];
  };
}

function textDecoder(text: string) {
  return new TextDecoder().decode(new Uint8Array([...text].map(char => char.charCodeAt(0))));
}

export const updateGameData = async (
  data: MatchData,
  scheduleId: string
): Promise<{status: string; message: string}> => {
  try {
    const {
      GameID,
      GameStartTime,
      FightingStartTime,
      FinishedStartTime,
      CurrentTime,
      TotalPlayerList,
      TeamInfoList
    } = data.allinfo;
    

    const gameExists = await MatchDB.findOne({ gameId: GameID });
    if (gameExists) {
      return { status: "error", message: "Game data already exists" };
    }

    const schedule = await ScheduleDB.findById(scheduleId).populate({path: "group", strictPopulate: false});
    if (!schedule) {
      return { status: "error", message: "Schedule not found" };
    }

    const event = await EventDB.findById(schedule.event);

    // Update MatchDB
    const matchData = {
      schedule: scheduleId,
      gameId: GameID,
      gameGlobalInfo: {
        GameStartTime,
        FightingStartTime,
        FinishedStartTime,
        CurrentTime,
      },
      teamInfo: TeamInfoList,
      playerInfo: TotalPlayerList,
      pointSystem: event.pointSystem,
    };

    const match = await MatchDB.findOneAndUpdate(
      { gameId: GameID },
      { $set: matchData },
      { upsert: true, new: true }
    );

    if (!match) {
      return { status: "error", message: "Error updating match data" };
    }


    schedule.match = match._id;
    await schedule.save();
    
    let teams: string[] = [];
    if (Array.isArray(schedule.group)) {
      for (const group of schedule.group) {
        if (group.team) {
          teams = teams.concat(group.team);
        }
      }
    } else {
      throw new Error("Expected schedule.group to be an array, but found otherwise.");
    }

    let unregisteredPlayers: string[] = [];
    
    teams.forEach(async (team: string) => {
      const playerList = await PlayerDB.find({ team });
      
      const teamStatsMap: Record<string, any> = {};
      const playerMap = new Map(playerList.map((p) => [p.uid.toString(), p]));
      
      for (const player of TotalPlayerList){
        
        const playerData = playerMap.get(player.uId.toString());
        // const playerData = playerList.find((p) =>{p.uid.toString() === player.uId.toString()});
        if (!playerData) {
          unregisteredPlayers = [...unregisteredPlayers, player.uId.toString()];
          continue;
        }

        const playerStats = {
          player: playerData._id,
          match: match._id,
          killNum: player.killNum,
          killNumBeforeDie: player.killNumBeforeDie,
          gotAirDropNum: player.gotAirDropNum,
          maxKillDistance: player.maxKillDistance,
          damage: player.damage,
          killNumInVehicle: player.killNumInVehicle,
          killNumByGrenade: player.killNumByGrenade,
          AIKillNum: player.AIKillNum,
          BossKillNum: player.BossKillNum,
          rank: player.rank,
          inDamage: player.inDamage,
          heal: player.heal,
          headShotNum: player.headShotNum,
          survivalTime: player.survivalTime,
          driveDistance: player.driveDistance,
          marchDistance: player.marchDistance,
          assists: player.assists,
          knockouts: player.knockouts,
          rescueTimes: player.rescueTimes,
          useSmokeGrenadeNum: player.useSmokeGrenadeNum,
          useFragGrenadeNum: player.useFragGrenadeNum,
          useBurnGrenadeNum: player.useBurnGrenadeNum,
          useFlashGrenadeNum: player.useFlashGrenadeNum,
          PoisonTotalDamage: player.PoisonTotalDamage,
          UseSelfRescueTime: player.UseSelfRescueTime,
          UseEmergencyCallTime: player.UseEmergencyCallTime,
        }

        await PlayerStatsDB.findOneAndUpdate(
          { player: playerData._id, match: match._id },
          { $set: playerStats },
          { upsert: true }
        );

        const teamId = playerData.team.toString();
        if (!teamStatsMap[teamId]) {
          teamStatsMap[teamId] = {
            team: playerData.team,
            match: match._id,
            killNum: 0,
            killNumBeforeDie: 0,
            gotAirDropNum: 0,
            maxKillDistance: 0,
            damage: 0,
            killNumInVehicle: 0,
            killNumByGrenade: 0,
            AIKillNum: 0,
            BossKillNum: 0,
            rank: player.rank,
            inDamage: 0,
            heal: 0,
            headShotNum: 0,
            survivalTime: 0,
            driveDistance: 0,
            marchDistance: 0,
            assists: 0,
            knockouts: 0,
            rescueTimes: 0,
            useSmokeGrenadeNum: 0,
            useFragGrenadeNum: 0,
            useBurnGrenadeNum: 0,
            useFlashGrenadeNum: 0,
            PoisonTotalDamage: 0,
            UseSelfRescueTime: 0,
            UseEmergencyCallTime: 0,
          };
        }
        
        const teamStats = teamStatsMap[teamId];
        
        teamStats.killNum += player.killNum;
        teamStats.killNumBeforeDie += player.killNumBeforeDie;
        teamStats.gotAirDropNum += player.gotAirDropNum;
        teamStats.maxKillDistance = Math.max(teamStats.maxKillDistance, player.maxKillDistance);
        teamStats.damage += player.damage;
        teamStats.killNumInVehicle += player.killNumInVehicle;
        teamStats.killNumByGrenade += player.killNumByGrenade;
        teamStats.AIKillNum += player.AIKillNum;
        teamStats.BossKillNum += player.BossKillNum;
        teamStats.rank = Math.min(teamStats.rank, player.rank);
        teamStats.inDamage += player.inDamage;
        teamStats.heal += player.heal;
        teamStats.headShotNum += player.headShotNum;
        teamStats.survivalTime += player.survivalTime;
        teamStats.driveDistance += player.driveDistance;
        teamStats.marchDistance += player.marchDistance;
        teamStats.assists += player.assists;
        teamStats.knockouts += player.knockouts;
        teamStats.rescueTimes += player.rescueTimes;
        teamStats.useSmokeGrenadeNum += player.useSmokeGrenadeNum;
        teamStats.useFragGrenadeNum += player.useFragGrenadeNum;
        teamStats.useBurnGrenadeNum += player.useBurnGrenadeNum;
        teamStats.useFlashGrenadeNum += player.useFlashGrenadeNum;
        teamStats.PoisonTotalDamage += player.PoisonTotalDamage;
        teamStats.UseSelfRescueTime += player.UseSelfRescueTime;
        teamStats.UseEmergencyCallTime += player.UseEmergencyCallTime;
        
      };

    for (const teamId in teamStatsMap) {
      await TeamStatsDB.findOneAndUpdate(
        { team: teamStatsMap[teamId].team, match: teamStatsMap[teamId].match },
        { $set: teamStatsMap[teamId] },
        { upsert: true }
      );
    }
      });

      console.log("Unregistered players:", unregisteredPlayers);
    return { status: "success", message: "Game data successfully updated!" };
  } catch (error) {
    console.log("Error updating game data:", error);
    
    return { status: "error", message: "Error updating game data" };
  }
};

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
}

/**
 * Fetch and calculate overall results for the given match IDs.
 */
export const getOverallResults = async (
    matchIds: string[]
  ): Promise<{ teamResults: TeamResult[]; playerResults: PlayerResult[] }> => {
    try {
      const objectIds = matchIds.map((id) => id);
      const validMatches = await MatchDB.find({ _id: { $in: objectIds } });
      const scheduleDoc : ScheduleDoc | null = await ScheduleDB.findOne({ match: objectIds[0] })
      .populate("group stage event")
      .lean<ScheduleDoc>();
    if (!scheduleDoc) {
      throw new Error("Schedule not found for the match");
    }
      const pointId = scheduleDoc.event.pointSystem;
      const pointSystem = await PointDB.findById(pointId);

      if (validMatches.length !== objectIds.length) {
        throw new Error("Invalid match IDs provided");
      }

      const validMatchIds = validMatches.map((match) => match._id);
      
      // Fetch all relevant team stats
      const teamStats = await TeamStatsDB.find({ match: { $in: validMatchIds } })
        .populate({ path: "team", select: "name group slot", strictPopulate: false })
        .lean();
      
      // Fetch all relevant player stats
      const playerStats = await PlayerStatsDB.find({ match: { $in: validMatchIds } })
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
      .lean();
  
      // Aggregate team stats
      const teamResultsMap: Record<string, TeamResult> = {};
  
      for (const stat of teamStats) {        
        const teamId = stat.team._id.toString();
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
          };
        }
  
        const playerData = playerResultsMap[playerId];
        playerData.kill += stat.killNum;
        playerData.damage += stat.damage;
        playerData.survivalTime += stat.survivalTime;
        playerData.assists += stat.assists;
        playerData.heal += stat.heal;
        playerData.matchesPlayed += 1;
      }

      for (const playerId in playerResultsMap) {
        playerResultsMap[playerId].avgSurvivalTime = playerResultsMap[playerId].survivalTime / playerResultsMap[playerId].matchesPlayed;
      }
      const playerResults = Object.values(playerResultsMap);
      
      // Sort and rank player results
      playerResults.sort((a, b) => {
        if (a.kill !== b.kill) return b.kill - a.kill;
        if (a.damage !== b.damage) return b.damage - a.damage;
        return b.survivalTime - a.survivalTime;
      });
  
      playerResults.forEach((item, index) => {
        item.cRank = index + 1;
      });
  
      return { teamResults, playerResults };
    } catch (error) {
      console.log("Error fetching overall results:", error);
      throw new Error("Error fetching overall results");
    }
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


  export const getPerMatchResults = async (
    matchId: string
  ): Promise<{ teamResults: TeamResult[]; playerResults: PlayerResult[] }> => {
    try {
      const objectId = matchId;
  
      // Fetch schedule document to retrieve match number
      const scheduleDoc : ScheduleDoc | null = await ScheduleDB.findOne({ match: objectId })
        .populate("group stage event")
        .lean<ScheduleDoc>();
      if (!scheduleDoc) {
        throw new Error("Schedule not found for the match");
      }

      const pointId = scheduleDoc.event.pointSystem;

      const pointSystem = await PointDB.findById(pointId);
      
      // Fetch team and player stats for the match
      const [teamStats, playerStats] = await Promise.all([
        TeamStatsDB.find({ match: objectId })
          .populate({ path: "team", select: "name group slot", strictPopulate: false })
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
          };
        }
  
        const playerData = playerResultsMap[playerId];
        playerData.kill += stat.killNum;
        playerData.damage += stat.damage;
        playerData.survivalTime += stat.survivalTime;
        playerData.assists += stat.assists;
        playerData.heal += stat.heal;
        playerData.matchesPlayed += 1;
      }
      for (const playerId in playerResultsMap) {
        playerResultsMap[playerId].avgSurvivalTime = playerResultsMap[playerId].survivalTime / playerResultsMap[playerId].matchesPlayed;
      }
      const playerResults = Object.values(playerResultsMap);
  
      // Sort and rank player results
      playerResults.sort((a, b) => {
        if (a.kill !== b.kill) return b.kill - a.kill;
        if (a.damage !== b.damage) return b.damage - a.damage;
        return b.survivalTime - a.survivalTime;
      });
  
      playerResults.forEach((item, index) => {
        item.cRank = index + 1;
      });
  
      return { teamResults, playerResults };
    } catch (error) {
      console.log("Error fetching per-match results:", error);
      throw new Error("Error fetching per-match results");
    }
  };
  

  export const getMatchData = async (
    scheduleIds: string[]
  ): Promise<{
    matchExists: boolean;
    data: { teamResults: TeamResult[]; playerResults: PlayerResult[] } | null;
  }> => {
    try {
      const schedules = await ScheduleDB.find({ _id: { $in: scheduleIds } });
  
      if (schedules.length === 1) {
        const schedule = schedules[0];
  
        if (!schedule.match) {
          return { matchExists: false, data: null };
        } else {
          const match = await MatchDB.findOne({ _id: schedule.match });
          const data = await getPerMatchResults(match._id);
  
          return { matchExists: true, data };
        }
      } else if (schedules.length > 1) {
        const matchIds = schedules.map((s: any) => s.match);
        const data = await getOverallResults(matchIds);
  
        return { matchExists: true, data };
      } else {
        return { matchExists: false, data: null };
      }
    } catch (error) {
      console.log("Error fetching match data:", error);
      return { matchExists: false, data: null };
    }
  };
  
