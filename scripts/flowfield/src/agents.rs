//! Agents that follow the flow field, with pairwise separation via a uniform
//! grid (one bucket per flow field cell, intrusive linked lists so the only
//! per-step allocations are the two index arrays, reused across steps).
//!
//! Units: positions are in grid cells, speeds in cells/second. Deterministic
//! by construction — fixed iteration order, no time-based or random state
//! outside the seeded spawn LCG.

use crate::field::{
    FlowGrid, DIR_VECTORS, DIR_NONE, FLOW_DIR_MASK, FLOW_LOS, INT_COST_MASK, WALL,
};

pub const MAX_AGENTS: usize = 20_000;

const SPEED: f32 = 3.0;
const MAX_SPEED: f32 = 4.5;
const ACCEL: f32 = 8.0;
const SEPARATION: f32 = 10.0;
const ARRIVE_RADIUS: f32 = 2.0;
/// Gauss-Seidel iterations of hard overlap resolution per step.
const COLLISION_ITERATIONS: u32 = 2;

/// Three agent kinds (think zergling / roach / ultralisk): base body radius
/// in grid cells, speed multiplier (small = nimble, large = lumbering), and
/// spawn weight. The global `scale` from the UI slider multiplies the radii.
pub const KIND_COUNT: usize = 3;
pub const BASE_RADII: [f32; KIND_COUNT] = [0.28, 0.36, 0.46];
/// Cumulative spawn weights: 50% small, 35% medium, 15% large.
const KIND_SPAWN_CDF: [f32; KIND_COUNT] = [0.5, 0.85, 1.0];
/// Per-agent random speed jitter range, applied at spawn.
const JITTER_MIN: f32 = 0.92;
const JITTER_SPAN: f32 = 0.16;
/// Body radius bounds in grid cells; the bucket scan radius adapts to the
/// largest contact distance, these just keep sizes sane vs the cell size.
pub const MAX_RADIUS: f32 = 0.5;
pub const MIN_RADIUS: f32 = 0.15;
pub const MIN_SCALE: f32 = 0.6;
pub const MAX_SCALE: f32 = 1.3;
/// Variety blends each kind's radius between the medium radius (0 = uniform
/// sizes) and an exaggerated spread of the BASE_RADII ratios.
pub const MIN_VARIETY: f32 = 0.0;
pub const MAX_VARIETY: f32 = 1.6;
/// Spacing pads the contact distance between bodies: 1 = touching bodies,
/// larger = the same crowd occupies more area. The neighbor scan radius
/// grows with the largest possible contact distance, so the full slider
/// range has a real effect (no silent cap).
pub const MIN_SPACING: f32 = 0.9;
pub const MAX_SPACING: f32 = 2.0;
/// Global pace multiplier from the UI slider.
pub const MIN_SPEED_SCALE: f32 = 0.3;
pub const MAX_SPEED_SCALE: f32 = 5.0;

pub struct Agents {
    /// Interleaved x,y in grid cells; length = 2 * count.
    pub pos: Vec<f32>,
    /// Interleaved vx,vy; length = 2 * count.
    pub vel: Vec<f32>,
    /// Interleaved unit hx,hy: last movement heading, kept while parked so
    /// stopped agents don't all snap to a default facing.
    pub heading: Vec<f32>,
    /// 1 once the agent has arrived (reached the goal or piled up against
    /// agents that did). Cleared on every new flow field compute.
    pub arrived: Vec<u8>,
    /// Position at the previous step, to measure actual displacement
    /// (velocity alone misses positional collision corrections).
    prev: Vec<f32>,
    /// Seconds spent moving well below cruise speed; gates arrival contagion
    /// so a flowing column doesn't park, only genuinely blocked agents do.
    stall: Vec<f32>,
    /// Agent kind, 0..KIND_COUNT; drives radius, speed, and render color.
    pub kind: Vec<u8>,
    /// Effective body radius per agent: BASE_RADII[kind] * scale, clamped.
    pub radii: Vec<f32>,
    /// Per-agent speed multiplier: smaller bodies move faster (inverse
    /// square root of the variety-spread radius) times a spawn jitter.
    speed: Vec<f32>,
    /// Spawn-time random speed jitter, kept so rescaling can recompute speed.
    jitter: Vec<f32>,
    /// Global size multiplier from the UI slider.
    scale: f32,
    /// Spread between kind sizes from the UI slider; see MAX_VARIETY.
    variety: f32,
    /// Contact distance multiplier from the UI slider; see MAX_SPACING.
    spacing: f32,
    /// Global pace multiplier from the UI slider.
    speed_scale: f32,
    /// Uniform-grid bucket heads, one per flow grid cell; -1 = empty.
    head: Vec<i32>,
    /// Next agent index in the same bucket; -1 = end.
    next: Vec<i32>,
}

