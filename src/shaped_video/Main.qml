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

    ShapedVideo {
        id: sv

        anchors.centerIn: parent
        width: 290
        height: 290
        // Can also be used for images and GIFs
        sourceUrl: "file:///path/to/video"
        autoPlay: true

        shape: 0
        cornerRadius: sv.width * .5
        borderWidth: 0
        borderColor: "#CC00FFFF"
        feather: 1.5

        borderGlow: 8
        borderGlowColor: "#3300FFFF"
    }
}
