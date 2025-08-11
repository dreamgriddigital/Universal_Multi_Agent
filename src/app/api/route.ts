// app/api/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Octokit } from "@octokit/rest";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const octokit =
  process.env.GITHUB_TOKEN ? new Octokit({ auth: process.env.GITHUB_TOKEN }) : null;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    // parse body safely without `any`
    const body = (await req.json().catch(() => ({}))) as {
      input?: unknown;
      message?: unknown;
    };

    const rawInput = String((body.input ?? body.message ?? "")).trim();
    if (!rawInput) return json({ response: "Please provide input." }, 400);

    // --- GitHub command shim (optional) ---
    if (/^(github|git)|(^create\s+(a\s+)?new\s+repo)/i.test(rawInput)) {
      if (!octokit || !process.env.GITHUB_USERNAME) {
        return json(
          {
            response:
              "GitHub agent not configured. Set GITHUB_TOKEN and GITHUB_USERNAME.",
          },
          400
        );
      }

      const createMatch = rawInput.match(
        /(create\s+(?:a\s+)?new\s+repo|create\s+repo)\s+(.+)$/i
      );
      if (createMatch) {
        const repoName = createMatch[2].trim();
        try {
          const { data } = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            private: true,
            auto_init: true,
            description: "Created by MCP UI on Vercel",
          });
          return json({ response: `✅ Repo created: ${data.html_url}` });
        } catch (e: unknown) {
          // safely extract error message (no `any`)
          const msg =
            typeof e === "object" &&
            e !== null &&
            "response" in e &&
            typeof (e as { response?: unknown }).response === "object" &&
            (e as { response?: { data?: { message?: string } } }).response?.data
              ?.message
              ? (e as { response?: { data?: { message?: string } } }).response!
                  .data!.message
              : e instanceof Error
              ? e.message
              : String(e);
          return json({ response: `❌ Failed: ${msg}` }, 500);
        }
      }

      return json({
        response: "Unknown GitHub command. Try: 'github create repo <name>'",
      }, 400);
    }

    // --- OpenAI fallback ---
    if (!process.env.OPENAI_API_KEY) {
      return json({ response: "OPENAI_API_KEY not set." }, 500);
    }

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: rawInput },
      ],
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No response from model.";
    return json({ response: text });
  } catch (err: unknown) {
    // no `any`
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/query] error:", msg);
    return json({ response: "⚠️ Error in API route." }, 500);
  }
}