/// Kind radius with the variety spread applied, before global scale.
fn spread_radius(kind: u8, variety: f32) -> f32 {
    let mid = BASE_RADII[1];
    mid + (BASE_RADII[kind as usize] - mid) * variety
}

fn effective_radius(kind: u8, scale: f32, variety: f32) -> f32 {
    (spread_radius(kind, variety) * scale).clamp(MIN_RADIUS, MAX_RADIUS)
}

/// Movement slowdown from the terrain under the agent: expensive ground is
/// waded through at 1/sqrt(cost) pace (cost 8 mud ~ 35% speed), and leaving
/// it restores full speed since this is sampled per step from the cell.
#[inline]
fn terrain_mult(cost: u8) -> f32 {
    if cost <= 1 {
        1.0
    } else {
        1.0 / (cost as f32).sqrt()
    }
}

/// Smaller bodies are nimbler: speed falls off as the square root of the
/// spread radius, so the variety slider widens speed differences along with
/// size differences. Global scale deliberately does not change pace.
fn kind_speed(kind: u8, variety: f32) -> f32 {
    (BASE_RADII[1] / spread_radius(kind, variety)).sqrt()
}

impl Agents {
    pub fn new() -> Self {
        Agents {
            pos: Vec::new(),
            vel: Vec::new(),
            heading: Vec::new(),
            arrived: Vec::new(),
            prev: Vec::new(),
            stall: Vec::new(),
            kind: Vec::new(),
            radii: Vec::new(),
            speed: Vec::new(),
            jitter: Vec::new(),
            scale: 1.0,
            variety: 1.0,
            spacing: 1.0,
            speed_scale: 1.0,
            head: Vec::new(),
            next: Vec::new(),
        }
    }

    fn rescale_all(&mut self) {
        for i in 0..self.count() {
            self.radii[i] = effective_radius(self.kind[i], self.scale, self.variety);
            self.speed[i] = kind_speed(self.kind[i], self.variety) * self.jitter[i];
        }
    }

    /// Set the global size multiplier and rescale every body.
    pub fn set_scale(&mut self, scale: f32) {
        self.scale = scale.clamp(MIN_SCALE, MAX_SCALE);
        self.rescale_all();
    }

    /// Set the spread between kind sizes (0 = uniform) and rescale.
    pub fn set_variety(&mut self, variety: f32) {
        self.variety = variety.clamp(MIN_VARIETY, MAX_VARIETY);
        self.rescale_all();
    }

    /// Set the contact distance multiplier (crowd footprint area).
    pub fn set_spacing(&mut self, spacing: f32) {
        self.spacing = spacing.clamp(MIN_SPACING, MAX_SPACING);
    }

    /// Set the global pace multiplier.
    pub fn set_speed(&mut self, speed: f32) {
        self.speed_scale = speed.clamp(MIN_SPEED_SCALE, MAX_SPEED_SCALE);
    }

    #[inline]
    fn contact_dist(&self, i: usize, j: usize) -> f32 {
        (self.radii[i] + self.radii[j]) * self.spacing
    }

    /// Bucket scan radius in cells, covering the largest possible contact
    /// distance under the current scale/variety/spacing. Kind ordering is
    /// preserved by the variety blend, so the largest kind bounds the pair.
    fn scan_radius(&self) -> i32 {
        let r_max = effective_radius((KIND_COUNT - 1) as u8, self.scale, self.variety);
        (2.0 * r_max * self.spacing).ceil().max(1.0) as i32
    }

    pub fn count(&self) -> usize {
        self.pos.len() / 2
    }

    pub fn clear(&mut self) {
        self.pos.clear();
        self.vel.clear();
        self.heading.clear();
        self.arrived.clear();
        self.prev.clear();
        self.stall.clear();
        self.kind.clear();
        self.radii.clear();
        self.speed.clear();
        self.jitter.clear();
    }

