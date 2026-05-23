import React, { useState } from 'react';
import {
  MousePointer,
  TrendingUp,
  Pencil,
  Square,
  BarChart2,
  Type,
  Eraser,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const tools = [
  { id: 'cursor',    label: 'Cursor / Crosshair',  Icon: MousePointer },
  { id: 'trendline', label: 'Trend Line',           Icon: TrendingUp   },
  { id: 'brush',     label: 'Free Draw',            Icon: Pencil       },
  { id: 'rectangle', label: 'Rectangle',            Icon: Square       },
  { id: 'fib',       label: 'Fib Retracement',      Icon: BarChart2    },
  { id: 'text',      label: 'Text Label',            Icon: Type         },
];

export default function FloatingToolbar({ activeTool, setActiveTool, onClearDrawings }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-row items-start h-full select-none z-40">

      {/* ── Collapsible panel ── */}
      {open && (
        <div className="flex flex-col items-center gap-1 w-10 py-2 bg-[#0a0e1a]/90 backdrop-blur-md border-r border-white/[0.06]">
          {tools.map(({ id, label, Icon }) => {
            const active = activeTool === id;
            return (
              <button
                key={id}
                title={label}
                onClick={() => setActiveTool(id)}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer
                  ${active
                    ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/35 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                    : 'text-[#4a5a7a] hover:text-[#a0b0cc] hover:bg-white/[0.05] border border-transparent'}
                `}
              >
                <Icon size={14} strokeWidth={1.8} />
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-6 h-px bg-white/10 my-0.5" />

          {/* Eraser / clear */}
          <button
            title="Clear All Drawings"
            onClick={() => { onClearDrawings?.(); setActiveTool('cursor'); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#ff4d6d]/70 hover:text-[#ff4d6d] hover:bg-[#ff4d6d]/10 border border-transparent transition-all duration-150 cursor-pointer"
          >
            <Eraser size={14} strokeWidth={1.8} />
          </button>
        </div>
      )}

      {/* ── Toggle tab ── */}
      <button
        onClick={() => setOpen(v => !v)}
        title={open ? 'Collapse toolbar' : 'Expand toolbar'}
        className="flex items-center justify-center w-3.5 self-stretch bg-[#0a0e1a]/70 border-r border-white/[0.06] text-[#3a4a6a] hover:text-[#00d4ff] hover:bg-[#00d4ff]/5 transition-all duration-150 cursor-pointer"
      >
        {open ? <ChevronLeft size={9} /> : <ChevronRight size={9} />}
      </button>

    </div>
  );
}
