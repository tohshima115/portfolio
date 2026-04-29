/**
 * 等高線背景用シェーダ。
 *
 * fullscreen quad に Value ノイズ + fBm の高さ場を描き、
 * 等高線 (iso-line) のみを fract+fwidth でアンチエイリアスして抜き出す。
 * 重さの主因は fBm のオクターブ数 × ピクセル数。
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
uniform float uLineWidth;
uniform float uBands;
uniform float uScale;
uniform float uSpeed;

varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise2(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUv;
    uv.x *= uResolution.x / uResolution.y;

    vec2 q = uv * uScale + vec2(uTime * uSpeed, uTime * uSpeed * 0.6);
    float h = fbm(q);

    float band = h * uBands;
    float d    = abs(fract(band) - 0.5);
    float aa   = fwidth(band);
    float line = 1.0 - smoothstep(uLineWidth - aa, uLineWidth + aa, d);

    gl_FragColor = vec4(uLineColor, line * uOpacity);
}
`;
