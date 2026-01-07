'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FileCode, FileText, Folder } from 'lucide-react'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileItem[]
  language?: string
}

interface FileExplorerProps {
  files: FileItem[]
}

export default function FileExplorer({ files }: FileExplorerProps) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-lg font-semibold mb-4">Generated Files</h3>
      <div className="space-y-1">
        {files.map((file) => (
          <FileItem key={file.id} item={file} depth={0} />
        ))}
      </div>
    </div>
  )
}

function FileItem({ item, depth }: { item: FileItem; depth: number }) {
  const [isOpen, setIsOpen] = useState(true)

  const getIcon = () => {
    if (item.type === 'folder') {
      return isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
    }
    if (item.name.endsWith('.js') || item.name.endsWith('.ts') || item.name.endsWith('.jsx') || item.name.endsWith('.tsx')) {
      return <FileCode size={16} />
    }
    return <FileText size={16} />
  }

  const getColor = () => {
    if (item.type === 'folder') return 'text-yellow-400'
    if (item.name.endsWith('.js') || item.name.endsWith('.ts')) return 'text-blue-400'
    if (item.name.endsWith('.json')) return 'text-green-400'
    if (item.name.endsWith('.css') || item.name.endsWith('.scss')) return 'text-purple-400'
    if (item.name.endsWith('.md')) return 'text-gray-400'
    return 'text-gray-300'
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full p-2 hover:bg-gray-800 rounded-lg transition-colors text-left"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        <span className="mr-2 text-gray-500">{getIcon()}</span>
        <span className={`${getColor()} font-medium`}>
          {item.type === 'folder' && <Folder className="inline mr-2" size={14} />}
          {item.name}
        </span>
      </button>
      
      {isOpen && item.children && (
        <div>
          {item.children.map((child) => (
            <FileItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// Sample files data
export const sampleFiles: FileItem[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'agents',
        type: 'folder',
        children: [
          { id: '3', name: 'researcher.ts', type: 'file' },
          { id: '4', name: 'builder.ts', type: 'file' },
          { id: '5', name: 'summarizer.ts', type: 'file' }
        ]
      },
      {
        id: '6',
        name: 'orchestrator.ts',
        type: 'file'
      },
      {
        id: '7',
        name: 'config.ts',
        type: 'file'
      }
    ]
  },
  {
    id: '8',
    name: 'package.json',
    type: 'file'
  },
  {
    id: '9',
    name: 'README.md',
    type: 'file'
  },
  {
    id: '10',
    name: 'tsconfig.json',
    type: 'file'
  }
]