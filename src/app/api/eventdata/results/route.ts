import { getResultsData } from "@/server/match";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const stageId = req.nextUrl.searchParams.get("stageId");

        if (!stageId) {
            return NextResponse.json(
                { error: "Stage ID is required" },
                { status: 400 }
            );
        }
        const data = await getResultsData(stageId);
        if(data.status === "error") {
            return NextResponse.json(
                { error: data.message },
                { status: 400 }
            );
        }
        return NextResponse.json(data.data, { status: 200 });
    } catch (error) {
        console.error("Error fetching results:", error);
        return NextResponse.json(
            { error: "Failed to fetch results" },
            { status: 500 }
        );
    }
}