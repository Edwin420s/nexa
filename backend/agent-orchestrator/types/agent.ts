export interface Agent {
  execute(task: string, context?: any): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    details?: any;
  }>;
}

export interface AgentResponse {
  success: boolean;
  data?: {
    content: string;
    sources: string[];
    confidence: number;
  };
  error?: string;
  details?: any;
}
