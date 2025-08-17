
#version 440

// ===== Qt ShaderEffect plumbing =====
layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform qt_uniforms {
    // Qt-required (keep order)
    mat4 qt_Matrix;
    float qt_Opacity;

    // Base uniforms
    vec2 u_resolution; // item size (px)
    float u_time; // seconds

    // Intensity / compositing
    float u_intensity; // overall gain
    float u_masked; // 1 = multiply by source alpha, 0 = ignore
    float u_alphaGain; // coverage → alpha boost

    // Colors
    vec3 u_colPrimary; // wide outer frame, sliders
    vec3 u_colSecondary; // concentric circle UI
    vec3 u_colAccent1; // small circle, bar graph
    vec3 u_colAccent2; // barcode, micro-dots
    vec3 u_colHighlight; // halo pair / fences

    // Glow controls
    vec3 u_glowTint; // tint multiplied with section color
    float u_glowStrength; // 0..3 typical
    float u_glowRadius; // sdf radius ~0.015..0.05
    float u_glowAlphaGain; // 0..2 extra alpha from glow

    // Section speeds (multiplied with time)
    float u_speedOuter; // scifiUI2
    float u_speedCircle; // circleUI (rings & their orbits)
    float u_speedSmallCircle; // smallCircleUI
    float u_speedDots; // smallCircleUI2 (micro dots)
    float u_speedBarcode; // barCode
    float u_speedGraph; // graph bars
    float u_speedSlider; // scifiUI (right slider cluster)
    float u_speedHalo; // scifiUI3Base / scifiUI3_fn
    float u_speedDigits; // tiny digits inside circleUI
    float u_speedTri; // triAnimatin (center strip)
    float u_speedRail; // randomDotLine (top middle)

    // ===== NEW: Per-section visibility toggles (0.0 off, 1.0 on) =====
    float u_showOuter; // scifiUI2 (wide frame)
    float u_showCircle; // circleUI (big concentric)
    float u_showSmallCircle; // smallCircleUI (bottom-left-ish)
    float u_showDots; // smallCircleUI2 (micro dots)
    float u_showBarcode; // barCode (top-right)
    float u_showGraph; // graph (top-left)
    float u_showSlider; // scifiUI (right slider block)
    float u_showHaloBase; // scifiUI3Base (dual halos)
    float u_showHaloFences; // scifiUI3_fn (rotating fences)
};

// Item texture when used as layer.effect
layout(binding = 1) uniform sampler2D source;

// Shadertoy-style aliases
#define iResolution vec3(u_resolution, 1.0)
#define iTime       u_time

// ===== Utils & SDF helpers =====
#define Rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
#define antialiasing(n) ((n) / max(1.0, min(iResolution.y, iResolution.x)))
#define S(d,b) smoothstep(antialiasing(1.0), b, d)
#define B(p,s) max(abs(p).x - (s).x, abs(p).y - (s).y)
#define Tri(p,s,a) max(-dot((p),vec2(cos(-a),sin(-a))),max(dot((p),vec2(cos(a),sin(a))),max(abs(p).x-(s).x,abs(p).y-(s).y)))
#define DF(a,b) length(a) * cos( mod( atan(a.y,a.x)+6.28/(b*8.0), 6.28/((b*8.0)*0.5))+(b-1.)*6.28/(b*8.0) + vec2(0,11) )

// Segments for digits
#define seg_0 0
#define seg_1 1
#define seg_2 2
#define seg_3 3
#define seg_4 4
#define seg_5 5
#define seg_6 6
#define seg_7 7
#define seg_8 8
#define seg_9 9

// ======= Forward declarations =======
float Hash21(vec2 p);

float segBase(vec2 p);
float seg0(vec2 p); float seg1(vec2 p); float seg2(vec2 p);
float seg3(vec2 p); float seg4(vec2 p); float seg5(vec2 p);
float seg6(vec2 p); float seg7(vec2 p); float seg8(vec2 p); float seg9(vec2 p);
float drawFont(vec2 p, int ch);

