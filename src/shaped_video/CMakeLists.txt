cmake_minimum_required(VERSION 4.0.1)
project(shaped_video)

set(QT_QML_GENERATE_QMLLS_INI ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.9.1 REQUIRED Qml Quick Core Gui ShaderTools Multimedia)

qt_standard_project_setup(REQUIRES 6.9.1)

qt_add_executable(shaped_videox
    main.cpp
)

qt_add_qml_module(shaped_videox
    URI shaped_video
    VERSION 1.0
    QML_FILES
        Main.qml
        ShapedVideo.qml
)

qt6_add_shaders(shaped_videox "shaped_video_shaders"
    PREFIX
        "/"
    FILES
        "shaped_video.frag"
)

target_link_libraries(shaped_videox
    PRIVATE
        Qt6::Quick
        Qt6::Gui
        Qt6::Multimedia
)

include(GNUInstallDirs)
install(TARGETS shaped_videox
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
