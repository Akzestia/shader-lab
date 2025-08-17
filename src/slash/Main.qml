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
        anchors.fill: parent
        fragmentShader: "qrc:/slash.frag.qsb"

        property vector2d u_resolution: Qt.vector2d(width, height)
        property real u_time: 0
        property real u_intensity: 1.0
        property real u_masked: 0.0

        property vector3d u_coreC: Qt.vector3d(0.0941, 0.8314, 0.7961)
        property vector3d u_glowC: Qt.vector3d(0.0275, 0.0549, 0.5529)
        property vector3d u_lightC: Qt.vector3d(0.7176, 0.7804, 0.7647)

        NumberAnimation on u_time {
            from: 0
            to: 50
            duration: 100000
            loops: Animation.Infinite
        }
    }
}