// NOTE: all HUD functions take local time 't' for per-section speed.
float barCode(vec2 p, float t);
float circleUI(vec2 p, float t, float tDigits);
float smallCircleUI(vec2 p, float t);
float smallCircleUI2(vec2 p, float t);
float graph(vec2 p, float t);
float scifiUI(vec2 p, float t);
float triAnimatin(vec2 p, float t);
float randomDotLine(vec2 p, float t);
float scifiUI2(vec2 p, float t);
float scifiUI3Base(vec2 p);
float scifiUI3_fn(vec2 p, float t);

// ===== Hash =====
float Hash21(vec2 p) {
    p = fract(p * vec2(234.56, 789.34));
    p += dot(p, p + 34.56);
    return fract(p.x + p.y);
}

/* ===== Digit SDFs ===== */
float segBase(vec2 p) {
    vec2 prevP = p;
    float padding = 0.05;
    float w = padding * 3.0;
    float h = padding * 5.0;

    // thin cross grid
    p = mod(p, 0.05) - 0.025;
    float thickness = 0.005;
    float gridMask = min(abs(p.x) - thickness, abs(p.y) - thickness);

    // diamond-ish enclosure
    p = prevP;
    float d = B(p, vec2(w * 0.5, h * 0.5));
    float a = radians(45.0);
    p.x = abs(p.x) - 0.1;
    p.y = abs(p.y) - 0.05;
    float d2 = dot(p, vec2(cos(a), sin(a)));
    d = max(d2, d);
    d = max(-gridMask, d);
    return d;
}
float seg0(vec2 p) {
    float d = segBase(p);
    float s = 0.03;
    float m = B(p, vec2(s, s * 2.7));
    return max(-m, d);
}
float seg1(vec2 p) {
    vec2 q = p;
    float d = segBase(p);
    float s = 0.03;
    p.x += s;
    p.y += s;
    float m = B(p, vec2(s * 2., s * 3.7));
    d = max(-m, d);
    p = q;
    p.x += s * 1.8;
    p.y -= s * 3.5;
    m = B(p, vec2(s));
    return max(-m, d);
}
float seg2(vec2 p) {
    vec2 q = p;
    float d = segBase(p);
    float s = 0.03;
    p.x += s;
    p.y -= 0.05;
    float m = B(p, vec2(s * 2., s));
    d = max(-m, d);
    p = q;
    p.x -= s;
    p.y += 0.05;
    m = B(p, vec2(s * 2., s));
    return max(-m, d);
}
float seg3(vec2 p) {
    vec2 q = p;
    float d = segBase(p);
    float s = 0.03;
    p.y = abs(p.y);
    p.x += s;
    p.y -= 0.05;
    float m = B(p, vec2(s * 2., s));
    d = max(-m, d);
    p = q;
    p.x += 0.05;
    m = B(p, vec2(s, s));
    return max(-m, d);
}
float seg4(vec2 p) {
    vec2 q = p;
    float d = segBase(p);
    float s = 0.03;
    p.x += s;
    p.y += 0.08;
    float m = B(p, vec2(s * 2., s * 2.0));
    d = max(-m, d);
    p = q;
    p.y -= 0.08;
    m = B(p, vec2(s, s * 2.0));
    return max(-m, d);
}
float seg5(vec2 p) {
    vec2 q = p;
    float d = segBase(p);
    float s = 0.03;
    p.x -= s;
    p.y -= 0.05;
    float m = B(p, vec2(s * 2., s));
    d = max(-m, d);
    p = q;
    p.x += s;
    p.y += 0.05;
    m = B(p, vec2(s * 2., s));
    return max(-m, d);
}
float seg6(vec2 p) {
    vec2 q = p;
    float d = segBase(p);
    float s = 0.03;
    p.x -= s;
    p.y -= 0.05;
    float m = B(p, vec2(s * 2., s));
    d = max(-m, d);
    p = q;
    p.y += 0.05;
    m = B(p, vec2(s, s));
    return max(-m, d);
}
float seg7(vec2 p) {
    float d = segBase(p);
    float s = 0.03;
    p.x += s;
    p.y += s;
    float m = B(p, vec2(s * 2., s * 3.7));
    return max(-m, d);
}
float seg8(vec2 p) {
    float d = segBase(p);
    float s = 0.03;
    p.y = abs(p.y);
    p.y -= 0.05;
    float m = B(p, vec2(s, s));
    return max(-m, d);
}
float seg9(vec2 p) {
    vec2 q = p;
    float d = segBase(p);
    float s = 0.03;
    p.y -= 0.05;
    float m = B(p, vec2(s, s));
    d = max(-m, d);
    p = q;
    p.x += s;
    p.y += 0.05;
    m = B(p, vec2(s * 2., s));
    d = max(-m, d);
    return d;
}

