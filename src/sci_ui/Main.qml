import QtQuick
import QtQuick.Controls

Window {
    id: root
    width: 1400
    height: 800
    minimumWidth: 1400
    maximumWidth: 1400
    minimumHeight: 800
    maximumHeight: 800
    color: "#111111"
    visible: true

    // ---------- Controls bar ----------
    Row {
        spacing: 16
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.top: parent.top
        anchors.topMargin: 16
        z: 2

        ComboBox {
            id: themeBox
            opacity: 0
            focusPolicy: Qt.TabFocus
            width: 260
            model: ["Neon (Cyan/Magenta)", "Plasma (Pink/Blue)", "Aurora (Green/Purple)", "Royal (Gold/Crimson)", "Toxic (Lime/Cyan)", "Solar (Orange/Yellow)", "Icefire (Blue/Orange)", "Inferno (Red/Yellow)", "Celestial (Blue/Gold)", "Emerald (Green/Gold)", "Cyber (Teal/Pink)", "Shadow (Black/Red)", "Storm (Grey/Blue)", "Voltage (Yellow/Purple)", "Arctic (Cyan/White)", "Obsidian (Black/Violet)", "Hologram (Pink/Teal)", "Crimson Dawn (Red/Gold)", "Oceanic (Blue/Green)", "Radiant (White/Gold)"]
            onActivated: applyTheme(index)
            Component.onCompleted: applyTheme(0)
        }

        ComboBox {
            id: visBox
            opacity: 0
            focusPolicy: Qt.TabFocus
            width: 260
            model: ["Full HUD", "Rings Focus", "Data Panels", "Halos Only", "Minimal Frame", "Clean Center", "Diagnostics", "Outer+Sliders"]
            onActivated: applyVisibility(index)
            Component.onCompleted: applyVisibility(0)
        }
    }

    // ---------- The live ShaderEffect (single instance) ----------
    ShaderEffect {
        id: fx
        anchors.fill: parent
        fragmentShader: "qrc:/sci_ui.frag.qsb"

        // Required
        property vector2d u_resolution: Qt.vector2d(width, height)
        property real u_time: 0

        // Intensity / alpha
        property real u_intensity: 1.2
        property real u_masked: 0.0
        property real u_alphaGain: 2.0

        // Colors (will be set by applyTheme)
        property vector3d u_colPrimary: Qt.vector3d(0.00, 1.00, 0.95)
        property vector3d u_colSecondary: Qt.vector3d(0.85, 0.25, 1.00)
        property vector3d u_colAccent1: Qt.vector3d(1.00, 0.40, 0.20)
        property vector3d u_colAccent2: Qt.vector3d(0.10, 0.50, 1.00)
        property vector3d u_colHighlight: Qt.vector3d(1.00, 0.90, 0.60)

        // Glow (strength unified to 0.6 unless noted)
        property vector3d u_glowTint: Qt.vector3d(1.00, 0.80, 1.00)
        property real u_glowStrength: 0.6
        property real u_glowRadius: 0.032
        property real u_glowAlphaGain: 0.90

        // Per-section speeds (you can tweak live)
        property real u_speedOuter: 1.0
        property real u_speedCircle: 1.0
        property real u_speedSmallCircle: 1.0
        property real u_speedDots: 1.0
        property real u_speedBarcode: 1.0
        property real u_speedGraph: 1.0
        property real u_speedSlider: 1.0
        property real u_speedHalo: 1.0
        property real u_speedDigits: 1.0
        property real u_speedTri: 1.0
        property real u_speedRail: 1.0

        // Visibility toggles (0.0 = hide, 1.0 = show) — set by applyVisibility
        property real u_showOuter: 1.0
        property real u_showCircle: 1.0
        property real u_showSmallCircle: 1.0
        property real u_showDots: 1.0
        property real u_showBarcode: 1.0
        property real u_showGraph: 1.0
        property real u_showSlider: 1.0
        property real u_showHaloBase: 1.0
        property real u_showHaloFences: 1.0

        // Time ticker
        NumberAnimation on u_time {
            from: 0
            to: 10
            duration: 10000
            loops: Animation.Infinite
        }
    }

    // ---------- Apply functions ----------
    function applyTheme(i) {
        switch (i) {
        case 0: // Neon
            fx.u_intensity = 1.2;
            fx.u_colPrimary = Qt.vector3d(0.00, 1.00, 0.95);
            fx.u_colSecondary = Qt.vector3d(0.85, 0.25, 1.00);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.40, 0.20);
            fx.u_colAccent2 = Qt.vector3d(0.10, 0.50, 1.00);
            fx.u_colHighlight = Qt.vector3d(1.00, 0.90, 0.60);
            fx.u_glowTint = Qt.vector3d(1.00, 0.80, 1.00);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.035;
            fx.u_glowAlphaGain = 0.90;
            break;
        case 1: // Plasma
            fx.u_intensity = 1.25;
            fx.u_colPrimary = Qt.vector3d(1.00, 0.20, 0.70);
            fx.u_colSecondary = Qt.vector3d(0.20, 0.60, 1.00);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.70, 0.25);
            fx.u_colAccent2 = Qt.vector3d(0.60, 0.85, 1.00);
            fx.u_colHighlight = Qt.vector3d(1.00, 0.40, 0.90);
            fx.u_glowTint = Qt.vector3d(0.90, 0.60, 1.00);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.030;
            fx.u_glowAlphaGain = 0.85;
            break;
        case 2: // Aurora
            fx.u_intensity = 1.2;
            fx.u_colPrimary = Qt.vector3d(0.10, 0.95, 0.50);
            fx.u_colSecondary = Qt.vector3d(0.20, 0.45, 1.00);
            fx.u_colAccent1 = Qt.vector3d(0.80, 0.25, 1.00);
            fx.u_colAccent2 = Qt.vector3d(0.10, 1.00, 0.60);
            fx.u_colHighlight = Qt.vector3d(0.90, 1.00, 0.70);
            fx.u_glowTint = Qt.vector3d(0.70, 1.00, 0.90);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.032;
            fx.u_glowAlphaGain = 0.90;
            break;
        case 3: // Royal
            fx.u_intensity = 1.15;
            fx.u_colPrimary = Qt.vector3d(1.00, 0.84, 0.00);
            fx.u_colSecondary = Qt.vector3d(0.80, 0.10, 0.10);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.60, 0.30);
            fx.u_colAccent2 = Qt.vector3d(1.00, 0.90, 0.40);
            fx.u_colHighlight = Qt.vector3d(1.00, 0.95, 0.80);
            fx.u_glowTint = Qt.vector3d(1.00, 0.85, 0.40);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.028;
            fx.u_glowAlphaGain = 0.75;
            break;
        case 4: // Toxic
            fx.u_intensity = 1.3;
            fx.u_colPrimary = Qt.vector3d(0.00, 1.00, 0.50);
            fx.u_colSecondary = Qt.vector3d(0.00, 1.00, 1.00);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.40, 0.20);
            fx.u_colAccent2 = Qt.vector3d(0.40, 1.00, 0.90);
            fx.u_colHighlight = Qt.vector3d(0.90, 1.00, 0.70);
            fx.u_glowTint = Qt.vector3d(0.70, 1.00, 0.90);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.036;
            fx.u_glowAlphaGain = 0.95;
            break;

        // ---------- New themes 5–19 ----------
        case 5: // Solar
            fx.u_intensity = 1.25;
            fx.u_colPrimary = Qt.vector3d(1.00, 0.60, 0.10);
            fx.u_colSecondary = Qt.vector3d(1.00, 0.90, 0.20);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.40, 0.00);
            fx.u_colAccent2 = Qt.vector3d(1.00, 0.75, 0.25);
            fx.u_colHighlight = Qt.vector3d(1.00, 1.00, 0.80);
            fx.u_glowTint = Qt.vector3d(1.00, 0.90, 0.50);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.030;
            fx.u_glowAlphaGain = 0.85;
            break;
        case 6: // Icefire
            fx.u_intensity = 1.3;
            fx.u_colPrimary = Qt.vector3d(0.10, 0.50, 1.00);
            fx.u_colSecondary = Qt.vector3d(1.00, 0.40, 0.10);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.60, 0.30);
            fx.u_colAccent2 = Qt.vector3d(0.50, 0.90, 1.00);
            fx.u_colHighlight = Qt.vector3d(1.00, 0.85, 0.70);
            fx.u_glowTint = Qt.vector3d(0.70, 0.80, 1.00);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.034;
            fx.u_glowAlphaGain = 0.90;
            break;
        case 7: // Inferno
            fx.u_intensity = 1.4;
            fx.u_colPrimary = Qt.vector3d(1.00, 0.30, 0.00);
            fx.u_colSecondary = Qt.vector3d(1.00, 0.90, 0.10);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.60, 0.20);
            fx.u_colAccent2 = Qt.vector3d(1.00, 0.50, 0.00);
            fx.u_colHighlight = Qt.vector3d(1.00, 0.95, 0.70);
            fx.u_glowTint = Qt.vector3d(1.00, 0.70, 0.40);
            fx.u_glowStrength = 0.7;
            fx.u_glowRadius = 0.040;
            fx.u_glowAlphaGain = 0.95;
            break;
        case 8: // Celestial
            fx.u_intensity = 1.2;
            fx.u_colPrimary = Qt.vector3d(0.20, 0.50, 1.00);
            fx.u_colSecondary = Qt.vector3d(1.00, 0.80, 0.20);
            fx.u_colAccent1 = Qt.vector3d(0.60, 0.40, 1.00);
            fx.u_colAccent2 = Qt.vector3d(1.00, 0.95, 0.60);
            fx.u_colHighlight = Qt.vector3d(0.80, 0.90, 1.00);
            fx.u_glowTint = Qt.vector3d(0.70, 0.70, 1.00);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.028;
            fx.u_glowAlphaGain = 0.85;
            break;
        case 9: // Emerald
            fx.u_intensity = 1.15;
            fx.u_colPrimary = Qt.vector3d(0.00, 1.00, 0.40);
            fx.u_colSecondary = Qt.vector3d(1.00, 0.80, 0.20);
            fx.u_colAccent1 = Qt.vector3d(0.30, 1.00, 0.50);
            fx.u_colAccent2 = Qt.vector3d(0.90, 1.00, 0.40);
            fx.u_colHighlight = Qt.vector3d(0.70, 1.00, 0.80);
            fx.u_glowTint = Qt.vector3d(0.40, 1.00, 0.60);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.030;
            fx.u_glowAlphaGain = 0.80;
            break;
        case 10: // Cyber
            fx.u_intensity = 1.3;
            fx.u_colPrimary = Qt.vector3d(0.00, 1.00, 0.80);
            fx.u_colSecondary = Qt.vector3d(1.00, 0.30, 0.70);
            fx.u_colAccent1 = Qt.vector3d(0.90, 0.40, 1.00);
            fx.u_colAccent2 = Qt.vector3d(0.40, 0.80, 1.00);
            fx.u_colHighlight = Qt.vector3d(1.00, 0.90, 0.95);
            fx.u_glowTint = Qt.vector3d(0.60, 1.00, 0.80);
            fx.u_glowStrength = 0.65;
            fx.u_glowRadius = 0.033;
            fx.u_glowAlphaGain = 0.90;
            break;
        case 11: // Shadow
            fx.u_intensity = 1.1;
            fx.u_colPrimary = Qt.vector3d(0.10, 0.10, 0.10);
            fx.u_colSecondary = Qt.vector3d(0.80, 0.10, 0.10);
            fx.u_colAccent1 = Qt.vector3d(0.40, 0.00, 0.00);
            fx.u_colAccent2 = Qt.vector3d(0.20, 0.20, 0.20);
            fx.u_colHighlight = Qt.vector3d(0.90, 0.30, 0.30);
            fx.u_glowTint = Qt.vector3d(0.70, 0.20, 0.20);
            fx.u_glowStrength = 0.55;
            fx.u_glowRadius = 0.025;
            fx.u_glowAlphaGain = 0.75;
            break;
        case 12: // Storm
            fx.u_intensity = 1.2;
            fx.u_colPrimary = Qt.vector3d(0.40, 0.50, 0.70);
            fx.u_colSecondary = Qt.vector3d(0.20, 0.40, 0.90);
            fx.u_colAccent1 = Qt.vector3d(0.60, 0.70, 0.90);
            fx.u_colAccent2 = Qt.vector3d(0.80, 0.85, 1.00);
            fx.u_colHighlight = Qt.vector3d(0.70, 0.80, 0.95);
            fx.u_glowTint = Qt.vector3d(0.60, 0.70, 1.00);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.027;
            fx.u_glowAlphaGain = 0.85;
            break;
        case 13: // Voltage
            fx.u_intensity = 1.3;
            fx.u_colPrimary = Qt.vector3d(1.00, 1.00, 0.20);
            fx.u_colSecondary = Qt.vector3d(0.70, 0.20, 1.00);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.60, 0.10);
            fx.u_colAccent2 = Qt.vector3d(0.90, 0.40, 1.00);
            fx.u_colHighlight = Qt.vector3d(1.00, 0.95, 0.70);
            fx.u_glowTint = Qt.vector3d(0.80, 0.70, 1.00);
            fx.u_glowStrength = 0.65;
            fx.u_glowRadius = 0.035;
            fx.u_glowAlphaGain = 0.90;
            break;
        case 14: // Arctic
            fx.u_intensity = 1.15;
            fx.u_colPrimary = Qt.vector3d(0.30, 0.90, 1.00);
            fx.u_colSecondary = Qt.vector3d(1.00, 1.00, 1.00);
            fx.u_colAccent1 = Qt.vector3d(0.70, 0.95, 1.00);
            fx.u_colAccent2 = Qt.vector3d(0.50, 0.80, 1.00);
            fx.u_colHighlight = Qt.vector3d(0.90, 1.00, 1.00);
            fx.u_glowTint = Qt.vector3d(0.80, 0.95, 1.00);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.030;
            fx.u_glowAlphaGain = 0.90;
            break;
        case 15: // Obsidian
            fx.u_intensity = 1.1;
            fx.u_colPrimary = Qt.vector3d(0.05, 0.05, 0.10);
            fx.u_colSecondary = Qt.vector3d(0.50, 0.00, 0.50);
            fx.u_colAccent1 = Qt.vector3d(0.20, 0.00, 0.30);
            fx.u_colAccent2 = Qt.vector3d(0.30, 0.20, 0.40);
            fx.u_colHighlight = Qt.vector3d(0.80, 0.60, 0.90);
            fx.u_glowTint = Qt.vector3d(0.50, 0.20, 0.70);
            fx.u_glowStrength = 0.55;
            fx.u_glowRadius = 0.028;
            fx.u_glowAlphaGain = 0.80;
            break;
        case 16: // Hologram
            fx.u_intensity = 1.25;
            fx.u_colPrimary = Qt.vector3d(1.00, 0.30, 0.80);
            fx.u_colSecondary = Qt.vector3d(0.00, 1.00, 1.00);
            fx.u_colAccent1 = Qt.vector3d(0.50, 0.80, 1.00);
            fx.u_colAccent2 = Qt.vector3d(0.90, 0.50, 1.00);
            fx.u_colHighlight = Qt.vector3d(0.80, 1.00, 1.00);
            fx.u_glowTint = Qt.vector3d(0.60, 0.90, 1.00);
            fx.u_glowStrength = 0.70;
            fx.u_glowRadius = 0.032;
            fx.u_glowAlphaGain = 0.95;
            break;
        case 17: // Crimson Dawn
            fx.u_intensity = 1.3;
            fx.u_colPrimary = Qt.vector3d(1.00, 0.20, 0.20);
            fx.u_colSecondary = Qt.vector3d(1.00, 0.70, 0.20);
            fx.u_colAccent1 = Qt.vector3d(0.80, 0.10, 0.10);
            fx.u_colAccent2 = Qt.vector3d(1.00, 0.40, 0.30);
            fx.u_colHighlight = Qt.vector3d(1.00, 0.90, 0.70);
            fx.u_glowTint = Qt.vector3d(1.00, 0.40, 0.40);
            fx.u_glowStrength = 0.65;
            fx.u_glowRadius = 0.034;
            fx.u_glowAlphaGain = 0.90;
            break;
        case 18: // Oceanic
            fx.u_intensity = 1.2;
            fx.u_colPrimary = Qt.vector3d(0.00, 0.40, 1.00);
            fx.u_colSecondary = Qt.vector3d(0.00, 1.00, 0.60);
            fx.u_colAccent1 = Qt.vector3d(0.20, 0.70, 0.90);
            fx.u_colAccent2 = Qt.vector3d(0.10, 0.90, 0.80);
            fx.u_colHighlight = Qt.vector3d(0.80, 1.00, 1.00);
            fx.u_glowTint = Qt.vector3d(0.40, 0.80, 1.00);
            fx.u_glowStrength = 0.6;
            fx.u_glowRadius = 0.030;
            fx.u_glowAlphaGain = 0.85;
            break;
        case 19: // Radiant
            fx.u_intensity = 1.4;
            fx.u_colPrimary = Qt.vector3d(1.00, 1.00, 1.00);
            fx.u_colSecondary = Qt.vector3d(1.00, 0.85, 0.40);
            fx.u_colAccent1 = Qt.vector3d(1.00, 0.70, 0.30);
            fx.u_colAccent2 = Qt.vector3d(1.00, 0.95, 0.70);
            fx.u_colHighlight = Qt.vector3d(1.00, 1.00, 0.90);
            fx.u_glowTint = Qt.vector3d(1.00, 0.95, 0.80);
            fx.u_glowStrength = 0.70;
            fx.u_glowRadius = 0.035;
            fx.u_glowAlphaGain = 0.95;
            break;
        }
    }

    function applyVisibility(i) {
        // Reset all to 0 first, then enable per preset
        function off() {
            fx.u_showOuter = 0.0;
            fx.u_showCircle = 0.0;
            fx.u_showSmallCircle = 0.0;
            fx.u_showDots = 0.0;
            fx.u_showBarcode = 0.0;
            fx.u_showGraph = 0.0;
            fx.u_showSlider = 0.0;
            fx.u_showHaloBase = 0.0;
            fx.u_showHaloFences = 0.0;
        }
        off();
        switch (i) {
        case 0: // Full HUD
            fx.u_showOuter = 1.0;
            fx.u_showCircle = 1.0;
            fx.u_showSmallCircle = 1.0;
            fx.u_showDots = 1.0;
            fx.u_showBarcode = 1.0;
            fx.u_showGraph = 1.0;
            fx.u_showSlider = 1.0;
            fx.u_showHaloBase = 1.0;
            fx.u_showHaloFences = 1.0;
            break;
        case 1: // Rings Focus (center UI + halos)
            fx.u_showCircle = 1.0;
            fx.u_showHaloBase = 1.0;
            fx.u_showHaloFences = 1.0;
            break;
        case 2: // Data Panels (graph + barcode + slider)
            fx.u_showGraph = 1.0;
            fx.u_showBarcode = 1.0;
            fx.u_showSlider = 1.0;
            break;
        case 3: // Halos Only
            fx.u_showHaloBase = 1.0;
            fx.u_showHaloFences = 1.0;
            break;
        case 4: // Minimal Frame (outer frame + slider only)
            fx.u_showOuter = 1.0;
            fx.u_showSlider = 1.0;
            break;
        case 5: // Clean Center (rings + small circle; no data panels)
            fx.u_showCircle = 1.0;
            fx.u_showSmallCircle = 1.0;
            break;
        case 6: // Diagnostics (dots rail + barcode + graph)
            fx.u_showDots = 1.0;
            fx.u_showBarcode = 1.0;
            fx.u_showGraph = 1.0;
            break;
        case 7: // Outer+Sliders (outer frame + slider + halos)
            fx.u_showOuter = 1.0;
            fx.u_showSlider = 1.0;
            fx.u_showHaloBase = 1.0;
            fx.u_showHaloFences = 1.0;
            break;
        }
    }
}
