// src/app/api/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Uses value from .env.local
});

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: input }],
    });

    const response = chatCompletion.choices[0]?.message?.content ?? "No reply.";

    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong", details: String(err) },
      { status: 500 }
    );
  }
}