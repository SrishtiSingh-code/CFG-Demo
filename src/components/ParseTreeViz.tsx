import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { TreeNode } from '../utils/cfgParser';
import { Tooltip } from './Tooltip';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export const ParseTreeViz = ({ data }: { data: TreeNode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<TreeNode | null>(null);
  const [hoveredNodePos, setHoveredNodePos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const root = useMemo(() => d3.hierarchy(data), [data]);
  const allNodes = useMemo(() => root.descendants(), [root]);
  
  const internalNodes = useMemo(() => {
    const internals = allNodes.filter(n => n.children && n.children.length > 0);
    internals.sort((a, b) => a.children![0].data.id - b.children![0].data.id);
    return internals;
  }, [allNodes]);

  const maxSteps = internalNodes.length;
  const [currentStep, setCurrentStep] = useState(maxSteps);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setCurrentStep(maxSteps);
    setIsPlaying(false);
  }, [maxSteps]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStep < maxSteps) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 800);
    } else if (currentStep >= maxSteps) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, maxSteps]);

  const visibleNodesSet = useMemo(() => {
    const visible = new Set<d3.HierarchyPointNode<TreeNode>>();
    visible.add(root);
    for (let i = 0; i < currentStep; i++) {
      const parent = internalNodes[i];
      parent.children?.forEach(child => visible.add(child));
    }
    return visible;
  }, [root, internalNodes, currentStep]);

  // Calculate current yield (output)
  const currentYield = useMemo(() => {
    const leaves: d3.HierarchyPointNode<TreeNode>[] = [];
    const traverse = (node: d3.HierarchyPointNode<TreeNode>) => {
      if (!visibleNodesSet.has(node)) return;
      if (!node.children || !visibleNodesSet.has(node.children[0])) {
        leaves.push(node);
      } else {
        node.children.forEach(traverse);
      }
    };
    traverse(root as d3.HierarchyPointNode<TreeNode>);
    return leaves.map(l => l.data.name).filter(n => n !== 'ε').join('');
  }, [root, visibleNodesSet]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 800;
    const height = 600;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const treeLayout = d3.tree<TreeNode>().size([innerWidth, innerHeight]);
    treeLayout(root);

    const isDark = document.documentElement.classList.contains('dark');
    const strokeColor = isDark ? '#475569' : '#94a3b8';

    // Links
    const visibleLinks = root.links().filter(l => visibleNodesSet.has(l.source) && visibleNodesSet.has(l.target));

    const link = g.selectAll('.link')
      .data(visibleLinks)
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2)
      .attr('d', d3.linkVertical<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.x)
        .y(d => d.y)
      )
      .attr('opacity', 0)
      .transition()
      .duration(300)
      .attr('opacity', 1);

    // Nodes
    const visibleNodesData = allNodes.filter(n => visibleNodesSet.has(n));

    const node = g.selectAll('.node')
      .data(visibleNodesData)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d: any) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => {
          setHoveredNode(d.data);
          
          const rect = svgRef.current?.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (rect && containerRect) {
            setHoveredNodePos({ 
              x: event.clientX - containerRect.left, 
              y: event.clientY - containerRect.top 
            });
          }
          
          // Highlight edges
          g.selectAll('.link')
              .attr('stroke', (l: any) => (l.source === d ? '#38bdf8' : strokeColor))
              .attr('stroke-width', (l: any) => (l.source === d ? 4 : 2));
        }, 200);
      })
      .on('mouseout', () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHoveredNode(null);
        g.selectAll('.link').attr('stroke', strokeColor).attr('stroke-width', 2);
      });

    node.attr('opacity', 0)
      .transition()
      .duration(300)
      .attr('opacity', 1);

    const getFillColor = (d: any) => {
      if (d.children) return '#3A7BD5'; // Non-terminal (calm blue)
      return '#E6C15A'; // Terminal (muted amber)
    };

    const getTextColor = (d: any) => {
      if (d.children) return '#EAF2FF'; // Non-terminal text
      return '#1A1A1A'; // Terminal text
    };

    node.selectAll('circle').remove();
    node.append('circle')
      .attr('r', 24)
      .attr('fill', getFillColor)
      .attr('stroke', 'none');

    node.selectAll('text').remove();
    node.append('text')
      .attr('dy', '0.31em')
      .attr('text-anchor', 'middle')
      .attr('fill', getTextColor)
      .attr('font-size', '20px')
      .attr('font-weight', '700')
      .text((d: any) => d.data.name);

  }, [data, theme, currentStep, allNodes, root]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            title="Reset"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              if (currentStep >= maxSteps) setCurrentStep(0);
              setIsPlaying(!isPlaying);
            }}
            className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => { setIsPlaying(false); setCurrentStep(Math.min(maxSteps, currentStep + 1)); }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            title="Next Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 w-full px-4">
          <input 
            type="range" 
            min="0" 
            max={maxSteps} 
            value={currentStep}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStep(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
        
        <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
          Step {currentStep} / {maxSteps}
        </div>
      </div>

      <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[80px]">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Current Output</div>
        <div className="font-mono text-lg text-white tracking-wider break-all text-center">
          {currentYield || 'ε'}
        </div>
      </div>

      <div ref={containerRef} className="w-full overflow-visible rounded-2xl glass-card relative">
        <svg ref={svgRef} width="100%" height="600" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" className="cursor-grab active:cursor-grabbing" />
        
        {hoveredNode && (
          <Tooltip node={hoveredNode} position={hoveredNodePos} />
        )}
      </div>
    </div>
  );
};
