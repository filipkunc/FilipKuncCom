EMSCRIPTEN_BINDINGS(meshmaker) {
    using namespace emscripten;

    // Primitives
    function("addCube", &api_addCube);
    function("addPlane", &api_addPlane);
    function("addCylinder", &api_addCylinder);
    function("addSphere", &api_addSphere);
    function("addIcosahedron", &api_addIcosahedron);

    // Edit mode (0=Items, 1=Vertices, 2=Triangles, 3=Edges)
    function("getEditMode", &api_getEditMode);
    function("setEditMode", &api_setEditMode);
