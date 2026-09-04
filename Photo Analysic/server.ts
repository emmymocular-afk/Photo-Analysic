/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image transfers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initializer for Gemini Client (creates fresh instance using current environment key)
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey.trim() === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
  });
}

// Robust retry wrapper to handle transient 503 errors and high-demand spikes safely
async function generateContentWithRetry(ai: GoogleGenAI, params: any) {
  const maxAttempts = 5;
  let delay = 1500;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Strategic sequence of models to try in case of heavy 503/UNAVAILABLE demand surges:
    // Attempt 1: gemini-3.5-flash (primary choice, best intelligence/capabilities balance)
    // Attempt 2: gemini-3.1-flash-lite (high-availability lightweight pool, extremely stable under peak load)
    // Attempt 3: gemini-flash-latest (older stable fallback alias)
    // Attempt 4: gemini-3.1-flash-lite (re-try highly available lite pool after backoff)
    // Attempt 5: gemini-3.5-flash (final attempt after maximum backoff delay)
    let currentModel = "gemini-3.5-flash";
    if (attempt === 2) {
      currentModel = "gemini-3.1-flash-lite";
    } else if (attempt === 3) {
      currentModel = "gemini-flash-latest";
    } else if (attempt === 4) {
      currentModel = "gemini-3.1-flash-lite";
    } else if (attempt === 5) {
      currentModel = "gemini-3.5-flash";
    }

    try {
      console.log(`[Forensic API Retry Engine] Attempt ${attempt}/${maxAttempts} with model '${currentModel}'`);
      const response = await ai.models.generateContent({
        ...params,
        model: currentModel,
      });
      if (response && response.text) {
        return response;
      }
      throw new Error("Returned content is empty.");
    } catch (err: any) {
      lastError = err;
      const errStr = typeof err === "object" ? (err.message || "") + " " + JSON.stringify(err) : String(err);
      const isAuthError = errStr.includes("401") ||
                          errStr.includes("UNAUTHENTICATED") ||
                          errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
                          errStr.includes("API_KEY_INVALID") ||
                          errStr.includes("API key expired") ||
                          errStr.includes("PERMISSION_DENIED") ||
                          errStr.includes("invalid authentication credentials") ||
                          (errStr.includes("400") && errStr.toLowerCase().includes("key"));
      
      // Never retry on authentication or credential errors — fail immediately so user gets instant clear guidance
      if (isAuthError) {
        throw err;
      }

      console.log(`[Forensic API Retry Engine] Attempt ${attempt}/${maxAttempts} handled a transient network event.`);
      if (attempt === maxAttempts) {
        break;
      }
      // Increment backoff non-linearly with full noise jitter
      const backoff = delay * Math.pow(1.8, attempt - 1) + Math.random() * 800;
      console.log(`[Forensic API Retry Engine] Retrying next model fallback configuration in ${Math.round(backoff)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw lastError;
}

// REST API for Image Verification
app.post("/api/analyze", async (req, res) => {
  try {
    const { image, imageUrl, mimeType } = req.body;
    if (!image && !imageUrl) {
      res.status(400).json({ error: "Missing image data, imageUrl, or mimeType" });
      return;
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyErr: any) {
      res.status(500).json({
        error: "Configure API Key",
        details: "Vui lòng cấu hình API Key trong Settings > Secrets để sử dụng ứng dụng.",
        detailsEn: "Please configure your GEMINI_API_KEY inside Settings > Secrets to use this application."
      });
      return;
    }

    let payload;
    if (imageUrl) {
      try {
        const fetchRes = await fetch(imageUrl);
        if (!fetchRes.ok) {
          throw new Error(`Failed to download image from preset URL: Status ${fetchRes.status}`);
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const detectedMime = fetchRes.headers.get("content-type") || "image/jpeg";
        payload = {
          inlineData: {
            mimeType: detectedMime,
            data: base64Data,
          },
        };
      } catch (dlErr: any) {
        console.error("Error downloading preset image:", dlErr);
        res.status(400).json({
          error: "Failed to load preset",
          details: `Không thể tải ảnh mẫu từ URL: ${dlErr.message}`,
          detailsEn: `Could not fetch the preset image: ${dlErr.message}`
        });
        return;
      }
    } else {
      payload = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: image,
        },
      };
    }

    const promptText = `
As an elite, highly-experienced digital forensics investigator specializing in detecting synthetic media, deepfakes, and AI-generated imagery, scrutinize this image with absolute precision.
Identify if this represent an authentic, real-world camera-captured image, or if it was partially/fully synthesized, edited, or generated by generative models (such as Midjourney, Flux, Stable Diffusion, DALL-E, etc.).

You must adapt your forensic checklist to handle challenging capture conditions:
1. LIGHTING & SHADOWS (Including Low-Light & Low Contrast):
   - Check if light sources are physically consistent. In low-light photos, distinguish high noise/grain from AI artifacts. Real low-light sensor noise should be uniform and random; AI models often blend noise incorrectly, leaving smooth wax-like patches next to hyper-sharp detail.
   - Look for unnatural reflections, especially mismatched catchlights (reflections) in the pupils of subjects, or physics-defying shadow drops.
2. TEXTURES & REFINE SURFACES (Including Low-Quality, Heavy Compression & Blur):
   - Guard against mistaking low resolution or JPEG compression artifacts (macroblocking, ringing, color banding) for AI synthesis.
   - AI generation exhibits unnatural, ultra-idealized "wax-like" skin, vanishing skin pores, weirdly isolated sharp zones (e.g., razor-sharp eyelashes on a heavily blurred eyelid), or hair strands that don't flow naturally or melt into skin.
3. PHYSICAL & ANATOMICAL SYMMETRY (Including Multi-Subject & Crowd Photos):
   - Multi-Subject environments: If multiple people are present, inspect auxiliary or background subjects. AI generators frequently mutilate, blend, or distort peripheral people (e.g., floating hands, extra/missing fingers, repeating visual styles, melting faces). Contrast this with natural camera depth of field (optical bokeh).
   - Check for mismatched jewelry (asymmetric earrings), distorted clothing lines, overlapping teeth, or warped text/lettering.
4. BACKGROUNDS & ENVIRONMENT:
   - Weird optical bokeh blending, straight background lines warped or curved artificially, non-physical floating artifacts, or inconsistent depth-of-field transitions.

Provide a meticulous forensic analysis under these rigorous guidelines, and output all findings in both Vietnamese and English.
`;

    const response = await generateContentWithRetry(ai, {
      contents: [payload, promptText],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isReal: {
              type: Type.BOOLEAN,
              description: "True if the image is an authentic, real-world photograph/camera capture. False if it is synthesized/generated by AI models like Midjourney, Stable Diffusion, DALL-E, Flux, or heavily manipulated."
            },
            confidence: {
              type: Type.INTEGER,
              description: "Confidence level of our detection judgment from 0 to 100."
            },
            verdictVi: {
              type: Type.STRING,
              description: "Short highlight label in Vietnamese (e.g., 'ẢNH CHỤP THẬT', 'ẢNH DO AI TẠO RA', 'CÓ DẤU HIỆU AI', 'CHƯA RÕ RÀNG')"
            },
            verdictEn: {
              type: Type.STRING,
              description: "Short highlight label in English (e.g., 'AUTHENTIC PHOTO', 'GENUINE CAPTURE', 'AI-GENERATED IMAGE', 'HIGHLY SUSPICIOUS', 'INCONCLUSIVE')"
            },
            summaryVi: {
              type: Type.STRING,
              description: "A comprehensive and professional summary of findings in Vietnamese."
            },
            summaryEn: {
              type: Type.STRING,
              description: "A comprehensive and professional summary of findings in English."
            },
            sections: {
              type: Type.OBJECT,
              properties: {
                lighting: {
                  type: Type.OBJECT,
                  properties: {
                    score: {
                      type: Type.INTEGER,
                      description: "Score from 0 to 100 (0 = extremely artificial physics, 100 = perfect real-world optical lighting)"
                    },
                    findingsVi: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of analytical findings related to light/reflections/shadows in Vietnamese"
                    },
                    findingsEn: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of analytical findings related to light/reflections/shadows in English"
                    },
                    explanationVi: {
                      type: Type.STRING,
                      description: "Overall lighting explanation in Vietnamese"
                    },
                    explanationEn: {
                      type: Type.STRING,
                      description: "Overall lighting explanation in English"
                    }
                  },
                  required: ["score", "findingsVi", "findingsEn", "explanationVi", "explanationEn"]
                },
                textures: {
                  type: Type.OBJECT,
                  properties: {
                    score: {
                      type: Type.INTEGER,
                      description: "Score from 0 to 100 (0 = wax/plastic skin, blurred pores, artificial hair flows; 100 = authentic complex textures)"
                    },
                    findingsVi: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of findings related to texture smoothness, hair/skin, and microdetails in Vietnamese"
                    },
                    findingsEn: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of findings related to texture smoothness, hair/skin, and microdetails in English"
                    },
                    explanationVi: {
                      type: Type.STRING,
                      description: "Overall texture explanation in Vietnamese"
                    },
                    explanationEn: {
                      type: Type.STRING,
                      description: "Overall texture explanation in English"
                    }
                  },
                  required: ["score", "findingsVi", "findingsEn", "explanationVi", "explanationEn"]
                },
                details: {
                  type: Type.OBJECT,
                  properties: {
                    score: {
                      type: Type.INTEGER,
                      description: "Score from 0 to 100 (0 = anatomically/geometrically chaotic, ears/digits distorted; 100 = structurally perfect)"
                    },
                    findingsVi: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Anatomical or geometric findings in Vietnamese"
                    },
                    findingsEn: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Anatomical or geometric findings in English"
                    },
                    explanationVi: {
                      type: Type.STRING,
                      description: "A detailed breakdown of details in Vietnamese"
                    },
                    explanationEn: {
                      type: Type.STRING,
                      description: "A detailed breakdown of details in English"
                    }
                  },
                  required: ["score", "findingsVi", "findingsEn", "explanationVi", "explanationEn"]
                },
                background: {
                  type: Type.OBJECT,
                  properties: {
                    score: {
                      type: Type.INTEGER,
                      description: "Score from 0 to 100 (0 = extremely distorted/warped environments or floating pixel artifacts; 100 = consistent depth/ambient scenery)"
                    },
                    findingsVi: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of background visual findings in Vietnamese"
                    },
                    findingsEn: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of background visual findings in English"
                    },
                    explanationVi: {
                      type: Type.STRING,
                      description: "Background optical evaluation in Vietnamese"
                    },
                    explanationEn: {
                      type: Type.STRING,
                      description: "Background optical evaluation in English"
                    }
                  },
                  required: ["score", "findingsVi", "findingsEn", "explanationVi", "explanationEn"]
                }
              },
              required: ["lighting", "textures", "details", "background"]
            },
            suspectedGenerator: {
              type: Type.STRING,
              description: "Suspected AI Generator model name (e.g. 'Midjourney v6', 'Flux.1 Schnell/Dev', 'Stable Diffusion v1.5/XL', 'DALL-E 3', 'None - Authentic Portrait', 'Unknown AI Generator')"
            },
            generatorLikelihoodVi: {
              type: Type.STRING,
              description: "AI engine signature matching overview comment in Vietnamese"
            },
            generatorLikelihoodEn: {
              type: Type.STRING,
              description: "AI engine signature matching overview comment in English"
            },
            artifacts: {
              type: Type.ARRAY,
              description: "A list of 3 to 6 localized regions of interest in the image representing either deepfake artifacts or authentic indicators.",
              items: {
                type: Type.OBJECT,
                properties: {
                  x: {
                    type: Type.INTEGER,
                    description: "Estimated percentage along the image width where this occurs (value 5 to 95)."
                  },
                  y: {
                    type: Type.INTEGER,
                    description: "Estimated percentage along the image height where this occurs (value 5 to 95)."
                  },
                  radius: {
                    type: Type.INTEGER,
                    description: "Approximate visual size of indicator highlighted circle in percentage (typically 8 to 22)."
                  },
                  type: {
                    type: Type.STRING,
                    description: "Type of focus area: 'lighting', 'texture', 'anatomy', 'environment'."
                  },
                  labelVi: {
                    type: Type.STRING,
                    description: "Short Vietnamese label, e.g., 'Ánh sáng bất thường', 'Lông mi bị nhòe', 'Họa tiết ảo'."
                  },
                  labelEn: {
                    type: Type.STRING,
                    description: "Short English label, e.g., 'Unnatural reflection', 'Mismatched shadow', 'Perfect pore detail'."
                  },
                  descriptionVi: {
                    type: Type.STRING,
                    description: "Vietnamese detailed forensic description."
                  },
                  descriptionEn: {
                    type: Type.STRING,
                    description: "English detailed forensic description."
                  }
                },
                required: ["x", "y", "radius", "type", "labelVi", "labelEn", "descriptionVi", "descriptionEn"]
              }
            }
          },
          required: [
            "isReal", 
            "confidence", 
            "verdictVi", 
            "verdictEn", 
            "summaryVi", 
            "summaryEn", 
            "sections", 
            "suspectedGenerator", 
            "generatorLikelihoodVi", 
            "generatorLikelihoodEn",
            "artifacts"
          ],
        },
      },
    });

    const parsedResult = JSON.parse(response.text || "{}");
    res.json(parsedResult);
  } catch (err: any) {
    console.error("Analysis route error:", err);
    
    const errString = typeof err === "object" ? (err.message || "") + " " + JSON.stringify(err) : String(err);
    const isUnsupportedToken = errString.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED");
    const isApiKeyError = isUnsupportedToken ||
                          errString.toLowerCase().includes("api key") || 
                          errString.includes("API_KEY_INVALID") || 
                          errString.includes("expired") ||
                          errString.includes("unauthorized") ||
                          errString.includes("UNAUTHENTICATED") ||
                          errString.includes("invalid authentication credentials") ||
                          errString.includes("Expected OAuth 2 access token") ||
                          errString.includes("PERMISSION_DENIED") ||
                          errString.includes("401") ||
                          (errString.includes("400") && errString.toLowerCase().includes("key"));

    if (isApiKeyError) {
      res.status(401).json({
        error: isUnsupportedToken ? "Unsupported Token / Key Format" : "API Key Expired or Invalid",
        details: isUnsupportedToken
          ? "Khóa API hiện tại gặp lỗi xác thực (ACCESS_TOKEN_TYPE_UNSUPPORTED). Khóa này chưa được cấp quyền Generative Language API hoặc bị giới hạn service trong Google Cloud Console. Vui lòng tạo một API Key mới tại aistudio.google.com/app/apikey (hoặc kiểm tra API Restrictions trong Google Cloud Console) rồi cập nhật vào Settings > Secrets."
          : "Khóa API Key (GEMINI_API_KEY) hiện tại của bạn đã hết hạn, bị thiếu hoặc không hợp lệ. Vui lòng mở menu Settings > Secrets (ở góc trên bên phải giao diện Google AI Studio Build) để cập nhật hoặc đổi mới mã khóa.",
        detailsEn: isUnsupportedToken
          ? "Authentication error (ACCESS_TOKEN_TYPE_UNSUPPORTED). This key is not permitted for the Generative Language API or has API Restrictions enabled in Google Cloud Console. Please generate a new key at aistudio.google.com/app/apikey and update it under Settings > Secrets."
          : "Your current GEMINI_API_KEY has expired, is missing, or is invalid. Please expand the Settings > Secrets menu (located in the top-right corner of Google AI Studio Build) to renew or update your API Key."
      });
      return;
    }

    const isServiceUnavailable = errString.includes("503") || 
                                 errString.toLowerCase().includes("unavailable") || 
                                 errString.toLowerCase().includes("high demand");
    if (isServiceUnavailable) {
      res.status(503).json({
        error: "Service Unavailable",
        details: "Máy chủ AI hiện tại đang quá tải tạm thời (Lỗi 503). Mô hình dự phòng cũng đã hết lượt xử lý. Vui lòng đợi 30 giây rồi nhấn quét lại.",
        detailsEn: "The AI service is currently experiencing transient high demand (Error 503). Fallback resources have been exhausted. Please wait 30 seconds and click re-analyze."
      });
      return;
    }

    res.status(500).json({
      error: "Analysis Failed",
      details: err?.message || "Đã xảy ra lỗi không xác định khi phân tích ảnh.",
      detailsEn: err?.message || "An unknown error occurred during image forensic analysis."
    });
  }
});

// Configure client routes / assets serving
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted successfully on port ${PORT}`);
  });
}

configureServer();
