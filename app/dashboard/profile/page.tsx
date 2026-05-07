"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { CandidateProfile } from "@/lib/resumeParser";

export default function ProfilePage() {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Profile related states
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [manualData, setManualData] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const checkUserAndSetupListener = async () => {
            const { data: { user: initialUser } } = await supabase.auth.getUser();
            if (!initialUser) {
                router.push("/sign-in");
            } else {
                setUser(initialUser);
                try {
                    const savedProfile = localStorage.getItem("prep_wise_current_profile");
                    if (savedProfile) {
                        setProfile(JSON.parse(savedProfile));
                    }
                } catch (e) { console.error("Could not load profile", e) }
            }
            setLoading(false);

            const { data: authListener } = supabase.auth.onAuthStateChange(
                (event: string, session: any) => {
                    setUser(session?.user ?? null);
                    if (event === 'SIGNED_OUT') {
                        router.push("/sign-in");
                    }
                }
            );

            return () => {
                authListener.subscription.unsubscribe();
            };
        };
        checkUserAndSetupListener();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
    };

    // Auto-save any profile changes to browser memory
    useEffect(() => {
        if (profile) {
            localStorage.setItem("prep_wise_current_profile", JSON.stringify(profile));
        }
    }, [profile]);

    // Upload handling
    const handleFile = async (file: File) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const isValidType = file.type.includes("pdf") || file.type.includes("document") || file.type.includes("msword") || ["pdf", "doc", "docx"].includes(fileExt || "");

        if (!isValidType) {
            setUploadError("Please upload a PDF or DOCX file. (Found: " + (file.type || fileExt || "Unknown") + ")");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
            if (!res.ok) {
                let errText = "Failed to parse resume";
                try {
                    const errObj = await res.json();
                    if (errObj.error) errText = errObj.error;
                } catch (e) { }
                throw new Error(errText);
            }

            const profileData: CandidateProfile = await res.json();
            setProfile(profileData);

            // In a real app, save this profile data to the database here

        } catch (err: any) {
            setUploadError(err.message || "Something went wrong.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!manualData.trim()) return;
        setUploadError(null);
        setIsUploading(true);
        try {
            const res = await fetch("/api/parse-manual-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: manualData })
            });
            if (!res.ok) throw new Error("Failed to process manual resume data");

            const profileData: CandidateProfile = await res.json();
            setProfile(profileData);
        } catch (err: any) {
            setUploadError(err.message || "Failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) await handleFile(e.dataTransfer.files[0]);
    }, []);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (profile) {
                    setProfile({ ...profile, photoBase64: reader.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const startInterviewWithProfile = () => {
        // Store profile in localStorage or state management to pass to interview
        if (profile) {
            localStorage.setItem("prep_wise_current_profile", JSON.stringify(profile));
        }
        router.push("/interview?from_profile=true");
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center border-t-transparent">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const userInitial = user.user_metadata?.full_name?.[0] || user.email?.[0] || "U";

    return (
        <div className="min-h-screen relative overflow-visible flex flex-col bg-[#0a0514]">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            <div className="flex flex-1 relative z-10 w-full max-w-[1700px] mx-auto">
                {/* Sidebar Setup... */}
                <aside
                    onMouseEnter={() => setIsSidebarHovered(true)}
                    onMouseLeave={() => setIsSidebarHovered(false)}
                    className={`fixed lg:sticky top-0 h-screen bg-[#070310]/98 backdrop-blur-3xl border-r border-white/10 z-[110] transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarHovered ? 'w-[280px]' : 'w-[90px]'} p-6 overflow-hidden flex flex-col group`}
                >
                    <div className="flex items-center gap-4 h-16 mb-8 px-1">
                        <div className={`transition-all duration-500 transform ${isSidebarHovered ? 'opacity-100 scale-110 translate-x-0' : 'opacity-100 scale-95 translate-x-1'} flex items-center gap-3`}>
                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-black font-black text-xs shadow-[0_0_20px_rgba(200,162,255,0.4)]">PW</div>
                            <div className={`transition-all duration-500 ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                                <Logo className="h-10" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-8 no-scrollbar overflow-hidden">
                        <div>
                            <p className={`text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 px-3 transition-opacity duration-500 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>Navigation</p>
                            <nav className="space-y-1.5">
                                <Link href="/dashboard" className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 text-white/40 hover:text-white hover:bg-white/5`}>
                                    <div className="shrink-0 w-6 flex justify-center scale-110">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                    </div>
                                    <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                                        Dashboard
                                    </span>
                                </Link>
                                <Link href="/dashboard/profile" className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 ${isSidebarHovered ? 'bg-white/5 text-[var(--primary)] font-bold' : 'text-white/40 hover:text-white'}`}>
                                    <div className="shrink-0 w-6 flex justify-center scale-110">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </div>
                                    <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                                        Candidate Profile
                                    </span>
                                </Link>
                                <Link href="/dashboard/history" className="flex items-center gap-4 px-3 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300">
                                    <div className="shrink-0 w-6 flex justify-center scale-110">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                    </div>
                                    <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                                        History logs
                                    </span>
                                </Link>
                            </nav>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 space-y-4">
                        <div className={`flex flex-col gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 transition-all duration-500 ${isSidebarHovered ? 'opacity-100' : 'opacity-0 invisible h-0 overflow-hidden'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white border border-white/10">
                                    <span className="font-bold text-sm">{userInitial}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                                    <p className="text-[9px] text-white/40 uppercase font-black tracking-widest leading-none">Active</p>
                                </div>
                            </div>
                            <button onClick={handleSignOut} className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold border border-red-500/10 transition-all">
                                Sign Out
                            </button>
                        </div>

                        <div className={`flex justify-center transition-all duration-300 ${isSidebarHovered ? 'hidden opacity-0 h-0' : 'opacity-100 h-12'}`}>
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 truncate">
                                {userInitial}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 min-h-screen px-6 sm:px-12 py-10 space-y-12 transition-all duration-500 lg:ml-4`}>
                    <div className="pb-8 border-b border-white/10">
                        <p className="text-[var(--primary)] font-black text-[10px] uppercase tracking-[0.4em] mb-3">Identity Center</p>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tighter">Candidate Profile</h1>
                        <p className="text-white/40 font-medium mt-3 max-w-2xl leading-relaxed">
                            Upload your resume to set up a continuous professional profile. Once your profile is mapped, you can jump instantly into AI interviews tailored specifically for your exact skillset.
                        </p>
                    </div>

                    {!profile ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            {/* Resume Upload Section */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold tracking-tight">Upload Credentials</h2>
                                <div
                                    className={`glass-card p-12 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all duration-300 h-[350px] ${isDragging ? "border-[var(--primary)] bg-[var(--primary)]/10 scale-[1.02]" : "border-white/10 hover:border-white/20 hover:bg-white/5"}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById("profile-file-input")?.click()}
                                >
                                    <input id="profile-file-input" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={isUploading} />

                                    {isUploading ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="font-bold text-[var(--primary)] animate-pulse">Extracting Profile Data...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(200,162,255,0.1)]">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                            </div>
                                            <p className="text-2xl font-semibold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Drop Resume Document</p>
                                            <p className="text-sm text-white/40 max-w-sm">Supported formats: PDF, DOCX.</p>
                                            {uploadError && <p className="text-red-400 mt-5 text-sm font-medium px-4 py-2 bg-red-400/10 rounded-lg">{uploadError}</p>}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Manual Entry Section */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold tracking-tight">Manual Skill Input</h2>
                                <div className="glass-card p-6 h-[350px] flex flex-col">
                                    <textarea
                                        value={manualData}
                                        onChange={(e) => setManualData(e.target.value)}
                                        placeholder="Paste your LinkedIn summary, specific skills, or raw resume text here..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-white/80 outline-none focus:border-[var(--primary)] focus:shadow-[0_0_20px_rgba(200,162,255,0.15)] custom-scrollbar resize-none transition-all"
                                        disabled={isUploading}
                                    />
                                    <button
                                        onClick={handleManualSubmit}
                                        disabled={!manualData.trim() || isUploading}
                                        className="mt-6 w-full btn-primary py-3 px-6 rounded-xl font-bold disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        Extract Skills
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in-up">
                            {/* Profile Data Display */}
                            <div className="glass-card overflow-hidden">
                                <div className="p-10 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-8">
                                        <div className="relative">
                                            {profile.photoBase64 ? (
                                                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-[var(--primary)] shadow-[0_0_30px_rgba(200,162,255,0.3)] rotate-3">
                                                    <img src={profile.photoBase64} alt="Profile" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-4xl font-black text-black shadow-[0_0_30px_rgba(200,162,255,0.3)] rotate-3">
                                                    {profile.name.charAt(0)}
                                                </div>
                                            )}
                                            {isEditing && (
                                                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg z-10">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                                </label>
                                            )}
                                        </div>
                                        <div>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={profile.name}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    className="bg-black/40 border border-white/20 rounded px-3 py-1 text-3xl font-black tracking-tight text-white w-full max-w-[300px] mb-2"
                                                />
                                            ) : (
                                                <h2 className="text-3xl font-black tracking-tight">{profile.name}</h2>
                                            )}
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={profile.email}
                                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                    className="bg-black/40 border border-white/20 rounded px-3 py-1 text-sm font-mono text-white/80 w-full max-w-[300px]"
                                                    placeholder="Email address"
                                                />
                                            ) : (
                                                <p className="text-white/40 font-mono mt-2">{profile.email || "No email parsed"}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                                        >
                                            {isEditing ? (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                                                    Save Changes
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                                    Edit Profile
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={startInterviewWithProfile}
                                            className="btn-primary px-8 py-4 text-sm font-bold shadow-[0_0_30px_rgba(200,162,255,0.2)] hover:scale-105 transition-all flex items-center gap-3 whitespace-nowrap"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                            Launch Interview
                                        </button>
                                    </div>
                                </div>

                                {/* Extra Information Form (Age, Phone, College, Hobbies) */}
                                {isEditing && (
                                    <div className="p-10 border-b border-white/5 bg-black/20">
                                        <h3 className="text-xl font-bold mb-6 text-white/90">Additional Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={profile.phone || ""}
                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--primary)]"
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Age</label>
                                                <input
                                                    type="number"
                                                    value={profile.age || ""}
                                                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--primary)]"
                                                    placeholder="e.g. 24"
                                                    min="16" max="100"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">College / University</label>
                                                <select
                                                    value={profile.education?.[0]?.institution || ""}
                                                    onChange={(e) => {
                                                        const newEd = [...(profile.education || [])];
                                                        if (newEd.length === 0) newEd.push({ institution: e.target.value, degree: "", branch: "", year: "", cgpa: "" });
                                                        else newEd[0].institution = e.target.value;
                                                        setProfile({ ...profile, education: newEd });
                                                    }}
                                                    className="w-full bg-[#0a0514] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--primary)]"
                                                >
                                                    <option value="" disabled>Select Institution</option>
                                                    <option value="MIT">Massachusetts Institute of Technology</option>
                                                    <option value="Stanford">Stanford University</option>
                                                    <option value="Harvard">Harvard University</option>
                                                    <option value="UC Berkeley">UC Berkeley</option>
                                                    <option value="Oxford">Oxford University</option>
                                                    <option value="Waterloo">University of Waterloo</option>
                                                    <option value="Other">Other / Not Listed</option>
                                                </select>
                                                {profile.education?.[0]?.institution === "Other" && (
                                                    <input
                                                        type="text"
                                                        placeholder="Type institution name..."
                                                        className="w-full mt-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
                                                    />
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Hobbies (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={profile.hobbies?.join(", ") || ""}
                                                    onChange={(e) => setProfile({ ...profile, hobbies: e.target.value.split(",").map(h => h.trim()).filter(Boolean) })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--primary)]"
                                                    placeholder="Reading, Chess, Hiking"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {/* Skills Block */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                                            </div>
                                            <h3 className="text-xl font-bold">Extracted Skill Vectors</h3>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            {Object.entries(profile.skills || {}).map(([category, skillList]) => skillList.length > 0 && (
                                                <div key={category}>
                                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{category}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {skillList.map((skill: any, idx: number) => (
                                                            <span key={idx} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2">
                                                                {skill.name} <span className="text-[10px] text-white/30 truncate">({skill.level})</span>
                                                                {isEditing && (
                                                                    <button onClick={() => {
                                                                        const newSkills = { ...profile.skills };
                                                                        (newSkills as any)[category] = skillList.filter((_: any, i: number) => i !== idx);
                                                                        setProfile({ ...profile, skills: newSkills });
                                                                    }} className="text-white/40 hover:text-red-400">
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            {isEditing && (
                                                <div className="mt-4 flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Add new skill..."
                                                        className="bg-transparent border-b border-[var(--primary)] text-sm px-2 py-1 outline-none w-40 text-white placeholder-white/30"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const val = e.currentTarget.value.trim();
                                                                if (val) {
                                                                    setProfile({
                                                                        ...profile,
                                                                        skills: {
                                                                            ...profile.skills,
                                                                            programming: [...(profile.skills?.programming || []), { name: val, level: "Intermediate" }]
                                                                        }
                                                                    });
                                                                    e.currentTarget.value = "";
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Experience or Summary Block */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                            </div>
                                            <h3 className="text-xl font-bold">Professional Overview</h3>
                                        </div>

                                        {profile.experience && profile.experience.length > 0 ? (
                                            <div className="space-y-6">
                                                {profile.experience.slice(0, 3).map((exp, idx) => (
                                                    <div key={idx} className="relative pl-6 border-l border-white/10 pb-6 last:pb-0 last:border-0">
                                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                                                        <h4 className="font-bold text-lg text-white/90">{exp.role}</h4>
                                                        <p className="text-white/40 font-mono text-sm mt-1">{exp.company} • {exp.duration}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                <p className="text-white/60 leading-relaxed text-sm font-medium">
                                                    {profile.summary.substring(0, 300)}...
                                                </p>
                                            </div>
                                        )}

                                        {profile.projects && profile.projects.length > 0 && (
                                            <div className="mt-8">
                                                <h3 className="text-xl font-bold mb-4">Projects</h3>
                                                <div className="space-y-4">
                                                    {profile.projects.map((proj, idx) => (
                                                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                                                            <h4 className="font-bold text-white mb-1">{proj.title}</h4>
                                                            <p className="text-xs text-white/50 mb-3">{proj.description}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {proj.technologies?.map((tech, i) => (
                                                                    <span key={i} className="text-[10px] uppercase font-bold tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded">{tech}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {profile.certifications && profile.certifications.length > 0 && (
                                            <div className="mt-8">
                                                <h3 className="text-lg font-bold mb-4 text-white/80">Certifications</h3>
                                                <div className="space-y-3">
                                                    {profile.certifications.map((cert, idx) => (
                                                        <div key={idx} className="flex justify-between items-center pb-3 border-b border-white/5">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white">{cert.name}</h4>
                                                                <p className="text-xs text-white/40">{cert.platform}</p>
                                                            </div>
                                                            <span className="text-xs text-white/30 font-mono">{cert.year}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Hobbies non-edit display */}
                                        {!isEditing && profile.hobbies && profile.hobbies.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-white/5">
                                                <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3">Hobbies & Interests</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.hobbies.map((hobby, idx) => (
                                                        <span key={idx} className="px-3 py-1 bg-white/5 rounded text-xs text-white/70">
                                                            {hobby}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Phone / Age / College info */}
                                        {!isEditing && (profile.phone || profile.age || profile.education?.length > 0) && (
                                            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                                {profile.phone && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Phone</p>
                                                        <p className="text-sm text-white/80">{profile.phone}</p>
                                                    </div>
                                                )}
                                                {profile.age && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Age</p>
                                                        <p className="text-sm text-white/80">{profile.age}</p>
                                                    </div>
                                                )}
                                                {profile.education?.[0]?.institution && (
                                                    <div className="col-span-2">
                                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Education</p>
                                                        <p className="text-sm text-white/80">{profile.education[0].institution}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 bg-black/40 border-t border-white/5 text-center">
                                    <button onClick={() => setProfile(null)} className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                                        Re-upload Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
