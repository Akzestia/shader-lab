
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

// Qt expects this UBO layout when only a fragment shader is provided.
layout(std140, binding = 0) uniform qt_uniforms {
    mat4 qt_Matrix; // required by Qt
    float qt_Opacity; // required by Qt

    // --- your uniforms ---
    int u_shape; // 0=RoundedRect, 1=Circle, 2=Hex, 3=MaskTexture
    float u_cornerRadius; // px
    float u_borderWidth; // px
    float u_feather; // px
    float u_borderGlow; // px (0 disables)

    vec4 u_borderColor; // RGBA
    vec4 u_borderGlowColor; // RGBA
    vec2 u_size; // item size in px

    int u_useMask; // 0/1 (use int, not bool, in UBOs)
};

// Samplers must declare explicit bindings with qsb/RHI
layout(binding = 1) uniform sampler2D u_source;
layout(binding = 2) uniform sampler2D u_mask;

// --------------------- helpers ---------------------
vec2 toPixel(vec2 uv) {
    return (uv * u_size) - 0.5 * u_size;
}

// Rounded rectangle SDF
float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - (b - vec2(r));
    return length(max(q, vec2(0.0))) - r;
}

// Circle SDF
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

// Regular hexagon SDF (flat top)
float sdHex(vec2 p, float r) {
    const vec3 k = vec3(0.8660254, 0.5, 0.57735);
    p = abs(p);
    return max(dot(p, vec2(k.x, k.y)), p.x) - r;
}

float shapeSDF(vec2 p) {
    vec2 halfSize = 0.5 * u_size;

    if (u_shape == 0) {
        float r = clamp(u_cornerRadius, 0.0, min(halfSize.x, halfSize.y));
        return sdRoundedRect(p, halfSize, r);
    } else if (u_shape == 1) {
        float r = min(halfSize.x, halfSize.y);
        return sdCircle(p, r);
    } else if (u_shape == 2) {
        float r = min(halfSize.x, halfSize.y);
        return sdHex(p, r);
    } else {
        // Mask texture: white=inside, black=outside
        float mask = (u_useMask != 0) ? texture(u_mask, qt_TexCoord0).r : 0.0;
        // Pseudo-distance around the 0.5 edge; scaled to pixel-ish units
        return (0.5 - mask) * min(u_size.x, u_size.y);
    }
}

void main() {
    vec2 uv = vec2(qt_TexCoord0.x, 1.0 - qt_TexCoord0.y);
    vec4 vid = texture(u_source, uv);

    vec2 p = toPixel(qt_TexCoord0);
    float d = shapeSDF(p);

    // Feather tweak for mask mode
    float f = max((u_shape == 3) ? max(u_feather, 1.0) : u_feather, 0.0001);

    // Inside fill
    float fill = 1.0 - smoothstep(0.0, f, d);

    // Border band
    float bw = max(u_borderWidth, 0.0);
    float border = 1.0 - smoothstep(bw, bw + f, abs(d));

    // Outer glow (outside only)
    float gw = max(u_borderGlow, 0.0);
    float glow = 0.0;
    if (gw > 0.0) {
        glow = 1.0 - smoothstep(0.0, gw, d);
        glow *= step(0.0, d);
    }

    // Composite: glow (behind) -> video fill -> border (over)
    vec3 col = vec3(0.0);
    float a = 0.0;

    float glowA = u_borderGlowColor.a * glow;
    col = mix(col, u_borderGlowColor.rgb, glowA);
    a = glowA + a * (1.0 - glowA);

    col = mix(col, vid.rgb, fill);
    a = fill + a * (1.0 - fill);

    float borderA = u_borderColor.a * border;
    col = mix(col, u_borderColor.rgb, borderA);
    a = borderA + a * (1.0 - borderA);

    fragColor = vec4(col, a) * qt_Opacity;
}
