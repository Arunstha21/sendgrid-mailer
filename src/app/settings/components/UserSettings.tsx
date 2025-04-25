"use client"

import type React from "react"

import { useState} from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changeEmail } from "@/server/user"
import { toast } from "sonner"

export default function UserSettings({ username, email }: { username: string; email: string }) {
  const router = useRouter()
  const [updateEmail, setEmail] = useState(email)
  // const [sendgridApiKey, setSendgridApiKey] = useState("")
  // const [isEditingApiKey, setIsEditingApiKey] = useState(false)
  // const [showApiKey, setShowApiKey] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implement update logic here for email and SendGrid API key
    await changeEmail(username, updateEmail).then((response) => {
      if (response.status === "success") {
        toast.success(response.message)
      }else if (response.status === "error") {
        toast.error(response.message)
      }
    }).catch((err) => {
      toast.error(err.message)
    })

    // console.log("Updating user settings:", {
    //   updateEmail,
      // sendgridApiKey: sendgridApiKey || "[EXISTING KEY]",
    // })
    // After successful update, reset the API key field and editing state
    // setSendgridApiKey("")
    // setIsEditingApiKey(false)
    // setShowApiKey(false)
  }

  const navigateToChangePassword = () => {
    router.push("/settings/change-password")
  }

  // const toggleApiKeyEdit = () => {
  //   setIsEditingApiKey(!isEditingApiKey)
  //   setSendgridApiKey("")
  //   setShowApiKey(false)
  // }

  // const toggleShowApiKey = () => {
  //   setShowApiKey(!showApiKey)
  // }

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">User Settings</h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <Label htmlFor="username">Username (non-editable)</Label>
          <Input id="username" value={username} disabled />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={updateEmail}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        {/* <div>
          <Label htmlFor="sendgrid-api-key">SendGrid API Key</Label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-grow">
              <Input
                id="sendgrid-api-key"
                type={showApiKey ? "text" : "password"}
                value={isEditingApiKey ? sendgridApiKey : mockUserData.hasSendgridApiKey ? "••••••••" : ""}
                onChange={(e) => setSendgridApiKey(e.target.value)}
                placeholder={isEditingApiKey ? "Enter new SendGrid API Key" : ""}
                disabled={!isEditingApiKey}
              />
              {mockUserData.hasSendgridApiKey && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={toggleShowApiKey}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
            </div>
            <Button type="button" onClick={toggleApiKeyEdit}>
              {isEditingApiKey ? "Cancel" : "Edit"}
            </Button>
          </div>
        </div> */}
        <div className="flex justify-between items-center">
          <Button type="submit">Update Settings</Button>
          <Button type="button" variant="outline" onClick={navigateToChangePassword}>
            Change Password
          </Button>
        </div>
      </form>
    </section>
  )
}

