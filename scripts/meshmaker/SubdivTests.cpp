TEST_F(CatmullClarkTest, CubeLevel1_ProducesExpectedCounts) {
    mesh.makeCube();

    size_t origVerts = mesh.getVertexCount();
    size_t origFaces = mesh.getFaceCount();
    size_t origEdges = mesh.getEdgeCount();

    // A cube has 8 verts, 6 faces, 12 edges
    ASSERT_EQ(origVerts, 8u);
    ASSERT_EQ(origFaces, 6u);
    ASSERT_EQ(origEdges, 12u);

    mesh.catmullClarkSubdivide(1);

    // After Catmull-Clark level 1 on a cube:
    // New verts = original verts + edge midpoints + face centers = 8 + 12 + 6 = 26
    // New faces = 4 per original face = 6 * 4 = 24
    EXPECT_EQ(mesh.getVertexCount(), 26u);
    EXPECT_EQ(mesh.getFaceCount(), 24u);

    // All faces should be quads after Catmull-Clark on a quad mesh
    for (size_t i = 0; i < mesh.getFaceCount(); i++) {
        EXPECT_TRUE(mesh.getFace(i).isQuad()) << "Face " << i << " should be a quad";
    }
}
