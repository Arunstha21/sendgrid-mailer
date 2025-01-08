import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
    {
        userName:{
            type: String,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        superUser:{
            type: Boolean,
        }     
    },
    {timestamps: true}
);

const eventSchema = new Schema(
    {
        name:{
            type: String,
            required: true,
        },
        stage:[{
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Stage'
        }],

    }
)

const stageSchema = new Schema(
    {
        name:{
            type: String,
            required: true,
        },
        event:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Event'
        },
        group:[{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Group'
        }],
    }
)

const groupSchema = new Schema(
    {
        event:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Event'
        },
        stage:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Stage'
        },
        schedule: [{
            type:  Schema.Types.ObjectId,
            ref: 'Schedule'
        }],
        name:{
            type: String,
            required: true,
        },
        team: [{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Team'
        }]
    }
)

const teamSchema = new Schema({
        event:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Event'
        },
        stage:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Stage'
        },
        group:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Group'
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
        }
})

const scheduleSchema = new Schema(
    {
        event:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Event'
        },
        stage:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Stage'
        },
        group:{
            type:  Schema.Types.ObjectId,
            required: true,
            ref: 'Group'
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
        }
    }
)
  

const UserDB = models?.User || model('User', userSchema);
const EventDB = models?.Event || model('Event', eventSchema);
const StageDB = models?.Stage || model('Stage', stageSchema);
const GroupDB = models?.Group || model('Group', groupSchema);
const TeamDB = models?.Team || model('Team', teamSchema);
const ScheduleDB = models?.Schedule || model('Schedule', scheduleSchema);

export {UserDB, EventDB, StageDB, GroupDB, ScheduleDB, TeamDB};