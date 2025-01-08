'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import New from "../components/new";
import Event from "../components/event";
import ImportData from "../components/import";



export default  function Task() {

  const pathname = usePathname();
  const currentPath = pathname.split("/").pop();
  const router = useRouter();

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${value}`);
  };
  const [gameList, setGameList] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {

    setGameList(gameList);
  }

  fetchData();
  }, [pathname]);

 
  
  return (
    <div className="flex mt-12 justify-center">
      <Tabs defaultValue={currentPath} onValueChange={handleTabChange} className="w-9/12">
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
    </div>
  );
}
