"use client";

import { useState, useCallback } from "react";
import { UploadCloud, File, CheckCircle2 } from "lucide-react";
import { CandidateProfile } from "../lib/resumeParser";

interface ResumeUploadProps {
    onUploadSuccess: (profile: CandidateProfile) => void;
}

export default function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            setError(null);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                await uploadFile(file);
            }
        },
        []
    );

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files.length > 0) {
            await uploadFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file: File) => {
        if (!file.type.includes("pdf") && !file.type.includes("document") && !file.type.includes("msword")) {
            setError("Please upload a PDF or DOCX file.");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/parse-resume", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to parse resume");
            }

            const profile = await res.json();
            onUploadSuccess(profile as CandidateProfile);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 animate-slide-up">
            <div
                className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer 
          ${isDragging
                        ? "border-primary bg-primary/10"
                        : "border-[var(--border)] hover:border-primary/50 hover:bg-[var(--muted)]"
                    } glass-card`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("resume-upload")?.click()}
            >
                <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-lg font-medium text-[var(--foreground)]">AI is analyzing your resume...</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Extracting skills and experience.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 rounded-full bg-primary/10 text-primary">
                            <UploadCloud size={40} />
                        </div>
                        <div>
                            <p className="text-xl font-semibold mb-2 text-[var(--foreground)]">
                                Upload your Resume
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
                                Drag and drop your PDF or DOCX file here, or click to browse. We'll use this to tailor your interview questions.
                            </p>
                        </div>
                        {error && (
                            <p className="text-red-500 mt-4 font-medium text-sm">{error}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