float drawFont(vec2 p, int ch) {
    p *= 2.0;
    if (ch == seg_0) return seg0(p);
    if (ch == seg_1) return seg1(p);
    if (ch == seg_2) return seg2(p);
    if (ch == seg_3) return seg3(p);
    if (ch == seg_4) return seg4(p);
    if (ch == seg_5) return seg5(p);
    if (ch == seg_6) return seg6(p);
    if (ch == seg_7) return seg7(p);
    if (ch == seg_8) return seg8(p);
    return seg9(p);
}

/* ===== Glow helper (single-pass halo) ===== */
float glowMask(float d, float radius) {
    float r = max(radius, 1e-4);
    float x = clamp(max(d, 0.0) / r, 0.0, 1.0);
    return pow(1.0 - x, 2.2);
}

/* ===== HUD pieces (with local time 't') ===== */

// Barcode (top-right)
float barCode(vec2 p, float t) {
    p *= 1.1;
    vec2 prev = p;
    p.x += t * 0.5;
    p *= 15.0;
    p.x = mod(p.x, 0.2) - 0.1;
    float d = abs(p.x) - ((0.01 * Hash21(vec2(floor(p.x))) * 5.) + 0.01);
    p = prev;
    d = max(abs(p.x) - 0.15, d);
    d = max(abs(p.y) - 0.1, d);
    float d2 = abs(B(p, vec2(0.16, 0.11))) - 0.001;
    d2 = max(-(abs(p.x) - 0.14), d2);
    d2 = max(-(abs(p.y) - 0.09), d2);
    return min(d, d2);
}

