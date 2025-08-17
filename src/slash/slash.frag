
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform qt_uniforms {
    mat4 qt_Matrix;
    float qt_Opacity;

    vec2 u_resolution; // pixels
    float u_time; // seconds
    float u_intensity; // overall gain (0..2)
    float u_masked; // 1 = conform to source alpha, 0 = free draw

    vec3 u_coreC;
    vec3 u_glowC;
    vec3 u_lightC;
};

// When used as layer.effect, this is the item's premultiplied texture
layout(binding = 1) uniform sampler2D source;

/* ---------- noise & helpers (unchanged) ---------- */
#define MOD3 vec3(0.1031, 0.11369, 0.13787)

vec3 hash33(vec3 p3) {
    p3 = fract(p3 * MOD3);
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

float simplex_noise(vec3 p) {
    const float K1 = 0.333333333, K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - 1.0 * K2);
    vec3 d2 = d0 - (i2 - 2.0 * K2);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);
    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
    return dot(vec4(31.316), n);
}

vec2 noise23(vec3 x) {
    return vec2(simplex_noise(x), simplex_noise(x + vec3(1.0)));
}
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}
float opSmoothSubtraction(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d2, -d1, h) + k * h * (1.0 - h);
}
vec2 hash21(float p) {
    vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

float erode(float d, float size, vec2 p) {
    for (int i = 1; i < 5; ++i) {
        float fi = float(i);
        vec2 s = vec2(size);
        vec2 q = p + hash21(fi) * size * 10.0;
        q = q - s * round(q / s);
        float d2 = sdCircle(q, size * 0.2);
        d = opSmoothSubtraction(d2, d, 0.02);
    }
    return d;
}

vec3 mapSlash(vec2 p, float w, float time, float seed) {
    p += noise23(vec3(p * 0.5, time * 0.2 + seed)).xy * 0.4;
    p += noise23(vec3(p, time * 0.2 + seed)).xy * 0.2;
    p += noise23(vec3(p * 5.0, time * 0.2 + seed)).xy * 0.05;
    vec2 uv = p * vec2(1.0, 1.0 / w);
    uv.x = mod(uv.x + time * 3.0 + seed * 0.5, 4.0) - 0.5;
    float d = sdCircle(uv, 0.5);
    return vec3(p, d);
}

/* ---------------- main ---------------- */
void main() {
    vec2 R = u_resolution;
    vec2 uv = (qt_TexCoord0 * R) / max(R, vec2(1.0));
    uv = uv * 2.0 - 1.0;

    vec3 col = vec3(0.0);

    for (int i = 0; i < 3; ++i) {
        float seed = float(i);
        float d0 = mapSlash(uv, 0.05, u_time, seed).z;
        col += u_glowC * smoothstep(-0.5, 0.0, -d0);
        col += u_coreC * smoothstep(-0.0, 0.1, -d0);

        vec3 m = mapSlash(uv, 0.2, u_time, seed);
        m.y *= 5.0;
        float dz = m.z;
        dz = erode(dz, 1.0, m.xy);
        dz = erode(dz, 0.5, m.xy);
        col += u_lightC * smoothstep(-0.0, 0.0, -dz);
    }

    // subtle exposure jitter
    vec2 h = hash21(mod(u_time * 0.001, 1.0) + 0.5);
    col *= h.x * 3.0;

    // gamma
    col = pow(col, vec3(0.4545));

    // ---- Transparent background handling ----
    // Base alpha from effect luminance (soft)
    float fxAlpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);

    // If masking (Text/Image via layer.effect), multiply by source alpha
    vec4 src = texture(source, qt_TexCoord0); // premultiplied
    float mask = mix(1.0, src.a, clamp(u_masked, 0.0, 1.0));

    float alpha = fxAlpha * mask;

    // Premultiply color, apply intensity
    vec3 outRGB = col * u_intensity * alpha;

    fragColor = vec4(outRGB, alpha) * qt_Opacity;
}
