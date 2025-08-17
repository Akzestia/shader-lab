import QtQuick
import QtQuick.Shapes

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

    PathVideo {
        width: 480
        height: 270
        sourceUrl: "file:///path/to/video"
        anchors.centerIn: parent
        shape: 1
        flipY: true
        clipMode: 0
        borderWidth: 4
        borderColor: "#CC00FFFF"
        maskContent: Shape {
            anchors.fill: parent
            ShapePath {
                strokeWidth: 0
                fillColor: "white"
                PathSvg {
                    path: "M96,0 L384,0 L480,54 L480,216 L480,270 L96,270 L0,216 L0,0 Z"
                }
            }
        }
    }
}
