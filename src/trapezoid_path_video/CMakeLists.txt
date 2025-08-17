cmake_minimum_required(VERSION 4.0.1)
project(trapezoid_path_video)

set(QT_QML_GENERATE_QMLLS_INI ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.9.1 REQUIRED Qml Quick Core Gui ShaderTools Multimedia)

qt_standard_project_setup(REQUIRES 6.9.1)

qt_add_executable(trapezoid_path_videox
    main.cpp
)

qt_add_qml_module(trapezoid_path_videox
    URI trapezoid_path_video
    VERSION 1.0
    QML_FILES
        Main.qml
        PathVideo.qml
)

qt6_add_shaders(trapezoid_path_videox "trapezoid_path_video_shaders"
    PREFIX
        "/"
    FILES
        "trapezoid_path_video.frag"
)

target_link_libraries(trapezoid_path_videox
    PRIVATE
        Qt6::Quick
        Qt6::Gui
        Qt6::Multimedia
)

include(GNUInstallDirs)
install(TARGETS trapezoid_path_videox
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
