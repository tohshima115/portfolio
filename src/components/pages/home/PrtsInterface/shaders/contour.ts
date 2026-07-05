/**
 * 等高線背景用シェーダ。
 *
 * 3D Value ノイズ + fBm の高さ場を fullscreen quad に描き、
 * 整数しきい値 (= 等高線) からの距離が 0 付近の画素だけを描画する。
 * 時間は Z 軸として 3D ノイズへ渡すため、XY 平面では平行移動せずに
 * その場で形がうねる。
 *
 * 重さの主因は fBm のオクターブ数 × ピクセル数。3D ノイズは 2D の約 2 倍。
 */

export const contourVertex = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const contourFragment = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec3  uLineColor;
uniform float uOpacity;
uniform float uLineWidth;   // 線の半値幅 (フラグメント単位)。0 で 1px AA のみ、0.5 で約 1.5px
uniform float uBands;       // 等高線本数 (高さ場 [0,1] を何分割するか)
uniform float uScale;       // 空間スケール (大きいほど密)
uniform float uSpeed;       // Z 軸方向の進行速度 (秒あたり)
uniform float uChaos;       // 0..1 進捗連動の「乱れ」係数。Hero→Statement 遷移演出用

varying vec2 vUv;

float hash3(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float n000 = hash3(i);
    float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash3(i + vec3(1.0, 1.0, 1.0));

    return mix(
        mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
        mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
        u.z
    );
}

float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    // 3 オクターブ (4 → 3 で fragment あたりのノイズサンプルが約 25% 削減)
    for (int i = 0; i < 3; i++) {
        v += a * noise3(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUv;
    uv.x *= uResolution.x / uResolution.y;

    // Z 軸 = 時間。XY は固定で形だけがうねる。
    vec3 q = vec3(uv * uScale, uTime * uSpeed);
    float h = fbm(q);

    // ★ 進捗連動の乱れ (uChaos: 0..1)
    //   - 高さ場に高速ノイズを足し、等高線が「揺れる」
    //   - 帯の数を増やして密にする
    //   - 線幅を sin(uTime*30) で振動させ「信号がブレる」感
    //   - opacity を押し上げて存在感を強める
    //   - 色を accent (黄) に少し寄せる
    float chaosNoise = noise3(q * 3.0 + vec3(0.0, 0.0, uTime * 5.0));
    h += (chaosNoise - 0.5) * uChaos * 0.4;
    float bandsCount = uBands * (1.0 + uChaos * 1.5);
    float lineW      = uLineWidth + sin(uTime * 30.0) * uChaos * 0.3;
    float opa        = uOpacity * (1.0 + uChaos * 1.2);
    vec3  col        = mix(uLineColor, vec3(1.0, 0.72, 0.0), uChaos * 0.35);

    float bands = h * bandsCount;
    float fw    = fwidth(bands);
    // 各整数しきい値からの距離。0 = しきい値の真上 (線)、0.5 = 帯の中央 (線なし)。
    float dist  = abs(fract(bands - 0.5) - 0.5);
    // fwidth ベースのアンチエイリアス。コア幅 (lineW*fw) を完全不透明にし、
    // そこから 1 fwidth 分でフェードアウト。
    float line  = 1.0 - smoothstep(lineW * fw, (lineW + 1.0) * fw, dist);

    // 画面端を放射状にフェード。アスペクト補正することでスクリーン空間で
    // 真円になる (補正なしだと横長スクリーンで横長の楕円になり、横方向の
    // フェードがビューポート端まで届かず効いて見えない問題があった)。
    vec2 maskUv = vUv - 0.5;
    maskUv.x *= uResolution.x / uResolution.y;
    float edgeDist = length(maskUv);
    float edgeMask = 1.0 - smoothstep(0.18, 0.45, edgeDist);

    gl_FragColor = vec4(col, line * opa * edgeMask);
}
`;
