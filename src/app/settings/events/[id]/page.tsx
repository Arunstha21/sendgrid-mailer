import { getEventById } from "@/server/database"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EventSettingsPage from "./components/eventSettings";

type Props = Promise<{ id: string }>;

export default async function EventSettings(props: { params: Props }) {
  const { id } = await props.params;
  const eventData = await getEventById(id);

  return (
    <>
    {eventData && (
      <div className="container mx-auto px-4 py-8">
        <EventSettingsPage eventData={eventData} />
        <Link href="/settings" passHref className="px-4">
          <Button>Back to Settings</Button>
        </Link>
      </div>
    ) || (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
        <p className="mb-4">The event you are looking for does not exist or you don&apos;t have permission.</p>
        <Link href="/settings" passHref>
          <Button>Back to Settings</Button>
        </Link>
      </div>
    ) }
    </>
  )
}