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
  let text = result.response.text();

  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(text);
    parsed.width = parsed.width || width;
    parsed.height = parsed.height || height;
    return JSON.stringify(parsed);
  } catch {
    throw new Error('AI generated invalid design JSON. Please try again with a different prompt.');
  }
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