    /// New goal: everyone is on the move again.
    pub fn reset_arrival(&mut self) {
        self.arrived.fill(0);
        self.stall.fill(0.0);
    }

    /// Spawn up to `count` agents in a disc around (cx, cy), skipping walls.
    /// The LCG keeps spawning deterministic for a given seed.
    pub fn spawn(&mut self, grid: &FlowGrid, cx: f32, cy: f32, count: u32, seed: u32) {
        let mut rng = seed | 1;
        let mut rand = move || {
            rng = rng.wrapping_mul(1664525).wrapping_add(1013904223);
            (rng >> 8) as f32 / (1 << 24) as f32
        };
        // Disc sized so density stays roughly constant as count grows.
        let avg = BASE_RADII[1] * self.scale;
        let radius = (count as f32 * avg * avg * 3.5).sqrt().max(1.0);
        for _ in 0..count {
            if self.count() >= MAX_AGENTS {
                return;
            }
            for _attempt in 0..8 {
                let a = rand() * std::f32::consts::TAU;
                let r = rand().sqrt() * radius;
                let x = (cx + a.cos() * r).clamp(0.0, grid.width as f32 - 0.001);
                let y = (cy + a.sin() * r).clamp(0.0, grid.height as f32 - 0.001);
                if grid.cost[grid.idx(x as u32, y as u32)] != WALL {
                    self.pos.push(x);
                    self.pos.push(y);
                    self.vel.push(0.0);
                    self.vel.push(0.0);
                    let ha = rand() * std::f32::consts::TAU;
                    self.heading.push(ha.cos());
                    self.heading.push(ha.sin());
                    self.arrived.push(0);
                    self.prev.push(x);
                    self.prev.push(y);
                    self.stall.push(0.0);
                    let roll = rand();
                    let kind = KIND_SPAWN_CDF.iter().position(|&c| roll < c).unwrap_or(0) as u8;
                    self.kind.push(kind);
                    self.radii.push(effective_radius(kind, self.scale, self.variety));
                    let jitter = JITTER_MIN + rand() * JITTER_SPAN;
                    self.jitter.push(jitter);
                    self.speed.push(kind_speed(kind, self.variety) * jitter);
                    break;
                }
            }
        }
    }

