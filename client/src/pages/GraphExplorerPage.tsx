import { useEffect, useState, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { getEntities, getGraphSummary, getNodesByEntity, getEdgesFrom } from '../api/client';

// ── Types ──────────────────────────────────────────────────────

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  nodeType: string;
  entityId: string;
  properties: Record<string, unknown>;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  edgeType: string;
  weight?: number;
  confidence?: number;
}

interface InspectedItem {
  kind: 'node' | 'edge';
  data: Record<string, unknown>;
}

// ── Color map ──────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  Entity: '#e91e63',
  Outcome: '#ff9800',
  Activity: '#4caf50',
  Resource: '#2196f3',
  Project: '#9c27b0',
  Initiative: '#00bcd4',
  Metric: '#ff5722',
  Capability: '#607d8b',
  Asset: '#795548',
  CustomerRelationshipAsset: '#f44336',
  WorkforceAsset: '#3f51b5',
  StakeholderAsset: '#009688',
  SocialConstraint: '#d32f2f',
  Obligation: '#c2185b',
  CashFlowEvent: '#1976d2',
  AccountingPeriod: '#388e3c',
  Fund: '#fbc02d',
};

const NODE_LABELS = [
  'outcomes', 'activities', 'resources', 'projects', 'initiatives',
  'metrics', 'capabilities', 'assets', 'obligations', 'cash-flow-events',
  'funds',
];

const NODE_TYPE_FROM_PATH: Record<string, string> = {
  outcomes: 'Outcome',
  activities: 'Activity',
  resources: 'Resource',
  projects: 'Project',
  initiatives: 'Initiative',
  metrics: 'Metric',
  capabilities: 'Capability',
  assets: 'Asset',
  obligations: 'Obligation',
  'cash-flow-events': 'CashFlowEvent',
  funds: 'Fund',
};

// ── Component ──────────────────────────────────────────────────

