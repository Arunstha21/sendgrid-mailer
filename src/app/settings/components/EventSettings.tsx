"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import EventList from "./EventList"
import { Event } from "@/server/database"

export default function EventSettings({events}: {events: Event[]}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center cursor-pointer" onClick={toggleExpand}>
        <h2 className="text-2xl font-semibold">Event Settings</h2>
        <Button variant="ghost" size="icon">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {isExpanded && <EventList events={events} />}
    </section>
  )
}

