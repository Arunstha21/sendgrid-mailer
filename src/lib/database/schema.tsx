import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    superUser: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const eventSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  stage: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Stage",
    },
  ],
  pointSystem: {
    type: Schema.Types.ObjectId,
    ref: "Point",
  }
});

const stageSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  event: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Event",
  },
  group: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Group",
    },
  ],
});

const groupSchema = new Schema({
  event: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Event",
  },
  stage: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Stage",
  },
  schedule: [
    {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
    },
  ],
  name: {
    type: String,
    required: true,
  },
  team: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Team",
    },
  ],
});

const teamSchema = new Schema({
  event: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Event",
  },
  stage: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Stage",
  },
  group: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Group",
  },
  slot: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  player: [{
    type: Schema.Types.ObjectId,
    ref: "Player",
  }]
});

const playerSchema = new Schema({
  team: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Team",
  },
  name: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
});

const scheduleSchema = new Schema({
  event: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Event",
  },
  stage: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Stage",
  },
  group: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Group",
  },
  matchNo: {
    type: Number,
    required: true,
  },
  map: {
    type: String,
    enum: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Karakin", "Livik"],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  match:{
    type: Schema.Types.ObjectId,
    ref: "Match",
  }
});

const matchSchema = new Schema({
  group: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Group",
  },
  schedule: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Schedule",
  },
  gameId: {
    type: String,
    required: true,
  },
  playerInfo: [
    {
      type: Object,
      required: true,
    },
  ],
  teamInfo: [
    {
      type: Object,
      required: true,
    },
  ],
  gameGlobalInfo: {
    type: Object,
    required: true,
  },
  pointSystem: {
    type: Schema.Types.ObjectId,
    ref: "Point",
    required: true,
  },
});

const pointSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  pointSystem: {
    type: Object,
    required: true,
  },
});

const playerStatsSchema = new Schema({
    player: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Player",
    },
    match: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Match",
    },
    killNum: {
        type: Number,
        required: true,
    },
    killNumBeforeDie: {
        type: Number,
        required: true,
    },
    gotAirDropNum: {
        type: Number,
        required: true,
    },
    maxKillDistance:{
        type: Number,
        required: true,
    },
    damage: {
        type: Number,
        required: true,
    },
    killNumInVehicle: {
        type: Number,
        required: true,
    },
    killNumByGrenade: {
        type: Number,
        required: true,
    },
    AIKillNum :{
        type: Number,
        required: true,
    },
    BossKillNum: {
        type: Number,
        required: true,
    },
    rank: {
        type: Number,
        required: true,
    },
    inDamage: {
        type: Number,
        required: true,
    },
    heal: {
        type: Number,
        required: true,
    },
    headShotNum: {
        type: Number,
        required: true,
    },
    survivalTime: {
        type: Number,
        required: true,
    },
    driveDistance: {
        type: Number,
        required: true,
    },
    marchDistance: {
        type: Number,
        required: true,
    },
    assists: {
        type: Number,
        required: true,
    },
    knockouts: {
        type: Number,
        required: true,
    },
    rescueTimes: {
        type: Number,
        required: true,
    },
    useSmokeGrenadeNum: {
        type: Number,
        required: true,
    },
    useFragGrenadeNum: {
        type: Number,
        required: true,
    },
    useBurnGrenadeNum: {
        type: Number,
        required: true,
    },
    useFlashGrenadeNum: {
        type: Number,
        required: true,
    },
    PoisonTotalDamage: {
        type: Number,
        required: true,
    },
    UseSelfRescueTime: {
        type: Number,
        required: true,
    },
    UseEmergencyCallTime: {
        type: Number,
        required: true,
    },

});

const teamStatsSchema = new Schema({
    team: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Team",
    },
    match: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Match",
    },
    killNum: {
        type: Number,
        required: true,
    },
    killNumBeforeDie: {
        type: Number,
        required: true,
    },
    gotAirDropNum: {
        type: Number,
        required: true,
    },
    maxKillDistance:{
        type: Number,
        required: true,
    },
    damage: {
        type: Number,
        required: true,
    },
    killNumInVehicle: {
        type: Number,
        required: true,
    },
    killNumByGrenade: {
        type: Number,
        required: true,
    },
    AIKillNum :{
        type: Number,
        required: true,
    },
    BossKillNum: {
        type: Number,
        required: true,
    },
    rank: {
        type: Number,
        required: true,
    },
    inDamage: {
        type: Number,
        required: true,
    },
    heal: {
        type: Number,
        required: true,
    },
    headShotNum: {
        type: Number,
        required: true,
    },
    survivalTime: {
        type: Number,
        required: true,
    },
    driveDistance: {
        type: Number,
        required: true,
    },
    marchDistance: {
        type: Number,
        required: true,
    },
    assists: {
        type: Number,
        required: true,
    },
    knockouts: {
        type: Number,
        required: true,
    },
    rescueTimes: {
        type: Number,
        required: true,
    },
    useSmokeGrenadeNum: {
        type: Number,
        required: true,
    },
    useFragGrenadeNum: {
        type: Number,
        required: true,
    },
    useBurnGrenadeNum: {
        type: Number,
        required: true,
    },
    useFlashGrenadeNum: {
        type: Number,
        required: true,
    },
    PoisonTotalDamage: {
        type: Number,
        required: true,
    },
    UseSelfRescueTime: {
        type: Number,
        required: true,
    },
    UseEmergencyCallTime: {
        type: Number,
        required: true,
    },

});

const UserDB = models?.User || model("User", userSchema);
const EventDB = models?.Event || model("Event", eventSchema);
const StageDB = models?.Stage || model("Stage", stageSchema);
const GroupDB = models?.Group || model("Group", groupSchema);
const TeamDB = models?.Team || model("Team", teamSchema);
const ScheduleDB = models?.Schedule || model("Schedule", scheduleSchema);
const PlayerDB = models?.Player || model("Player", playerSchema);
const MatchDB = models?.Match || model("Match", matchSchema);
const PointDB = models?.Point || model("Point", pointSchema);
const PlayerStatsDB = models?.PlayerStats || model("PlayerStats", playerStatsSchema);
const TeamStatsDB = models?.TeamStats || model("TeamStats", teamStatsSchema);

export { UserDB, EventDB, StageDB, GroupDB, ScheduleDB, TeamDB, PlayerDB, MatchDB, PointDB, PlayerStatsDB, TeamStatsDB };
