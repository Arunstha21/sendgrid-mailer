'use client'

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, Check } from 'lucide-react'
import { MatchData, PlayerResult, TeamResult, getMatchData, updateGameData } from "@/server/match"
import { MatchDataDialog } from "./resultView/match-data-dialogue"
import { toast } from "sonner";
import CheckMatchData from "./checkPlayerData";
import MatchDataSelector from "./MatchDataSelector";

export default function MatchDataUploader() {
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState<boolean>(false)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [resultData, setResultData] = useState<{teamResults: TeamResult[]; playerResults: PlayerResult[]} | null>(null)
  const [isMatchDataUploaded, setIsMatchDataUploaded] = useState<boolean>(false)

  const handleMatchDataUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const result = e.target?.result
          if (typeof result === "string") {
            const jsonData: MatchData = JSON.parse(result)
            setMatchData(jsonData)
          } else {
            toast.error("Error parsing JSON file")
            return;
          }
        } catch (err) {
          console.log("Error parsing JSON file:", (err as Error).message)
          toast.error(`Error parsing JSON file ${(err as Error).message}`)
          setIsMatchDataUploaded(false)
        }
      }
      reader.readAsText(file)
    }
  }

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
            setIsMatchDataUploaded(false)
          }else if(res.status === "success"){
            setIsMatchDataUploaded(true)
          }
        }).catch((err) => {
          toast.error(err.message)
          setIsMatchDataUploaded(false)
        }).finally(() => {
        handleMatchChange(matchNo)
        setUploading(false);
        })
    }
  }

  const handleMatchChange = async (matchId: string) => {
    setResultData(null)
    setMatchNo(matchId)
    
    const resultsData = await getMatchData([matchId]);
    if(!resultsData){
        return
    }
    
    if(resultsData.matchExists){
        setResultData(resultsData.data)
    }
  }

  useEffect(() => {
    if (matchNo && resultData) {
      setIsMatchDataUploaded(true)
    } else {
      setIsMatchDataUploaded(false)
    }
  }, [matchNo, resultData])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Match Data Uploader</CardTitle>
      </CardHeader>
      <CardContent>
        <MatchDataSelector handleMatchChange={handleMatchChange}/>
        {matchNo ? ( <div className="space-y-4">
          <Label>Match Data</Label>
          {!isMatchDataUploaded ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleMatchDataUpload}
                  id="file-upload"
                  className="hidden"
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose file
                </Label>
                <span className="text-sm text-muted-foreground">
                  {matchData ? matchData.allinfo.TotalPlayerList.length + " players loaded" : "No file chosen"}
                </span>
              </div>
              <div className="flex space-x-2">
              <Button onClick={uploadMatchData} disabled={!matchData}>
                <Upload className="mr-2 h-4 w-4" /> {uploading? "Uploading....." :"Upload Match Data"}
              </Button>
               <CheckMatchData matchData={matchData} setMatchData={setMatchData} matchNo={matchNo} />
              </div>
            </div>
          ) : (
            <>
            {resultData ?  <MatchDataDialog data={resultData} loading={uploading}/>: null}
            </>
            )}
        </div>) : null}
        {isMatchDataUploaded && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md flex items-center">
            <Check className="mr-2 h-5 w-5" />
            <span>Match data successfully uploaded!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

