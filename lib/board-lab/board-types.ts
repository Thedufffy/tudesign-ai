// lib/board-lab/board-types.ts

export type BoardLabAnalysis = {
  projectTitle: string;
  spaceType: "interior" | "exterior" | "unknown" | string;
  conceptText: string;
  functionText: string[];
  materialPalette: string[];
  colorPalette: string[];
  detailNotes: string[];
};

export type BoardLabMeta = {
  layoutStyle: string;
  imageMode: string;
  generatedBy: string;
};

export type BoardLabGenerateResponse = {
  projectTitle: string;
  sheetTitle: string;
  mainImage: string;
  detailImages: string[];
  sketchImage?: string;
  conceptText: string;
  functionText: string[];
  detailNotes: string[];
  materialPalette: string[];
  colorPalette: string[];
  spaceType: string;
  meta?: BoardLabMeta;
};

export type BoardLabAnalyzeApiResponse = {
  success: boolean;
  analysis?: BoardLabAnalysis;
  error?: string;
};

export type BoardLabGenerateApiResponse = {
  success: boolean;
  boardData?: BoardLabGenerateResponse;
  error?: string;
};