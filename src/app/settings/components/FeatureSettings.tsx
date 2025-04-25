"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { discordFeature } from "@/server/user"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function FeatureSettings({profile, discordData}: {profile: any, discordData: {guildId: string, channelId: string, adminGuildId: string, adminChannelId: string, adminOverallChannelId: string}}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDiscordEnabled, setIsDiscordEnabled] = useState(profile?.isDiscordResult || false)
  const [discordChannelIds, setDiscordChannelIds] = useState(discordData)

  useEffect(() => {
    handleDiscordToggle()
  },[isDiscordEnabled])



  const handleDiscordToggle = async () => {
    discordFeature(profile.userName, isDiscordEnabled).then((response) => {
        if (response.status === "success") {
            console.log(response.message)
        } else if (response.status === "error") {
            console.error(response.message)
        }
    })
    .catch((err) => {
        console.error(err.message)
    })
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center cursor-pointer" onClick={toggleExpand}>
        <h2 className="text-2xl font-semibold">Feature Settings</h2>
        <Button variant="ghost" size="icon">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {isExpanded &&
       <>
       <li className="flex justify-between items-center">
            <span>Enable Discord</span>
            <Switch checked={isDiscordEnabled} onCheckedChange={setIsDiscordEnabled} className="w-16 h-8 bg-gray-200 rounded-full relative cursor-pointer transition-colors duration-300 ease-in-out"/>
       </li>
        {isDiscordEnabled && <Card className="w-1/2">
            <CardHeader>
                Discord Channel Ids for Result Post
            </CardHeader>
            <CardContent>
                <div className="flex">
                    <Input
                        type="text"
                        disabled={!profile.superUser}
                        placeholder="Team Guild ID"
                        className="w-full m-2"
                    />
                    <Input
                        type="text"
                        disabled={!profile.superUser}
                        placeholder="Team Result Guild Channel ID"
                        className="w-full m-2"
                    />
                </div>
                <div className="flex">
                    <Input
                        type="text"
                        disabled={!profile.superUser}
                        placeholder="Admin Guild ID"
                        className="w-full m-2"
                    />
                    <Input
                        type="text"
                        disabled={!profile.superUser}
                        placeholder="Admin Guild Channel ID"
                        className="w-full m-2"
                    />
                    <Input
                        type="text"
                        disabled={!profile.superUser}
                        placeholder="Admin Guild Overall Channel ID"
                        className="w-full m-2"
                    />
                </div>
            </CardContent>
        </Card>}
        </>
      }
    </section>
  )
}

