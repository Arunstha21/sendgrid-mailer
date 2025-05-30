import { MatchData } from "@/server/match";
import { NextResponse } from "next/server";

let SetMatchData: MatchData;

function addCorsHeaders(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function GET() {
  try {
    if (!SetMatchData) {
      const res = NextResponse.json(
        { error: "Match data is not set" },
        { status: 400 }
      );
      return addCorsHeaders(res);
    }
    
    const res = NextResponse.json(SetMatchData, { status: 200 });
    return addCorsHeaders(res);
  } catch (error) {
    console.log("Error fetching match info:", error);
    const res = NextResponse.json(
      { error: "Failed to fetch match info" },
      { status: 500 }
    );
    return addCorsHeaders(res);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchData } = body;

    if (!matchData) {
      const res = NextResponse.json(
        { error: "Match data is missing" },
        { status: 400 }
      );
      return addCorsHeaders(res);
    }

    SetMatchData = matchData;

    const res = NextResponse.json(
      { message: "Match info received successfully" },
      { status: 200 }
    );
    return addCorsHeaders(res);
  } catch (error) {
    console.error("Error processing match info:", error);
    const res = NextResponse.json(
      { error: "Failed to fetch match info" },
      { status: 500 }
    );
    return addCorsHeaders(res);
  }
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  return addCorsHeaders(res);
}