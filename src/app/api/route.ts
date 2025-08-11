// app/api/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Octokit } from "@octokit/rest";

// ---- ENV (set these in Vercel project settings) ----
// OPENAI_API_KEY=sk-...
// OPENAI_MODEL=gpt-4o-mini
// GITHUB_TOKEN=ghp_...   (classic token with "repo" scope)
// GITHUB_USERNAME=your-username

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const octokit =
  process.env.GITHUB_TOKEN
    ? new Octokit({ auth: process.env.GITHUB_TOKEN })
    : null;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = (body.input || body.message || "").trim();

    if (!raw) return json({ response: "Please provide input." }, 400);

    // --- Simple GitHub command router (optional) ---
    // Examples:
    // "github create repo MY MCP SERVER"
    // "create a new repo MY MCP SERVER"
    if (/^(github|git)|(^create\s+(a\s+)?new\s+repo)/i.test(raw)) {
      if (!octokit || !process.env.GITHUB_USERNAME) {
        return json({
          response:
            "GitHub agent not configured. Set GITHUB_TOKEN and GITHUB_USERNAME.",
        }, 400);
      }

      // create repo pattern
      const m = raw.match(
        /(create\s+(?:a\s+)?new\s+repo|create\s+repo)\s+(.+)$/i
      );
      if (m) {
        const repoName = m[2].trim();
        try {
          const { data } = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            private: true,
            auto_init: true,
            description: "Created by MCP UI on Vercel",
          });
          return json({ response: `✅ Repo created: ${data.html_url}` });
        } catch (e: any) {
          const msg = e?.response?.data?.message || e?.message || String(e);
          return json({ response: `❌ Failed: ${msg}` }, 500);
        }
      }

      return json({
        response:
          "Unknown GitHub command. Try: 'github create repo <name>'",
      }, 400);
    }

    // --- Otherwise, send to OpenAI ---
    if (!process.env.OPENAI_API_KEY) {
      return json({ response: "OPENAI_API_KEY not set." }, 500);
    }

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: raw },
      ],
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No response from model.";
    return json({ response: text });
  } catch (err: any) {
    console.error("[/api/query] error:", err);
    return json({ response: "⚠️ Error in API route." }, 500);
  }
}