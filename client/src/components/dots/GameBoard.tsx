import React, { useState } from 'react';
import { DotsGameState } from '../../../../shared/types';

interface GameBoardProps {
  dotsState: DotsGameState;
  myPlayerId: string;
  playerIds: string[];
  playerNames: Record<string, string>;
  onMakeMove: (type: 'h' | 'v', row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  dotsState,
  myPlayerId,
  playerIds,
  playerNames,
  onMakeMove,
}) => {
  const [hoveredLine, setHoveredLine] = useState<{ type: 'h' | 'v'; row: number; col: number } | null>(null);

  const isMyTurn = dotsState.currentTurn === myPlayerId;
  const p1Id = playerIds[0] || '';
  const p2Id = playerIds[1] || '';

  const CANVAS_SIZE = 400;
  const PADDING = 36;
  const GRID_SPAN = CANVAS_SIZE - PADDING * 2;
  const STEP = GRID_SPAN / 4;

  const getDotCoords = (r: number, c: number) => ({
    x: PADDING + c * STEP,
    y: PADDING + r * STEP,
  });

  const getLineColor = (ownerId: string | null) => {
    if (!ownerId) return null;
    if (ownerId === p1Id) return '#38bdf8'; // Sky blue for player 1
    if (ownerId === p2Id) return '#fb923c'; // Amber orange for player 2
    return '#94a3b8';
  };

  const getBoxFill = (ownerId: string | null) => {
    if (!ownerId) return 'none';
    if (ownerId === p1Id) return 'rgba(56, 189, 248, 0.18)';
    if (ownerId === p2Id) return 'rgba(251, 146, 60, 0.18)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  const getBoxInitial = (ownerId: string | null) => {
    if (!ownerId) return '';
    const name = playerNames[ownerId] || 'P';
    return name.charAt(0).toUpperCase();
  };

  const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
    if (!isMyTurn) return;
    if (type === 'h' && dotsState.horizontalLines[r][c].owner !== null) return;
    if (type === 'v' && dotsState.verticalLines[r][c].owner !== null) return;
    onMakeMove(type, r, c);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex items-center justify-center p-2 sm:p-4">
      <div className="glass-panel w-full aspect-square rounded-3xl p-3 sm:p-5 relative shadow-2xl flex items-center justify-center border border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <svg
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          className="w-full h-full select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Box Fills */}
          {dotsState.boxes.map((row, r) =>
            row.map((box, c) => {
              const x = PADDING + c * STEP;
              const y = PADDING + r * STEP;
              const fill = getBoxFill(box.owner);
              const initial = getBoxInitial(box.owner);
              const isP1 = box.owner === p1Id;

              return (
                <g key={`box-${r}-${c}`}>
                  {box.owner && (
                    <>
                      <rect
                        x={x + 4}
                        y={y + 4}
                        width={STEP - 8}
                        height={STEP - 8}
                        rx={10}
                        fill={fill}
                        stroke={isP1 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(251, 146, 60, 0.3)'}
                        strokeWidth="1"
                        className="transition-all duration-500 ease-out"
                      />
                      <text
                        x={x + STEP / 2}
                        y={y + STEP / 2 + 6}
                        textAnchor="middle"
                        fill={isP1 ? '#7dd3fc' : '#ffedd5'}
                        fontSize="22"
                        fontWeight="800"
                        fontFamily="sans-serif"
                        className="pointer-events-none opacity-90 select-none"
                      >
                        {initial}
                      </text>
                    </>
                  )}
                </g>
              );
            })
          )}

          {/* Horizontal Lines */}
          {dotsState.horizontalLines.map((row, r) =>
            row.map((line, c) => {
              const start = getDotCoords(r, c);
              const end = getDotCoords(r, c + 1);
              const drawnColor = getLineColor(line.owner);
              const isHovered =
                isMyTurn &&
                line.owner === null &&
                hoveredLine?.type === 'h' &&
                hoveredLine.row === r &&
                hoveredLine.col === c;

              return (
                <g key={`h-${r}-${c}`}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={
                      line.owner
                        ? drawnColor!
                        : isHovered
                        ? myPlayerId === p1Id
                          ? 'rgba(56, 189, 248, 0.5)'
                          : 'rgba(251, 146, 60, 0.5)'
                        : 'rgba(255, 255, 255, 0.08)'
                    }
                    strokeWidth={line.owner ? '5' : isHovered ? '4' : '2'}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                  {line.owner === null && (
                    <rect
                      x={start.x + 6}
                      y={start.y - 14}
                      width={STEP - 12}
                      height={28}
                      fill="transparent"
                      className={isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed'}
                      onMouseEnter={() => setHoveredLine({ type: 'h', row: r, col: c })}
                      onMouseLeave={() => setHoveredLine(null)}
                      onClick={() => handleLineClick('h', r, c)}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Vertical Lines */}
          {dotsState.verticalLines.map((row, r) =>
            row.map((line, c) => {
              const start = getDotCoords(r, c);
              const end = getDotCoords(r + 1, c);
              const drawnColor = getLineColor(line.owner);
              const isHovered =
                isMyTurn &&
                line.owner === null &&
                hoveredLine?.type === 'v' &&
                hoveredLine.row === r &&
                hoveredLine.col === c;

              return (
                <g key={`v-${r}-${c}`}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={
                      line.owner
                        ? drawnColor!
                        : isHovered
                        ? myPlayerId === p1Id
                          ? 'rgba(56, 189, 248, 0.5)'
                          : 'rgba(251, 146, 60, 0.5)'
                        : 'rgba(255, 255, 255, 0.08)'
                    }
                    strokeWidth={line.owner ? '5' : isHovered ? '4' : '2'}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                  {line.owner === null && (
                    <rect
                      x={start.x - 14}
                      y={start.y + 6}
                      width={28}
                      height={STEP - 12}
                      fill="transparent"
                      className={isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed'}
                      onMouseEnter={() => setHoveredLine({ type: 'v', row: r, col: c })}
                      onMouseLeave={() => setHoveredLine(null)}
                      onClick={() => handleLineClick('v', r, c)}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Grid Dots */}
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 5 }).map((_, c) => {
              const { x, y } = getDotCoords(r, c);
              return (
                <g key={`dot-${r}-${c}`}>
                  <circle cx={x} cy={y} r="5.5" fill="rgba(0, 0, 0, 0.4)" />
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#f8fafc"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1"
                  />
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};
