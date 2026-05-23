import React from 'react';
import { 
  MousePointer, 
  TrendingUp, 
  Brush, 
  Square, 
  Grid, 
  Type, 
  Eraser 
} from 'lucide-react';

export default function LeftToolbar({ activeTool, setActiveTool, onClearDrawings }) {
  const tools = [
    { id: 'cursor', label: 'Crosshair / Cursor', icon: MousePointer },
    { id: 'trendline', label: 'Trend Line', icon: TrendingUp },
    { id: 'brush', label: 'Brush Painter', icon: Brush },
    { id: 'rectangle', label: 'Rectangle Shape', icon: Square },
    { id: 'fib', label: 'Fib Retracement', icon: Grid },
    { id: 'text', label: 'Anchor Text', icon: Type },
  ];

  return (
    <div className="flex flex-col items-center bg-[#0b1120] border border-white/[0.04] p-1.5 rounded space-y-1.5 shadow-xl select-none">
      {tools.map(tool => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
            className={`p-2.5 rounded transition-all cursor-pointer ${
              isActive 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]' 
                : 'text-[#7c8aa5] hover:text-white border border-transparent hover:bg-white/5'
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
      
      <div className="h-px w-6 bg-white/10 my-1" />
      
      <button
        onClick={() => {
          onClearDrawings();
          setActiveTool('cursor');
        }}
        title="Clear All Drawings"
        className="p-2.5 rounded text-[#ff4d6d] hover:bg-[#ff4d6d]/10 border border-transparent hover:border-[#ff4d6d]/20 transition-all cursor-pointer"
      >
        <Eraser size={14} />
      </button>
    </div>
  );
}
