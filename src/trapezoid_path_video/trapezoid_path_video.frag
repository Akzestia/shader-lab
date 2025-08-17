
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

// Qt RHI expects this UBO layout when only a fragment shader is provided.
layout(std140, binding = 0) uniform qt_uniforms {
    mat4 qt_Matrix; // required by Qt
    float qt_Opacity; // required by Qt

    // ---- Shape & render params ----
    int u_shape; // 0 = Trapezoid, 1 = PathMask
    float u_trapTop; // fraction of half-width (0..1)
    float u_trapBottom; // fraction of half-width (0..1)
    float u_rotation; // radians, rotate the shape in 2D

    float u_borderWidth; // px
    float u_feather; // px
    float u_borderGlow; // px (0 disables)

    vec4 u_borderColor; // RGBA
    vec4 u_borderGlowColor; // RGBA
    vec2 u_size; // item size in px

    int u_clipMode; // 0=clip, 1=border-only, 2=ring-only
    int u_useMask; // 0/1 (for PathMask)
};

// Samplers need explicit bindings with qsb/RHI
layout(binding = 1) uniform sampler2D u_source; // video
layout(binding = 2) uniform sampler2D u_mask; // path mask (white=inside)

// --------------------- helpers ---------------------
vec2 toPixel(vec2 uv) {
    return (uv * u_size) - 0.5 * u_size;
}

// 2D rotation
vec2 rot(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c) * p;
}

// Inigo Quilez-style trapezoid SDF (axis-aligned, centered)
// r1 = top half-width, r2 = bottom half-width, h = half-height
float sdTrapezoid(vec2 p, float r1, float r2, float h) {
    p.x = abs(p.x);
    vec2 k1 = vec2(r2, h);
    vec2 k2 = vec2(r2 - r1, 2.0 * h);
    vec2 ca = vec2(p.x - min(p.x, (p.y < 0.0) ? r1 : r2), abs(p.y) - h);
    vec2 cb = ca - k1 + k2 * clamp(dot(k1 - ca, k2) / dot(k2, k2), 0.0, 1.0);
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

float shapeSDF(vec2 p) {
    vec2 halfSize = 0.5 * u_size;
    p = rot(p, u_rotation);

    if (u_shape == 0) {
        // Trapezoid: full height = u_size.y
        float h = halfSize.y;
        float r1 = clamp(u_trapTop, 0.0, 1.0) * halfSize.x;
        float r2 = clamp(u_trapBottom, 0.0, 1.0) * halfSize.x;
        return sdTrapezoid(p, r1, r2, h);
    } else {
        // Path mask: white=inside, black=outside; build pseudo-distance around 0.5
        float mask = (u_useMask != 0) ? texture(u_mask, qt_TexCoord0).r : 0.0;
        return (0.5 - mask) * min(u_size.x, u_size.y);
    }
}

void main() {
    vec2 p = toPixel(qt_TexCoord0);
    float d = shapeSDF(p);

    // Feather (wider for mask pseudo-distance)
    float f = max((u_shape == 1) ? max(u_feather, 1.0) : u_feather, 0.0001);

    // Masks
    float fill = 1.0 - smoothstep(0.0, f, d);
    float bw = max(u_borderWidth, 0.0);
    float border = 1.0 - smoothstep(bw, bw + f, abs(d));

    float gw = max(u_borderGlow, 0.0);
    float glow = (gw > 0.0) ? (1.0 - smoothstep(0.0, gw, d)) * step(0.0, d) : 0.0;

    // Decide how much video shows
    float fillMask =
        (u_clipMode == 0) ? fill :
        (u_clipMode == 1) ? 1.0 : 0.0;

    // Sample video (UV comes from QML; flip handled there if needed)
    vec4 vid = texture(u_source, qt_TexCoord0);

    // Composite: glow (behind) -> video -> border
    vec3 col = vec3(0.0);
    float a = 0.0;

    float glowA = u_borderGlowColor.a * glow;
    col = mix(col, u_borderGlowColor.rgb, glowA);
    a = glowA + a * (1.0 - glowA);

    col = mix(col, vid.rgb, fillMask);
    a = fillMask + a * (1.0 - fillMask);

    float borderA = u_borderColor.a * border;
    col = mix(col, u_borderColor.rgb, borderA);
    a = borderA + a * (1.0 - borderA);

    fragColor = vec4(col, a) * qt_Opacity;
}
