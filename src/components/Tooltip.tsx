import React from 'react';

interface TooltipProps {
  node: any;
  position: { x: number; y: number };
}

export const Tooltip: React.FC<TooltipProps> = ({ node, position }) => {
  const isTerminal = !node.children || node.children.length === 0;

  return (
    <div
      className="absolute z-50 p-4 bg-[rgba(20,20,20,0.8)] border border-cyan-500 rounded-lg shadow-xl text-white font-mono pointer-events-none"
      style={{ left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(-50%, -120%)' }}
    >
      {isTerminal ? (
        <div className="text-sm">Terminal Token</div>
      ) : (
        <div className="text-sm space-y-2">
          <div>
            <span className="text-slate-400 text-xs">Rule:</span>
            <div className="text-white">{node.ruleApplied?.replace('->', '→')}</div>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Substitution:</span>
            <div className="text-white">{node.children?.map((c: any) => c.name).join(' ')}</div>
          </div>
        </div>
      )}
    </div>
  );
};
