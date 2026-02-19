import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function isGeminiConfigured(): boolean {
  return !!apiKey;
}

// ============================================================
// DESIGN GENERATION - Generate Fabric.js JSON from a prompt
// ============================================================

const DESIGN_SYSTEM_PROMPT = `You are an expert graphic designer and Fabric.js developer. When the user describes a design, you generate a complete Fabric.js canvas JSON that can be loaded directly into a Fabric.js canvas.

IMPORTANT RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Use Fabric.js object types: "i-text" for text, "rect" for rectangles, "circle" for circles, "triangle" for triangles, "polygon" for polygons, "path" for SVG paths, "line" for lines
3. Position objects using "left" and "top" (in pixels from top-left of design)
4. Use "fill" for colors, "stroke" for borders
5. For text objects ("i-text"), include: text, fontSize, fontFamily, fill, fontWeight, fontStyle, textAlign, left, top
6. Create visually appealing, professional designs with proper spacing, hierarchy, and color harmony
7. Layer objects properly - backgrounds first, then decorative elements, then text on top
8. Use modern, trendy color palettes
9. Always include a background rectangle as the first object matching the design dimensions
10. Make text readable - good contrast against backgrounds
11. Use proper font sizes: headings 48-72px, subheadings 24-36px, body 16-20px
12. Consider the design dimensions when positioning elements - center important content

The JSON format must be:
{
  "objects": [
    { "type": "rect", "left": 0, "top": 0, "width": ..., "height": ..., "fill": "...", ... },
    { "type": "i-text", "text": "...", "left": ..., "top": ..., "fontSize": ..., "fill": "...", ... },
    ...
  ],
  "width": <design_width>,
  "height": <design_height>,
  "background": "<background_color>"
}

Available font families: Arial, Helvetica, Georgia, Times New Roman, Courier New, Verdana, Impact, Comic Sans MS, Trebuchet MS, Palatino Linotype
Available font weights: normal, bold, 100-900
Text align options: left, center, right

For shapes, you can use:
- rx and ry for rounded corners on rectangles
- radius for circles
- opacity (0-1)
- angle for rotation
- scaleX, scaleY for scaling
- shadow: { color: "rgba(0,0,0,0.3)", blur: 10, offsetX: 2, offsetY: 2 }
- strokeWidth and stroke for borders

Create designs that look professional and modern. Use gradients by layering semi-transparent shapes. Add decorative elements like circles, lines, and shapes for visual interest.`;

