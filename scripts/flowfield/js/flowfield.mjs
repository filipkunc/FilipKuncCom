// Thin wrapper over the C-ABI wasm module (see src/lib.rs). All field and
// agent data stays in wasm linear memory; this class hands out typed-array
// views over it. Views are recreated whenever the memory grows (growth
// detaches the old ArrayBuffer), and agent views are fetched per call because
// the underlying Vec may reallocate.

// Must match src/field.rs.
export const WALL = 255;
export const INT_COST_MASK = 0xffff;
export const INT_LOS = 1 << 16;
export const UNREACHABLE = 0xffff;
export const FLOW_DIR_MASK = 0x0f;
export const FLOW_PATHABLE = 1 << 4;
export const FLOW_LOS = 1 << 5;
export const DIR_NONE = 0x0f;

const S = Math.SQRT1_2;
export const DIR_VECTORS = [
  [1, 0], [S, S], [0, 1], [-S, S], [-1, 0], [-S, -S], [0, -1], [S, -S],
];

export class FlowField {
  /** @param {Response|Promise<Response>|ArrayBuffer|Uint8Array} source */
  static async load(source, width, height) {
    let result;
    if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
      result = await WebAssembly.instantiate(
        source instanceof Uint8Array ? source.slice().buffer : source,
        {},
      );
    } else {
      result = await WebAssembly.instantiateStreaming(source, {});
    }
    return new FlowField(result.instance, width, height);
  }

  constructor(instance, width, height) {
    this.exports = instance.exports;
    this.width = width;
    this.height = height;
    this.cells = width * height;
    this.handle = this.exports.ff_new(width, height);
    this.goal = null;
  }

  #view(Ctor, ptr, length) {
    return new Ctor(this.exports.memory.buffer, ptr, length);
  }

  // #region views
  /** Writable u8 view of the cost field (255 = wall). Call compute() after edits. */
  get cost() {
    return this.#view(Uint8Array, this.exports.ff_cost_ptr(this.handle), this.cells);
  }
  // #endregion

  /** u32 view: bits 0..16 integrated cost, bit 16 = line of sight to goal. */
  get integration() {
    return this.#view(Uint32Array, this.exports.ff_integration_ptr(this.handle), this.cells);
  }

  /** u8 view: bits 0..4 direction index, bit 4 pathable, bit 5 LOS. */
  get flow() {
    return this.#view(Uint8Array, this.exports.ff_flow_ptr(this.handle), this.cells);
  }

  /** @returns {boolean} false if the goal cell is a wall */
  compute(gx, gy) {
    const ok = this.exports.ff_compute(this.handle, gx, gy) === 1;
    if (ok) this.goal = { x: gx, y: gy };
    return ok;
  }

  spawn(x, y, count, seed = (Math.random() * 0xffffffff) >>> 0) {
    this.exports.ff_spawn(this.handle, x, y, count, seed);
  }

  clearAgents() {
    this.exports.ff_clear_agents(this.handle);
  }

  get agentCount() {
    return this.exports.ff_agent_count(this.handle);
  }

  /** Interleaved x,y per agent, in grid cells. Valid until the next spawn/grow. */
  get positions() {
    const n = this.agentCount;
    return this.#view(Float32Array, this.exports.ff_positions_ptr(this.handle), n * 2);
  }

  /** Interleaved vx,vy per agent. Valid until the next spawn/grow. */
  get velocities() {
    const n = this.agentCount;
    return this.#view(Float32Array, this.exports.ff_velocities_ptr(this.handle), n * 2);
  }

  /** Interleaved unit hx,hy per agent: render orientation, stable while parked. */
  get headings() {
    const n = this.agentCount;
    return this.#view(Float32Array, this.exports.ff_headings_ptr(this.handle), n * 2);
  }

  /** Agent kind per agent: 0 small, 1 medium, 2 large. */
  get kinds() {
    return this.#view(Uint8Array, this.exports.ff_kinds_ptr(this.handle), this.agentCount);
  }

  /** Effective body radius per agent, in grid cells. */
  get radii() {
    return this.#view(Float32Array, this.exports.ff_radii_ptr(this.handle), this.agentCount);
  }

  /** Global body size multiplier; clamped to [0.6, 1.3] in the sim. */
  setScale(scale) {
    this.exports.ff_set_scale(this.handle, scale);
  }

  /** Spread between kind sizes and speeds; 0 = uniform, clamped to [0, 1.6]. */
  setVariety(variety) {
    this.exports.ff_set_variety(this.handle, variety);
  }

  /** Contact distance multiplier (crowd footprint); clamped to [0.9, 2]. */
  setSpacing(spacing) {
    this.exports.ff_set_spacing(this.handle, spacing);
  }

  /** Global pace multiplier; clamped to [0.3, 5]. */
  setSpeed(speed) {
    this.exports.ff_set_speed(this.handle, speed);
  }

  step(dt) {
    this.exports.ff_step(this.handle, dt);
  }

  dispose() {
    this.exports.ff_free(this.handle);
    this.handle = 0;
  }
}
