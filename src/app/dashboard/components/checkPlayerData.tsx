'use client'

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkPlayerData, MatchData } from "@/server/match";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CheckPlayerData({matchData, setMatchData, matchNo, checking}: {matchData: MatchData | null; setMatchData: (matchData: MatchData) => void; matchNo: string | undefined; checking?: boolean}) {
    const [uploading, setUploading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [unMatchedGameData, setUnMatchedGameData] = useState<{ playerName: string; uId: string }[]>([]);
    const [unMatchedDbData, setUnMatchedDbData] = useState<{ playerName: string; uId: string }[]>([]);
    const [updatePlayerData, setUpdatePlayerData] = useState<Record<string, string>>({});

    const checkMatchData = async (): Promise<void> => {
        if (matchData && matchNo) {
        setUploading(true);
        await checkPlayerData(matchData, matchNo).then((res) => {
            if (res.status === "error") {
            toast.error(res.message)
            }
            else if (res.status === "success") {
                const unregisteredPlayersData = res.unregisteredPlayersData;
                if(unregisteredPlayersData) {
                    setUnMatchedGameData(unregisteredPlayersData.gameData);
                    setUnMatchedDbData(unregisteredPlayersData.dbData);
                    setIsOpen(true);
                } else {
                    toast.error("No unmatched player data found");
                }
            }
        }).catch((err: any) => {
            toast.error(err.message)
        }
        ).finally(() => {
            setUploading(false);
        })
        } else {
            toast.error("No unmatched player data found")
        }
    }

    const handlePlayerSelect = (gamePlayerId: string, dbPlayerId: string) => {
        setUpdatePlayerData((prev) => ({
        ...prev,
        [gamePlayerId]: dbPlayerId,
        }));
    }

    const updatePlayerDataHandler = () => {
        if(!matchData) {
            toast.error("No match data found");
            return;
        }
        const updatePlayersData = matchData.allinfo.TotalPlayerList.map((player) => {
            if (updatePlayerData[player.uId]) {
                return {
                    ...player,
                    uId: Number(updatePlayerData[player.uId]),
                };
            }
            return player;
        })

        if (updatePlayersData) {
            const updatedMatchData = {
                allinfo: {
                    ...matchData.allinfo,
                    TotalPlayerList: updatePlayersData,
                },
            };
            setMatchData(updatedMatchData);
            toast.success("Player data updated successfully");
            setIsOpen(false);
        } else {
            toast.error("No players selected for update");
        }
    }

  return (
    <div>
        <Button onClick={checkMatchData} disabled={!matchData}>
            <Upload className="mr-2 h-4 w-4" /> {uploading? "Checking....." :"Check Player Data"}
        </Button>
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Unmatched Player Data</DialogTitle>
        </DialogHeader>
            {unMatchedGameData.length > 0 ? (
          <div className="space-y-2">
            {unMatchedGameData.map((player) => (
              <div key={player.uId} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                   {checking ?(
                  <span className="font-medium block truncate">{player.playerName} <span className="text-sm text-muted-foreground">UID: {player.uId}</span></span>
                   ): (<><span className="font-medium block truncate">{player.playerName}</span>
                  <span className="text-sm text-muted-foreground">UID: {player.uId}</span></>)}
                </div>
                {checking ? null : (
                <div className="w-48">
                  <Select
                    value={updatePlayerData[player.uId] || ""}
                    onValueChange={(value) => handlePlayerSelect(player.uId, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Player" />
                    </SelectTrigger>
                    <SelectContent>
                      {unMatchedDbData.map((dbPlayer) => (
                        <SelectItem
                          key={dbPlayer.uId}
                          value={dbPlayer.uId}
                          disabled={Object.values(updatePlayerData).includes(dbPlayer.uId)}
                        >
                          {dbPlayer.playerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>)}
              </div>
            ))}
          </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">No unmatched game data found.</div>
      )}

      {checking ? null :<Button className="mt-4" onClick={updatePlayerDataHandler} >Update Player Data</Button>}
      </DialogContent>
    </Dialog>
    </>
    </div>
  )
}