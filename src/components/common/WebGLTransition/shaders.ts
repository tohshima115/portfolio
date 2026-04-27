/**
 * WebGL ページ遷移用シェーダ。
 *
 * 仮実装: 上から黒い帯が降りてきて画面を覆い (uCover 0→1)、
 * その後同じく上から黒帯が引き上げられて新ページを露出する (uReveal 0→1)。
 * 表現自体は後から差し替える前提なので、最低限の動作確認用。
 */

export const transitionVertex = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const transitionFragment = /* glsl */ `
precision highp float;

uniform float uCover;   // 0 = なし, 1 = 全画面黒
uniform float uReveal;  // 0 = 黒のまま, 1 = 黒が完全に退いた
uniform vec3  uColor;   // 帯の色 (RGB)

varying vec2 vUv;

void main() {
    // 画面の上端から覆う / 退ける形状。
    //   黒い領域: vUv.y > 1 - uCover かつ vUv.y < 1 - uReveal
    float coverEdge  = 1.0 - uCover;
    float revealEdge = 1.0 - uReveal;

    if (vUv.y > coverEdge && vUv.y < revealEdge) {
        gl_FragColor = vec4(uColor, 1.0);
    } else {
        discard;
    }
}
`;
