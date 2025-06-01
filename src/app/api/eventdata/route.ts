import { StageDB } from "@/lib/database/schema";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const stageDoc = await StageDB.find({event:"682c6d54f4b6f4c7d6512146"})
        if (!stageDoc || stageDoc.length === 0) {
            return NextResponse.json(
                { error: "No stage data found" },
                { status: 404 }
            );
        }

        const stageData = stageDoc.map(stage => ({
            id: stage._id,
            name: stage.name,
            eventId: stage.eventId,
        }));
        return NextResponse.json(stageData, { status: 200 });
        
    } catch (error) {
        console.error("Error fetching event data:", error);
        return NextResponse.json(
            { error: "Failed to fetch event data" },
            { status: 500 }
        );
        
    }
}