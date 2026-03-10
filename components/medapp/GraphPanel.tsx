'use client'

import { useEffect, useRef } from 'react'
import { useAppState } from '@/lib/store'

declare const d3: any

export default function GraphPanel({ onSelectNode }: { onSelectNode: (uid: string) => void }) {
  const { state } = useAppState()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<any>(null)

  useEffect(() => {
    if (!state.graphData || !svgRef.current || !containerRef.current) return
    const data = state.graphData
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    if (typeof d3 === 'undefined') return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    if (simRef.current) simRef.current.stop()

    const g = svg.append('g')
    const zoom = d3.zoom().on('zoom', (e: any) => g.attr('transform', e.transform))
    svg.call(zoom)

    const validNodes = new Set((data.nodes as any[]).map((n: any) => n.uid))
    const edges = ((data.edges ?? []) as any[]).filter((e: any) => validNodes.has(e.source) && validNodes.has(e.target))

    simRef.current = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.uid).distance((d: any) => d.edge_type === 'semantic' ? 140 : 80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('y', d3.forceY().strength((d: any) => d.role === 'seed' ? 0.05 : 0))
      .force('collision', d3.forceCollide().radius(40))

    const colorMap: Record<string, string> = {
      seed: '#ff4e6a',
      parent: '#00d4b8',
      sibling: '#f5a623',
      semantic: '#a855f7',
    }
    const getColor = (role: string) => colorMap[role] ?? '#888'

    const link = g.append('g').selectAll('line').data(edges).join('line')
      .attr('stroke', (d: any) => d.edge_type === 'semantic' ? '#a855f7' : '#2e3d5c')
      .attr('stroke-opacity', (d: any) => d.edge_type === 'semantic' ? 0.4 : 0.8)
      .attr('stroke-width', (d: any) => d.edge_type === 'semantic' ? Math.max(1, (d.weight ?? 0.5) * 3) : 1)
      .attr('stroke-dasharray', (d: any) => d.edge_type === 'semantic' ? '4,4' : 'none')

    const nodeGroup = g.append('g').selectAll('g').data(data.nodes).join('g')
      .call(drag(simRef.current))
      .on('click', (e: any, d: any) => { if (!e.defaultPrevented) onSelectNode(d.uid) })

    nodeGroup.append('circle')
      .attr('r', 12)
      .attr('fill', '#0d1017')
      .attr('stroke', (d: any) => getColor(d.role))
      .attr('stroke-width', (d: any) => (d.uid === state.selectedUid || d.uid === data.center_uid) ? 4 : 2)

    nodeGroup.append('text')
      .text((d: any) => d.title.length > 20 ? d.title.substring(0, 18) + '…' : d.title)
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-size', '11px')
      .attr('fill', '#dde4f5')
      .attr('dx', 16)
      .attr('dy', 4)
      .attr('pointer-events', 'none')

    simRef.current.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    function drag(sim: any) {
      return d3.drag()
        .on('start', (e: any) => {
          if (!e.active) sim.alphaTarget(0.3).restart()
          e.subject.fx = e.subject.x; e.subject.fy = e.subject.y
        })
        .on('drag', (e: any) => { e.subject.fx = e.x; e.subject.fy = e.y })
        .on('end', (e: any) => {
          if (!e.active) sim.alphaTarget(0)
          e.subject.fx = null; e.subject.fy = null
        })
    }
  }, [state.graphData, state.selectedUid])

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden"
      style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <svg ref={svgRef} className="w-full h-full" />

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded p-2 px-3"
        style={{ background: 'rgba(8,10,15,0.88)', border: '1px solid var(--border2)' }}
      >
        {[
          { color: 'var(--seed-color)', label: 'seed match', type: 'dot' },
          { color: 'var(--parent-color)', label: 'parent topic', type: 'dot' },
          { color: 'var(--sibling-color)', label: 'sibling', type: 'dot' },
          { color: 'var(--sem-color)', label: 'semantic link', type: 'dot' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--dim)]">
            <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--dim)] mt-1">
          <div className="w-[18px] h-[2px] flex-shrink-0" style={{ background: 'var(--muted)' }} />
          hierarchical
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--dim)]">
          <div className="w-[18px] h-0 flex-shrink-0 border-t-2 border-dashed" style={{ borderColor: 'var(--sem-color)' }} />
          semantic
        </div>
      </div>
    </div>
  )
}
