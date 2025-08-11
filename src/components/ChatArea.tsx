"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const agents = ["data", "developer", "research", "chat"];

export default function ChatArea() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState("data");
  // Default ON so it uses /query out of the box
  const [directMode, setDirectMode] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMsg = { role: "user", text: userInput };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsLoading(true);

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/query`;

      // If not in direct mode, prefix the agent to the input text.
      const inputText = directMode ? userInput : `${agent} ${userInput}`;

		const res = await fetch(`/api/query`, {
		  method: "POST",
		  headers: { "Content-Type": "application/json" },
		  body: JSON.stringify({ input: inputText }), // inputText = user message or "data <msg>" etc.
		});

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const botText =
        data.response ||
        data.answer ||
        JSON.stringify(data, null, 2) ||
        "⚠️ No response";

      setMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `⚠️ Error: ${err.message}` },
      ]);
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
            className={`mb-3 ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
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
        {/* Agent selector only matters when Direct AI is OFF */}
        {!directMode && (
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="border rounded p-2"
          >
            {agents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}

        {/* Direct mode toggle */}
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={directMode}
            onChange={(e) => setDirectMode(e.target.checked)}
          />
          Direct AI
        </label>

        {/* Input */}
        <input
          className="flex-1 border rounded p-2"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />

        {/* Send button */}
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