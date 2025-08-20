import QtQuick
import QtQuick.Controls
import QtMultimedia

Item {
    id: root
    // Public API
    property url sourceUrl: ""
    property bool autoPlay: true
    property real playbackRate: 1.0
    property int loopCount: MediaPlayer.Infinite

    // --- shape controls ---
    property int shape: 0
    property real cornerRadius: 24
    property real borderWidth: 3
    property color borderColor: "#80FFFFFF"
    property real feather: 1.5
    property url maskSource: ""

    property real borderGlow: 0.0
    property color borderGlowColor: "#4000FFFF"

    width: 640
    height: 360
    clip: false

    Video {
        id: video
        anchors.fill: parent
        source: root.sourceUrl
        playbackRate: root.playbackRate
        loops: root.loopCount
        autoPlay: root.autoPlay
        visible: false // we sample it in the shader
        onErrorOccurred: console.warn("Video error:", errorString)
    }

    ShaderEffectSource {
        id: videoTex
        sourceItem: video
        live: true
        hideSource: true
        textureMirroring: ShaderEffectSource.NoMirroring
    }

    Image {
        id: maskImg
        source: root.maskSource
        visible: false
        fillMode: Image.PreserveAspectFit
        anchors.fill: parent
    }

    ShaderEffectSource {
        id: maskTex
        sourceItem: maskImg
        live: false
        hideSource: true
        textureMirroring: ShaderEffectSource.NoMirroring
        enabled: !!root.maskSource && root.shape === 3
    }

    ShaderEffect {
        id: fx
        anchors.fill: parent
        fragmentShader: "qrc:/shaped_video.frag.qsb"

        property variant u_source: videoTex
        property variant u_mask: maskTex

        property int u_shape: root.shape
        property real u_cornerRadius: root.cornerRadius
        property real u_borderWidth: root.borderWidth
        property real u_feather: root.feather
        property real u_borderGlow: root.borderGlow
        property color u_borderColor: root.borderColor
        property color u_borderGlowColor: root.borderGlowColor
        property vector2d u_size: Qt.vector2d(width, height)

        property int u_useMask: (root.shape === 3 && !!root.maskSource) ? 1 : 0
    }

    function play() {
        video.play();
    }
    function pause() {
        video.pause();
    }
    function stop() {
        video.stop();
    }
}
