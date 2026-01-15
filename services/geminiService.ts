
import { GoogleGenAI, Type } from "@google/genai";
import { HistoryData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// Simple in-memory cache to prevent redundant API calls
const historyCache: Record<number, HistoryData> = {};

export async function fetchHistoricalData(year: number): Promise<HistoryData> {
  // Return from cache if available for near-instant loading
  if (historyCache[year]) {
    return historyCache[year];
  }

  const isBC = year < 0;
  const absYear = Math.abs(year);
  const yearStr = isBC ? `${absYear} BC` : `${absYear} CE`;

  const prompt = `Year: ${yearStr}. Geography: Iberian Peninsula.
  Tasks:
  1. Identify major political entities (max 8).
  2. For each, provide a smooth boundary (12-18 points) following the peninsula's shape (Lat 35.5-43.8, Lon -9.5-3.5).
  3. Provide a brief (max 150 chars) historical summary.
  
  Return strictly valid JSON. Priority: Speed and accuracy.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash model for lowest latency
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            year: { type: Type.INTEGER },
            label: { type: Type.STRING },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  color: { type: Type.STRING },
                  boundaryPoints: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.ARRAY,
                      items: { type: Type.NUMBER },
                      minItems: 2,
                      maxItems: 2
                    }
                  },
                  description: { type: Type.STRING }
                },
                required: ["name", "color", "boundaryPoints", "description"]
              }
            }
          },
          required: ["year", "label", "entities"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}") as HistoryData;
    
    // Store in cache for future instant access
    historyCache[year] = data;
    
    return data;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return {
      year,
      label: yearStr,
      entities: [
        {
          name: "Information Unavailable",
          color: "#94a3b8",
          description: "Connection error or data unavailable for this specific era.",
          boundaryPoints: [[36, -9], [36, 3], [43, 3], [43, -9]]
        }
      ]
    };
  }
}
