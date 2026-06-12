//! C-ABI surface for the wasm build. No wasm-bindgen: the interface is a
//! handful of pointers into linear memory that the JS side wraps in typed
//! array views (see js/flowfield.mjs). State lives behind an opaque handle so
//! there are no mutable statics.

pub mod agents;
pub mod field;

use agents::Agents;
use field::FlowGrid;

// #region handle
pub struct State {
    grid: FlowGrid,
    agents: Agents,
}

/// # Safety
/// Handles returned by `ff_new` must only be used with these functions and
/// freed exactly once with `ff_free`.
#[no_mangle]
pub extern "C" fn ff_new(width: u32, height: u32) -> *mut State {
    let state = State {
        grid: FlowGrid::new(width, height),
        agents: Agents::new(),
    };
    Box::into_raw(Box::new(state))
}

#[no_mangle]
pub unsafe extern "C" fn ff_free(s: *mut State) {
    drop(Box::from_raw(s));
}
// #endregion

#[no_mangle]
pub unsafe extern "C" fn ff_cost_ptr(s: *mut State) -> *mut u8 {
    (*s).grid.cost.as_mut_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn ff_integration_ptr(s: *mut State) -> *const u32 {
    (*s).grid.integration.as_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn ff_flow_ptr(s: *mut State) -> *const u8 {
    (*s).grid.flow.as_ptr()
}

/// Recompute integration + flow toward (gx, gy). Returns 1 on success, 0 if
/// the goal is a wall or out of bounds.
#[no_mangle]
pub unsafe extern "C" fn ff_compute(s: *mut State, gx: u32, gy: u32) -> u32 {
    let state = &mut *s;
    let ok = state.grid.compute(gx, gy);
    if ok {
        state.agents.reset_arrival();
    }
    ok as u32
}

#[no_mangle]
pub unsafe extern "C" fn ff_spawn(s: *mut State, x: f32, y: f32, count: u32, seed: u32) {
    let state = &mut *s;
    state.agents.spawn(&state.grid, x, y, count, seed);
}

#[no_mangle]
pub unsafe extern "C" fn ff_clear_agents(s: *mut State) {
    (*s).agents.clear();
}

#[no_mangle]
pub unsafe extern "C" fn ff_agent_count(s: *mut State) -> u32 {
    (*s).agents.count() as u32
}

// #region pointers
/// Interleaved x,y per agent. Fetch after every call that may grow the agent
/// list, and re-view after any wasm memory growth.
#[no_mangle]
pub unsafe extern "C" fn ff_positions_ptr(s: *mut State) -> *const f32 {
    (*s).agents.pos.as_ptr()
}
// #endregion

#[no_mangle]
pub unsafe extern "C" fn ff_velocities_ptr(s: *mut State) -> *const f32 {
    (*s).agents.vel.as_ptr()
}

/// Interleaved unit hx,hy per agent: last movement heading, stable while the
/// agent is parked. Use this for rendering orientation.
#[no_mangle]
pub unsafe extern "C" fn ff_headings_ptr(s: *mut State) -> *const f32 {
    (*s).agents.heading.as_ptr()
}

/// Agent kind per agent (0 = small, 1 = medium, 2 = large); render color.
#[no_mangle]
pub unsafe extern "C" fn ff_kinds_ptr(s: *mut State) -> *const u8 {
    (*s).agents.kind.as_ptr()
}

/// Effective body radius per agent, in grid cells; render size.
#[no_mangle]
pub unsafe extern "C" fn ff_radii_ptr(s: *mut State) -> *const f32 {
    (*s).agents.radii.as_ptr()
}

/// Global body size multiplier (the UI slider). Clamped in the sim.
#[no_mangle]
pub unsafe extern "C" fn ff_set_scale(s: *mut State, scale: f32) {
    (*s).agents.set_scale(scale);
}

/// Spread between kind sizes and speeds: 0 = uniform agents. Clamped.
#[no_mangle]
pub unsafe extern "C" fn ff_set_variety(s: *mut State, variety: f32) {
    (*s).agents.set_variety(variety);
}

/// Contact distance multiplier: how much area the crowd occupies. Clamped.
#[no_mangle]
pub unsafe extern "C" fn ff_set_spacing(s: *mut State, spacing: f32) {
    (*s).agents.set_spacing(spacing);
}

/// Global pace multiplier. Clamped.
#[no_mangle]
pub unsafe extern "C" fn ff_set_speed(s: *mut State, speed: f32) {
    (*s).agents.set_speed(speed);
}

#[no_mangle]
pub unsafe extern "C" fn ff_step(s: *mut State, dt: f32) {
    let state = &mut *s;
    state.agents.step(&state.grid, dt);
}
