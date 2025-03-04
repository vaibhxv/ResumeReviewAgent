"use client";

import { useState, useEffect } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ResumeUploader } from "@/components/resume-uploader";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CareerGuidance } from "@/components/career-guidance";
import { toast } from "sonner";

export default function Home() {
  const [resumeData, setResumeData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upload");
  
  // Create a runtime with initial messages based on resume data
  const runtime = useChatRuntime({ 
    api: "https://resumereviewagent-1.onrender.com/api/resume-feedback",
    initialMessages: resumeData ? [
      {
        role: "user",
        content: `Here is my resume data for analysis: ${JSON.stringify(resumeData, null, 2)}`
      }
    ] : []
  });

 

  const handleResumeUpload = (data: any) => {
    setResumeData(data);
   // setActiveTab("chat");
   // console.log(data);
    toast.success("Resume uploaded successfully", {
      description: "Switching to AI Analysis tab for feedback"
    });
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="upload">Upload Resume</TabsTrigger>
            <TabsTrigger value="chat" disabled={!resumeData}>User Guidance</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <div className="">
              <Card className="p-6">
                <ResumeUploader onUpload={handleResumeUpload} />
              </Card>
              <Card className="p-6">
                <CareerGuidance/>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="chat">
            <Card className="h-[calc(100vh-250px)]">
              {resumeData ? (
                <Thread />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Please upload your resume first to get AI analysis
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  </AssistantRuntimeProvider>
);
}