// Concentric ring UI (center-ish) + tiny digits
float circleUI(vec2 p, float t, float tDigits) {
    vec2 prevP = p;
    float speed = 3.;
    mat2 R1 = Rot(radians(t * speed) * 30.0);
    p *= R1;
    p = DF(p, 32.0);
    p -= vec2(0.28);
    float d = B(p * Rot(radians(45.0)), vec2(0.002, 0.02));
    p = prevP;
    p *= R1;
    float a = radians(130.);
    d = max(dot(p, vec2(cos(a), sin(a))), d);
    a = radians(-130.);
    d = max(dot(p, vec2(cos(a), sin(a))), d);

    p = prevP;
    mat2 R2 = Rot(radians(t) * 20.0);
    p *= R2;
    p = DF(p, 24.0);
    p -= vec2(0.19);
    float d2 = B(p * Rot(radians(45.0)), vec2(0.003, 0.015));
    p = prevP;
    p *= R2;
    a = radians(137.5);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    a = radians(-137.5);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    d = min(d, d2);

    p = prevP;
    mat2 R3 = Rot(-radians(t * speed) * 25.0);
    p *= R3;
    p = DF(p, 16.0);
    p -= vec2(0.16);
    d2 = B(p * Rot(radians(45.0)), vec2(0.003, 0.01));
    p = prevP;
    p *= R3;
    a = radians(25.5);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    a = radians(-25.5);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    d = min(d, d2);

    p = prevP;
    mat2 R4 = Rot(radians(t * speed) * 35.0);
    p *= R4;
    p = DF(p, 8.0);
    p -= vec2(0.23);
    d2 = B(p * Rot(radians(45.0)), vec2(0.02, 0.02));
    p = prevP;
    p *= R4;
    a = radians(40.0);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    a = radians(-40.0);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    d = min(d, d2);

    p = prevP;
    mat2 R5 = Rot(radians(t * speed) * 15.0);
    p *= R5;
    d2 = abs(length(p) - 0.36) - 0.002;
    d2 = max(abs(p.x) - 0.2, d2);
    d = min(d, d2);
    p = prevP;
    mat2 R6 = Rot(radians(90.) + radians(t * speed) * 38.0);
    p *= R6;
    d2 = abs(length(p) - 0.245) - 0.002;
    d2 = max(abs(p.x) - 0.1, d2);
    d = min(d, d2);

    p = prevP;
    d2 = abs(length(p) - 0.18) - 0.001;
    d = min(d, d2);

    p = prevP;
    mat2 R7 = Rot(radians(145.) + radians(t * speed) * 32.0);
    p *= R7;
    d2 = abs(length(p) - 0.18) - 0.008;
    a = radians(30.0);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    a = radians(-30.0);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    d = min(d, d2);

    p = prevP;
    float ang = radians(t * speed) * 30.0;
    p.x += cos(ang) * 0.45;
    p.y += sin(ang) * 0.45;
    d2 = Tri(p * Rot(-ang) * Rot(radians(90.0)), vec2(0.02), radians(45.));
    d = min(d, d2);

    p = prevP;
    ang = radians(-sin(t * speed * 0.5)) * 120.0 + radians(-70.);
    p.x += cos(ang) * 0.45;
    p.y += sin(ang) * 0.45;
    d2 = abs(Tri(p * Rot(-ang) * Rot(radians(90.0)), vec2(0.02), radians(45.))) - 0.001;
    d = min(d, d2);

    p = prevP;
    mat2 R8 = Rot(-radians(t * speed) * 27.0);
    p *= R8;
    d2 = abs(length(p) - 0.43) - 0.0001;
    d2 = max(abs(p.x) - 0.3, d2);
    d = min(d, d2);

    p = prevP;
    mat2 R9 = Rot(-radians(t * speed) * 12.0);
    p *= R9;
    p = DF(p, 8.0);
    p -= vec2(0.103);
    d2 = B(p * Rot(radians(45.0)), vec2(0.001, 0.007));
    d = min(d, d2);

    p = prevP;
    mat2 R10 = Rot(radians(16.8) - radians(t * speed) * 12.0);
    p *= R10;
    p = DF(p, 8.0);
    p -= vec2(0.098);
    d2 = B(p * Rot(radians(45.0)), vec2(0.001, 0.013));
    d = min(d, d2);

    p = prevP;
    mat2 R11 = Rot(radians(t * speed) * 30.0);
    p *= R11;
    p = DF(p, 10.0);
    p -= vec2(0.28);
    d2 = abs(B(p * Rot(radians(45.0)), vec2(0.02, 0.02))) - 0.001;
    p = prevP;
    p *= R11;
    a = radians(50.);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    a = radians(-50.);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    d = min(d, d2);

    // tiny two digits – driven by tDigits
    p = prevP;
    int num = int(mod(tDigits * 10.0, 10.0));
    d2 = drawFont(p - vec2(0.038, 0.0), num);
    d = min(d, abs(d2) - 0.001);
    num = int(mod(tDigits * 3.0, 10.0));
    d2 = drawFont(p - vec2(-0.038, 0.0), num);
    d = min(d, d2);

    return d;
}