    pub fn step(&mut self, grid: &FlowGrid, dt: f32) {
        let n = self.count();
        if n == 0 {
            return;
        }
        let w = grid.width as i32;
        let h = grid.height as i32;
        let (gx, gy) = grid.goal;
        let goal = (gx as f32 + 0.5, gy as f32 + 0.5);

        // Stall tracking from actual displacement since the last step.
        for i in 0..n {
            let ddx = self.pos[2 * i] - self.prev[2 * i];
            let ddy = self.pos[2 * i + 1] - self.prev[2 * i + 1];
            let moved = (ddx * ddx + ddy * ddy).sqrt() / dt;
            // The stall threshold tracks the global pace and the terrain
            // underfoot, so slow or wading crowds don't read as "blocked"
            // and park mid-march.
            let terrain = terrain_mult(
                grid.cost[grid.idx(self.pos[2 * i] as u32, self.pos[2 * i + 1] as u32)],
            );
            if moved < SPEED * self.speed_scale * terrain * 0.35 {
                self.stall[i] += dt;
            } else {
                self.stall[i] = 0.0;
            }
            self.prev[2 * i] = self.pos[2 * i];
            self.prev[2 * i + 1] = self.pos[2 * i + 1];
        }

        self.rebuild_buckets(grid);

        for i in 0..n {
            let x = self.pos[2 * i];
            let y = self.pos[2 * i + 1];
            let cell = grid.idx(x as u32, y as u32);

            // Desired direction: straight at the goal when the cell has line
            // of sight, otherwise the cell's quantized flow direction.
            let to_goal = (goal.0 - x, goal.1 - y);
            let goal_dist = (to_goal.0 * to_goal.0 + to_goal.1 * to_goal.1).sqrt();
            if goal_dist < 1.0 {
                self.arrived[i] = 1;
            }
            let desired = if self.arrived[i] == 1 {
                // Parked: hold position, let collisions shuffle us around.
                (0.0, 0.0)
            } else {
                let flow = grid.flow[cell];
                let (dx, dy) = if flow & FLOW_LOS != 0 && goal_dist > 1e-3 {
                    (to_goal.0 / goal_dist, to_goal.1 / goal_dist)
                } else {
                    let dir = flow & FLOW_DIR_MASK;
                    if dir == DIR_NONE {
                        (0.0, 0.0)
                    } else {
                        DIR_VECTORS[dir as usize]
                    }
                };
                // Slow into the goal so arrivals pool instead of orbiting.
                let arrive = (goal_dist / ARRIVE_RADIUS).min(1.0);
                let speed =
                    SPEED * self.speed_scale * self.speed[i] * terrain_mult(grid.cost[cell]);
                (dx * speed * arrive, dy * speed * arrive)
            };

            let (px, py) = self.separation(i, x, y, w, h);

            let vx = self.vel[2 * i];
            let vy = self.vel[2 * i + 1];
            let blend = (ACCEL * dt).min(1.0);
            let mut nvx = vx + (desired.0 - vx) * blend + px * SEPARATION * dt;
            let mut nvy = vy + (desired.1 - vy) * blend + py * SEPARATION * dt;
            let max_speed =
                MAX_SPEED * self.speed_scale * self.speed[i] * terrain_mult(grid.cost[cell]);
            let speed = (nvx * nvx + nvy * nvy).sqrt();
            if speed > max_speed {
                nvx *= max_speed / speed;
                nvy *= max_speed / speed;
            }

            // Integrate per axis so a wall hit slides instead of sticking.
            let eps = 0.001;
            let max_x = grid.width as f32 - eps;
            let max_y = grid.height as f32 - eps;
            let tx = (x + nvx * dt).clamp(0.0, max_x);
            if grid.cost[grid.idx(tx as u32, y as u32)] != WALL {
                self.pos[2 * i] = tx;
            } else {
                nvx = 0.0;
            }
            let cx = self.pos[2 * i];
            let ty = (y + nvy * dt).clamp(0.0, max_y);
            if grid.cost[grid.idx(cx as u32, ty as u32)] != WALL {
                self.pos[2 * i + 1] = ty;
            } else {
                nvy = 0.0;
            }
            self.vel[2 * i] = nvx;
            self.vel[2 * i + 1] = nvy;
            let speed = (nvx * nvx + nvy * nvy).sqrt();
            if speed > 0.2 {
                self.heading[2 * i] = nvx / speed;
                self.heading[2 * i + 1] = nvy / speed;
            }
        }

        // Hard collision: separation steering spreads agents out ahead of
        // time, but only positional push-out keeps bodies from overlapping
        // when a crowd packs around the goal or squeezes through a gap.
        for _ in 0..COLLISION_ITERATIONS {
            self.rebuild_buckets(grid);
            self.resolve_overlaps(grid);
        }
    }

    /// Position-based overlap resolution: each intersecting pair is pushed
    /// apart by half the overlap each, wall-aware. Pairs are processed once
    /// (j > i) in fixed index order, so the result stays deterministic.
    fn resolve_overlaps(&mut self, grid: &FlowGrid) {
        let w = grid.width as i32;
        let h = grid.height as i32;
        let n = self.count();
        let scan = self.scan_radius();
        for i in 0..n {
            let x = self.pos[2 * i];
            let y = self.pos[2 * i + 1];
            let cx = x as i32;
            let cy = y as i32;
            for by in (cy - scan).max(0)..=(cy + scan).min(h - 1) {
                for bx in (cx - scan).max(0)..=(cx + scan).min(w - 1) {
                    let mut j = self.head[(by * w + bx) as usize];
                    while j >= 0 {
                        let ju = j as usize;
                        if ju > i {
                            self.push_apart(i, ju, grid);
                        }
                        j = self.next[ju];
                    }
                }
            }
        }
    }

