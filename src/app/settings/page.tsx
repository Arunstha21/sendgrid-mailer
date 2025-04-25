import { getDiscordData, GetProfileData } from "@/server/user";
import EventSettings from "./components/EventSettings";
import UserSettings from "./components/UserSettings";
import { getEventData } from "@/server/database";
import ProfileDropDown from "@/components/profileDropDown";
import FeatureSettings from "./components/FeatureSettings";

export default async function SettingsPage() {
  const profileData = await GetProfileData();
  const events = await getEventData();
  const discordChannelData = await getDiscordData(profileData.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4 sm:mb-2">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="hidden sm:flex justify-end ml-4 mb-8">
        <ProfileDropDown profile={profileData} page="settings"/>
      </div>
      </div>
      <div className="space-y-8">
        <UserSettings username={profileData.userName} email={profileData.email}/>
        <EventSettings  events={events}/>
        <FeatureSettings profile={profileData} discordData={discordChannelData.data}/>
      </div>
    </div>
  )
}

