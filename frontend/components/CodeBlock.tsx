'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export default function CodeBlock({ code, language = 'javascript', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-sm font-medium text-gray-300">{filename}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className={`language-${language} text-sm`}>
          {code}
        </code>
      </pre>
    </div>
  )
}

// Example usage component
export function CodeExample() {
  const exampleCode = `// Example: Autonomous Research Agent
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

class ResearchAgent {
  async researchTopic(topic: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro",
      contents: \`Research the topic: \${topic}\`,
    });
    
    return {
      summary: response.text,
      confidence: this.calculateConfidence(response),
      sources: response.citations
    };
  }

  calculateConfidence(response) {
    // Calculate confidence based on response quality
    return 0.85;
  }
}`

  return <CodeBlock code={exampleCode} language="javascript" filename="research-agent.js" />
}