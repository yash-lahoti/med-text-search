'use client'

import { useCallback } from 'react'
import { useAppState } from '@/lib/store'
import type { TreeNode } from '@/lib/types'

interface Props {
  onSelectNode: (uid: string) => void
  onAddSubtopic: () => void
}

function flattenTree(nodes: TreeNode[], expanded: Set<string>, depth = 0): { node: TreeNode; depth: number }[] {
  const result: { node: TreeNode; depth: number }[] = []
  for (const n of nodes) {
    result.push({ node: n, depth })
    if (n.has_children && expanded.has(n.uid)) {
      result.push(...flattenTree(n.children, expanded, depth + 1))
    }
  }
  return result
}

export default function TreeView({ onSelectNode, onAddSubtopic }: Props) {
  const { state, dispatch } = useAppState()

  const flat = state.treeData ? flattenTree(state.treeData, state.expandedUids) : []

  const handleClick = useCallback(
    (node: TreeNode, e: React.MouseEvent<HTMLDivElement>) => {
      const depth = flat.find(f => f.node.uid === node.uid)?.depth ?? 0
      const offset = (e as React.MouseEvent).nativeEvent.offsetX
      if (node.has_children && offset < 24 + depth * 14) {
        dispatch({ type: 'TOGGLE_EXPAND', uid: node.uid })
      } else {
        onSelectNode(node.uid)
      }
    },
    [flat, dispatch, onSelectNode]
  )

  if (!state.treeData) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2.5 text-[var(--muted)] p-8">
        <span className="text-3xl opacity-25">◫</span>
        <p className="font-mono text-[11px] text-center leading-7 text-[var(--dim)]">
          Pick a subject tab<br />to browse the tree
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {flat.map(({ node, depth }) => {
        const isSelected = node.uid === state.selectedUid
        const clampedDepth = Math.min(depth, 3)
        const textSizes = ['text-[12px] font-semibold text-[var(--text)]', 'text-[11.5px]', 'text-[11px]', 'text-[11px] text-[var(--text-dim)]']

        return (
          <div
            key={node.uid}
            id={`tree-node-${node.uid.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
            className={[
              'flex items-center gap-1 px-3 cursor-pointer select-none min-h-7 border-l-2 transition-colors duration-100',
              textSizes[clampedDepth],
              isSelected
                ? 'bg-[var(--brand-dim)] border-l-[var(--brand)]'
                : 'border-l-transparent hover:bg-[var(--bg2)]',
            ].join(' ')}
            onClick={e => handleClick(node, e)}
          >
            <div className="flex-shrink-0" style={{ width: depth * 14 }} />
            <div
              className={[
                'w-4 h-4 flex items-center justify-center flex-shrink-0 text-[var(--dim)] text-[9px] transition-transform duration-150',
                node.has_children && state.expandedUids.has(node.uid) ? 'rotate-90' : '',
              ].join(' ')}
            >
              {node.has_children ? '▶' : ''}
            </div>
            <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-snug">
              {node.title || 'untitled'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
