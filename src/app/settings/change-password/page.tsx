import { GetProfileData } from "@/server/user";
import ChangePassword from "../components/ChangePassword";

export default async function ChangePasswordPage() {
  const profileData = await GetProfileData();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Change Password</h1>
      <ChangePassword userName={profileData.userName}/>
    </div>
  )
}
