import { useState, useRef } from "react";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ResumeUploaderProps {
  onUpload: (file: File) => void;
}

export function ResumeUploader({ onUpload }: ResumeUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or Word document");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("https://resumereviewagent-1.onrender.com/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse resume");
      }

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.analysis);
        onUpload(result.analysis);
        toast.success("Resume uploaded successfully", {
          description: "Your resume is now being analyzed by our AI",
        });
      } else {
        throw new Error(result.error || "Failed to parse resume");
      }
    } catch (err) {
      setError("An error occurred while uploading your resume");
      console.error(err);
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, index) => {
      if (line.startsWith("## ")) return <h2 key={index} className="text-xl font-bold mt-4">{line.replace("## ", "")}</h2>;
      if (line.startsWith("### ")) return <h3 key={index} className="text-lg font-semibold mt-3">{line.replace("### ", "")}</h3>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={index} className="font-semibold">{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("* ")) return <li key={index} className="ml-6 list-disc">{line.replace("* ", "")}</li>;
      return <p key={index} className="mt-2">{line}</p>;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Your Resume</h2>
        <p className="text-muted-foreground">
          Upload your resume in PDF or Word format to get personalized feedback and career guidance.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          error ? "border-destructive" : "border-muted-foreground/25"
        } hover:border-primary/50 transition-colors cursor-pointer`}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-muted rounded-full p-3">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">
              {file ? file.name : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF or Word documents up to 5MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {file && !error && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">{file.name}</p>
            {!uploading && progress === 100 && (
              <Check className="h-4 w-4 text-green-500 ml-auto" />
            )}
          </div>

          {uploading && <Progress value={progress} className="h-2" />}

          {progress !== 100 && (
            <Button onClick={handleUpload} disabled={uploading || !file} className="w-full">
              {uploading ? "Uploading..." : "Upload Resume"}
            </Button>
          )}
        </div>
      )}

      {analysis && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resume Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {renderFormattedText(analysis)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
