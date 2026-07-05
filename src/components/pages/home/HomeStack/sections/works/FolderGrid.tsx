import { useMemo } from 'react';
import type { GridConfig } from './constants';
import {
    STACK_LAYERS,
    STACK_OFFSET_X_PX,
    STACK_OFFSET_Y_PX,
    LAYER_SCALE_X,
    LAYER_SCALE_Y,
    MID_DELAY_COL_STAGGER,
    MID_DELAY_ROW_STAGGER,
} from './constants';

// public/folder.svg と同じパスを inline。fill: currentColor で theme color を載せる。
const FolderShape: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 709 567"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
    >
        <g transform="matrix(1,0,0,1,-1228.346457,-1086.562999)">
            <path
                fill="currentColor"
                d="M1228.346,1653.543L1937.008,1653.543L1937.008,1181.102C1937.008,1181.102 1678.894,1180.896 1606.299,1181.102C1487.818,1181.44 1535.151,1086.851 1417.323,1086.614C1359.999,1086.499 1228.346,1086.614 1228.346,1086.614L1228.346,1653.543Z"
            />
        </g>
    </svg>
);

interface FolderTile {
    row: number;
    col: number;
    fromLeft: boolean;
    delay: number;
}

interface FolderTileElProps {
    tile: FolderTile;
    config: GridConfig;
    centerCol: number;
    centerRow: number;
    rowTopVh: number;
    isMid: boolean;
    midDelay: number;
}

const FolderTileEl: React.FC<FolderTileElProps> = ({
    tile,
    config,
    centerCol,
    centerRow,
    rowTopVh,
    isMid,
    midDelay,
}) => {
    const layerInsetXPct = ((1 - LAYER_SCALE_X) / 2) * 100;
    const layerInsetYPct = ((1 - LAYER_SCALE_Y) / 2) * 100;

    const finalDirX = centerCol === 0 ? 0 : (centerCol - tile.col) / centerCol;
    const finalDirY = centerRow === 0 ? 0 : (centerRow - tile.row) / centerRow;
    const initialDirX = 1;
    const initialDirY = 0;

    const styleVars: React.CSSProperties = {
        ['--init-dx' as string]: initialDirX,
        ['--init-dy' as string]: initialDirY,
        ['--final-dx' as string]: finalDirX,
        ['--final-dy' as string]: finalDirY,
        ['--travel' as string]: 0,
    };

    return (
        <div
            data-folder-tile
            data-from-left={tile.fromLeft ? '1' : '0'}
            data-tile-delay={tile.delay}
            data-mid={isMid ? '1' : '0'}
            data-mid-delay={midDelay}
            data-tile-col={tile.col}
            data-tile-row={tile.row}
            style={{
                position: 'absolute',
                left: `${tile.col * config.tileWVw}vw`,
                top: `${rowTopVh}vh`,
                width: `${config.tileWVw}vw`,
                height: `${config.tileHVh}vh`,
                color: 'var(--color-foreground)',
                lineHeight: 0,
                willChange: 'transform',
                ...styleVars,
            }}
        >
            {Array.from({ length: STACK_LAYERS }).map((_, layer) => {
                const t = layer - (STACK_LAYERS - 1) / 2;
                const factorX = t * STACK_OFFSET_X_PX;
                const factorY = t * STACK_OFFSET_Y_PX;
                return (
                    <div
                        key={layer}
                        style={{
                            position: 'absolute',
                            top: `${layerInsetYPct}%`,
                            left: `${layerInsetXPct}%`,
                            width: `${LAYER_SCALE_X * 100}%`,
                            height: `${LAYER_SCALE_Y * 100}%`,
                            transform: `translate(
                                calc(((1 - var(--travel)) * var(--init-dx) + var(--travel) * var(--final-dx)) * ${factorX}px),
                                calc(((1 - var(--travel)) * var(--init-dy) + var(--travel) * var(--final-dy)) * ${factorY}px)
                            )`,
                            zIndex: layer,
                        }}
                    >
                        <FolderShape className="block w-full h-full" />
                    </div>
                );
            })}
        </div>
    );
};

interface FolderGridProps {
    config: GridConfig;
}

export const FolderGrid: React.FC<FolderGridProps> = ({ config }) => {
    const { cols, rows, tileWVw: _tileW, tileHVh, rowCompressedStrideVh, edgeGapExtraVh, hiddenLeftCols } = config;
    const centerCol = (cols - 1) / 2;
    const centerRow = (rows - 1) / 2;
    const edgeStrideVh = tileHVh + edgeGapExtraVh;

    const computeRowTopVh = (row: number): number => {
        if (row === 0) return 0;
        if (row === rows - 1) {
            return edgeStrideVh + (rows - 3) * rowCompressedStrideVh + edgeStrideVh;
        }
        return edgeStrideVh + (row - 1) * rowCompressedStrideVh;
    };

    const tiles = useMemo<(FolderTile & {
        rowTopVh: number;
        isMid: boolean;
        midDelay: number;
    })[]>(() => {
        const arr: (FolderTile & { rowTopVh: number; isMid: boolean; midDelay: number })[] = [];

        const edgeStride = tileHVh + edgeGapExtraVh;
        const _centerCol = (cols - 1) / 2;
        const _centerRow = (rows - 1) / 2;

        const computeRowTop = (row: number): number => {
            if (row === 0) return 0;
            if (row === rows - 1) return edgeStride + (rows - 3) * rowCompressedStrideVh + edgeStride;
            return edgeStride + (row - 1) * rowCompressedStrideVh;
        };

        for (let r = 0; r < rows; r++) {
            for (let h = hiddenLeftCols; h >= 1; h--) {
                const isMid = r >= 1 && r <= rows - 2;
                const midDelay = isMid
                    ? Math.max(0, (-h + 1) / cols) * MID_DELAY_COL_STAGGER
                      + ((r - 1) / Math.max(1, rows - 3)) * MID_DELAY_ROW_STAGGER
                    : 0;
                arr.push({
                    row: r,
                    col: -h,
                    fromLeft: true,
                    delay: 1.0,
                    rowTopVh: computeRowTop(r),
                    isMid,
                    midDelay,
                });
            }
            for (let c = 0; c < cols; c++) {
                const colInverted = cols - 1 - c;
                const rowJitter = (r / rows) * 0.15;
                const delay = colInverted / Math.max(1, cols - 1) + rowJitter;
                const isMid = r >= 1 && r <= rows - 2;
                const midDelay = isMid
                    ? Math.max(0, (c + 1) / cols) * MID_DELAY_COL_STAGGER
                      + ((r - 1) / Math.max(1, rows - 3)) * MID_DELAY_ROW_STAGGER
                    : 0;
                arr.push({
                    row: r,
                    col: c,
                    fromLeft: true,
                    delay: delay / 1.15,
                    rowTopVh: computeRowTop(r),
                    isMid,
                    midDelay,
                });
            }
        }
        // suppress unused warnings
        void _centerCol;
        void _centerRow;
        return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cols, rows, tileHVh, rowCompressedStrideVh, edgeGapExtraVh, hiddenLeftCols]);

    void computeRowTopVh; // used above; suppress lint

    return (
        <div
            aria-hidden
            className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
            style={{ perspective: '1500px', perspectiveOrigin: '50% 50%' }}
        >
            {tiles.map((t, i) => (
                <FolderTileEl
                    key={`tile-${i}`}
                    tile={t}
                    config={config}
                    centerCol={centerCol}
                    centerRow={centerRow}
                    rowTopVh={t.rowTopVh}
                    isMid={t.isMid}
                    midDelay={t.midDelay}
                />
            ))}
        </div>
    );
};
