"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { LogOut } from "lucide-react"
import { logout } from "@/server/user"
import Link from "next/link"

export default function ProfileDropDown({profile, page}: {profile: any, page: string}) {
    const handleLogout = async () => {
        try {
          await logout()
        } catch (error) {
          console.log(error)
        }
      }
    return (
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
            <DropdownMenuLabel className="font-normal">
                <Link href={page === "settings" ? "/dashboard/new" : "/settings"} passHref>
                <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{page === "settings" ? "Dashboard": "Settings"}</p>
                </div>
                </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}