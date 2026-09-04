/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImageArtifact {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  radius: number; // 0-100 percentage size
  type: "lighting" | "texture" | "anatomy" | "environment";
  labelVi: string;
  labelEn: string;
  descriptionVi: string;
  descriptionEn: string;
}

export interface AnalysisSection {
  score: number; // 0 to 100 representing how realistic/natural it looks
  findingsVi: string[];
  findingsEn: string[];
  explanationVi: string;
  explanationEn: string;
}

export interface AnalysisResult {
  isReal: boolean;
  confidence: number; // 0 to 100
  verdictVi: string;
  verdictEn: string;
  summaryVi: string;
  summaryEn: string;
  sections: {
    lighting: AnalysisSection;
    textures: AnalysisSection;
    details: AnalysisSection;
    background: AnalysisSection;
  };
  suspectedGenerator: string; // "Stable Diffusion", "Midjourney", "Flux", "DALL-E", "Authentic Camera Capture", or "Inconclusive"
  generatorLikelihoodVi: string;
  generatorLikelihoodEn: string;
  artifacts?: ImageArtifact[];
}

