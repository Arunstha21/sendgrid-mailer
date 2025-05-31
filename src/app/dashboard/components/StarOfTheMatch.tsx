"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getStarOfTheMatch, StarOfMatch } from "@/server/match"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function StarOfTheMatch({ matchId }: { matchId: string | undefined }) {
  const [loading, setLoading] = useState<boolean>(false)
  const [starOfMatchData, setStarOfMatchData] = useState<StarOfMatch | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [goingAllOut, setGoingAllOut] = useState<
    {
      inGameName: string
      uId: string
      teamName: string
      knockouts: number
      kill: number
      bonus: number
      damage: number
    }[]
  >([])
  const [bestCompanion, setBestCompanion] = useState<
    {
      inGameName: string
      uId: string
      teamName: string
      assists: number
      rescueTimes: number
      heal: number
      survivalTime: number
    }[]
  >([])
  const [finishers, setFinishers] = useState<
    {
      inGameName: string
      uId: string
      teamName: string
      kill: number
      assists: number
      travelDistance: number
      survivalTime: number
    }[]
  >([])

  const [selectedGoingAllOut, setSelectedGoingAllOut] = useState<{
    inGameName: string
    uId: string
    teamName: string
    knockouts: number
    kill: number
    bonus: number
    damage: number
  } | null>(null)
  const [selectedBestCompanion, setSelectedBestCompanion] = useState<{
    inGameName: string
    uId: string
    teamName: string
    assists: number
    rescueTimes: number
    heal: number
    survivalTime: number
  } | null>(null)
  const [selectedFinishers, setSelectedFinishers] = useState<{
    inGameName: string
    uId: string
    teamName: string
    kill: number
    assists: number
    travelDistance: number
    survivalTime: number
  } | null>(null)

  const handleGetStarOfMatch = async () => {
    setLoading(true)
    if (!matchId) {
      toast.error("Match ID is required to get Star of the Match")
      setLoading(false)
      return
    }
    setStarOfMatchData(null)
    setGoingAllOut([])
    setBestCompanion([])
    setFinishers([])
    setSelectedGoingAllOut(null)
    setSelectedBestCompanion(null)
    setSelectedFinishers(null)
    await getStarOfTheMatch(matchId)
      .then((res) => {
        if (res.status === "error") {
          toast.error(res.message)
          return null
        } else if (res.status === "success" && res.result) {
          setStarOfMatchData(res.result)
          toast.success("Star of the Match fetched successfully")
        }
      })
      .catch((err) => {
        toast.error(err.message)
        return null
      })
      .finally(() => {
        setLoading(false)
      })
  }


  useEffect(() => {
    if (starOfMatchData) {
      if (starOfMatchData.goingAllOut && starOfMatchData.goingAllOut.length > 1) {
        setGoingAllOut(starOfMatchData.goingAllOut)
      } else {
        setGoingAllOut([])
        setSelectedGoingAllOut(starOfMatchData.goingAllOut ? starOfMatchData.goingAllOut[0] : null)
      }
      if (starOfMatchData.bestCompanion && starOfMatchData.bestCompanion.length > 1) {
        setBestCompanion(starOfMatchData.bestCompanion)
      } else {
        setBestCompanion([])
        setSelectedBestCompanion(starOfMatchData.bestCompanion ? starOfMatchData.bestCompanion[0] : null)
      }
      if (starOfMatchData.finishers && starOfMatchData.finishers.length > 1) {
        setFinishers(starOfMatchData.finishers)
      } else {
        setFinishers([])
        setSelectedFinishers(starOfMatchData.finishers ? starOfMatchData.finishers[0] : null)
      }

      setIsOpen(true)
    }
  }, [starOfMatchData])
  return (
    <div>
      <Button onClick={handleGetStarOfMatch} disabled={loading}>
        Star Of Match
      </Button>
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Star Of the Match</DialogTitle>
            </DialogHeader>
            {starOfMatchData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="w-full m-2">
                  {goingAllOut ? (
                    <Card className="w-full max-w-4xl mx-auto">
                      <CardHeader>Going All Out</CardHeader>
                      <CardContent>
                        {goingAllOut.length > 1 ? (
                          <div className="mb-4">
                            <Select
                              onValueChange={(value) => {
                                setSelectedGoingAllOut(JSON.parse(value))
                              }}
                              value={selectedGoingAllOut ? JSON.stringify(selectedGoingAllOut) : ""}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Player" />
                              </SelectTrigger>
                              <SelectContent>
                                {goingAllOut.map((player, index) => (
                                  <SelectItem key={index} value={JSON.stringify(player)}>
                                    {player.inGameName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                        {goingAllOut && selectedGoingAllOut && (
                          <table className="min-w-full mb-4 border border-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left border-b">Key</th>
                                <th className="p-2 text-left border-b">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="p-2">IGN</td>
                                <td className="p-2">{selectedGoingAllOut.inGameName}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Team</td>
                                <td className="p-2">{selectedGoingAllOut.teamName}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Knockouts</td>
                                <td className="p-2">{selectedGoingAllOut.knockouts.toString()}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Kills</td>
                                <td className="p-2">{selectedGoingAllOut.kill.toString()}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Bonus</td>
                                <td className="p-2">{selectedGoingAllOut.bonus.toString()}</td>
                              </tr>
                              <tr>
                                <td className="p-2">Damage</td>
                                <td className="p-2">{selectedGoingAllOut.damage.toString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
                <div className="w-full m-2">
                  {bestCompanion ? (
                    <Card className="w-full max-w-4xl mx-auto">
                      <CardHeader>Best Companion</CardHeader>
                      <CardContent>
                        {bestCompanion.length > 1 ? (
                          <div className="mb-4">
                            <Select
                              onValueChange={(value) => {
                                setSelectedBestCompanion(JSON.parse(value))
                              }}
                              value={selectedBestCompanion ? JSON.stringify(selectedBestCompanion) : ""}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Player" />
                              </SelectTrigger>
                              <SelectContent>
                                {bestCompanion.map((player, index) => (
                                  <SelectItem key={index} value={JSON.stringify(player)}>
                                    {player.inGameName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                        {bestCompanion && selectedBestCompanion && (
                          <table className="min-w-full mb-4 border border-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left border-b">Key</th>
                                <th className="p-2 text-left border-b">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="p-2">IGN</td>
                                <td className="p-2">{selectedBestCompanion.inGameName}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Team</td>
                                <td className="p-2">{selectedBestCompanion.teamName}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Assists</td>
                                <td className="p-2">{selectedBestCompanion.assists.toString()}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Rescues</td>
                                <td className="p-2">{selectedBestCompanion.rescueTimes.toString()}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Health Restored</td>
                                <td className="p-2">{selectedBestCompanion.heal.toString()}</td>
                              </tr>
                              <tr>
                                <td className="p-2">Survival Time</td>
                                <td className="p-2">{selectedBestCompanion.survivalTime.toString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
                <div className="w-full m-2">
                  {finishers ? (
                    <Card className="w-full max-w-4xl mx-auto">
                      <CardHeader>Finishers</CardHeader>
                      <CardContent>
                        {finishers.length > 1 ? (
                          <div className="mb-4">
                            <Select
                              onValueChange={(value) => {
                                setSelectedFinishers(JSON.parse(value))
                              }}
                              value={selectedFinishers ? JSON.stringify(selectedFinishers) : ""}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Player" />
                              </SelectTrigger>
                              <SelectContent>
                                {finishers.map((player, index) => (
                                  <SelectItem key={index} value={JSON.stringify(player)}>
                                    {player.inGameName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                        {finishers && selectedFinishers && (
                          <table className="min-w-full mb-4 border border-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left border-b">Key</th>
                                <th className="p-2 text-left border-b">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="p-2">IGN</td>
                                <td className="p-2">{selectedFinishers.inGameName}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Team</td>
                                <td className="p-2">{selectedFinishers.teamName}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Kills</td>
                                <td className="p-2">{selectedFinishers.kill.toString()}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Assists</td>
                                <td className="p-2">{selectedFinishers.assists.toString()}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="p-2">Travel Distance</td>
                                <td className="p-2">{selectedFinishers.travelDistance.toString()}</td>
                              </tr>
                              <tr>
                                <td className="p-2">Survival Time</td>
                                <td className="p-2">{selectedFinishers.survivalTime.toString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">No Star of the Match data available</div>
            )}
          </DialogContent>
        </Dialog>
      </>
    </div>
  )
}