export async function generateDesign(
  prompt: string,
  width: number,
  height: number,
  referenceImageBase64?: string
): Promise<string> {
  const client = getClient();

  const extractJsonCandidate = (raw: string): string => {
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .replace(/\u201c|\u201d/g, '"')
      .replace(/\u2018|\u2019/g, "'")
      .trim();

    if (cleaned.startsWith("{") && cleaned.endsWith("}")) return cleaned;

    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return cleaned.slice(first, last + 1).trim();
    }
    return cleaned;
  };

  const tryParseDesignJSON = (raw: string): any | null => {
    const candidate = extractJsonCandidate(raw);
    if (!candidate) return null;
    try {
      return JSON.parse(candidate);
    } catch {
      // Try one more pass with trailing comma cleanup.
      const withoutTrailingCommas = candidate.replace(/,\s*([}\]])/g, "$1");
      try {
        return JSON.parse(withoutTrailingCommas);
      } catch {
        return null;
      }
    }
  };

  const normalizeDesignJSON = (parsed: any) => {
    if (!parsed || typeof parsed !== "object") return null;
    const objects = Array.isArray(parsed.objects)
      ? parsed.objects
      : Array.isArray(parsed.canvas?.objects)
        ? parsed.canvas.objects
        : Array.isArray(parsed.data?.objects)
          ? parsed.data.objects
          : [];

    const normalized = {
      objects,
      width: Number(parsed.width) || width,
      height: Number(parsed.height) || height,
      background:
        parsed.background ||
        parsed.backgroundColor ||
        "#0f172a",
    };

    return normalized;
  };

  const buildArchitectureFallback = (): string => {
    const layerW = Math.min(950, Math.max(560, Math.round(width * 0.72)));
    const layerH = Math.min(130, Math.max(90, Math.round(height * 0.13)));
    const centerX = Math.round((width - layerW) / 2);
    const startY = Math.max(80, Math.round(height * 0.12));
    const gap = Math.max(28, Math.round(height * 0.04));

    const layers = [
      { title: "Presentation Layer", subtitle: "ASP.NET Core Web API", color: "#3b82f6" },
      { title: "Application Layer", subtitle: "Use Cases / CQRS / Validation", color: "#8b5cf6" },
      { title: "Domain Layer", subtitle: "Entities / Value Objects / Rules", color: "#10b981" },
      { title: "Infrastructure Layer", subtitle: "EF Core / Messaging / External Services", color: "#f59e0b" },
    ];

    const objects: any[] = [
      {
        type: "rect",
        left: 0,
        top: 0,
        width,
        height,
        fill: "#0b1020",
        selectable: false,
      },
      {
        type: "i-text",
        left: centerX,
        top: 24,
        width: layerW,
        text: ".NET 10 Layered Architecture",
        fontSize: 44,
        fontWeight: "bold",
        fontFamily: "Arial",
        fill: "#f8fafc",
        textAlign: "center",
      },
      {
        type: "i-text",
        left: centerX,
        top: 72,
        width: layerW,
        text: "Clean boundaries, scalable flow, production-ready design",
        fontSize: 18,
        fontFamily: "Arial",
        fill: "#94a3b8",
        textAlign: "center",
      },
    ];

    layers.forEach((layer, i) => {
      const y = startY + i * (layerH + gap);
      objects.push(
        {
          type: "rect",
          left: centerX,
          top: y,
          width: layerW,
          height: layerH,
          fill: layer.color,
          opacity: 0.18,
          stroke: layer.color,
          strokeWidth: 2,
          rx: 22,
          ry: 22,
        },
        {
          type: "i-text",
          left: centerX + 30,
          top: y + 24,
          text: layer.title,
          fontSize: 30,
          fontWeight: "bold",
          fontFamily: "Arial",
          fill: "#e2e8f0",
        },
        {
          type: "i-text",
          left: centerX + 30,
          top: y + 64,
          text: layer.subtitle,
          fontSize: 17,
          fontFamily: "Arial",
          fill: "#cbd5e1",
        }
      );

      if (i < layers.length - 1) {
        const arrowX = centerX + layerW / 2;
        const fromY = y + layerH + 8;
        const toY = y + layerH + gap - 8;
        objects.push(
          {
            type: "line",
            x1: arrowX,
            y1: fromY,
            x2: arrowX,
            y2: toY,
            stroke: "#60a5fa",
            strokeWidth: 4,
          },
          {
            type: "triangle",
            left: arrowX - 10,
            top: toY - 2,
            width: 20,
            height: 16,
            fill: "#60a5fa",
            angle: 180,
          }
        );
      }
    });

    const badgeY = startY + layers.length * (layerH + gap) + 8;
    const badgeW = 230;
    const badgeGap = 20;
    const badgesX = Math.max(40, Math.round((width - badgeW * 3 - badgeGap * 2) / 2));
    const badges = [
      { text: "Observability", color: "#06b6d4" },
      { text: "Resilience", color: "#a78bfa" },
      { text: "Cloud Ready", color: "#22c55e" },
    ];
    badges.forEach((badge, i) => {
      const x = badgesX + i * (badgeW + badgeGap);
      objects.push(
        {
          type: "rect",
          left: x,
          top: badgeY,
          width: badgeW,
          height: 54,
          fill: badge.color,
          opacity: 0.2,
          stroke: badge.color,
          strokeWidth: 1.5,
          rx: 14,
          ry: 14,
        },
        {
          type: "i-text",
          left: x + 20,
          top: badgeY + 16,
          text: badge.text,
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "Arial",
          fill: "#e2e8f0",
        }
      );
    });

    return JSON.stringify({
      objects,
      width,
      height,
      background: "#0b1020",
    });
  };

  let textPrompt = `Create a design with these specifications:
- Design size: ${width}x${height} pixels
- Description: ${prompt}

Generate a complete Fabric.js JSON with all objects positioned within the ${width}x${height} canvas. Make it visually stunning and professional.`;

  const parts: Part[] = [];

  if (referenceImageBase64) {
    textPrompt += '\n\nI have attached a reference image. Recreate this design as closely as possible using Fabric.js objects (text, shapes, colors, layout). Make everything editable. Match the colors, typography, and layout from the image.';
    parts.push({ text: textPrompt });

    let base64Data = referenceImageBase64;
    let mimeType = 'image/png';
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }
    parts.push({
      inlineData: { mimeType, data: base64Data },
    });
  } else {
    parts.push({ text: textPrompt });
  }

  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: DESIGN_SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: referenceImageBase64 ? undefined : 'application/json',
    },
  });

  const result = await model.generateContent(parts);
  const text = result.response.text();

  let parsed = tryParseDesignJSON(text);
  if (!parsed) {
    try {
      const repairModel = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      });
      const repair = await repairModel.generateContent([
        {
          text:
            `Convert this output into strict valid JSON for a Fabric.js canvas. ` +
            `Return only JSON with keys: objects (array), width (number), height (number), background (string). ` +
            `Keep the design intent and visual hierarchy.\n\n` +
            `ORIGINAL OUTPUT:\n${text.slice(0, 15000)}`,
        },
      ]);
      parsed = tryParseDesignJSON(repair.response.text());
    } catch {
      parsed = null;
    }
  }

  const normalized = normalizeDesignJSON(parsed);
  if (normalized && Array.isArray(normalized.objects)) {
    return JSON.stringify(normalized);
  }

  const isArchitecturePrompt =
    /architecture|layer|diagram|flow|microservice|api|domain|infrastructure|\.net|dotnet|clean architecture/i.test(prompt);
  if (isArchitecturePrompt) {
    return buildArchitectureFallback();
  }

  throw new Error("AI generated invalid design JSON. Please try again with a different prompt.");
}

