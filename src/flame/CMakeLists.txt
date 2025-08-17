cmake_minimum_required(VERSION 4.0.1)
project(flame)

set(QT_QML_GENERATE_QMLLS_INI ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.9.1 REQUIRED Qml Quick Core Gui ShaderTools Multimedia)

qt_standard_project_setup(REQUIRES 6.9.1)

qt_add_executable(flamex
    main.cpp
)

qt_add_qml_module(flamex
    URI flame
    VERSION 1.0
    QML_FILES
        Main.qml
)

qt6_add_shaders(flamex "flame_shaders"
    PREFIX
        "/"
    FILES
        "flame.frag"
)

target_link_libraries(flamex
    PRIVATE
        Qt6::Quick
        Qt6::Gui
        Qt6::Multimedia
)

include(GNUInstallDirs)
install(TARGETS flamex
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
