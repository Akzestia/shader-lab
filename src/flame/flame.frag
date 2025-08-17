
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

// Qt expects this uniform buffer layout when only a fragment shader is provided.
layout(std140, binding = 0) uniform qt_uniforms {
    mat4 qt_Matrix; // required by Qt
    float qt_Opacity; // required by Qt

    // --- Your uniforms ---
    float u_time; // seconds
    vec2 u_resolution; // window size in px
    vec3 u_colorA; // base/orange (or your preferred)
    vec3 u_colorB; // tip/blue (or your preferred)
    float u_glowBoost; // 0.0..2.0 extra glow
};

// --------------------- original-style helpers ---------------------
float noise(vec3 p) // XT95 / Las^Mercury style
{
    vec3 i = floor(p);
    vec4 a = dot(i, vec3(1.0, 57.0, 21.0)) + vec4(0.0, 57.0, 21.0, 78.0);
    // cos(pi*x) trick
    const float PI = 3.14159265358979323846;
    vec3 f = cos((p - i) * PI) * (-0.5) + 0.5;
    a = mix(sin(cos(a) * a), sin(cos(1.0 + a) * (1.0 + a)), f.x);
    a.xy = mix(a.xz, a.yw, f.y);
    return mix(a.x, a.y, f.z);
}

float sphere(vec3 p, vec4 spr)
{
    return length(spr.xyz - p) - spr.w;
}

float flameSDF(vec3 p)
{
    // squash in Y to elongate flame vertically, base centered slightly below
    float d = sphere(p * vec3(1.0, 0.5, 1.0), vec4(0.0, -1.0, 0.0, 1.0));
    // add animated noise that strengthens with height (p.y)
    return d + (noise(p + vec3(0.0, u_time * 2.0, 0.0)) + noise(p * 3.0) * 0.5)
            * 0.25 * (p.y);
}

float sceneSDF(vec3 p)
{
    // large bounding sphere to avoid marching to infinity
    return min(100.0 - length(p), abs(flameSDF(p)));
}

vec4 raymarch(vec3 org, vec3 dir)
{
    float d = 0.0, glow = 0.0;
    const float eps = 0.02;
    vec3 p = org;
    bool glowed = false;

    // fixed-iteration sphere-trace (like Shadertoy example)
    for (int i = 0; i < 64; ++i) {
        d = sceneSDF(p) + eps;
        p += d * dir;

        // track pass-through of the negative region of the flame SDF for glow
        if (d > eps) {
            if (flameSDF(p) < 0.0)
                glowed = true;
            if (glowed)
                glow = float(i) / 64.0;
        }
    }
    return vec4(p, glow);
}

// --------------------- main ---------------------
void main()
{
    // Convert Qt's 0..1 UV to pixel coords like Shadertoy's fragCoord
    vec2 fragCoord = qt_TexCoord0 * u_resolution;
    vec2 v = -1.0 + 2.0 * fragCoord / max(u_resolution, vec2(1.0));
    v.x *= u_resolution.x / max(u_resolution.y, 1.0);

    // Camera similar to the original
    vec3 org = vec3(0.0, -2.0, 4.0);
    vec3 dir = normalize(vec3(v.x * 1.6, v.y, -1.5));

    vec4 pr = raymarch(org, dir);
    float glow = pr.w;

    // Color mix like original: y height influences the hue shift
    float yMix = pr.y * 0.02 + 0.4; // shift palette by height
    vec3 col = mix(u_colorA, u_colorB, clamp(yMix, 0.0, 1.0));

    // Glow exponent & boost -> anime-y bloom; premultiply for Qt
    float g = pow(glow * (2.0 + u_glowBoost), 4.0);
    vec3 rgb = mix(vec3(0.0), col, g);

    // Use glow as alpha; clamp, then premultiply
    float alpha = clamp(g, 0.0, 1.0);
    vec3 premul = rgb * alpha;

    fragColor = vec4(premul, alpha) * qt_Opacity;
}
