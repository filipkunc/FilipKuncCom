// Determine if all faces are triangles (use Loop) or not (use Catmull-Clark)
bool allTriangles = true;
for (const auto& face : faces) {
    if (face.isQuad()) {
        allTriangles = false;
        break;
    }
}

Sdc::SchemeType scheme = allTriangles
    ? Sdc::SCHEME_LOOP
    : Sdc::SCHEME_CATMARK;

// ...pack the faces, vertices, and per-corner UVs into a TopologyDescriptor...

Sdc::Options sdc_options;
sdc_options.SetVtxBoundaryInterpolation(Sdc::Options::VTX_BOUNDARY_EDGE_ONLY);
sdc_options.SetFVarLinearInterpolation(Sdc::Options::FVAR_LINEAR_CORNERS_ONLY);

Far::TopologyRefiner* refiner = Far::TopologyRefinerFactory<Far::TopologyDescriptor>::Create(
    desc,
    Far::TopologyRefinerFactory<Far::TopologyDescriptor>::Options(scheme, sdc_options)
);

refiner->RefineUniform(Far::TopologyRefiner::UniformOptions(level));
