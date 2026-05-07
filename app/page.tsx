"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import LiveBackground from "@/components/LiveBackground";
import { useEffect, useRef } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => { });
          }
        });
      },
      { threshold: 0.3 } // Plays when 30% of the video is visible
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative bg-[#0a0514]">

      <LiveBackground />

      <div className="ambient-background" />
      <div className="grid-background" />
      <div className="grid-crosses" />


      {/* Hero Section - Vertical Stack */}
      <header className="relative z-10 pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-16 animate-fade-in-up">
          {/* 1. Words (Top) */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-bold border border-[var(--primary)]/20 mb-4 stagger-1">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
              The Next Evolution of Interview Prep
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none stagger-2">
              Master Your Next<br />
              <span className="bg-gradient-to-r from-[var(--primary)] via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(200,162,255,0.3)]">
                Technical Interview
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/40 max-w-3xl mx-auto leading-relaxed stagger-3">
              Experience photorealistic AI simulations tailored to your career path. Practice with
              the most advanced behavioral and technical gauntlets ever engineered.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 stagger-4">
              <Link href="/sign-up" className="btn-primary text-xl px-12 py-5 shadow-[0_0_40px_rgba(200,162,255,0.3)] hover:scale-105 transition-transform">
                Get Started Now
              </Link>
              <Link href="/dashboard" className="text-white/30 hover:text-white font-bold text-sm uppercase tracking-widest transition-all">
                Access Dashboard →
              </Link>
            </div>
          </div>

          {/* 2. Photo (Below Words) - Now Significantly Larger */}
          <div className="relative stagger-5 group max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-[var(--primary)]/20 blur-[180px] rounded-full pointer-events-none -z-10 group-hover:bg-[var(--primary)]/30 transition-all duration-1000"></div>
            <div className="relative rounded-[3.5rem] overflow-hidden border border-white/10 shadow-3xl bg-[#160d2b]/40 backdrop-blur-md p-4">
              <Image
                src="/interview-hero.png"
                alt="AI Interview Session"
                width={1600}
                height={1000}
                className="rounded-[3rem] w-full h-auto object-cover transform transition-transform duration-1000 group-hover:scale-[1.01]"
                priority
              />
            </div>
          </div>

          {/* 3. Video (Below Photo) - Future-Proofed URL Placeholder */}
          <div className="relative pt-32 stagger-6 pb-20">
            <div className="max-w-5xl mx-auto">
              <div className="mb-14 text-center">
                <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.5em] text-[var(--primary)] mb-6">
                  Experience Reality
                </div>
                <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                  4K Simulation Engine
                </h3>
              </div>
              <div className="relative rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <video
                  ref={videoRef}
                  muted
                  loop
                  playsInline
                  className="w-full aspect-video object-cover transition-transform duration-700 hover:scale-[1.01]"
                  key="main-simulation-video"
                  onMouseEnter={() => videoRef.current?.play().catch(() => { })}
                >
                  {/* Swap the 'src' below with any video URL you want to use */}
                  <source
                    src="/ai-interview-promo.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute bottom-12 left-12 flex items-center gap-5">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                    <div className="relative w-5 h-5 rounded-full bg-red-500" />
                  </div>
                  <span className="text-sm font-black text-white uppercase tracking-[0.6em]">Live Engine Feed</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {[
                  "Real-time Logic Processing",
                  "Visual Sentiment Analysis",
                  "High-Density Score Matrix"
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-white/50">
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-sm font-black text-[var(--primary)] uppercase tracking-widest">Core Capabilities</h2>
            <h3 className="text-4xl md:text-6xl font-extrabold text-white">Engineered for Success</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Resume Intel",
                desc: "Our AI analyzes your specific experience to ask questions that you'll actually face.",
                icon: "📄",
                href: null
              },
              {
                title: "Code Challenge",
                desc: "Write code in our browser editor. Built-in execution against test cases, plus skill level rating scores.",
                icon: "💻",
                href: "/code-challenge"
              },
              {
                title: "Simple Compiler",
                desc: "A standalone execution playground for Java, Python, C++, and JS. Zero-latency code runner for quick prototyping.",
                icon: "⚡",
                href: "/compiler"
              },
              {
                title: "Voice Response",
                desc: "Practice speaking out loud. We detect tone, hesitation, and technical accuracy.",
                icon: "🎙️",
                href: null
              },
              {
                title: "Real-time Metrics",
                desc: "Get a comprehensive score and detailed improvement roadmap after every session.",
                icon: "📈",
                href: null
              },
              {
                title: "Casual Talk",
                desc: "No pressure chat with Alex — practice communication, think out loud, or just warm up before an interview.",
                icon: "💬",
                href: "/casual-talk"
              },
              {
                title: "Deep Analytics",
                desc: "Track your progress over time with our visual performance pulse matrix.",
                icon: "💎",
                href: null
              },
              {
                title: "Face & Emotion AI",
                desc: "Real-time body language analysis via DeepFace — confidence, emotion, and eye contact tracked live.",
                icon: "👁️",
                href: null
              }
            ].map((feat, i) =>
              feat.href ? (
                <Link
                  key={i}
                  href={feat.href}
                  className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden border-[var(--accent)]/20 hover:border-[var(--accent)]/40 cursor-pointer"
                >
                  <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--accent)]/10 rounded-bl-xl border-b border-l border-[var(--accent)]/20">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Try it →</span>
                  </div>
                  <div className="text-4xl mb-6">{feat.icon}</div>
                  <h4 className="text-2xl font-bold mb-4 group-hover:text-[var(--accent)] transition-colors">{feat.title}</h4>
                  <p className="text-white/50 leading-relaxed">{feat.desc}</p>
                </Link>
              ) : (
                <div key={i} className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300">
                  <div className="text-4xl mb-6">{feat.icon}</div>
                  <h4 className="text-2xl font-bold mb-4 group-hover:text-[var(--primary)] transition-colors">{feat.title}</h4>
                  <p className="text-white/50 leading-relaxed">{feat.desc}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative z-10 py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">Ready for your dream offer?</h2>
          <div className="pt-4">
            <Link href="/sign-up" className="btn-primary text-xl px-12 py-5 shadow-[0_0_40px_rgba(200,162,255,0.25)]">Start Your Journey Today</Link>
          </div>
          <div className="pt-20 border-t border-white/5 text-white/30 text-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo className="h-6 grayscale opacity-50" />
            <p>© 2026 PrepWise AI. All rights reserved by Fahad Shajahan.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-white transition-colors">Github</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
