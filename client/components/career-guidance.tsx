"use client";

import { Lightbulb, TrendingUp, Award, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CareerGuidance() {
  const guidanceItems = [
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Resume Feedback",
      description: "Get detailed feedback on your resume's strengths and areas for improvement."
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Career Trajectory",
      description: "Discover potential career paths based on your skills and experience."
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Skill Development",
      description: "Identify key skills to develop for your desired career progression."
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Learning Resources",
      description: "Get recommendations for courses, certifications, and resources."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI-Powered Career Guidance</h2>
        <p className="text-muted-foreground">
          Our AI will analyze your resume and provide personalized career advice to help you succeed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {guidanceItems.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                {item.icon}
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}