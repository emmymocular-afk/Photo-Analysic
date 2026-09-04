/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import Presets from "./components/Presets";
import { PresetImage } from "./data/presets";
import { AnalysisResult, ImageArtifact } from "./types";
import { 
  Upload, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  ChevronRight, 
  Info,
  Layers,
  Fingerprint,
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

export default function App() {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeArtifact, setActiveArtifact] = useState<ImageArtifact | null>(null);
  const [showExplainOverlay, setShowExplainOverlay] = useState<boolean>(true);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Resize and compress high-res image to avoid heavy requests and lower latency
  const processAndSetImage = (file: File) => {
    setError(null);
    setFileName(file.name);
    
    const sizeInKb = (file.size / 1024).toFixed(1);
    setFileSize(`${sizeInKb} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        // Target an eye-safe size of maximum 1200x1200px
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setImageSrc(compressedDataUrl);
          setSelectedPresetId(undefined);
          setAnalysisResult(null); // Clear previous output on upload
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndSetImage(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSelectPreset = (preset: PresetImage) => {
    setError(null);
    setImageSrc(preset.url);
    setFileName(preset.titleEn);
    setFileSize("Hosted URL");
    setSelectedPresetId(preset.id);
    setAnalysisResult(null); // Reset past result
    setActiveArtifact(null);
  };

  // Run the core forensics analysis using our secure /api/analyze endpoint
  const runForensicAnalysis = async () => {
    if (!imageSrc) return;
    setAnalyzing(true);
    setError(null);
    setActiveArtifact(null);

    try {
      let payload: any = {};
      
      // If we are using a preset that isn't base64, send the direct URL to save upload bandwidth
      if (selectedPresetId) {
        payload.imageUrl = imageSrc;
      } else {
        // Strip data:image/jpeg;base64, header for the inlineData API
        const base64Parts = imageSrc.split(",");
        const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const base64Data = base64Parts[1];
        payload.image = base64Data;
        payload.mimeType = mimeType;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errMsg = lang === "vi"
          ? (errorData.details || errorData.error || "Có lỗi phân tích xảy ra.")
          : (errorData.detailsEn || errorData.error || "An analysis error occurred.");
        throw new Error(errMsg);
      }

      const result: AnalysisResult = await res.json();
      setAnalysisResult(result);
      
      // Pre-select the first artifact if any are available to guide the user visual attention
      if (result.artifacts && result.artifacts.length > 0) {
        setActiveArtifact(result.artifacts[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi truyền tải hoặc xử lý ảnh.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Clear Analysis functionality to instantly reset workspace to zero
  const clearAnalysis = () => {
    setImageSrc(null);
    setFileName(null);
    setFileSize(null);
    setSelectedPresetId(undefined);
    setAnalysisResult(null);
    setError(null);
    setActiveArtifact(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      <Header lang={lang} setLang={setLang} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Sub-headline explaining what the AI can detect */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-900 rounded-xl p-4 sm:px-6">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              {lang === "vi" 
                ? "Mô tả Khả năng Nhận diện" 
                : "Detection System Overview"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {lang === "vi"
                ? "Ứng dụng phân tích pháp chứng hình ảnh chuyên sâu bằng mô hình Gemini 3.5. Hệ thống sẽ phát hiện tính chất bất hợp lý về mặt vật lý, mật độ lỗ chân lông giả, lỗi phản chiếu ánh sáng trong đồng tử, biến dạng cấu trúc hoặc độ sâu trường ảnh giả lập để kết luận ảnh thật hay tạo bằng AI."
                : "Advanced forensic image analysis powered by Gemini 3.5. Scrutinizes sub-pixel noise distribution, biological skin structures, lighting geometry matches, and anatomical symmetries to evaluate raw camera captures against generative output."}
            </p>
          </div>
        </div>

        {/* Outer Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT ZONE: Image Preview & Interactive Artifact Highlighting Workspace (Cols 1-7 on large desktop) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Presets Row */}
            <Presets 
              lang={lang} 
              onSelectPreset={handleSelectPreset} 
              selectedId={selectedPresetId} 
              disabled={analyzing} 
            />

            {/* Custom interactive dashboard container */}
            <div 
              id="image-forensic-workbench"
              className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {/* Visual laser scanner effect animation overlay for forensic aesthetic while uploading/analyzing */}
              {analyzing && (
                <div className="absolute top-0 inset-x-0 h-1 bg-cyan-500/70 shadow-lg shadow-cyan-400 animate-bounce z-10" />
              )}

              {/* Header inside workbench */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                  {lang === "vi" ? "Khu vực pháp chứng" : "Forensic Workbench"}
                </span>
                
                {imageSrc && (
                  <button
                    id="btn-clear-workbench"
                    onClick={clearAnalysis}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800/80 hover:bg-red-950/40 hover:text-red-400 border border-slate-800 hover:border-red-900/50 text-slate-300 transition-colors cursor-pointer"
                    title={lang === "vi" ? "Dọn dẹp ảnh hiện tại" : "Clear current image"}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{lang === "vi" ? "Xóa ảnh" : "Clear picture"}</span>
                  </button>
                )}
              </div>

              {/* Main Content Pane */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[380px]">
                {!imageSrc ? (
                  // UPLOAD EMPTY STATE CODE
                  <div 
                    onClick={triggerFileSelect} 
                    className={`w-full border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                      dragActive 
                        ? "border-cyan-500 bg-cyan-500/5" 
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60"
                    }`}
                  >
                    <div className="p-4 rounded-full bg-slate-900/85 border border-slate-800 text-slate-300 group-hover:scale-110 transition-transform">
                      <Upload className="h-10 w-10 text-cyan-400" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <p className="text-sm font-semibold text-slate-200">
                        {lang === "vi" ? "Bấm vào đây hoặc kéo thả tập tin để tải lên" : "Click or drag/drop image here to begin"}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {lang === "vi" 
                          ? "Hỗ trợ PNG, JPEG hoặc WebP. Hệ thống sẽ tự động tối ưu hóa dung lượng trước khi quét."
                          : "Supports PNG, JPEG or WebP. Optimal forensic compression is calculated client-side."}
                      </p>
                    </div>

                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                ) : (
                  // PHOTO IS LOADED STATE
                  <div className="w-full space-y-4">
                    {/* Raw layout of the rendering image and its visual coordinates */}
                    <div 
                      ref={previewContainerRef}
                      className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 max-h-[500px] flex items-center justify-center group"
                    >
                      <img
                        id="target-forensic-image"
                        src={imageSrc}
                        alt="Forensic view target"
                        className="max-h-[500px] w-auto max-w-full object-contain block select-none"
                      />

                      {/* Dark grid graphic overlay when detecting/analyzing to highlight technical background */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                      {/* "Explain" Hotspots overlay inside the image itself */}
                      {analysisResult && showExplainOverlay && analysisResult.artifacts && (
                        <div className="absolute inset-0 pointer-events-auto">
                          {/* Map coordinates onto the absolute sizing container */}
                          {analysisResult.artifacts.map((art, idx) => {
                            const isSelected = activeArtifact?.x === art.x && activeArtifact?.y === art.y;
                            
                            // Colors based on artifact categories
                            let dotColorClass = "from-red-500 to-amber-600 shadow-red-500/30 border-red-400";
                            if (art.type === "lighting") {
                              dotColorClass = "from-yellow-400 to-amber-500 shadow-yellow-400/40 border-yellow-200";
                            } else if (art.type === "texture") {
                              dotColorClass = "from-teal-400 to-cyan-500 shadow-cyan-400/40 border-cyan-200";
                            } else if (art.type === "anatomy") {
                              dotColorClass = "from-rose-500 to-red-600 shadow-red-500/40 border-rose-200";
                            } else if (art.type === "environment") {
                              dotColorClass = "from-indigo-400 to-indigo-600 shadow-indigo-500/40 border-indigo-200";
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => setActiveArtifact(art)}
                                style={{
                                  left: `${art.x}%`,
                                  top: `${art.y}%`,
                                  width: `${Math.max(16, art.radius * 2)}px`,
                                  height: `${Math.max(16, art.radius * 2)}px`,
                                  transform: "translate(-50%, -50%)"
                                }}
                                className={`absolute rounded-full border bg-gradient-to-tr flex items-center justify-center cursor-pointer transition-all ${dotColorClass} ${
                                  isSelected 
                                    ? "scale-125 ring-2 ring-white/50 z-30" 
                                    : "hover:scale-110 opacity-80 hover:opacity-100 z-20"
                                }`}
                                title={lang === "vi" ? art.labelVi : art.labelEn}
                              >
                                {/* Inner animated radar rings to signify attention focus */}
                                <span className={`absolute inset-0 rounded-full border animate-ping opacity-65 ${
                                  art.type === "lighting" ? "border-yellow-400" : "border-rose-400"
                                }`} />
                                
                                <span className="text-[10px] font-mono font-bold text-white leading-none">
                                  {idx + 1}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Loading text container block */}
                      {analyzing && (
                        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-20">
                          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
                          <div className="text-center space-y-1">
                            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                              {lang === "vi" ? "ĐANG TIẾN HÀNH PHÂN TÍCH FORENSIC..." : "RUNNING ADVANCED SCAN..."}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {lang === "vi" 
                                ? "Vui lòng đợi vài giây để Gemini quét và định vị các điểm lỗi"
                                : "Scanning image canvas and projecting sub-region matrices"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Trigger buttons segment */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 border border-slate-900 rounded-lg p-3">
                      <div className="text-xs space-y-0.5 w-full sm:w-auto">
                        <div className="text-slate-200 font-medium truncate max-w-[280px]">
                          {fileName || (lang === "vi" ? "Tệp không tên" : "Unnamed file")}
                        </div>
                        <div className="text-slate-400 font-mono text-[10px]">
                          SIZE: {fileSize}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Interactive Explain overlay toggle switch */}
                        {analysisResult && (
                          <button
                            onClick={() => setShowExplainOverlay(!showExplainOverlay)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                              showExplainOverlay 
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm shadow-cyan-500/5" 
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300"
                            }`}
                          >
                            {showExplainOverlay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            <span>{lang === "vi" ? "Giải thích chi tiết" : "Explain highlights"}</span>
                          </button>
                        )}

                        <button
                          id="btn-trigger-analysis"
                          disabled={analyzing}
                          onClick={runForensicAnalysis}
                          className="flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
                        >
                          {analyzing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>{lang === "vi" ? "Đang quét..." : "Scanning..."}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                              <span>
                                {analysisResult 
                                  ? (lang === "vi" ? "Quét lại ảnh" : "Re-analyze Image")
                                  : (lang === "vi" ? "Tiến hành phân tích hình ảnh" : "Start Deep Analysis")}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Local Selected Highlight Area Box (The interactive 'Explain' artifact detail layout) */}
                    {analysisResult && showExplainOverlay && activeArtifact && (
                      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4.5 space-y-2.5 shadow-md relative">
                        <div className="absolute top-4.5 right-4.5 flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase border bg-slate-950/40 border-slate-800 text-slate-400">
                          <Layers className="h-3 w-3 text-cyan-400" />
                          <span>COORD: X:{activeArtifact.x}% Y:{activeArtifact.y}%</span>
                        </div>

                        <div className="flex items-start gap-3">
                          {/* Colored category pill */}
                          <div className={`mt-0.5 h-6 w-6 rounded-md flex items-center justify-center border text-[10px] font-mono font-bold ${
                            activeArtifact.type === "lighting" 
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : activeArtifact.type === "texture"
                              ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                              : activeArtifact.type === "anatomy"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          }`}>
                            {activeArtifact.type[0].toUpperCase()}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
                              {lang === "vi" ? "ĐIỂM FORENSIC SỐ" : "SCANNED POINT"}
                            </span>
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                              {lang === "vi" ? activeArtifact.labelVi : activeArtifact.labelEn}
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mt-1 bg-slate-950/30 p-2.5 rounded-lg border border-slate-950">
                              {lang === "vi" ? activeArtifact.descriptionVi : activeArtifact.descriptionEn}
                            </p>
                          </div>
                        </div>

                        {/* List out helper buttons for other artifacts click references */}
                        {analysisResult.artifacts && analysisResult.artifacts.length > 1 && (
                          <div className="pt-2 border-t border-slate-950">
                            <span className="text-[10px] text-slate-500 block mb-1.5 uppercase font-mono tracking-wider">
                              {lang === "vi" ? "Xem nhanh các tọa độ phát hiện khác:" : "Jump to other flagged hotspots:"}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisResult.artifacts.map((a, i) => (
                                <button
                                  key={i}
                                  onClick={() => setActiveArtifact(a)}
                                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                                    activeArtifact.x === a.x && activeArtifact.y === a.y
                                      ? "bg-cyan-500/20 text-cyan-100 border-cyan-500/40"
                                      : "bg-slate-950/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-900"
                                  }`}
                                >
                                  #{i + 1} - {lang === "vi" ? a.labelVi : a.labelEn}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-950/20 border border-red-900/40 text-red-100 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-semibold tracking-wide text-red-300">
                        {lang === "vi" ? "LỖI XÁC THỰC HOẶC PHÂN TÍCH" : "AUTHENTICATION OR ANALYSIS ERROR"}
                      </p>
                      <p className="text-xs text-red-200/90 leading-relaxed">{error}</p>
                    </div>
                  </div>

                  {(error.includes("Settings") || error.includes("Secrets") || error.includes("API Key") || error.includes("API_KEY") || error.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || error.includes("UNAUTHENTICATED")) && (
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                      <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <span>💡</span>
                        {lang === "vi" ? "Cách khắc phục nhanh:" : "Quick resolution steps:"}
                      </p>
                      <p className="leading-relaxed">
                        {lang === "vi"
                          ? "1. Truy cập https://aistudio.google.com/app/apikey và tạo một API Key mới (chọn project mới hoặc project đã bật Generative Language API)."
                          : "1. Visit https://aistudio.google.com/app/apikey and create a new API Key (select a new project or one with Generative Language API enabled)."}
                      </p>
                      <p className="leading-relaxed">
                        {lang === "vi"
                          ? "2. Nếu khóa có đặt giới hạn (API Restrictions) trong Google Cloud Console, hãy đảm bảo đã chọn 'Generative Language API'."
                          : "2. If the key has API Restrictions in Google Cloud Console, ensure 'Generative Language API' is permitted."}
                      </p>
                      <p className="leading-relaxed">
                        {lang === "vi"
                          ? "3. Nhấp vào Settings (bánh răng ở góc trên bên phải Google AI Studio Build) > 'Secrets' > Cập nhật GEMINI_API_KEY rồi bấm 'Thử quét lại'."
                          : "3. Click Settings (gear icon in Google AI Studio Build) > 'Secrets' > Update GEMINI_API_KEY then click 'Retry Analysis'."}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={runForensicAnalysis}
                      disabled={analyzing}
                      className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 text-xs text-red-100 font-medium transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {lang === "vi" ? "Thử quét lại" : "Retry Analysis"}
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {lang === "vi" ? "Đóng" : "Dismiss"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT ZONE: Final Verdict & In-depth Category Checklist Reports (Cols 8-12 on large desktop) */}
          <div className="lg:col-span-5 space-y-4">
            
            {!analysisResult && !analyzing ? (
              // Empty result instructions
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-500 mx-auto">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-slate-200">
                    {lang === "vi" ? "Chưa có Báo cáo Quét" : "Analysis Awaiting Image"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {lang === "vi"
                      ? "Chọn một trong các ảnh mẫu ở trên hoặc tải một bức ảnh từ máy tính để phân phân phối chi tiết lỗ chân lông, ánh mắt và môi trường xung quanh."
                      : "Please upload an image or click on a sample preset to generate real-time visual coordinate markers and the deep forensics audit scorecard."}
                  </p>
                </div>
              </div>
            ) : (
              // RESULT/ANALYZING PORTION
              <div className="space-y-4">
                
                {/* Result Loading Skeletons */}
                {analyzing && !analysisResult ? (
                  <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 space-y-6 animate-pulse">
                    <div className="h-28 bg-slate-950/60 rounded-xl flex items-center justify-center">
                      <span className="text-xs font-mono text-slate-500 tracking-wider">PREPARING DIAGNOSTICK MATRIX...</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-950/50 rounded w-1/3" />
                      <div className="h-3 bg-slate-950/50 rounded w-5/6" />
                      <div className="h-3 bg-slate-950/50 rounded w-full" />
                    </div>
                    <div className="space-y-3 pt-4 border-t border-slate-950">
                      <div className="h-10 bg-slate-950/50 rounded" />
                      <div className="h-10 bg-slate-950/50 rounded" />
                      <div className="h-10 bg-slate-950/50 rounded" />
                    </div>
                  </div>
                ) : (
                  // REAL ANALYSIS SCORECARD
                  analysisResult && (
                    <div className="space-y-4">

                      {/* Main Big Gauges card */}
                      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 sm:p-6 space-y-5">
                        
                        {/* Title and Badge */}
                        <div className="flex items-center justify-between border-b border-slate-950 pb-3">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                            {lang === "vi" ? "KẾT LUẬN CUỐI CÙNG" : "FORENSIC VERDICT"}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase bg-cyan-950/30 border border-cyan-500/20 px-2 py-0.5 rounded">
                            {analysisResult.isReal 
                              ? (lang === "vi" ? "ĐỘ TIN CẬY CAO" : "HIGH FIDELITY") 
                              : (lang === "vi" ? "PHÁT HIỆN AI" : "AI DETECTED")}
                          </span>
                        </div>

                        {/* Interactive gauge scale block */}
                        <div className="flex items-center gap-5">
                          {/* Compact visual percentage circle */}
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 flex items-center justify-center">
                            {/* SVG gauge tracks */}
                            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle 
                                cx="50" cy="50" r="42" 
                                className="fill-none stroke-slate-950 stroke-[6]"
                              />
                              <circle 
                                cx="50" cy="50" r="42" 
                                className={`fill-none stroke-[6] transition-all duration-1000 ${
                                  analysisResult.isReal 
                                    ? "stroke-emerald-500" 
                                    : "stroke-amber-500"
                                }`}
                                strokeDasharray={263.8}
                                strokeDashoffset={263.8 - (263.8 * (analysisResult.confidence || 0)) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            
                            {/* Inner score texts */}
                            <div className="text-center z-10">
                              <span className="text-2xl sm:text-3xl font-mono font-bold text-white leading-none block">
                                {analysisResult.confidence}%
                              </span>
                              <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-0.5 block">
                                {analysisResult.isReal 
                                  ? (lang === "vi" ? "MỨC THẬT" : "REALITY") 
                                  : (lang === "vi" ? "MỨC GIẢ" : "SYNTHESIS")}
                              </span>
                            </div>
                          </div>

                          {/* Descriptive Verdict tag */}
                          <div className="space-y-2 flex-grow">
                            <div className={`text-base sm:text-lg font-bold flex items-center gap-1.5 ${
                              analysisResult.isReal ? "text-emerald-400" : "text-amber-400"
                            }`}>
                              {analysisResult.isReal ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                              <span>{lang === "vi" ? analysisResult.verdictVi : analysisResult.verdictEn}</span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                              {lang === "vi" ? analysisResult.summaryVi : analysisResult.summaryEn}
                            </p>
                          </div>
                        </div>

                        {/* Suspected Generator Metadata footer */}
                        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-950">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-400 font-medium">
                              {lang === "vi" ? "Nhãn hiệu AI Nghi vấn:" : "Suspected Generator Type:"}
                            </span>
                            <span className="font-bold text-cyan-400 font-mono">
                              {analysisResult.suspectedGenerator}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {lang === "vi" ? analysisResult.generatorLikelihoodVi : analysisResult.generatorLikelihoodEn}
                          </p>
                        </div>

                      </div>

                      {/* Detail audit scorecards for all categories (Lighting, textures, anatomical symmetry, background) */}
                      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                          <CheckCircle className="h-4 w-4 text-cyan-500" />
                          <span>{lang === "vi" ? "Chi tiết Các Chỉ số Quét" : "Detailed Forensic Scores"}</span>
                        </div>

                        {/* LIGHTING */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">
                              {lang === "vi" ? "⚡ Ánh sáng & Đổ bóng" : "⚡ Lighting & Optical Physics"}
                            </span>
                            <span className={`font-mono text-xs font-bold ${
                              analysisResult.sections.lighting.score >= 80 
                                ? "text-emerald-400" 
                                : analysisResult.sections.lighting.score >= 50 
                                ? "text-yellow-400" 
                                : "text-red-400"
                            }`}>
                              {analysisResult.sections.lighting.score}/100
                            </span>
                          </div>
                          <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                analysisResult.sections.lighting.score >= 80 
                                  ? "bg-emerald-500" 
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${analysisResult.sections.lighting.score}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 italic">
                            {lang === "vi" ? analysisResult.sections.lighting.explanationVi : analysisResult.sections.lighting.explanationEn}
                          </p>
                          <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 ml-1 leading-relaxed">
                            {(lang === "vi" ? analysisResult.sections.lighting.findingsVi : analysisResult.sections.lighting.findingsEn).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                        {/* TEXTURES */}
                        <div className="space-y-1.5 pt-3.5 border-t border-slate-950">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">
                              {lang === "vi" ? "🔬 Vân da & Độ sắc nét" : "🔬 Skin Texture & Porosity"}
                            </span>
                            <span className={`font-mono text-xs font-bold ${
                              analysisResult.sections.textures.score >= 80 
                                ? "text-emerald-400" 
                                : "text-red-400"
                            }`}>
                              {analysisResult.sections.textures.score}/100
                            </span>
                          </div>
                          <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                analysisResult.sections.textures.score >= 80 
                                  ? "bg-emerald-500" 
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${analysisResult.sections.textures.score}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 italic">
                            {lang === "vi" ? analysisResult.sections.textures.explanationVi : analysisResult.sections.textures.explanationEn}
                          </p>
                          <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 ml-1 leading-relaxed">
                            {(lang === "vi" ? analysisResult.sections.textures.findingsVi : analysisResult.sections.textures.findingsEn).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                        {/* DETAILS / ANATOMY */}
                        <div className="space-y-1.5 pt-3.5 border-t border-slate-950">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">
                              {lang === "vi" ? "🧬 Đối xứng Hình thể & Chi tiết" : "🧬 Anatomical & Geometrical Symmetry"}
                            </span>
                            <span className={`font-mono text-xs font-bold ${
                              analysisResult.sections.details.score >= 80 
                                ? "text-emerald-400" 
                                : "text-red-400"
                            }`}>
                              {analysisResult.sections.details.score}/100
                            </span>
                          </div>
                          <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                analysisResult.sections.details.score >= 80 
                                  ? "bg-emerald-500" 
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${analysisResult.sections.details.score}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 italic">
                            {lang === "vi" ? analysisResult.sections.details.explanationVi : analysisResult.sections.details.explanationEn}
                          </p>
                          <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 ml-1 leading-relaxed">
                            {(lang === "vi" ? analysisResult.sections.details.findingsVi : analysisResult.sections.details.findingsEn).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                        {/* ENVIRONMENT / BACKGROUND */}
                        <div className="space-y-1.5 pt-3.5 border-t border-slate-950">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">
                              {lang === "vi" ? "🖼️ Hậu cảnh & Độ sâu trường ảnh" : "🖼️ Background Field & Depths"}
                            </span>
                            <span className={`font-mono text-xs font-bold ${
                              analysisResult.sections.background.score >= 80 
                                ? "text-emerald-400" 
                                : "text-red-400"
                            }`}>
                              {analysisResult.sections.background.score}/100
                            </span>
                          </div>
                          <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                analysisResult.sections.background.score >= 80 
                                  ? "bg-emerald-500" 
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${analysisResult.sections.background.score}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 italic">
                            {lang === "vi" ? analysisResult.sections.background.explanationVi : analysisResult.sections.background.explanationEn}
                          </p>
                          <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 ml-1 leading-relaxed">
                            {(lang === "vi" ? analysisResult.sections.background.findingsVi : analysisResult.sections.background.findingsEn).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>
      </main>

      <footer className="mt-12 border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-500 space-y-1.5">
        <p className="font-mono text-[10px] tracking-widest uppercase">
          {lang === "vi" ? "HỆ THỐNG FORENSIC SỐ TIÊN TIẾN" : "ADVANCED DIGITAL FORENSIC SCANNER SYSTEM"}
        </p>
        <p>
          {lang === "vi" 
            ? "Mô phỏng phân tích chính xác dựa trên suy luận thị giác máy tính của Gemini 3.5 Flash."
            : "Analytical evaluation generated via advanced visual inference modeling on Gemini 3.5 Flash."}
        </p>
      </footer>
    </div>
  );
}
