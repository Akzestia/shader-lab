import QtQuick
import QtQuick.Controls
import QtMultimedia

Item {
    id: root
    // Public API
    property url sourceUrl: ""              // video file or stream URL
    property bool autoPlay: true
    property real playbackRate: 1.0
    property int loopCount: MediaPlayer.Infinite

    // --- shape controls ---
    // 0=RoundedRect, 1=Circle, 2=Hexagon, 3=MaskTexture
    property int shape: 0
    property real cornerRadius: 24          // for RoundedRect
    property real borderWidth: 3
    property color borderColor: "#80FFFFFF" // semi-transparent white
    property real feather: 1.5              // edge smoothing (in px)
    property url maskSource: ""             // optional mask (grayscale) for shape=3

    // Optional drop shadow-ish glow around border (0 disables)
    property real borderGlow: 0.0           // in px, soft outer halo
    property color borderGlowColor: "#4000FFFF"

    width: 640
    height: 360
    clip: false

    // Use the Video convenience item instead of MediaPlayer+VideoOutput
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

    // Optional mask texture (grayscale) for arbitrary shapes
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

    // Fragment shader is your compiled .qsb with explicit sampler bindings
    ShaderEffect {
        id: fx
        anchors.fill: parent
        fragmentShader: "qrc:/shaped_video.frag.qsb"

        // samplers
        property variant u_source: videoTex
        property variant u_mask: maskTex

        // UBO uniforms (names/types must match shader block)
        property int u_shape: root.shape
        property real u_cornerRadius: root.cornerRadius
        property real u_borderWidth: root.borderWidth
        property real u_feather: root.feather
        property real u_borderGlow: root.borderGlow
        property color u_borderColor: root.borderColor
        property color u_borderGlowColor: root.borderGlowColor
        property vector2d u_size: Qt.vector2d(width, height)

        // use int instead of bool for UBO
        property int u_useMask: (root.shape === 3 && !!root.maskSource) ? 1 : 0
    }

    // simple API helpers
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