// ============================================================
// RESUME EXTRACTION - Extract resume data from documents
// ============================================================

const RESUME_SYSTEM_PROMPT = `You are an expert resume parser. Extract structured data from the provided content (text, image, or PDF) and return it as JSON matching this exact schema:

{
  "personalInfo": {
    "fullName": "string",
    "title": "string (job title/headline)",
    "email": "string",
    "phone": "string or empty",
    "whatsapp": "string or empty",
    "location": "string",
    "bio": "string (professional summary/objective)",
    "socialLinks": [
      { "id": "string", "platform": "github|linkedin|twitter|website|other", "url": "string" }
    ]
  },
  "education": [
    {
      "id": "string (uuid)",
      "degree": "string",
      "institution": "string",
      "field": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or empty",
      "current": false,
      "gpa": "string or empty",
      "description": "string or empty"
    }
  ],
  "experience": [
    {
      "id": "string (uuid)",
      "title": "string",
      "company": "string",
      "location": "string",
      "locationType": "onsite|remote|hybrid",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or empty",
      "current": false,
      "description": "string",
      "technologies": ["string"],
      "responsibilities": ["string"]
    }
  ],
  "skills": [
    {
      "id": "string (uuid)",
      "name": "string",
      "level": "expert|proficient|intermediate|beginner",
      "category": "string (e.g. Frontend, Backend, Cloud, etc.)"
    }
  ],
  "certifications": [
    {
      "id": "string (uuid)",
      "name": "string",
      "issuer": "string",
      "issueDate": "YYYY-MM",
      "expiryDate": "YYYY-MM or empty",
      "credentialId": "string or empty",
      "credentialUrl": "string or empty"
    }
  ],
  "projects": [
    {
      "id": "string (uuid)",
      "name": "string",
      "description": "string",
      "url": "string or empty",
      "githubUrl": "string or empty",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or empty",
      "technologies": ["string"],
      "highlights": ["string"]
    }
  ],
  "languages": [
    {
      "id": "string (uuid)",
      "name": "string",
      "proficiency": "native|fluent|professional|intermediate|basic"
    }
  ]
}

IMPORTANT:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Generate unique IDs for each item (use format like "ext-1", "ext-2", etc.)
3. If information is missing, use empty strings or empty arrays
4. Dates should be in YYYY-MM format
5. Infer skill levels based on years of experience and context
6. Categorize skills appropriately (Frontend, Backend, Cloud & DevOps, Databases, etc.)
7. Extract as much detail as possible from the source material
8. If the text mentions current position, set current: true and leave endDate empty`;

export async function extractResumeData(
  content: string,
  contentType: 'text' | 'image' | 'pdf',
  base64Data?: string
): Promise<string> {
  const client = getClient();

  const parts: Part[] = [];
  let useVision = false;

  if (contentType === 'text') {
    parts.push({
      text: 'Extract resume data from this text:\n\n' + content,
    });
  } else if (contentType === 'image' && base64Data) {
    useVision = true;
    parts.push({
      text: 'Extract all resume data from this image. Read every detail carefully.',
    });
    let imgData = base64Data;
    let mimeType = 'image/png';
    if (imgData.startsWith('data:')) {
      const match = imgData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imgData = match[2];
      }
    }
    parts.push({
      inlineData: { mimeType, data: imgData },
    });
  } else if (contentType === 'pdf' && base64Data) {
    useVision = true;
    parts.push({
      text: 'Extract all resume data from this document. Read every detail carefully.',
    });
    let pdfData = base64Data;
    let mimeType = 'application/pdf';
    if (pdfData.startsWith('data:')) {
      const match = pdfData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        pdfData = match[2];
      }
    }
    parts.push({
      inlineData: { mimeType, data: pdfData },
    });
  }

  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: RESUME_SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: useVision ? undefined : 'application/json',
    },
  });

  const result = await model.generateContent(parts);
  let text = result.response.text();

  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    JSON.parse(text);
    return text;
  } catch {
    throw new Error('AI could not extract resume data. Please try with clearer content.');
  }
}
