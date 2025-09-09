export enum Step {
  UPLOAD,
  GENERATING_MOODS,
  MOODS_RESULT,
  REFINING_MOOD,
  REFINE_RESULT,
  GENERATING_FINAL_IMAGE,
  FINAL_RESULT,
}

export interface Mood {
  name: string;
  description: string;
  imageUrl: string;
}

export interface UploadedFile {
  base64: string;
  mimeType: string;
  name: string;
}

export interface GenerationControls {
  allowPaintChanges: boolean;
  allowFloorChanges: boolean;
  removeFurniture: boolean;
}

export interface SavedMood {
  id: string;
  title: string;
  originalImage: UploadedFile;
  finalImage: string; // base64 data URL
  moodName: string;
  refinements: string[];
  addedObjects: UploadedFile[];
}