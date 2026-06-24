"use client";

import { Fragment } from "@/lib/types";

interface Props {
  fragments: Fragment[];
  currentId: number;
  onSelect: (f: Fragment) => void;
}

const NODES = [
  { id: 1, x: 50, y: 20 }, { id: 2, x: 90, y: 50 }, { id: 3, x: 50, y: 80 },
  { id: 4, x: 90, y: 110 }, { id: 5, x: 50, y: 140 },
  { id: 6, x: 20, y: 175 }, { id: 7, x: 80, y: 175 },
  { id: 8, x: 20, y: 210 }, { id: 9, x: 80, y: 210 },
  { id: 10, x: 50, y: 245 },
  { id: 11, x: 20, y: 280 }, { id: 12, x: 80, y: 280 },
  { id: 13, x: 50, y: 315 }, { id: 14, x: 50, y: 350 }, { id: 15, x: 50, y: 385 },
];

const EDGES: [number, number][] = [
  [1,2],[2,3],[3,4],[4,5],[5,6],[5,7],[6,8],[7,9],[8,10],[9,10],[10,11],[10,12],[11,13],[12,13],[13,14],[14,15],
];

export default function PathMap({ fragments, currentId, onSelect }: Props) {
  return (
    <div className="w-full flex justify-center">
      <svg viewBox="-5 0 115 405" className="w-full max-w-[140px]">
        {EDGES.map(([a, b]) => {
          const na = NODES[a - 1], nb = NODES[b - 1];
          const visited = fragments.some((f) => f.id === a) && fragments.some((f) => f.id === b);
          return (
            <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={visited ? "#c4923a" : "#1a1a1a"} strokeWidth={visited ? 1.5 : 0.8}
              opacity={visited ? 0.6 : 0.3}
            />
          );
        })}
        {NODES.map((node) => {
          const frag = fragments.find((f) => f.id === node.id);
          const isCurrent = node.id === currentId;
          const isVisited = !!frag;
          const isFuture = !frag && node.id > currentId;
          const isBranch = node.id === 5 || node.id === 10;
          const r = isBranch ? 9 : 7;

          return (
            <g key={node.id}
              onClick={() => frag && onSelect(frag)}
              className={isVisited ? "cursor-pointer" : ""}
            >
              {isCurrent && (
                <circle cx={node.x} cy={node.y} r={r + 4}
                  fill="none" stroke="#8b0000" strokeWidth={1} opacity={0.4}>
                  <animate attributeName="r" values={`${r + 2};${r + 6};${r + 2}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={node.x} cy={node.y} r={r}
                fill={isCurrent ? "#8b0000" : isVisited ? "#0a0a0a" : "#080808"}
                stroke={isCurrent ? "#ff2222" : isVisited ? "#c4923a" : "#1a1a1a"}
                strokeWidth={isCurrent ? 2 : 1}
              />
              {isVisited && !isCurrent && (
                <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fill="#c4923a" fontSize="6" fontFamily="monospace" opacity={0.7}>✓</text>
              )}
              {isFuture && (
                <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fill="#333" fontSize="5" fontFamily="monospace">
                  {isBranch ? "Y" : "·"}
                </text>
              )}
              <text x={node.x} y={node.y + r + 10} textAnchor="middle"
                fill={isCurrent ? "#ff4444" : isVisited ? "#c4923a66" : "#1a1a1a"}
                fontSize="6" fontFamily="monospace">
                {String(node.id).padStart(2, "0")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
