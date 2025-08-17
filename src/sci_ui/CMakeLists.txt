cmake_minimum_required(VERSION 4.0.1)
project(sci_ui)

set(QT_QML_GENERATE_QMLLS_INI ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.9.1 REQUIRED Qml Quick Core Gui ShaderTools Multimedia)

qt_standard_project_setup(REQUIRES 6.9.1)

qt_add_executable(sci_uix
    main.cpp
)

qt_add_qml_module(sci_uix
    URI sci_ui
    VERSION 1.0
    QML_FILES
        Main.qml
)

qt6_add_shaders(sci_uix "sci_ui_shaders"
    PREFIX
        "/"
    FILES
        "sci_ui.frag"
)

target_link_libraries(sci_uix
    PRIVATE
        Qt6::Quick
        Qt6::Gui
        Qt6::Multimedia
)

include(GNUInstallDirs)
install(TARGETS sci_uix
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
