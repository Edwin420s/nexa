'use client'

import { useState } from 'react'
import { Brain, Cpu, Zap, Network, Layers, GitBranch, Cloud, Shield, CpuIcon, Sparkles, Target, Clock, Users } from 'lucide-react'

export default function AIFeaturesPage() {
  const [activeFeature, setActiveFeature] = useState('thought-signatures')

  const features = [
    {
      id: 'thought-signatures',
      name: 'Thought Signatures',
      icon: Brain,
      description: 'Maintain reasoning state across long-running tasks',
      benefits: ['Continuous reasoning', 'Error recovery', 'Context preservation'],
      geminiModels: ['Gemini 3 Pro', 'Gemini 2.5 Pro'],
      implementation: 'Uses structured JSON to track agent thinking patterns',
      example: 'Agent can pause and resume complex analysis without losing context'
    },
    {
      id: 'function-calling',
      name: 'Function Calling',
      icon: Cpu,
      description: 'Structured tool orchestration for autonomous execution',
      benefits: ['Deterministic actions', 'Tool integration', 'Error handling'],
      geminiModels: ['Gemini 3 Pro', 'Gemini 2.5 Flash', 'Gemini 2.5 Pro'],
      implementation: 'JSON schema definitions for agent tools and APIs',
      example: 'Agent can call external APIs, run code, and process files'
    },
    {
      id: 'multi-agent',
      name: 'Multi-agent Coordination',
      icon: Network,
      description: 'Collaborative agent workflows with specialized roles',
      benefits: ['Parallel processing', 'Specialized expertise', 'Fault tolerance'],
      geminiModels: ['All Gemini 3 models'],
      implementation: 'Orchestrator pattern with message passing',
      example: 'Researcher, architect, and builder agents working together'
    },
    {
      id: 'confidence-scoring',
      name: 'Confidence Scoring',
      icon: Target,
      description: 'Real-time confidence estimation for agent decisions',
      benefits: ['Trust metrics', 'Quality control', 'Automatic retries'],
      geminiModels: ['Gemini 3 Pro'],
      implementation: 'Model introspection and output analysis',
      example: 'Agent provides confidence score with every decision'
    },
    {
      id: 'real-time-streaming',
      name: 'Real-time Streaming',
      icon: Zap,
      description: 'Live streaming of agent reasoning and outputs',
      benefits: ['Immediate feedback', 'Progress tracking', 'Transparency'],
      geminiModels: ['All Gemini models with streaming support'],
      implementation: 'Server-Sent Events (SSE) for continuous updates',
      example: 'Watch agents think and act in real-time'
    },
    {
      id: 'context-window',
      name: '1M Token Context',
      icon: Layers,
      description: 'Massive context window for complex reasoning',
      benefits: ['Whole-project analysis', 'Long documents', 'Multi-file reasoning'],
      geminiModels: ['Gemini 2.5 Flash', 'Gemini 2.5 Pro'],
      implementation: 'Chunking and attention mechanisms',
      example: 'Process entire codebases or research papers at once'
    }
  ]

  const useCases = [
    {
      title: 'Autonomous Research',
      description: 'Agents that research topics, summarize findings, and generate reports',
      features: ['Thought Signatures', 'Multi-agent', 'Context Window'],
      complexity: 'Intermediate',
      timeSaved: '80%'
    },
    {
      title: 'Code Generation',
      description: 'Full-stack application development with testing and deployment',
      features: ['Function Calling', 'Confidence Scoring', 'Real-time Streaming'],
      complexity: 'Advanced',
      timeSaved: '75%'
    },
    {
      title: 'Data Analysis',
      description: 'Automated data processing, visualization, and insight generation',
      features: ['Multi-agent', 'Context Window', 'Confidence Scoring'],
      complexity: 'Advanced',
      timeSaved: '85%'
    },
    {
      title: 'Content Creation',
      description: 'Multi-modal content generation with brand consistency',
      features: ['Real-time Streaming', 'Confidence Scoring', 'Thought Signatures'],
      complexity: 'Beginner',
      timeSaved: '90%'
    }
  ]

  const activeFeatureData = features.find(f => f.id === activeFeature)

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
            <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Gemini 3 Exclusive</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Advanced AI Features</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Leveraging Gemini 3's cutting-edge capabilities for autonomous agent systems
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Features Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <h3 className="font-medium mb-4">Gemini 3 Features</h3>
                <nav className="space-y-2">
                  {features.map((feature) => {
                    const Icon = feature.icon
                    return (
                      <button
                        key={feature.id}
                        onClick={() => setActiveFeature(feature.id)}
                        className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${activeFeature === feature.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
                      >
                        <Icon size={20} className={activeFeature === feature.id ? 'text-blue-400' : 'text-gray-400'} />
                        <span className={activeFeature === feature.id ? 'font-medium' : 'text-gray-300'}>
                          {feature.name}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Stats */}
              <div className="mt-6 p-6 bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/30 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <CpuIcon className="text-blue-400" size={24} />
                  <h3 className="font-medium">Performance Impact</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Task Completion</span>
                      <span className="font-medium text-green-400">+300%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-gradient-to-r from-green-500 to-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Accuracy</span>
                      <span className="font-medium text-blue-400">+45%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Cost Efficiency</span>
                      <span className="font-medium text-purple-400">-60%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-gradient-to-r from-purple-500 to-pink-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Feature Details */}
          <div className="lg:col-span-2">
            {activeFeatureData && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <activeFeatureData.icon className="text-blue-400" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{activeFeatureData.name}</h2>
                    <p className="text-gray-400">{activeFeatureData.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-medium mb-4">Key Benefits</h3>
                    <ul className="space-y-3">
                      {activeFeatureData.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-gray-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-8">
                      <h3 className="font-medium mb-4">Supported Models</h3>
                      <div className="flex flex-wrap gap-2">
                        {activeFeatureData.geminiModels.map((model, idx) => (
                          <span key={idx} className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Implementation</h3>
                    <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg mb-6">
                      <p className="text-gray-300">{activeFeatureData.implementation}</p>
                    </div>
                    
                    <h3 className="font-medium mb-4">Example Usage</h3>
                    <div className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/30 rounded-lg">
                      <p className="text-gray-300">{activeFeatureData.example}</p>
                    </div>
                  </div>
                </div>

                {/* Code Example */}
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <h3 className="font-medium mb-4">Code Implementation</h3>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// ${activeFeatureData.name} Implementation
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function use${activeFeatureData.name.replace(/\s+/g, '')}(task: string) {
  const response = await ai.models.generateContent({
    model: "${activeFeatureData.geminiModels[0]}",
    contents: task,
    ${activeFeature.id === 'function-calling' ? `tools: [
      {
        functionDeclarations: [{
          name: "execute_task",
          description: "Execute the planned task",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string" },
              parameters: { type: "object" }
            }
          }
        }]
      }
    ]` : ''}
  });
  
  return {
    result: response.text,
    confidence: calculateConfidence(response),
    metadata: extractMetadata(response)
  };
}`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Use Cases */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Real-world Use Cases</h2>
                <div className="flex items-center space-x-2 text-blue-400">
                  <Users size={20} />
                  <span>Production Proven</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {useCases.map((useCase, idx) => (
                  <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg">{useCase.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        useCase.complexity === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                        useCase.complexity === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {useCase.complexity}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{useCase.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Features Used</div>
                        <div className="flex flex-wrap gap-2">
                          {useCase.features.map((feature, fIdx) => (
                            <span key={fIdx} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                        <div className="text-sm text-gray-400">Time Saved</div>
                        <div className="text-lg font-bold text-green-400">{useCase.timeSaved}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 border border-gray-800 rounded-xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Integrate?</h2>
            <p className="text-gray-300 mb-6 max-w-3xl mx-auto">
              Start building with Gemini 3's advanced features in minutes. Our platform handles the complexity so you can focus on innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/projects/new"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform hover:scale-105"
              >
                Start Building
              </a>
              <a
                href="/docs/gemini-integration"
                className="px-6 py-3 border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-colors"
              >
                View Integration Guide
              </a>
              <a
                href="https://ai.google.dev/gemini-api"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Gemini API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}