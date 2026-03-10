// ── Shared types ─────────────────────────────────────────────────────────────

export interface Subject {
  key: string
  short: string
  hasData: boolean
  color?: string
}

export interface TreeNode {
  uid: string
  title: string
  has_children: boolean
  children: TreeNode[]
  subject?: string
  page?: number
}

export interface FullNode {
  uid: string
  title: string
  text?: string
  subject?: string
  page?: number
  pdf_pages_b64?: string[]
  resolved_images?: string[]
  is_user?: boolean
}

export interface SearchResult {
  uid: string
  title: string
  subject: string
  path: string
  text?: string
  role: 'seed' | 'parent' | 'sibling' | 'semantic'
}

export interface GraphBundle {
  nodes: SearchResult[]
  edges?: GraphEdge[]
  center_uid?: string
}

export interface GraphNode {
  uid: string
  title: string
  role: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
  edge_type: 'hierarchical' | 'semantic'
  weight?: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  center_uid?: string
}

export interface Transcript {
  id: number
  created_at: string
  content?: string
  node_uid?: string | null
  outputs?: AIOutput[]
}

export interface AIOutput {
  id?: number
  prompt_name?: string
  output_text: string
  created_at?: string
}

export interface AIPrompt {
  id: number
  name: string
  system_prompt: string
  user_template: string
  json_schema?: string
  use_structured?: number
}

export interface Settings {
  ai_backend?: 'ollama' | 'gemini'
  ollama_model?: string
  gemini_model?: string
  gemini_api_key?: string
  record_mode?: 'toggle' | 'hold'
  remove_fillers?: boolean
}

export interface DaemonStatus {
  status: 'idle' | 'recording' | 'transcribing'
  model_ready: boolean
}

export type LeftTab = 'tree' | 'search' | 'transcripts' | 'settings' | 'prompts'
