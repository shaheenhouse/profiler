export interface Design {
  id: string;
  userId: string;
  name: string;
  width: number;
  height: number;
  canvasJSON: string; // Serialized fabric.js canvas JSON
  thumbnail: string;  // Base64 data URL thumbnail
  createdAt: string;
  updatedAt: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  thumbnail: string;
  canvasJSON: string;
}

export type DesignSize = {
  name: string;
  width: number;
  height: number;
  icon?: string;
};

export const DESIGN_SIZES: DesignSize[] = [
  { name: "Instagram Post", width: 1080, height: 1080 },
  { name: "Instagram Story", width: 1080, height: 1920 },
  { name: "Facebook Post", width: 940, height: 788 },
  { name: "Facebook Cover", width: 820, height: 312 },
  { name: "Twitter Post", width: 1200, height: 675 },
  { name: "LinkedIn Banner", width: 1584, height: 396 },
  { name: "YouTube Thumbnail", width: 1280, height: 720 },
  { name: "Presentation (16:9)", width: 1920, height: 1080 },
  { name: "A4 Document", width: 2480, height: 3508 },
  { name: "Business Card", width: 1050, height: 600 },
  { name: "Poster", width: 1587, height: 2245 },
  { name: "Resume", width: 2480, height: 3508 },
  { name: "Custom", width: 800, height: 600 },
];

export type ToolType =
  | "select"
  | "ai"
  | "text"
  | "shapes"
  | "flowchart"
  | "elements"
  | "draw"
  | "image"
  | "templates"
  | "background"
  | "layers";

export type ShapeType =
  | "rectangle"
  | "circle"
  | "triangle"
  | "line"
  | "star"
  | "polygon"
  | "arrow"
  // Flowchart shapes
  | "process"
  | "decision"
  | "terminator"
  | "data-io"
  | "database"
  | "document"
  | "cloud-shape"
  | "subroutine"
  | "predefined-process"
  // Connectors
  | "connector-arrow"
  | "connector-double"
  | "connector-dashed"
  | "connector-elbow"
  | "connector-curved";

export interface CanvasHistory {
  states: string[];
  currentIndex: number;
}
