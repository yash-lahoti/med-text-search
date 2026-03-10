// ── API helpers ───────────────────────────────────────────────────────────────
import type {
  DaemonStatus, FullNode, GraphData, Settings,
  Subject, Transcript, AIPrompt, GraphBundle,
} from './types'

const BASE = ''

// ── Ready ─────────────────────────────────────────────────────────────────────
export async function fetchReady(): Promise<{ ready: boolean }> {
  const r = await fetch(`${BASE}/api/ready`)
  return r.json()
}

// ── Tree ──────────────────────────────────────────────────────────────────────
export async function fetchTree(subjKey: string): Promise<import('./types').TreeNode[]> {
  const r = await fetch(`${BASE}/api/tree/${encodeURIComponent(subjKey)}`)
  return r.json()
}

// ── Node ─────────────────────────────────────────────────────────────────────
export async function fetchNode(uid: string): Promise<FullNode> {
  const r = await fetch(`${BASE}/api/node/${encodeURIComponent(uid)}`)
  return r.json()
}

// ── Graph ─────────────────────────────────────────────────────────────────────
export async function fetchGraph(uid: string): Promise<GraphData> {
  const r = await fetch(`${BASE}/api/graph/${encodeURIComponent(uid)}`)
  return r.json()
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function runSearch(query: string, topK = 12): Promise<GraphBundle> {
  const r = await fetch(`${BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK }),
  })
  return r.json()
}

// ── User Nodes ────────────────────────────────────────────────────────────────
export async function createUserNode(payload: {
  parent_uid: string; subject: string; title: string; text: string
}): Promise<FullNode> {
  const r = await fetch(`${BASE}/api/user_nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function patchUserNode(uid: string, text: string): Promise<FullNode> {
  const r = await fetch(`${BASE}/api/user_nodes/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return r.json()
}

export async function uploadUserNodeImage(uid: string, file: File): Promise<{ ok: boolean; error?: string }> {
  const form = new FormData()
  form.append('file', file)
  const r = await fetch(`${BASE}/api/user_nodes/${encodeURIComponent(uid)}/images`, {
    method: 'POST',
    body: form,
  })
  return r.json()
}

export async function fetchUserNode(uid: string): Promise<FullNode> {
  const r = await fetch(`${BASE}/api/user_nodes/${encodeURIComponent(uid)}`)
  return r.json()
}

// ── Daemon ────────────────────────────────────────────────────────────────────
export async function fetchDaemonStatus(): Promise<DaemonStatus> {
  const r = await fetch(`${BASE}/api/daemon/status`)
  return r.json()
}

export async function daemonStart(): Promise<void> {
  await fetch(`${BASE}/api/daemon/start`, { method: 'POST' })
}

export async function daemonStop(): Promise<void> {
  await fetch(`${BASE}/api/daemon/stop`, { method: 'POST' })
}

// ── Transcripts ───────────────────────────────────────────────────────────────
export async function fetchTranscripts(): Promise<Transcript[]> {
  const r = await fetch(`${BASE}/api/stt/transcripts`)
  return r.json()
}

export async function fetchTranscript(id: number): Promise<Transcript> {
  const r = await fetch(`${BASE}/api/stt/transcripts/${id}`)
  return r.json()
}

export async function createTranscript(content: string): Promise<{ ok: boolean; id: number }> {
  const r = await fetch(`${BASE}/api/stt/transcripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  return r.json()
}

export async function patchTranscript(
  id: number,
  payload: { content?: string; node_uid?: string | null }
): Promise<void> {
  await fetch(`${BASE}/api/stt/transcripts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteTranscript(id: number): Promise<void> {
  await fetch(`${BASE}/api/stt/transcripts/${id}`, { method: 'DELETE' })
}

export async function appendTranscript(
  id: number,
  text: string
): Promise<{ ok: boolean; content?: string }> {
  const r = await fetch(`${BASE}/api/stt/transcripts/${id}/append`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return r.json()
}

export async function setActiveTranscript(id: number | null): Promise<void> {
  await fetch(`${BASE}/api/stt/active_transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  }).catch(() => {})
}

// ── Transcript Images ─────────────────────────────────────────────────────────
export async function fetchTxImages(tid: number): Promise<{ id: number; mime_type: string; filename?: string }[]> {
  const r = await fetch(`${BASE}/api/stt/transcripts/${tid}/images`)
  return r.json()
}

export async function fetchTxImageData(tid: number, iid: number): Promise<{ data_b64?: string }> {
  const r = await fetch(`${BASE}/api/stt/transcripts/${tid}/images/${iid}/data`)
  return r.json()
}

export async function uploadTxImage(tid: number, file: File): Promise<{ ok: boolean; id?: number; data_b64?: string }> {
  const form = new FormData()
  form.append('file', file)
  const r = await fetch(`${BASE}/api/stt/transcripts/${tid}/images`, {
    method: 'POST',
    body: form,
  })
  return r.json()
}

export async function deleteTxImage(tid: number, iid: number): Promise<void> {
  await fetch(`${BASE}/api/stt/transcripts/${tid}/images/${iid}`, { method: 'DELETE' })
}

// ── Prompts ───────────────────────────────────────────────────────────────────
export async function fetchPrompts(): Promise<AIPrompt[]> {
  const r = await fetch(`${BASE}/api/stt/prompts`)
  return r.json()
}

export async function savePrompt(payload: Partial<AIPrompt>): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/stt/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function deletePrompt(id: number): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/stt/prompts/${id}`, { method: 'DELETE' })
  return r.json()
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function fetchSettings(): Promise<Settings> {
  const r = await fetch(`${BASE}/api/stt/settings`)
  return r.json()
}

export async function patchSettings(partial: Partial<Settings>): Promise<void> {
  await fetch(`${BASE}/api/stt/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  })
}

// ── AI Run (SSE) ──────────────────────────────────────────────────────────────
export async function* runAI(transcriptId: number, promptId: number) {
  const resp = await fetch(`${BASE}/api/ai/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript_id: transcriptId, prompt_id: promptId }),
  })
  const reader = resp.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()!
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6))
        } catch {}
      }
    }
  }
}

// ── Subjects (mock fallback) ──────────────────────────────────────────────────
export const SUBJECTS: Subject[] = []
