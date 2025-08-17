import QtQuick
import QtQuick.Controls
import QtMultimedia
import QtQuick.Shapes   // for optional path mask via Shape

Item {
    id: root

    // ---- Public API ----
    // video
    property url sourceUrl: ""
    property bool autoPlay: true
    property real playbackRate: 1.0
    property int loopCount: MediaPlayer.Infinite
    property bool flipY: false            // set true if your backend flips video

    // shape selector: 0 = Trapezoid, 1 = PathMask
    property int shape: 0

    // trapezoid params (fractions of half-width)
    property real trapTop: 0.70
    property real trapBottom: 1.00
    property real rotationDeg: 0          // rotation in degrees

    // border & rendering
    property real borderWidth: 4
    property color borderColor: "#CC00FFFF"
    property real feather: 1.5
    property real borderGlow: 0.0
    property color borderGlowColor: "#3300FFFF"

    // 0 = clip, 1 = border-only overlay, 2 = ring-only
    property int clipMode: 0

    // Allow user to define any path/shape as a mask (white=inside)
    default property alias maskContent: maskArea.data

    width: 640
    height: 360
    clip: false

    // ---- Video ----
    Video {
        id: video
        anchors.fill: parent
        source: root.sourceUrl
        playbackRate: root.playbackRate
        loops: root.loopCount
        autoPlay: root.autoPlay
        visible: false
        onErrorOccurred: console.warn("Video error:", errorString)
    }

    ShaderEffectSource {
        id: videoTex
        sourceItem: video
        live: true
        hideSource: true
        textureMirroring: root.flipY ? ShaderEffectSource.MirrorVertically : ShaderEffectSource.NoMirroring
    }

    // ---- Path mask (user-provided content) ----
    // Put any Shape/Canvas/Item here; white areas mean "inside"
    Item {
        id: maskArea
        anchors.fill: parent
        visible: false
    }

    ShaderEffectSource {
        id: maskTex
        sourceItem: maskArea
        live: true
        hideSource: true
        textureMirroring: ShaderEffectSource.NoMirroring
        enabled: root.shape === 1
    }

    // ---- Shader ----
    ShaderEffect {
        id: fx
        anchors.fill: parent

        fragmentShader: "qrc:/trapezoid_path_video.frag.qsb"

        // samplers
        property variant u_source: videoTex
        property variant u_mask: maskTex

        // UBO uniforms (names must match the shader)
        property int u_shape: root.shape
        property real u_trapTop: root.trapTop
        property real u_trapBottom: root.trapBottom
        property real u_rotation: root.rotationDeg * Math.PI / 180.0

        property real u_borderWidth: root.borderWidth
        property real u_feather: root.feather
        property real u_borderGlow: root.borderGlow

        property color u_borderColor: root.borderColor
        property color u_borderGlowColor: root.borderGlowColor
        property vector2d u_size: Qt.vector2d(width, height)

        property int u_clipMode: root.clipMode
        property int u_useMask: (root.shape === 1) ? 1 : 0
    }

    // convenience
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
