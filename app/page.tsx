"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="grid-background" />
      <div className="grid-crosses" />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#e8985a" strokeWidth="2.5" fill="none" />
              <circle cx="12" cy="16" r="3" fill="#e8985a" />
              <path d="M18 13 C22 13 22 19 18 19" stroke="#e8985a" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M20 11 C25 11 25 21 20 21" stroke="#e8985a" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span className="font-bold text-lg">PrepWise</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="btn-outline text-sm py-2 px-5">Sign In</Link>
            <Link href="/sign-up" className="btn-primary text-sm py-2 px-5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Master Your Next<br />
            <span className="bg-gradient-to-r from-[var(--primary)] via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Technical Interview
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            AI-powered mock interviews tailored to your resume. Practice with real questions, speak out loud, and get instant feedback on your performance.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/sign-up" className="btn-primary text-lg px-10 py-4">
              Start for Free
            </Link>
            <Link href="/dashboard" className="btn-outline text-lg px-8 py-4">
              Explore Courses
            </Link>
          </div>

          {/* Robot */}
          <div className="mt-8 animate-float">
            <Image
              src="/robot-hero.png"
              alt="AI Robot"
              width={360}
              height={300}
              className="mx-auto drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </main>
    </div>
  );
}
