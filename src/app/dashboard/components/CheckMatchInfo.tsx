'use client'
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CheckPlayerData from "./checkPlayerData";
import { MatchData, updateGameData } from "@/server/match";
import { Upload } from "lucide-react";
import MatchDataSelector from "./MatchDataSelector";
import { Schedule } from "@/server/database";

export default function CheckMatchInfo(){
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined);
  const [fetching, setFetching] = useState<boolean>(false);
  const [isMatchEnded, setIsMatchEnded] = useState<boolean>(false);
  const [showMatchUpload, setShowMatchUpload] = useState<boolean>(false);
  const [scheduleList, setScheduleList] = useState<Schedule[]>([])

  const [uploading, setUploading] = useState<boolean>(false)


  const uploadMatchData = (): void => {
    if (matchData) {
      sendMatchData(matchData)
    } else {
      toast.error("No match data found")
    }
  }

  const sendMatchData = async (data: MatchData): Promise<void> => {
    if(matchNo){
        setUploading(true);
        await updateGameData(data, matchNo).then((res) => {
          if(res.status === "error"){
            toast.error(res.message)
            setShowMatchUpload(true)
          }else if(res.status === "success"){
            setShowMatchUpload(false)
          }
        }).catch((err) => {
          toast.error(err.message)
          setShowMatchUpload(true)
        }).finally(() => {
        setUploading(false);
        })
    }
  }

  useEffect(() => {
    setIsMatchEnded(false);
  }, [matchNo]);

  useEffect(() => {
    const selectedScheduleData = scheduleList.find(s => s.id === matchNo);
    console.log(selectedScheduleData);
    
    if (!selectedScheduleData || selectedScheduleData?.match || !isMatchEnded) {
      setShowMatchUpload(false);
    } else if (!selectedScheduleData?.match && isMatchEnded) {
      setShowMatchUpload(true);
    }
  }, [ matchNo, isMatchEnded]);

  const handleMatchChange = (matchId: string) => {
    setMatchNo(matchId);
  }

  const getMatchData = async () => {
    setFetching(true);
    setIsMatchEnded(false)
    fetch("/api/matchInfo",{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    }).then(async (response) => {
        if (!response.ok) {
            if(response.status === 400) {
                toast.error("Match data is not set");
                return;
            }
            toast.error("Failed to fetch match data");
        }
        const data = await response.json() as MatchData;
        const wwcd = data.allinfo.TotalPlayerList.find(p => p.rank === 1)
        if(wwcd){
          setIsMatchEnded(true)
        }
        setMatchData(data);
    }).catch((error) => {
        console.error("Error fetching match data:", error);
        toast.error("Error fetching match data");
    }).finally(() => {
        setFetching(false);
    });
  }


    return (
    <div className="w-full max-w-[1400px] mx-auto">
    <MatchDataSelector handleMatchChange={handleMatchChange} setScheduleData={setScheduleList} />
    <div className="space-y-2">
        <div className="space-y-2">
            <Button onClick={getMatchData} disabled={ !matchNo || fetching}>
                Get Match Data
            </Button>
            <span className="m-2 text-sm text-muted-foreground">
                  {matchData ? matchData.allinfo.TotalPlayerList.length + " players loaded" : "Match Data not available"}
            </span>
        </div>
        <div className="space-y-2">
            <CheckPlayerData matchData={matchData} setMatchData={setMatchData} matchNo={matchNo} checking={!isMatchEnded}/>
        </div>
        {showMatchUpload ? (
          <Button onClick={uploadMatchData} disabled={!matchData}>
            <Upload className="mr-2 h-4 w-4" /> {uploading? "Uploading....." :"Upload Match Data"}
          </Button>) : null}
    </div>
    </div>
    );
}