// Small ring UI (bottom-left)
float smallCircleUI(vec2 p, float t) {
    p *= 1.3;
    vec2 prev = p;
    float speed = 3.;
    mat2 R = Rot(radians(t * speed) * 35.0);
    p *= R;
    float d = abs(length(p) - 0.2) - 0.005;
    float a = radians(50.);
    d = max(dot(p, vec2(cos(a), sin(a))), d);
    a = radians(-50.);
    d = max(dot(p, vec2(cos(a), sin(a))), d);

    p *= Rot(radians(10.));
    float d2 = abs(length(p) - 0.19) - 0.006;
    a = radians(60.);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    a = radians(-60.);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    d = min(d, d2);

    p = prev;
    d2 = abs(length(p) - 0.195) - 0.0001;
    d = min(d, d2);

    p = prev;
    R = Rot(-radians(t * speed) * 30.0);
    p *= R;
    p = DF(p, 12.0);
    p -= vec2(0.11);
    d2 = B(p * Rot(radians(45.0)), vec2(0.003, 0.015));
    d = min(d, d2);

    p = prev;
    R = Rot(radians(t * speed) * 23.0);
    p *= R;
    p = DF(p, 2.5);
    p -= vec2(0.05);
    d2 = B(p * Rot(radians(45.0)), vec2(0.01));
    d = min(d, d2);

    p = prev;
    R = Rot(-radians(t * speed) * 26.0);
    p *= R;
    d2 = abs(length(p) - 0.11) - 0.005;
    d2 = max(abs(p.x) - 0.05, d2);
    d = min(d, d2);
    return d;
}

// Micro dots ring
float smallCircleUI2(vec2 p, float t) {
    p.x = abs(p.x) - 0.4;
    p.y = abs(p.y) - 0.34;
    vec2 prev = p;
    float speed = 3.;
    mat2 R = Rot(radians(t * speed) * 28.0);
    p *= R;
    float d = abs(length(p) - 0.028) - 0.0005;
    d = max(B(p, vec2(0.015, 0.1)), d);
    p = prev;
    R = Rot(-radians(t * speed) * 31.0);
    p *= R;
    float d2 = abs(length(p) - 0.027) - 0.004;
    float a = radians(50.);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    a = radians(-50.);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    d = min(max(-d2, d), abs(d2) - 0.001);
    p = prev;
    R = Rot(-radians(t * speed) * 30.0);
    p *= R;
    p = DF(p, 2.0);
    p -= vec2(0.008);
    d2 = B(p * Rot(radians(45.0)), vec2(0.0005, 0.002));
    d = min(d, d2);
    return d;
}

// Bars stack graph (top-left)
float graph(vec2 p, float t) {
    vec2 prev = p;
    float d = 10.;
    float tt = t + Hash21(vec2(floor(p.y - 0.5), 0.0));
    p.y = abs(p.y);
    p.y += 0.127;
    for (float i = 1.0; i <= 20.0; i += 1.0) {
        float y = i * -0.015;
        float w = abs(sin(Hash21(vec2(i, 0.0)) * tt * 3.0) * 0.1);
        float d2 = B(p + vec2(0.1 - w, y), vec2(w, 0.003));
        d = min(d, d2);
    }
    p = prev;
    return max(abs(p.y) - 0.2, d);
}

// HUD frame + slider cluster (right side)
float scifiUI(vec2 p, float t) {
    p *= 1.1;
    vec2 prev = p;
    float d = B(p, vec2(0.15, 0.06));
    float a = radians(45.);
    p.x = abs(p.x) - 0.195;
    p.y = abs(p.y);
    float m = dot(p, vec2(cos(a), sin(a)));
    d = max(m, d);
    p = prev;
    p.x += 0.16;
    p.y += 0.008;
    float d2 = B(p, vec2(0.06, 0.052));
    a = radians(45.);
    p.x = abs(p.x) - 0.095;
    p.y = abs(p.y);
    m = dot(p, vec2(cos(a), sin(a)));
    d2 = max(m, d2);
    p = prev;
    d2 = min(d, d2);
    d2 = max(-B(p - vec2(-0.03, -0.05), vec2(0.2, 0.05)), abs(d2) - 0.003);
    return abs(d2) - 0.001;
}

