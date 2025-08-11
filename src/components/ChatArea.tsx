"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "bot"; text: string };

const agents = ["data", "developer", "research", "chat"] as const;
type Agent = (typeof agents)[number];

export default function ChatArea() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<Agent>("data");
  // directMode true = talk to /api/query as plain prompt; false = prefix with agent
  const [directMode, setDirectMode] = useState<boolean>(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMsg: Msg = { role: "user", text: userInput };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsLoading(true);

    try {
      const inputText = directMode ? userInput : `${agent} ${userInput}`;

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputText }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      // response shape is { response: string }
      const data = (await res.json()) as { response?: string; [k: string]: unknown };
      const botText =
        (typeof data.response === "string" && data.response) ||
        "⚠️ No response";

      setMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [...prev, { role: "bot", text: `⚠️ Error: ${msg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Chat window */}
      <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-white">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-500 text-sm italic">...AI is typing</div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Controls */}
      <div className="mt-3 flex gap-2">
        {!directMode && (
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value as Agent)}
            className="border rounded p-2"
          >
            {agents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={directMode}
            onChange={(e) => setDirectMode(e.target.checked)}
          />
          Direct AI
        </label>

        <input
          className="flex-1 border rounded p-2"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />

        <button
          onClick={sendMessage}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
}