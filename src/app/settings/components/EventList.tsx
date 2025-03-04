import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Event } from "@/server/database"

export default function EventList({events}: {events: Event[]}) {
  return (
    <div className="mt-4 space-y-4">
      <ul className="space-y-2">
        {events.map((event: Event) => (
          <li key={event.id} className="flex justify-between items-center">
            <span>{event.name}</span>
            <Link href={`settings/events/${event.id}`} passHref>
              <Button variant="outline">View Data</Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}