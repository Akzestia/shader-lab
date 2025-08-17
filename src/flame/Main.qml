import QtQuick

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

    ShaderEffect {
        id: flame
        anchors.fill: parent
        fragmentShader: "qrc:/flame.frag.qsb"

        // Uniforms
        property real u_time: 0.0
        property vector2d u_resolution: Qt.vector2d(width, height)

        // Color endpoints (like original orange->blue). Customize freely:
        property vector3d u_colorA: Qt.vector3d(1.0, 0.5, 0.1)   // base/orange
        property vector3d u_colorB: Qt.vector3d(0.1, 0.5, 1.0)   // tip/blue

        // Extra glow boost (0..2); push higher for more “spirit” bloom
        property real u_glowBoost: 0.6

        // Animate time
        NumberAnimation on u_time {
            from: 0
            to: 100
            duration: 100000
            loops: Animation.Infinite
        }
    }
}
