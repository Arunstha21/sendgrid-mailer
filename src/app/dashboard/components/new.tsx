"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiEmailInput } from "./MultiEmailInput";
import RichTextEditor from "./RichEditor";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { from, getEmailList, sendEmail } from "@/server/sendgrid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultSelectedSender = { email: "", name: "" };

export default function New() {
  const [to, setTo] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [emailList, setEmailList] = useState<from[]>([]);
  const [selectedSender, setSelectedSender] = useState<from>(defaultSelectedSender);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      shakeForm();
    }
  }, [error]);

  function shakeForm() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const emailData = {
      from: selectedSender.email,
      tos: to,
      bccs: bcc,
      subject,
      message,
    }

    try {
      await sendEmail(emailData);
      setSuccess("Email sent successfully!");
      setLoading(false);
    } catch (error: any) {
      shakeForm();
      setError(error.message);
      console.error('Error sending email:', error.message);
      setLoading(false);
    }
  };



  useEffect(() => {
    async function fetchData() {
      const emailList = await getEmailList();
      setEmailList(emailList);
    }

    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className={`w-full max-w-6xl mx-auto ${shake ? 'animate-shake' : ''}`}>
        <CardHeader className="flex items-center justify-between">
          Compose New Email
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 flex-grow flex flex-col"
          >
            <div className="grid w-full gap-1.5">
              <Label htmlFor="from">From</Label>
              <Select onValueChange={(email) => setSelectedSender(emailList.find(sender => sender.email === email) || defaultSelectedSender )}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sender">
                  {selectedSender && (selectedSender.name || selectedSender.email)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {emailList.map((sender) => (
                    <SelectItem key={sender.email} value={sender.email}>
                      {sender.name
                        ? `${sender.name} <${sender.email}>`
                        : sender.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="to">To</Label>
              <MultiEmailInput
                id="to"
                value={to}
                onChange={setTo}
                placeholder="Enter email addresses..."
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="bcc">BCC</Label>
              <MultiEmailInput
                id="bcc"
                value={bcc}
                onChange={setBcc}
                placeholder="Enter BCC email addresses..."
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5 flex-grow">
              <Label htmlFor="message">Message</Label>
              <div className="flex-grow">
                <RichTextEditor content={message} onChange={setMessage} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>Send Email</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
    </div>
    
  );
}
