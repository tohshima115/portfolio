import { useMemo } from 'react';
import {
    FOLDER_COLS,
    FOLDER_ROWS,
    HIDDEN_LEFT_COLS,
    TILE_W_VW,
    TILE_H_VH,
    ROW_COMPRESSED_STRIDE_VH,
    EDGE_GAP_EXTRA_VH,
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
    /** 横入りの方向。true=画面左から、false=画面右から */
    fromLeft: boolean;
    /** stagger 用 (0..1) */
    delay: number;
}

// 1 stack = 4 枚の folder を radial に offset させて重ねる。
// stack の (col, row) と grid center を基準に中心からの方向ベクトルを正規化 → 各層の
// offset がその方向に沿って動く。CSS var `--travel` (0..1) を gsap で animate し、初期
// (=左から流入のため全 stack 右向き) → 最終 (= radial) を補間。これで移動中も front が
// viewport center を向き続ける。
const CENTER_COL = (FOLDER_COLS - 1) / 2;
const CENTER_ROW = (FOLDER_ROWS - 1) / 2;

const FolderTileEl: React.FC<{ tile: FolderTile }> = ({ tile }) => {
    const layerInsetXPct = ((1 - LAYER_SCALE_X) / 2) * 100;
    const layerInsetYPct = ((1 - LAYER_SCALE_Y) / 2) * 100;

    // 最終 (settled) の中心方向ベクトル (-1..+1)
    const finalDirX = (CENTER_COL - tile.col) / CENTER_COL;
    const finalDirY = (CENTER_ROW - tile.row) / CENTER_ROW;
    // 初期方向: 全 stack は左から入るので「中心向き = +x」一律
    const initialDirX = 1;
    const initialDirY = 0;

    // CSS 変数で渡し、layer の transform で var を補間する
    const styleVars: React.CSSProperties = {
        ['--init-dx' as string]: initialDirX,
        ['--init-dy' as string]: initialDirY,
        ['--final-dx' as string]: finalDirX,
        ['--final-dy' as string]: finalDirY,
        ['--travel' as string]: 0,
    };

    // row 0 → row 1 と row N-2 → row N-1 は (TILE_H + EDGE_GAP_EXTRA) で広めに。
    // 中段 row 1..N-2 間は圧縮 stride で詰めて重ねる。
    const edgeStrideVh = TILE_H_VH + EDGE_GAP_EXTRA_VH;
    const rowTopVh = (() => {
        if (tile.row === 0) return 0;
        if (tile.row === FOLDER_ROWS - 1) {
            return (
                edgeStrideVh +
                (FOLDER_ROWS - 3) * ROW_COMPRESSED_STRIDE_VH +
                edgeStrideVh
            );
        }
        return edgeStrideVh + (tile.row - 1) * ROW_COMPRESSED_STRIDE_VH;
    })();

    // 中段行 (row 1..N-2) の stack を Phase D で shrink して画面中央に WORKS reveal
    // 用の横帯を作る。発火順は col 左→右、同 col 内では row 上→下。
    const isMid = tile.row >= 1 && tile.row <= FOLDER_ROWS - 2;
    // col stagger: (col + 1) / FOLDER_COLS を 0..1 に正規化 (col -2..-4 は負になるので 0 にクランプ)。
    // row stagger: row 1..(N-2) を 0..1 に正規化。
    const midDelay = isMid
        ? Math.max(0, (tile.col + 1) / FOLDER_COLS) * MID_DELAY_COL_STAGGER
        + ((tile.row - 1) / Math.max(1, FOLDER_ROWS - 3)) * MID_DELAY_ROW_STAGGER
        : 0;

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
                left: `${tile.col * TILE_W_VW}vw`,
                top: `${rowTopVh}vh`,
                width: `${TILE_W_VW}vw`,
                height: `${TILE_H_VH}vh`,
                color: 'var(--color-foreground)',
                lineHeight: 0,
                willChange: 'transform',
                ...styleVars,
            }}
        >
            {Array.from({ length: STACK_LAYERS }).map((_, layer) => {
                // t : -1.5, -0.5, 0.5, 1.5 (back → front)
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
                            // calc 内で var(--travel) を使い、init と final を線形補間
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

// FolderGrid: 全 tile を z-20 absolute 領域に並べる。
// FOLDER_COLS × FOLDER_ROWS に加え、左外に hidden col -1 を 1 列追加 (Phase D の右
// シフトで新 col 0 へ滑り込む)。
export const FolderGrid: React.FC = () => {
    const tiles = useMemo<FolderTile[]>(() => {
        const arr: FolderTile[] = [];
        for (let r = 0; r < FOLDER_ROWS; r++) {
            // 左外の hidden cols (col -HIDDEN_LEFT_COLS .. -1)。
            // Phase D / Phase F の右シフトに合わせて 1 列ずつ visible 領域に滑り込む。
            for (let h = HIDDEN_LEFT_COLS; h >= 1; h--) {
                arr.push({
                    row: r,
                    col: -h,
                    fromLeft: true,
                    delay: 1.0, // waterfall は最後尾扱い (見た目には影響しない)
                });
            }
            for (let c = 0; c < FOLDER_COLS; c++) {
                // 全 folder は左から入場。最終的に右に着地する (= col 大) ものほど早く
                // 出発し、画面を横切って奥に積まれていく waterfall 順。
                // col 0 (一番左の最終位置) が最後に滑り込む。
                const colInverted = FOLDER_COLS - 1 - c;
                const rowJitter = (r / FOLDER_ROWS) * 0.15;
                const delay =
                    colInverted / Math.max(1, FOLDER_COLS - 1) + rowJitter;
                arr.push({
                    row: r,
                    col: c,
                    fromLeft: true,
                    delay: delay / 1.15,
                });
            }
        }
        return arr;
    }, []);

    return (
        <div
            aria-hidden
            className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
            // 各 tile の rotateX を 3D で見せるための perspective。値が小さいほど奥行きが誇張。
            // perspectiveOrigin を 50% 50% (= viewport 中央) に固定して、vanishing point が
            // 右シフトに引きずられず常に画面中央 (上下方向の axis) に来るようにする。
            style={{ perspective: '1500px', perspectiveOrigin: '50% 50%' }}
        >
            {tiles.map((t, i) => (
                <FolderTileEl key={`tile-${i}`} tile={t} />
            ))}
        </div>
    );
};
