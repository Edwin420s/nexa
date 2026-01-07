'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Copy, Zap, RefreshCw, Save, Maximize2, Minimize2 } from 'lucide-react'

interface PromptTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  category: string
}

interface PromptEditorProps {
  initialPrompt?: string
  templates?: PromptTemplate[]
  onSend?: (prompt: string) => void
  onSave?: (template: Omit<PromptTemplate, 'id'>) => void
  readOnly?: boolean
}

export default function PromptEditor({
  initialPrompt = '',
  templates = [],
  onSend,
  onSave,
  readOnly = false
}: PromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [prompt])

  // Handle template selection
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate)
      if (template) {
        setPrompt(template.content)
        
        // Initialize variables
        const vars: Record<string, string> = {}
        template.variables.forEach(variable => {
          vars[variable] = `[${variable.toUpperCase()}]`
        })
        setVariables(vars)
      }
    }
  }, [selectedTemplate, templates])

  // Apply variable replacement
  const applyVariables = () => {
    let result = prompt
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key.toUpperCase()}\\]`, 'g')
      result = result.replace(regex, value)
    })
    return result
  }

  const handleSend = () => {
    const finalPrompt = applyVariables()
    onSend?.(finalPrompt)
  }

  const handleSaveTemplate = () => {
    const variableNames = Array.from(
      new Set(
        prompt.match(/\[([A-Z_]+)\]/g)?.map(match => 
          match.slice(1, -1).toLowerCase()
        ) || []
      )
    )

    onSave?.({
      name: `Template ${templates.length + 1}`,
      content: prompt,
      variables: variableNames,
      category: 'custom'
    })
    
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(applyVariables())
  }

  const handleOptimize = () => {
    // In a real app, this would call an optimization API
    const optimized = prompt
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\. /g, '.\n')
    
    setPrompt(optimized)
  }

  const handleFullscreen = () => {
    if (!isFullscreen && editorRef.current) {
      editorRef.current.requestFullscreen()
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  // Extract variables from prompt
  const detectedVariables = Array.from(
    new Set(
      prompt.match(/\[([A-Z_]+)\]/g)?.map(match => 
        match.slice(1, -1).toLowerCase()
      ) || []
    )
  )

  return (
    <div 
      ref={editorRef}
      className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select Template</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.category})
              </option>
            ))}
          </select>
          
          <span className="text-xs text-gray-400">
            {prompt.length} chars • {prompt.split(' ').length} words
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 p-6">
        {/* Left: Variables */}
        <div className="lg:col-span-1">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Variables</h4>
            <div className="space-y-3">
              {detectedVariables.map(variable => (
                <div key={variable} className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 w-24 truncate">
                    {variable}:
                  </span>
                  <input
                    type="text"
                    value={variables[variable] || ''}
                    onChange={(e) => setVariables(prev => ({
                      ...prev,
                      [variable]: e.target.value
                    }))}
                    className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder={`Enter ${variable}`}
                  />
                </div>
              ))}
              
              {detectedVariables.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  Add variables like [TOPIC] or [TASK] to your prompt
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">Preview</h4>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {applyVariables()}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              readOnly={readOnly}
              className="w-full min-h-[300px] px-4 py-4 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm resize-none"
              placeholder="Write your prompt here... Use [VARIABLES] for dynamic content."
            />
            
            {/* Character counter */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {prompt.length}/4000
            </div>
          </div>

          {/* Editor Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOptimize}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Zap size={14} />
                <span>Optimize</span>
              </button>
              
              <button
                onClick={handleCopy}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Copy size={14} />
                <span>Copy</span>
              </button>
              
              <button
                onClick={() => setPrompt('')}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <RefreshCw size={14} />
                <span>Clear</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              {onSave && (
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSaved}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${isSaved ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  <Save size={14} />
                  <span>{isSaved ? 'Saved!' : 'Save Template'}</span>
                </button>
              )}
              
              {onSend && (
                <button
                  onClick={handleSend}
                  disabled={!prompt.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send size={16} />
                  <span>Send to Agent</span>
                </button>
              )}
            </div>
          </div>

          {/* Templates Grid */}
          {templates.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Templates</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.slice(0, 6).map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 text-left rounded-lg border transition-colors ${selectedTemplate === template.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700'}`}
                  >
                    <div className="text-xs font-medium mb-1 truncate">{template.name}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {template.variables.length} variables
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Example templates
export const exampleTemplates: PromptTemplate[] = [
  {
    id: 'research-template',
    name: 'Research Agent',
    content: `You are a research assistant. Research the topic of [TOPIC] and provide:
1. Key concepts and definitions
2. Current trends and developments
3. Important figures and organizations
4. Recommended resources for further learning

Focus on accuracy and provide citations where possible.`,
    variables: ['topic'],
    category: 'research'
  },
  {
    id: 'code-template',
    name: 'Code Generator',
    content: `Generate [LANGUAGE] code for the following task: [TASK]

Requirements:
- Include proper error handling
- Add comments for key sections
- Follow best practices for [LANGUAGE]
- Include example usage

Return only the code without explanations.`,
    variables: ['language', 'task'],
    category: 'code'
  },
  {
    id: 'analysis-template',
    name: 'Data Analysis',
    content: `Analyze the following [DATA_TYPE] data about [SUBJECT]:

[DATA]

Provide:
1. Key insights and patterns
2. Statistical analysis
3. Visualizations recommendations
4. Actionable recommendations

Keep the analysis data-driven and objective.`,
    variables: ['data_type', 'subject', 'data'],
    category: 'analysis'
  }
]