export function GraphExplorerPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inspected, setInspected] = useState<InspectedItem | null>(null);
  const [highlightedPaths, setHighlightedPaths] = useState<Set<string>>(new Set());

  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  // Load entities on mount
  useEffect(() => {
    getEntities()
      .then((data) => setEntities(data.entities))
      .catch((e) => setError(e.message));
  }, []);

  // Load graph when entity changes
  const loadGraph = useCallback(async (entityId: string) => {
    if (!entityId) return;
    setLoading(true);
    setError('');
    setInspected(null);
    setHighlightedPaths(new Set());

    try {
      // Fetch summary
      const summaryData = await getGraphSummary(entityId);
      setSummary(summaryData);

      // Fetch all node types in parallel
      const nodePromises = NODE_LABELS.map(async (label) => {
        try {
          const data = await getNodesByEntity(label, entityId);
          return (data.items || []).map((n: any) => ({
            id: n.id,
            label: n.label || n.name || n.id?.slice(0, 8),
            nodeType: NODE_TYPE_FROM_PATH[label] || label,
            entityId,
            properties: n,
          }));
        } catch {
          return [];
        }
      });

      const nodeArrays = await Promise.all(nodePromises);
      const allNodes: GraphNode[] = nodeArrays.flat();

      // Add the entity itself as a node
      const entityData = entities.find((e) => e.id === entityId);
      if (entityData) {
        allNodes.unshift({
          id: entityId,
          label: entityData.label || 'Entity',
          nodeType: 'Entity',
          entityId,
          properties: entityData,
        });
      }

      // Fetch CONTRIBUTES_TO edges from each node
      const edgePromises = allNodes.map(async (node) => {
        try {
          const data = await getEdgesFrom('contributes-to', node.id);
          return (data.items || []).map((e: any) => ({
            source: e.source_id || e.sourceId || node.id,
            target: e.target_id || e.targetId,
            edgeType: 'CONTRIBUTES_TO',
            weight: e.weight,
            confidence: e.confidence,
          }));
        } catch {
          return [];
        }
      });

      const edgeArrays = await Promise.all(edgePromises);
      const allEdges: GraphEdge[] = edgeArrays.flat();

      // Filter edges to only include nodes we have
      const nodeIds = new Set(allNodes.map((n) => n.id));
      const validEdges = allEdges.filter(
        (e) => nodeIds.has(e.source as string) && nodeIds.has(e.target as string),
      );

      setNodes(allNodes);
      setEdges(validEdges);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entities]);

  useEffect(() => {
    if (selectedEntity) loadGraph(selectedEntity);
  }, [selectedEntity, loadGraph]);

  // ── D3 force simulation ──────────────────────────────────────

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    // Zoom
    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => g.attr('transform', event.transform)),
    );

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(edges)
        .id((d) => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    simRef.current = sim;

    // Draw edges
    const link = g.append('g')
      .selectAll<SVGLineElement, GraphEdge>('line')
      .data(edges)
      .join('line')
      .attr('stroke', (d) => highlightedPaths.has(`${(d.source as GraphNode).id || d.source}-${(d.target as GraphNode).id || d.target}`) ? '#ff9800' : '#ccc')
      .attr('stroke-width', (d) => {
        const w = d.weight ?? 0.5;
        return Math.max(1, w * 4);
      })
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setInspected({
          kind: 'edge',
          data: {
            type: d.edgeType,
            source: (d.source as GraphNode).label || d.source,
            target: (d.target as GraphNode).label || d.target,
            weight: d.weight,
            confidence: d.confidence,
          },
        });
      });

    // Edge weight labels
    const edgeLabels = g.append('g')
      .selectAll<SVGTextElement, GraphEdge>('text')
      .data(edges.filter((e) => e.weight != null))
      .join('text')
      .attr('font-size', '9px')
      .attr('fill', '#888')
      .attr('text-anchor', 'middle')
      .text((d) => `${((d.weight ?? 0) * 100).toFixed(0)}%`);

    // Draw nodes
    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setInspected({ kind: 'node', data: { ...d.properties, _nodeType: d.nodeType } });
      })
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    node.append('circle')
      .attr('r', (d) => d.nodeType === 'Entity' ? 18 : d.nodeType === 'Outcome' ? 14 : 10)
      .attr('fill', (d) => NODE_COLORS[d.nodeType] || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node.append('text')
      .text((d) => d.label?.length > 16 ? d.label.slice(0, 14) + '..' : d.label)
      .attr('dx', 14)
      .attr('dy', 4)
      .attr('font-size', '11px')
      .attr('fill', '#333');

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x!)
        .attr('y1', (d) => (d.source as GraphNode).y!)
        .attr('x2', (d) => (d.target as GraphNode).x!)
        .attr('y2', (d) => (d.target as GraphNode).y!);

      edgeLabels
        .attr('x', (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2 - 6);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, [nodes, edges, highlightedPaths]);

  // ── Render ───────────────────────────────────────────────────

  return (
    <div>
      <h2>Graph Explorer</h2>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Entity</label>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            style={{ width: 280 }}
          >
            <option value="">Select entity...</option>
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.label} ({ent.entity_type})
              </option>
            ))}
          </select>
        </div>
        {selectedEntity && (
          <button onClick={() => loadGraph(selectedEntity)} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Summary stats */}
      {summary && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {summary.nodeCounts && Object.entries(summary.nodeCounts).map(([type, count]) => (
            <div key={type} className="card" style={{ padding: '10px 16px', marginBottom: 0, minWidth: 100 }}>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>{type}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: NODE_COLORS[type] || '#333' }}>
                {count as number}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main layout: graph + inspector */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Graph canvas */}
        <div
          className="card"
          style={{ flex: 1, padding: 0, position: 'relative', minHeight: 500 }}
        >
          {nodes.length === 0 && !loading && selectedEntity && (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
              No graph nodes found for this entity.
            </div>
          )}
          <svg
            ref={svgRef}
            style={{ width: '100%', height: 560, display: 'block' }}
          />
          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(255,255,255,0.95)', padding: '8px 12px',
            borderRadius: 6, fontSize: '0.7rem',
            display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
          }}>
            {Object.entries(NODE_COLORS).slice(0, 8).map(([type, color]) => (
              <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: color, display: 'inline-block',
                }} />
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Inspector panel */}
        <div className="card" style={{ width: 320, flexShrink: 0, maxHeight: 580, overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>Inspector</h3>
          {!inspected ? (
            <p style={{ color: '#888', fontSize: '0.85rem' }}>
              Click a node or edge to inspect its properties.
            </p>
          ) : (
            <div>
              <div style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                background: inspected.kind === 'node' ? '#e3f2fd' : '#fff3e0',
                fontSize: '0.75rem', fontWeight: 600, marginBottom: 8,
                color: inspected.kind === 'node' ? '#1565c0' : '#e65100',
              }}>
                {inspected.kind === 'node' ? (inspected.data._nodeType as string) : 'CONTRIBUTES_TO'}
              </div>
              <table style={{ fontSize: '0.78rem', boxShadow: 'none' }}>
                <tbody>
                  {Object.entries(inspected.data)
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([key, val]) => (
                      <tr key={key}>
                        <td style={{ fontWeight: 600, color: '#555', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                          {key}
                        </td>
                        <td style={{ wordBreak: 'break-all' }}>
                          {typeof val === 'object' ? (
                            <pre style={{ margin: 0, fontSize: '0.72rem' }}>
                              {JSON.stringify(val, null, 2)}
                            </pre>
                          ) : String(val ?? '')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
