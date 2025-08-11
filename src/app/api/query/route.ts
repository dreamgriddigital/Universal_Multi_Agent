// File: src/app/api/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: input }],
    });

    const message = chatResponse.choices[0]?.message?.content || "⚠️ No response from OpenAI.";
    return NextResponse.json({ response: message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "OpenAI error" }, { status: 500 });
  }
}