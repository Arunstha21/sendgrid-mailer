'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import New from "../components/new";
import Event from "../components/event";
import ImportData from "../components/import";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { GetProfileData, User, logout } from "@/server/user";



export default  function Task() {

  const pathname = usePathname();
  const currentPath = pathname.split("/").pop();
  const router = useRouter();

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${value}`);
  };
  const [profile, setProfile] = useState<User| null>(null);

  useEffect(() => {
    async function fetchData() {
      const profile = await GetProfileData();
      setProfile(profile);
  }

  fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.log(error)
    }
  }
 
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between mb-8">
      <Tabs defaultValue={currentPath} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">Compose New</TabsTrigger>
          <TabsTrigger value="event">Compose for Event</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>
        <TabsContent value="new">
          <New />
        </TabsContent>
        <TabsContent value="event">
          <Event />
        </TabsContent>
        <TabsContent value="import">
          <ImportData />
        </TabsContent>
      </Tabs>
      <div className="ml-6 mt-1">
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
  );
}
