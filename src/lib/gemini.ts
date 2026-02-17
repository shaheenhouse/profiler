import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    client = new OpenAI({ apiKey });
  }
  return client;
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
  const openai = getClient();

  const userContent: any[] = [];

  let textPrompt = `Create a design with these specifications:
- Design size: ${width}x${height} pixels
- Description: ${prompt}

Generate a complete Fabric.js JSON with all objects positioned within the ${width}x${height} canvas. Make it visually stunning and professional.`;

  if (referenceImageBase64) {
    textPrompt += '\n\nI have attached a reference image. Recreate this design as closely as possible using Fabric.js objects (text, shapes, colors, layout). Make everything editable. Match the colors, typography, and layout from the image.';
    
    userContent.push({ type: 'text', text: textPrompt });
    userContent.push({
      type: 'image_url',
      image_url: {
        url: referenceImageBase64.startsWith('data:')
          ? referenceImageBase64
          : `data:image/png;base64,${referenceImageBase64}`,
      },
    });
  } else {
    userContent.push({ type: 'text', text: textPrompt });
  }

  // Use gpt-4o-mini for text-only, gpt-4o for vision tasks
  const model = referenceImageBase64 ? 'gpt-4o' : 'gpt-4o-mini';

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: DESIGN_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    max_tokens: 4096,
    temperature: 0.7,
    response_format: referenceImageBase64 ? undefined : { type: 'json_object' },
  });

  let text = response.choices[0]?.message?.content || '';

  // Clean up response - extract JSON from potential markdown
  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  // Validate it's valid JSON
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
  const openai = getClient();

  const userContent: any[] = [];

  if (contentType === 'text') {
    userContent.push({
      type: 'text',
      text: 'Extract resume data from this text:\n\n' + content,
    });
  } else if (contentType === 'image' && base64Data) {
    userContent.push({
      type: 'text',
      text: 'Extract all resume data from this image. Read every detail carefully.',
    });
    userContent.push({
      type: 'image_url',
      image_url: {
        url: base64Data.startsWith('data:')
          ? base64Data
          : `data:image/png;base64,${base64Data}`,
      },
    });
  } else if (contentType === 'pdf' && base64Data) {
    // For PDFs, we send as image (GPT-4o can read PDF pages as images)
    userContent.push({
      type: 'text',
      text: 'Extract all resume data from this document image. Read every detail carefully.',
    });
    userContent.push({
      type: 'image_url',
      image_url: {
        url: base64Data.startsWith('data:')
          ? base64Data
          : `data:application/pdf;base64,${base64Data}`,
      },
    });
  }

  // Use gpt-4o for vision tasks, gpt-4o-mini for text only
  const model = contentType === 'text' ? 'gpt-4o-mini' : 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: RESUME_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    max_tokens: 4096,
    temperature: 0.3,
    response_format: contentType === 'text' ? { type: 'json_object' } : undefined,
  });

  let text = response.choices[0]?.message?.content || '';

  // Clean up response
  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    JSON.parse(text);
    return text;
  } catch {
    throw new Error('AI could not extract resume data. Please try with clearer content.');
  }
}
