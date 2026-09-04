/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PRESET_IMAGES, PresetImage } from "../data/presets";
import { Eye, ShieldAlert, Sparkles, Heart } from "lucide-react";

interface PresetsProps {
  lang: "vi" | "en";
  onSelectPreset: (preset: PresetImage) => void;
  selectedId?: string;
  disabled: boolean;
}

export default function Presets({ lang, onSelectPreset, selectedId, disabled }: PresetsProps) {
  return (
    <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-semibold tracking-wide text-slate-200">
          {lang === "vi" ? "Dùng thử Ảnh Mẫu" : "Quick Sample Presets"}
        </h3>
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
          {lang === "vi" ? "Click để phân tích ngay" : "click to test instantly"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PRESET_IMAGES.map((preset) => (
          <button
            key={preset.id}
            disabled={disabled}
            onClick={() => onSelectPreset(preset)}
            className={`group text-left rounded-lg overflow-hidden border bg-slate-900/40 hover:bg-slate-900 transition-all cursor-pointer relative ${
              selectedId === preset.id
                ? "border-cyan-500 ring-1 ring-cyan-500/30"
                : "border-slate-800 hover:border-slate-700"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {/* Image banner */}
            <div className="h-24 w-full overflow-hidden relative">
              <img
                src={preset.url}
                alt={preset.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              
              {/* Category tags */}
              <span className={`absolute top-2 right-2 text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded uppercase border ${
                preset.category === "real" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : preset.category === "ai"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`}>
                {preset.category === "real" 
                  ? (lang === "vi" ? "Đời Thật" : "Genuine")
                  : "AI"}
              </span>
            </div>

            {/* Content body */}
            <div className="p-3">
              <h4 className="text-xs font-bold text-white tracking-wide truncate">
                {lang === "vi" ? preset.titleVi : preset.titleEn}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {lang === "vi" ? preset.descriptionVi : preset.descriptionEn}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