// Moving triangle strip (center)
float triAnimatin(vec2 p, float t) {
    p.x = abs(p.x) - 0.458;
    p.y = abs(p.y) - 0.45;
    vec2 prev = p;
    p.x += t * 0.1;
    p.x = mod(p.x, 0.04) - 0.02;
    p.x += 0.01;
    float d = abs(Tri(p * Rot(radians(-90.0)), vec2(0.012), radians(45.0))) - 0.0001;
    p = prev;
    return max(abs(p.x) - 0.125, d);
}

// Random dotted rail (top middle)
float randomDotLine(vec2 p, float t) {
    vec2 prev = p;
    p.x += t * 0.08;
    vec2 gv = fract(p * 17.0) - 0.5;
    vec2 id = floor(p * 17.0);
    float n = Hash21(id);
    float d = B(gv, vec2(0.25 * (n * 2.0), 0.2));
    p = prev;
    p.y += 0.012;
    d = max(abs(p.y) - 0.01, max(abs(p.x) - 0.27, d));
    return d;
}

// Wide frame with diagonals & moving notches (far outer)
float scifiUI2(vec2 p, float t) {
    vec2 prev = p;
    p *= 1.2;
    p.x = abs(p.x) - 0.72;
    p.y = abs(p.y) - 0.53;
    float d = B(p, vec2(0.03));
    float a = radians(-45.0);
    float m = -dot(p - vec2(-0.005, 0.0), vec2(cos(a), sin(a)));
    d = max(m, d);
    m = dot(p - vec2(0.005, 0.0), vec2(cos(a), sin(a)));
    d = max(m, d);

    float d2 = B(p - vec2(0.175, 0.0256), vec2(0.15, 0.004));
    d = min(d, d2);
    d2 = B(p - vec2(-0.175, -0.0256), vec2(0.15, 0.004));
    d = abs(min(d, d2)) - 0.0005;

    // moving notch rail inside
    p.y -= 0.003;
    p.x += t * 0.05;
    p.x = mod(p.x, 0.03) - 0.015;
    p.x -= 0.01;
    d2 = B(p, vec2(0.026));
    m = -dot(p - vec2(-0.005, 0.0), vec2(cos(a), sin(a)));
    d2 = max(m, d2);
    m = dot(p - vec2(0.005, 0.0), vec2(cos(a), sin(a)));
    d2 = max(m, d2);

    p = prev;
    p *= 1.2;
    p.x = abs(p.x) - 0.72;
    p.y = abs(p.y) - 0.53;
    m = -dot(p - vec2(0.02, 0.0), vec2(cos(a), sin(a)));
    d2 = max(m, d2);
    m = dot(p - vec2(0.32, 0.0), vec2(cos(a), sin(a)));
    d2 = max(m, d2);

    d = min(d, d2);

    // center strip + dotted rail
    d2 = triAnimatin(prev, t);
    d = min(d, d2);
    vec2 p2 = prev;
    p2.x = abs(p2.x) - 0.6;
    p2.y = abs(p2.y) - 0.418;
    d2 = randomDotLine(p2, t);
    d = min(d, d2);
    return d;
}

// Small dual halos base (no time)
float scifiUI3Base(vec2 p) {
    float d = abs(length(p) - 0.03) - 0.01;
    p.x = abs(p.x) - 0.1;
    float d2 = abs(length(p) - 0.03) - 0.01;
    return min(d, d2);
}

// Rotating fences (time)
float scifiUI3_fn(vec2 p, float t) {
    vec2 prevP = p;
    float speed = 3.;
    float d = abs(length(p) - 0.03) - 0.01;

    mat2 animRot = Rot(radians(t * speed) * 40.0);
    p *= animRot;
    float a = radians(50.);
    d = max(dot(p, vec2(cos(a), sin(a))), d);
    a = radians(-50.);
    d = max(dot(p, vec2(cos(a), sin(a))), d);

    p = prevP;
    p.x = abs(p.x) - 0.1;
    animRot = Rot(radians(t * speed) * 45.0);
    p *= animRot;
    float d2 = abs(length(p) - 0.03) - 0.01;
    a = radians(170.);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    a = radians(-170.);
    d2 = max(dot(p, vec2(cos(a), sin(a))), d2);
    return min(d, d2);
}

