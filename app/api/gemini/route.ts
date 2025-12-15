// app/api/gemini/route.ts

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

// ----------------------------------------------------
// 1. Client Initialization (Official SDK)
// ----------------------------------------------------

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.");
}

// Initialize the GoogleGenAI client
const ai = new GoogleGenAI({
    apiKey: apiKey
}); 


// ----------------------------------------------------
// 2. POST Handler Function
// ----------------------------------------------------

export async function POST(req: Request) { 
  
  if (!apiKey) {
    return NextResponse.json({ error: "Server Configuration Error: API Key missing." }, { status: 500 });
  }

  try {
    // 1. Parse the request body
    const body = await req.json();
    const { question, context } = body; 

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    
    // 2. Define the System Instruction based on context
    let systemInstruction = "You are a helpful assistant speaking Burmese. Respond only in Burmese.";

    if (context) {
      systemInstruction = `
        You are an expert assistant for a service provider. 
        Answer the user's question in Burmese based ONLY on the following context about services and categories. 
        If the context does not contain the answer, politely state that you cannot find the relevant information in your knowledge base.
        
        CONTEXT:
        ${context}
      `;
    }
    
    // 3. Call the Gemini API using the official SDK (generateContent)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use the direct, supported model name
      contents: [
        { 
          role: "user", 
          // The official SDK uses a parts array for text content
          parts: [{ text: `${systemInstruction}\n\nUSER QUESTION: ${question}` }] 
        }
      ],
      config: {
        // System instructions are passed separately in the config for best results
        // systemInstruction: systemInstruction, // Alternative if preferred
        temperature: 0.2,
      },
    });

    // The response object is slightly different with the official SDK
    const geminiText = response.text || "အဖြေရှာမရခဲ့ပါ။"; 
    
    // 4. Return the successful response
    return NextResponse.json({ answer: geminiText }, { status: 200 });

  } catch (err) {
    console.error("Gemini API Error:", err);
    // You may get a detailed error here if the API key is invalid
    return NextResponse.json({ error: "Gemini API error" }, { status: 500 });
  }
}