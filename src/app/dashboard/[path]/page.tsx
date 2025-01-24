"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import New from "../components/new"
import Event from "../components/event"
import ImportData from "../components/import"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Menu } from "lucide-react"
import { GetProfileData, type User, logout } from "@/server/user"
import ResultTabs from "../components/resultView/resultsTab"

export default function Task() {
  const pathname = usePathname()
  const currentPath = pathname.split("/").pop()
  const router = useRouter()
  const [profile, setProfile] = useState<User | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${value}`)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    async function fetchData() {
      const profile = await GetProfileData()
      setProfile(profile)
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.log(error)
    }
  }

  const tabItems = [
    { value: "new", label: "Compose New", component: <New /> },
    { value: "event", label: "Compose for Event", component: <Event /> },
    { value: "import", label: "Import Data", component: <ImportData /> },
    { value: "results", label: "Results", component: <ResultTabs /> },
  ]

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between mb-4 sm:mb-8">
        <div className="flex justify-between items-center mb-4 sm:mb-0">
          <Button variant="ghost" className="sm:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex justify-end sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage alt={profile?.userName} />
                    <AvatarFallback>{profile?.userName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.userName}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Tabs defaultValue={currentPath} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-between">
        <TabsList
          className={`grid w-full gap-2 ${isMobileMenuOpen ? "grid-cols-2" : "hidden"} sm:grid sm:grid-cols-4`}
        >
          {tabItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full h-full text-sm font-medium"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className={`flex justify-end ml-4 ${isMobileMenuOpen ? "hidden" : ""}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage alt={profile?.userName} />
                    <AvatarFallback>{profile?.userName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.userName}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="px-16">
        {tabItems.map((item) => (
          <TabsContent key={item.value} value={item.value}>
            {item.component}
          </TabsContent>
        ))}
        </div>
      </Tabs>
    </div>
  )
}