    fn push_apart(&mut self, i: usize, j: usize, grid: &FlowGrid) {
        let min_dist = self.contact_dist(i, j);
        let dx = self.pos[2 * i] - self.pos[2 * j];
        let dy = self.pos[2 * i + 1] - self.pos[2 * j + 1];
        let d2 = dx * dx + dy * dy;
        if d2 >= min_dist * min_dist {
            return;
        }
        let (nx, ny, overlap) = if d2 > 1e-9 {
            let d = d2.sqrt();
            (dx / d, dy / d, min_dist - d)
        } else {
            // Coincident agents: pick a deterministic axis from the indices.
            let angle = ((i * 31 + j) % 64) as f32 * (std::f32::consts::TAU / 64.0);
            (angle.cos(), angle.sin(), min_dist)
        };
        let half = overlap * 0.5;
        self.move_clamped(i, nx * half, ny * half, grid);
        self.move_clamped(j, -nx * half, -ny * half, grid);

        // Arrival contagion: touching a parked agent that is closer to the
        // goal (by integrated cost, so the chain can't jump across a wall)
        // parks us too, but only once we are genuinely blocked (stalled),
        // so a flowing column doesn't freeze tail-first. This is what makes
        // a crowd pile up zergling-style instead of grinding into the center.
        const STALL_TO_PARK: f32 = 0.35;
        let ci = grid.integration
            [grid.idx(self.pos[2 * i] as u32, self.pos[2 * i + 1] as u32)]
            & INT_COST_MASK;
        let cj = grid.integration
            [grid.idx(self.pos[2 * j] as u32, self.pos[2 * j + 1] as u32)]
            & INT_COST_MASK;
        if self.arrived[j] == 1
            && self.arrived[i] == 0
            && self.stall[i] >= STALL_TO_PARK
            && ci >= cj
            && ci - cj <= 4
        {
            self.arrived[i] = 1;
        } else if self.arrived[i] == 1
            && self.arrived[j] == 0
            && self.stall[j] >= STALL_TO_PARK
            && cj >= ci
            && cj - ci <= 4
        {
            self.arrived[j] = 1;
        }
    }

    /// Apply a positional correction with the same per-axis wall slide rule
    /// as the integrator, so push-out never shoves an agent into a wall.
    fn move_clamped(&mut self, i: usize, dx: f32, dy: f32, grid: &FlowGrid) {
        let eps = 0.001;
        let x = self.pos[2 * i];
        let y = self.pos[2 * i + 1];
        let tx = (x + dx).clamp(0.0, grid.width as f32 - eps);
        if grid.cost[grid.idx(tx as u32, y as u32)] != WALL {
            self.pos[2 * i] = tx;
        }
        let x2 = self.pos[2 * i];
        let ty = (y + dy).clamp(0.0, grid.height as f32 - eps);
        if grid.cost[grid.idx(x2 as u32, ty as u32)] != WALL {
            self.pos[2 * i + 1] = ty;
        }
    }

    fn rebuild_buckets(&mut self, grid: &FlowGrid) {
        let cells = (grid.width * grid.height) as usize;
        self.head.clear();
        self.head.resize(cells, -1);
        self.next.clear();
        self.next.resize(self.count(), -1);
        for i in 0..self.count() {
            let cell = grid.idx(self.pos[2 * i] as u32, self.pos[2 * i + 1] as u32);
            self.next[i] = self.head[cell];
            self.head[cell] = i as i32;
        }
    }

