"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { changePassword } from "@/server/user"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d{2,}).*$/;

const addUserSchema = z
  .object({
    oldPassword: z.string(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        passwordRegex,
        "Password must have at least one capital letter, one special character, and at least two numbers"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ChangePassword({userName} : {userName: string}) {
  const router = useRouter()

  const form = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = useWatch({ control: form.control, name: "newPassword" });
  const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" });

  const passwordsMatch = newPassword === confirmPassword || confirmPassword === "";
  const passwordValid = passwordRegex.test(newPassword) || newPassword === "";

  async function onSubmit(data: z.infer<typeof addUserSchema>) {
    await changePassword(userName, data.oldPassword, data.newPassword)
      .then((response) => {
        if (response.status === "success") {
          router.push("/settings")
        }else if(response.status === "error"){
          toast.error(response.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      }
    );
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="oldPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Old Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password"
                    placeholder="Enter your old Password" {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter New Password" 
                    className={`${!passwordValid ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                    {...field} 
                  />
                </FormControl>
                {!passwordValid && (
                  <p className="text-red-500 text-sm">
                    Password must have at least one capital letter, one special character, and at least two numbers
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Confirm New Password" 
                    className={`${!passwordsMatch ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                    {...field} 
                  />
                </FormControl>
                {!passwordsMatch && <p className="text-red-500 text-sm">Passwords do not match</p>}
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Change Password
          </Button>
        </form>
      </Form>
    </section>
  )
}