/* ===================== Main ===================== */
void main() {
    // Shadertoy-like UV
    vec2 fragCoord = qt_TexCoord0 * u_resolution;
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / max(1.0, iResolution.y);

    // Section-local times
    float tOuter = iTime * u_speedOuter;
    float tCircle = iTime * u_speedCircle;
    float tSmall = iTime * u_speedSmallCircle;
    float tDots = iTime * u_speedDots;
    float tBarcode = iTime * u_speedBarcode;
    float tGraph = iTime * u_speedGraph;
    float tSlider = iTime * u_speedSlider;
    float tHalo = iTime * u_speedHalo;
    float tDigits = iTime * u_speedDigits;
    float tTri = iTime * u_speedTri;
    float tRail = iTime * u_speedRail; // (used inside scifiUI2 via tri/rail)

    vec3 col = vec3(0.0);
    float cov = 0.0; // coverage (shape “on”)
    float gcv = 0.0; // glow coverage (for alpha assist)

    // Helper macro to apply a section with toggle
    #define APPLY_SECTION(toggle, d, baseColor)           \
                                s = S((d), 0.0) * clamp((toggle), 0.0, 1.0);      \
                                g = glowMask((d), u_glowRadius) * clamp((toggle), 0.0, 1.0); \
                                col += (baseColor) * s + ((baseColor) * u_glowTint) * g * u_glowStrength; \
                                cov = max(cov, s);                                \
                                gcv = max(gcv, g);

    float s, g, d, d2;

    // --- Wide frame + decorations (Outer)
    d = scifiUI2(uv, tOuter);
    APPLY_SECTION(u_showOuter, d, u_colPrimary)

    // --- Concentric circle UI
    d2 = circleUI(uv, tCircle, tDigits);
    APPLY_SECTION(u_showCircle, d2, u_colSecondary)

    // --- Small circle (bottom-left-ish)
    d2 = smallCircleUI(uv - vec2(-0.62, -0.22), tSmall);
    APPLY_SECTION(u_showSmallCircle, d2, u_colAccent1)

    // --- Micro dots ring (center-ish)
    d2 = smallCircleUI2(uv, tDots);
    APPLY_SECTION(u_showDots, d2, u_colAccent2)

    // --- Bar graph (top-left-ish)
    d2 = graph(uv - vec2(-0.67, 0.19), tGraph);
    APPLY_SECTION(u_showGraph, d2, u_colAccent1)

    // --- Barcode (top-right)
    d2 = barCode(uv - vec2(0.63, -0.27), tBarcode);
    APPLY_SECTION(u_showBarcode, d2, u_colAccent2)

    // --- Slider cluster (right)
    d2 = scifiUI(uv - vec2(0.62, 0.26), tSlider);
    APPLY_SECTION(u_showSlider, d2, u_colPrimary)

    // --- Small dual halos base (right middle)
    d = scifiUI3Base(uv - vec2(0.65, 0.0));
    APPLY_SECTION(u_showHaloBase, d, u_colHighlight * 0.5)

    // --- Rotating fences on halos
    d = scifiUI3_fn(uv - vec2(0.65, 0.0), tHalo);
    APPLY_SECTION(u_showHaloFences, d, u_colHighlight)

    #undef APPLY_SECTION

    col = clamp(col, 0.0, 1.0);

    // Alpha from coverage + glow coverage boost
    float fxAlpha = clamp(cov * u_alphaGain + gcv * u_glowAlphaGain, 0.0, 1.0);

    // If used as layer.effect, multiply by source alpha
    vec4 src = texture(source, qt_TexCoord0); // premultiplied
    float mask = mix(1.0, src.a, clamp(u_masked, 0.0, 1.0));
    float alpha = fxAlpha * mask;

    // Premultiply & intensity
    vec3 outRGB = col * alpha * u_intensity;
    fragColor = vec4(outRGB, alpha) * qt_Opacity;
}
