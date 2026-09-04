/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, ShieldCheck, Languages } from "lucide-react";

interface HeaderProps {
  lang: "vi" | "en";
  setLang: (lang: "vi" | "en") => void;
}

export default function Header({ lang, setLang }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-sans font-bold text-lg sm:text-xl tracking-tight text-white">
                Photo Analysis
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                <Sparkles className="h-3 w-3" /> FORENSICS v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              {lang === "vi"
                ? "Hệ thống Phân tích & Phát hiện Ảnh Thật / AI"
                : "Authentic Portrait & AI Synthesis Detection System"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats Banner - Adds realistic cyber aesthetic */}
          <div className="hidden md:flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              CORE: ACTIVE
            </div>
            <span className="text-slate-700">|</span>
            <div>MODEL: GEMINI-3.5</div>
          </div>

          {/* Bilingual Toggle */}
          <button
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
          >
            <Languages className="h-3.5 w-3.5 text-cyan-400" />
            <span>{lang === "vi" ? "EN" : "VI"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
