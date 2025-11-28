import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize Gemini AI
// API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImageInfo = async (base64Image: string): Promise<{ caption: string; location: string; tags: string[]; dominantColors: string[] }> => {
  try {
    const model = "gemini-2.5-flash"; // Fast model for image analysis
    
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        caption: { type: Type.STRING, description: "A poetic, artistic caption for the image, max 15 words." },
        location: { type: Type.STRING, description: "A plausible generic location name for the scene (e.g., 'Misty Valley', 'Urban Center')." },
        tags: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }, 
          description: "5 descriptive tags for the image (e.g., 'sunset', 'portrait', 'moody')." 
        },
        dominantColors: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }, 
          description: "3-5 dominant hex color codes from the image." 
        }
      },
      required: ["caption", "location", "tags", "dominantColors"],
    };

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Analyze this image for a professional photography portfolio. Return a JSON object with a creative caption, location, 5 descriptive tags, and 3-5 dominant hex color codes." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Clean up Markdown if present
    text = text.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn("JSON parse failed, raw text:", text);
        return {
            caption: "Captured in the moment.",
            location: "Unknown Location",
            tags: ["photography", "art"],
            dominantColors: ["#000000", "#ffffff"]
        };
    }
    
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      caption: "Captured in the moment.",
      location: "Unknown Location",
      tags: ["photography", "art"],
      dominantColors: ["#000000", "#ffffff"]
    };
  }
};