    /// Accumulated push away from neighbors within touching distance. This
    /// is only a pre-spreading steering hint (the push-out pass enforces the
    /// real contact distance), so it deliberately keeps the cheap 3x3 scan
    /// and caps its influence distance at one cell.
    fn separation(&self, i: usize, x: f32, y: f32, w: i32, h: i32) -> (f32, f32) {
        let mut px = 0.0;
        let mut py = 0.0;
        let cx = x as i32;
        let cy = y as i32;
        for by in (cy - 1).max(0)..=(cy + 1).min(h - 1) {
            for bx in (cx - 1).max(0)..=(cx + 1).min(w - 1) {
                let mut j = self.head[(by * w + bx) as usize];
                while j >= 0 {
                    let ju = j as usize;
                    if ju != i {
                        let min_dist = self.contact_dist(i, ju).min(1.0);
                        let ddx = x - self.pos[2 * ju];
                        let ddy = y - self.pos[2 * ju + 1];
                        let d2 = ddx * ddx + ddy * ddy;
                        if d2 < min_dist * min_dist && d2 > 1e-9 {
                            let d = d2.sqrt();
                            let push = (min_dist - d) / min_dist;
                            px += ddx / d * push;
                            py += ddy / d * push;
                        }
                    }
                    j = self.next[ju];
                }
            }
        }
        (px, py)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn agents_reach_goal() {
        let mut g = FlowGrid::new(16, 16);
        for y in 0..12 {
            let i = g.idx(8, y);
            g.cost[i] = WALL;
        }
        assert!(g.compute(14, 2));
        let mut a = Agents::new();
        a.spawn(&g, 2.0, 2.0, 50, 7);
        assert_eq!(a.count(), 50);
        for _ in 0..(30.0 / 0.016) as usize {
            a.step(&g, 0.016);
        }
        // Everyone made it around the wall and near the goal.
        for i in 0..a.count() {
            let dx = a.pos[2 * i] - 14.5;
            let dy = a.pos[2 * i + 1] - 2.5;
            let dist = (dx * dx + dy * dy).sqrt();
            assert!(dist < 4.5, "agent {i} stuck at dist {dist}");
        }
    }

    #[test]
    fn kinds_are_mixed_and_scale_applies() {
        let g = FlowGrid::new(32, 32);
        let mut a = Agents::new();
        a.spawn(&g, 16.0, 16.0, 600, 5);
        let mut seen = [0u32; KIND_COUNT];
        for &k in &a.kind {
            seen[k as usize] += 1;
        }
        for (k, &n) in seen.iter().enumerate() {
            assert!(n > 0, "kind {k} never spawned");
        }
        let before = a.radii[0];
        a.set_scale(1.3);
        assert!(a.radii[0] > before);
        assert!(a.radii.iter().all(|&r| r <= MAX_RADIUS));
    }

    #[test]
    fn variety_zero_means_uniform_sizes_and_speeds() {
        let g = FlowGrid::new(32, 32);
        let mut a = Agents::new();
        a.spawn(&g, 16.0, 16.0, 200, 11);
        a.set_variety(0.0);
        let r0 = a.radii[0];
        assert!(a.radii.iter().all(|&r| (r - r0).abs() < 1e-6));
        // Speeds keep only the per-agent jitter at variety 0.
        assert!(a
            .speed
            .iter()
            .all(|&s| (JITTER_MIN..=JITTER_MIN + JITTER_SPAN).contains(&s)));
        // At full variety, smaller kinds are strictly faster on average.
        a.set_variety(1.0);
        let small = a.speed.iter().zip(&a.kind).filter(|(_, &k)| k == 0).count();
        assert!(small > 0);
        for i in 0..a.count() {
            for j in 0..a.count() {
                if a.kind[i] == 0 && a.kind[j] == 2 {
                    // Worst-case jitter cannot invert the kind ordering.
                    assert!(
                        kind_speed(0, 1.0) * JITTER_MIN
                            > kind_speed(2, 1.0) * (JITTER_MIN + JITTER_SPAN)
                    );
                }
            }
        }
    }

    #[test]
    fn spacing_grows_the_crowd_footprint() {
        let mut tight = Agents::new();
        let mut loose = Agents::new();
        let mut g = FlowGrid::new(32, 32);
        assert!(g.compute(16, 16));
        for a in [&mut tight, &mut loose] {
            a.spawn(&g, 16.0, 16.0, 300, 99);
        }
        loose.set_spacing(2.0);
        for _ in 0..(12.0 / 0.016) as usize {
            tight.step(&g, 0.016);
            loose.step(&g, 0.016);
        }
        let spread = |a: &Agents| {
            let mut sum = 0.0;
            for i in 0..a.count() {
                let dx = a.pos[2 * i] - 16.5;
                let dy = a.pos[2 * i + 1] - 16.5;
                sum += (dx * dx + dy * dy).sqrt();
            }
            sum / a.count() as f32
        };
        assert!(
            spread(&loose) > spread(&tight) * 1.5,
            "loose {} vs tight {}",
            spread(&loose),
            spread(&tight)
        );
    }

    #[test]
    fn speed_scale_changes_pace_without_premature_parking() {
        let mut g = FlowGrid::new(64, 16);
        assert!(g.compute(60, 8));
        let mut slow = Agents::new();
        let mut fast = Agents::new();
        for a in [&mut slow, &mut fast] {
            a.spawn(&g, 6.0, 8.0, 100, 3);
        }
        slow.set_speed(0.3);
        fast.set_speed(2.5);
        let progress = |a: &Agents| {
            (0..a.count()).map(|i| a.pos[2 * i]).sum::<f32>() / a.count() as f32
        };
        let start = progress(&slow);
        for _ in 0..300 {
            slow.step(&g, 0.016);
            fast.step(&g, 0.016);
        }
        let slow_gain = progress(&slow) - start;
        let fast_gain = progress(&fast) - start;
        assert!(
            fast_gain > slow_gain * 3.0,
            "fast {fast_gain} vs slow {slow_gain}"
        );
        // The slow crowd is marching, not parked by a mis-scaled stall gate.
        assert!(slow_gain > 1.0, "slow crowd barely moved: {slow_gain}");
        let parked = slow.arrived.iter().filter(|&&p| p == 1).count();
        assert_eq!(parked, 0, "{parked} slow agents parked mid-march");
    }

    #[test]
    fn mud_slows_agents_and_speed_recovers() {
        // Full-height mud band: no detour exists, agents must wade through.
        let mut clear = FlowGrid::new(48, 9);
        let mut muddy = FlowGrid::new(48, 9);
        for y in 0..9 {
            for x in 16..28 {
                let i = muddy.idx(x, y);
                muddy.cost[i] = 8;
            }
        }
        assert!(clear.compute(44, 4));
        assert!(muddy.compute(44, 4));
        let mut a = Agents::new();
        let mut b = Agents::new();
        a.spawn(&clear, 4.0, 4.0, 40, 7);
        b.spawn(&muddy, 4.0, 4.0, 40, 7);
        let avg_x = |a: &Agents| {
            (0..a.count()).map(|i| a.pos[2 * i]).sum::<f32>() / a.count() as f32
        };
        // While the muddy group wades, the clear group pulls far ahead.
        for _ in 0..400 {
            a.step(&clear, 0.016);
            b.step(&muddy, 0.016);
        }
        assert!(
            avg_x(&a) > avg_x(&b) + 4.0,
            "clear {} vs muddy {}",
            avg_x(&a),
            avg_x(&b)
        );
        // Speed recovers after the mud: the muddy group still arrives.
        for _ in 0..2500 {
            b.step(&muddy, 0.016);
        }
        assert!(avg_x(&b) > 40.0, "muddy group never recovered: {}", avg_x(&b));
    }

    #[test]
    fn scan_radius_tracks_spacing() {
        let mut a = Agents::new();
        assert_eq!(a.scan_radius(), 1);
        a.set_spacing(2.0);
        assert_eq!(a.scan_radius(), 2);
        a.set_scale(1.3);
        // 2 * 0.5 (clamped) * 2.0 = 2.0 cells.
        assert_eq!(a.scan_radius(), 2);
    }

    #[test]
    fn agents_never_enter_walls() {
        let mut g = FlowGrid::new(16, 16);
        for y in 0..16 {
            let i = g.idx(8, y);
            if y != 8 {
                g.cost[i] = WALL;
            }
        }
        assert!(g.compute(14, 8));
        let mut a = Agents::new();
        a.spawn(&g, 3.0, 8.0, 200, 42);
        for _ in 0..1500 {
            a.step(&g, 0.016);
            for i in 0..a.count() {
                let cell = g.idx(a.pos[2 * i] as u32, a.pos[2 * i + 1] as u32);
                assert_ne!(g.cost[cell], WALL, "agent {i} inside a wall");
            }
        }
    }

    #[test]
    fn settled_crowd_does_not_overlap() {
        let mut g = FlowGrid::new(32, 32);
        assert!(g.compute(16, 16));
        let mut a = Agents::new();
        a.spawn(&g, 16.0, 16.0, 400, 99);
        for _ in 0..(12.0 / 0.016) as usize {
            a.step(&g, 0.016);
        }
        // The packed blob around the goal may keep a little residual squeeze
        // from arrivals pushing in; allow 15% of the pair's contact distance.
        let mut worst = f32::MAX; // ratio of distance to contact distance
        for i in 0..a.count() {
            for j in (i + 1)..a.count() {
                let dx = a.pos[2 * i] - a.pos[2 * j];
                let dy = a.pos[2 * i + 1] - a.pos[2 * j + 1];
                let d = (dx * dx + dy * dy).sqrt();
                let ratio = d / a.contact_dist(i, j);
                if ratio < worst {
                    worst = ratio;
                }
            }
        }
        assert!(worst >= 0.85, "closest pair at {worst} of contact distance");
    }

    #[test]
    fn spawn_is_deterministic() {
        let g = FlowGrid::new(16, 16);
        let mut a = Agents::new();
        let mut b = Agents::new();
        a.spawn(&g, 8.0, 8.0, 100, 1234);
        b.spawn(&g, 8.0, 8.0, 100, 1234);
        assert_eq!(a.pos, b.pos);
    }
}
