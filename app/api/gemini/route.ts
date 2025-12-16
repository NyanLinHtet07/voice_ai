// app/api/gemini/route.ts

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

// No top-level AI client. We'll create a client per-request so a client-provided API key can be used.
// (This keeps local dev flexible while still supporting a server-side GEMINI_API_KEY.)

function createAiClient(key?: string) {
  const effectiveKey = key || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: effectiveKey });
}


// ----------------------------------------------------
// 2. POST Handler Function
// ----------------------------------------------------

export async function POST(req: Request) { 
  

  try {
    // 1. Parse the request body
    const body = await req.json();
    const { question, context, apiKey: clientKey } = body; 

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const effectiveApiKey = clientKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      return NextResponse.json({ error: "Server Configuration Error: API Key missing. Provide a server GEMINI_API_KEY or pass an API key in the request body." }, { status: 500 });
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

    // 3. Create per-request AI client (supports client-provided keys) and call the Gemini API
    const ai = createAiClient(effectiveApiKey);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { 
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nUSER QUESTION: ${question}` }]
        }
      ],
      config: { temperature: 0.2 }
    });

    // Try to extract text in multiple ways depending on SDK response shape
    const geminiText = response.text ?? ((response as any).output?.[0]?.content?.[0]?.text) ?? "အဖြေရှာမရခဲ့ပါ။";

    // 4. Return the successful response
    return NextResponse.json({ answer: geminiText }, { status: 200 });

  } catch (err: any) {
    console.error("Gemini API Error:", err);

    // Try to extract a useful error message from the SDK error
    const errMsg = err?.message || (err?.response?.data && JSON.stringify(err.response.data)) || JSON.stringify(err);

    // Common case: the key or account can't be used from the user's location
    if (errMsg && (errMsg.includes('User location is not supported') || errMsg.includes('FAILED_PRECONDITION'))) {
      return NextResponse.json({
        error: 'Gemini service is not available from your location. (Gemini API ကို သင့်နိုင်ငံတွင် အသုံးမပြုနိုင်ပါ)',
        details: errMsg
      }, { status: 403 });
    }

    // Fallback: return details for debugging (server logs will also have the full error)
    return NextResponse.json({ error: "Gemini API error", details: errMsg }, { status: 500 });
  }
}