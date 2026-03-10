'use client'

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type {
  LeftTab, Subject, TreeNode, FullNode, GraphData,
  GraphBundle, Transcript, AIPrompt, Settings, DaemonStatus, AIOutput,
} from '@/lib/types'

// ── State ─────────────────────────────────────────────────────────────────────
export interface AppState {
  leftTab: LeftTab
  // Tree
  subjects: Subject[]
  activeTreeSubj: string | null
  treeData: TreeNode[] | null
  expandedUids: Set<string>
  selectedUid: string | null
  nodeCache: Record<string, FullNode>
  // Reader
  activeNode: FullNode | null
  activeNodeRawText: string
  currentPdfZoom: number
  graphData: GraphData | null
  currentGraphBundle: GraphBundle | null
  // Daemon
  daemonStatus: DaemonStatus
  prevDaemonStatus: string
  // Transcripts
  txList: Transcript[]
  selectedTxId: number | null
  selectedTxNodeUid: string | null
  txText: string
  txDirty: boolean
  txPreviewMode: boolean
  aiOutputs: AIOutput[]
  lastSemanticNodes: { uid: string; title: string; path?: string }[]
  // Media
  lightboxSrc: string | null
  // Prompts
  aiPrompts: AIPrompt[]
  // Settings
  settings: Settings
  // Status
  graphReady: boolean
}

const initialState: AppState = {
  leftTab: 'tree',
  subjects: [],
  activeTreeSubj: null,
  treeData: null,
  expandedUids: new Set(),
  selectedUid: null,
  nodeCache: {},
  activeNode: null,
  activeNodeRawText: '',
  currentPdfZoom: 100,
  graphData: null,
  currentGraphBundle: null,
  daemonStatus: { status: 'idle', model_ready: false },
  prevDaemonStatus: 'idle',
  txList: [],
  selectedTxId: null,
  selectedTxNodeUid: null,
  txText: '',
  txDirty: false,
  txPreviewMode: false,
  aiOutputs: [],
  lastSemanticNodes: [],
  lightboxSrc: null,
  aiPrompts: [],
  settings: {},
  graphReady: false,
}

// ── Actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_LEFT_TAB'; tab: LeftTab }
  | { type: 'SET_SUBJECTS'; subjects: Subject[] }
  | { type: 'SET_ACTIVE_TREE_SUBJ'; key: string }
  | { type: 'SET_TREE_DATA'; data: TreeNode[] }
  | { type: 'TOGGLE_EXPAND'; uid: string }
  | { type: 'EXPAND_UIDS'; uids: string[] }
  | { type: 'SET_SELECTED_UID'; uid: string }
  | { type: 'SET_NODE_CACHE'; uid: string; node: FullNode }
  | { type: 'SET_ACTIVE_NODE'; node: FullNode }
  | { type: 'SET_ACTIVE_NODE_TEXT'; text: string }
  | { type: 'SET_PDF_ZOOM'; zoom: number }
  | { type: 'SET_GRAPH_DATA'; data: GraphData }
  | { type: 'SET_GRAPH_BUNDLE'; bundle: GraphBundle | null }
  | { type: 'SET_DAEMON_STATUS'; status: DaemonStatus }
  | { type: 'SET_TX_LIST'; list: Transcript[] }
  | { type: 'SET_SELECTED_TX'; id: number | null }
  | { type: 'SET_TX_NODE_UID'; uid: string | null }
  | { type: 'SET_TX_TEXT'; text: string }
  | { type: 'SET_TX_DIRTY'; dirty: boolean }
  | { type: 'SET_TX_PREVIEW'; on: boolean }
  | { type: 'SET_AI_OUTPUTS'; outputs: AIOutput[] }
  | { type: 'SET_SEMANTIC_NODES'; nodes: AppState['lastSemanticNodes'] }
  | { type: 'SET_LIGHTBOX'; src: string | null }
  | { type: 'SET_AI_PROMPTS'; prompts: AIPrompt[] }
  | { type: 'SET_SETTINGS'; settings: Settings }
  | { type: 'MERGE_SETTINGS'; partial: Partial<Settings> }
  | { type: 'SET_GRAPH_READY'; ready: boolean }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LEFT_TAB': return { ...state, leftTab: action.tab }
    case 'SET_SUBJECTS': return { ...state, subjects: action.subjects }
    case 'SET_ACTIVE_TREE_SUBJ': return { ...state, activeTreeSubj: action.key }
    case 'SET_TREE_DATA': return { ...state, treeData: action.data, expandedUids: new Set(action.data.map(n => n.uid)) }
    case 'TOGGLE_EXPAND': {
      const next = new Set(state.expandedUids)
      next.has(action.uid) ? next.delete(action.uid) : next.add(action.uid)
      return { ...state, expandedUids: next }
    }
    case 'EXPAND_UIDS': {
      const next = new Set(state.expandedUids)
      action.uids.forEach(u => next.add(u))
      return { ...state, expandedUids: next }
    }
    case 'SET_SELECTED_UID': return { ...state, selectedUid: action.uid }
    case 'SET_NODE_CACHE': return { ...state, nodeCache: { ...state.nodeCache, [action.uid]: action.node } }
    case 'SET_ACTIVE_NODE': return { ...state, activeNode: action.node }
    case 'SET_ACTIVE_NODE_TEXT': return { ...state, activeNodeRawText: action.text }
    case 'SET_PDF_ZOOM': return { ...state, currentPdfZoom: action.zoom }
    case 'SET_GRAPH_DATA': return { ...state, graphData: action.data }
    case 'SET_GRAPH_BUNDLE': return { ...state, currentGraphBundle: action.bundle }
    case 'SET_DAEMON_STATUS': return {
      ...state,
      prevDaemonStatus: state.daemonStatus.status,
      daemonStatus: action.status,
    }
    case 'SET_TX_LIST': return { ...state, txList: action.list }
    case 'SET_SELECTED_TX': return { ...state, selectedTxId: action.id }
    case 'SET_TX_NODE_UID': return { ...state, selectedTxNodeUid: action.uid }
    case 'SET_TX_TEXT': return { ...state, txText: action.text }
    case 'SET_TX_DIRTY': return { ...state, txDirty: action.dirty }
    case 'SET_TX_PREVIEW': return { ...state, txPreviewMode: action.on }
    case 'SET_AI_OUTPUTS': return { ...state, aiOutputs: action.outputs }
    case 'SET_SEMANTIC_NODES': return { ...state, lastSemanticNodes: action.nodes }
    case 'SET_LIGHTBOX': return { ...state, lightboxSrc: action.src }
    case 'SET_AI_PROMPTS': return { ...state, aiPrompts: action.prompts }
    case 'SET_SETTINGS': return { ...state, settings: action.settings }
    case 'MERGE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.partial } }
    case 'SET_GRAPH_READY': return { ...state, graphReady: action.ready }
    default: return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useAppState() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppState must be used inside AppProvider')
  return ctx
}
