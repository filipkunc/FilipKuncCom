//! Flow field tiles after Emerson, "Crowd Pathfinding and Steering Using Flow
//! Field Tiles" (Game AI Pro ch. 23). Field layouts follow the chapter:
//!
//!   cost field        u8   255 = wall, 1..=254 = traversal cost
//!   integration field u32  bits 0..16 integrated cost, bits 16.. flags
//!   flow field        u8   bits 0..4 direction LUT index, bits 4.. flags
//!
//! The chapter calls the integrator an "Eikonal equation" method, but the
//! 4-neighbor min-sum update it describes is a Dijkstra-style relaxation;
//! that is what runs here. The Bresenham line-of-sight pass is the chapter's
//! fix for diamond-shaped flow around the goal: LOS cells steer straight at
//! the goal instead of along the quantized direction LUT.

pub const WALL: u8 = 255;

pub const INT_COST_MASK: u32 = 0xFFFF;
pub const INT_LOS: u32 = 1 << 16;
pub const UNREACHABLE: u32 = 0xFFFF;

pub const FLOW_DIR_MASK: u8 = 0x0F;
pub const FLOW_PATHABLE: u8 = 1 << 4;
pub const FLOW_LOS: u8 = 1 << 5;
/// Direction index meaning "no direction" (goal cell, or nothing reachable).
pub const DIR_NONE: u8 = 0x0F;

/// 8-way direction LUT. Index = flow field bits 0..4. Order: E, SE, S, SW, W,
/// NW, N, NE with +y pointing down (row-major grid).
pub const DIR_OFFSETS: [(i32, i32); 8] = [
    (1, 0),
    (1, 1),
    (0, 1),
    (-1, 1),
    (-1, 0),
    (-1, -1),
    (0, -1),
    (1, -1),
];

const INV_SQRT2: f32 = std::f32::consts::FRAC_1_SQRT_2;
pub const DIR_VECTORS: [(f32, f32); 8] = [
    (1.0, 0.0),
    (INV_SQRT2, INV_SQRT2),
    (0.0, 1.0),
    (-INV_SQRT2, INV_SQRT2),
    (-1.0, 0.0),
    (-INV_SQRT2, -INV_SQRT2),
    (0.0, -1.0),
    (INV_SQRT2, -INV_SQRT2),
];

pub struct FlowGrid {
    pub width: u32,
    pub height: u32,
    pub cost: Vec<u8>,
    pub integration: Vec<u32>,
    pub flow: Vec<u8>,
    pub goal: (u32, u32),
    /// Scratch heap, kept to avoid reallocating per compute.
    heap: std::collections::BinaryHeap<std::cmp::Reverse<(u32, u32)>>,
}

impl FlowGrid {
    pub fn new(width: u32, height: u32) -> Self {
        let n = (width * height) as usize;
        FlowGrid {
            width,
            height,
            cost: vec![1; n],
            integration: vec![UNREACHABLE; n],
            flow: vec![0; n],
            goal: (0, 0),
            heap: std::collections::BinaryHeap::new(),
        }
    }

    #[inline]
    pub fn idx(&self, x: u32, y: u32) -> usize {
        (y * self.width + x) as usize
    }

    #[inline]
    fn is_wall(&self, x: i32, y: i32) -> bool {
        if x < 0 || y < 0 || x >= self.width as i32 || y >= self.height as i32 {
            return true;
        }
        self.cost[(y as u32 * self.width + x as u32) as usize] == WALL
    }

    /// Recompute integration + flow toward (gx, gy). Returns false if the
    /// goal is a wall or out of bounds.
    pub fn compute(&mut self, gx: u32, gy: u32) -> bool {
        if gx >= self.width || gy >= self.height {
            return false;
        }
        let goal_idx = self.idx(gx, gy);
        if self.cost[goal_idx] == WALL {
            return false;
        }
        self.goal = (gx, gy);

        self.integrate(goal_idx);
        self.line_of_sight_pass(gx, gy);
        self.build_flow(goal_idx);
        true
    }

    /// Dijkstra wavefront from the goal over 4-neighbors: each cell's
    /// integrated cost is the cheapest (neighbor integrated cost + own cost
    /// field), exactly the chapter's update rule.
    fn integrate(&mut self, goal_idx: usize) {
        for v in self.integration.iter_mut() {
            *v = UNREACHABLE;
        }
        self.integration[goal_idx] = 0;
        self.heap.clear();
        self.heap.push(std::cmp::Reverse((0, goal_idx as u32)));

        let w = self.width as i32;
        let h = self.height as i32;
        while let Some(std::cmp::Reverse((dist, idx))) = self.heap.pop() {
            let idx = idx as usize;
            if dist > self.integration[idx] & INT_COST_MASK {
                continue;
            }
            let x = idx as i32 % w;
            let y = idx as i32 / w;
            for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1)] {
                let (nx, ny) = (x + dx, y + dy);
                if nx < 0 || ny < 0 || nx >= w || ny >= h {
                    continue;
                }
                let nidx = (ny * w + nx) as usize;
                let step = self.cost[nidx];
                if step == WALL {
                    continue;
                }
                let nd = (dist + step as u32).min(UNREACHABLE - 1);
                if nd < self.integration[nidx] & INT_COST_MASK {
                    self.integration[nidx] = nd;
                    self.heap.push(std::cmp::Reverse((nd, nidx as u32)));
                }
            }
        }
    }

    /// Mark every reachable cell that has an unobstructed Bresenham line to
    /// the goal. Agents in LOS cells steer straight at the goal, which kills
    /// the diamond-shaped flow artifact near it. The line must cross only
    /// cheapest-cost ground: a straight shot through mud may be longer in
    /// integrated cost than the detour the flow field found, so expensive
    /// terrain blocks LOS the same way a wall does.
    fn line_of_sight_pass(&mut self, gx: u32, gy: u32) {
        let w = self.width;
        for y in 0..self.height {
            for x in 0..w {
                let idx = (y * w + x) as usize;
                if self.cost[idx] == WALL
                    || self.integration[idx] & INT_COST_MASK == UNREACHABLE
                {
                    continue;
                }
                if self.line_clear(x as i32, y as i32, gx as i32, gy as i32) {
                    self.integration[idx] |= INT_LOS;
                }
            }
        }
    }

    /// Bresenham walk from (x0,y0) to (x1,y1); true if every cell on the
    /// line is plain cheapest-cost ground (no wall, no expensive terrain).
    fn line_clear(&self, mut x0: i32, mut y0: i32, x1: i32, y1: i32) -> bool {
        let dx = (x1 - x0).abs();
        let dy = -(y1 - y0).abs();
        let sx = if x0 < x1 { 1 } else { -1 };
        let sy = if y0 < y1 { 1 } else { -1 };
        let mut err = dx + dy;
        loop {
            if x0 < 0
                || y0 < 0
                || x0 >= self.width as i32
                || y0 >= self.height as i32
                || self.cost[(y0 as u32 * self.width + x0 as u32) as usize] > 1
            {
                return false;
            }
            if x0 == x1 && y0 == y1 {
                return true;
            }
            let e2 = 2 * err;
            if e2 >= dy {
                err += dy;
                x0 += sx;
            }
            if e2 <= dx {
                err += dx;
                y0 += sy;
            }
        }
    }

    /// Pick, per cell, the 8-way neighbor with the lowest integrated cost.
    /// Diagonal moves require both adjacent orthogonal cells to be passable,
    /// so flow never cuts a wall corner.
    fn build_flow(&mut self, goal_idx: usize) {
        let w = self.width as i32;
        let h = self.height as i32;
        for y in 0..h {
            for x in 0..w {
                let idx = (y * w + x) as usize;
                if self.cost[idx] == WALL {
                    self.flow[idx] = DIR_NONE;
                    continue;
                }
                let mut flags = FLOW_PATHABLE;
                if self.integration[idx] & INT_LOS != 0 {
                    flags |= FLOW_LOS;
                }
                if idx == goal_idx {
                    self.flow[idx] = flags | DIR_NONE;
                    continue;
                }
                let mut best_dir = DIR_NONE;
                let mut best = self.integration[idx] & INT_COST_MASK;
                for (d, (dx, dy)) in DIR_OFFSETS.iter().enumerate() {
                    let (nx, ny) = (x + dx, y + dy);
                    if nx < 0 || ny < 0 || nx >= w || ny >= h {
                        continue;
                    }
                    if self.is_wall(nx, ny) {
                        continue;
                    }
                    if *dx != 0 && *dy != 0 && (self.is_wall(x + dx, y) || self.is_wall(x, y + dy))
                    {
                        continue;
                    }
                    let c = self.integration[(ny * w + nx) as usize] & INT_COST_MASK;
                    if c < best {
                        best = c;
                        best_dir = d as u8;
                    }
                }
                self.flow[idx] = flags | best_dir;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn grid_with_wall() -> FlowGrid {
        // 8x8, vertical wall at x=4 with a gap at y=6.
        let mut g = FlowGrid::new(8, 8);
        for y in 0..6 {
            let i = g.idx(4, y);
            g.cost[i] = WALL;
        }
        g
    }

    #[test]
    fn integration_matches_hand_dijkstra() {
        let mut g = FlowGrid::new(4, 1);
        g.cost[2] = 5;
        assert!(g.compute(0, 0));
        let costs: Vec<u32> = g.integration.iter().map(|v| v & INT_COST_MASK).collect();
        // Entering cell 1 costs 1, cell 2 costs 5, cell 3 costs 1 more.
        assert_eq!(costs, vec![0, 1, 6, 7]);
    }

    #[test]
    fn wall_blocks_and_detours() {
        let mut g = grid_with_wall();
        assert!(g.compute(7, 0));
        // Cell left of the wall must detour through the gap at y=6.
        let direct = g.integration[g.idx(3, 0)] & INT_COST_MASK;
        assert!(direct > 10, "must route around the wall, got {direct}");
        // Wall cells stay unreachable.
        assert_eq!(g.integration[g.idx(4, 0)] & INT_COST_MASK, UNREACHABLE);
    }

    #[test]
    fn goal_on_wall_rejected() {
        let mut g = grid_with_wall();
        assert!(!g.compute(4, 0));
    }

    #[test]
    fn flow_points_downhill() {
        let mut g = grid_with_wall();
        assert!(g.compute(7, 0));
        for y in 0..8i32 {
            for x in 0..8i32 {
                let idx = g.idx(x as u32, y as u32);
                if g.cost[idx] == WALL {
                    continue;
                }
                let dir = g.flow[idx] & FLOW_DIR_MASK;
                if dir == DIR_NONE {
                    assert_eq!(idx, g.idx(7, 0), "only the goal may have no direction");
                    continue;
                }
                let (dx, dy) = DIR_OFFSETS[dir as usize];
                let nidx = g.idx((x + dx) as u32, (y + dy) as u32);
                assert!(
                    g.integration[nidx] & INT_COST_MASK < g.integration[idx] & INT_COST_MASK,
                    "flow at ({x},{y}) does not descend"
                );
            }
        }
    }

    #[test]
    fn los_flags() {
        let mut g = grid_with_wall();
        assert!(g.compute(7, 0));
        // Same row as the goal, right of the wall: clear line.
        assert_ne!(g.integration[g.idx(5, 0)] & INT_LOS, 0);
        assert_ne!(g.flow[g.idx(5, 0)] & FLOW_LOS, 0);
        // Left of the wall: blocked.
        assert_eq!(g.integration[g.idx(0, 0)] & INT_LOS, 0);
        // The goal itself sees itself.
        assert_ne!(g.integration[g.idx(7, 0)] & INT_LOS, 0);
    }

    #[test]
    fn expensive_terrain_blocks_los() {
        let mut g = FlowGrid::new(8, 3);
        // Mud column between the left edge and the goal on the right.
        for y in 0..3 {
            let i = g.idx(4, y);
            g.cost[i] = 8;
        }
        assert!(g.compute(7, 1));
        // Mud is passable: still reachable, just expensive.
        assert_ne!(g.integration[g.idx(0, 1)] & INT_COST_MASK, UNREACHABLE);
        // But a straight shot through mud must not claim line of sight.
        assert_eq!(g.integration[g.idx(0, 1)] & INT_LOS, 0);
        // Right of the mud, plain ground: LOS holds.
        assert_ne!(g.integration[g.idx(5, 1)] & INT_LOS, 0);
    }

    #[test]
    fn flow_never_cuts_corners() {
        let mut g = FlowGrid::new(3, 3);
        // Single wall at center-right; diagonal around it must be forbidden.
        let i = g.idx(1, 1);
        g.cost[i] = WALL;
        assert!(g.compute(2, 2));
        let dir = g.flow[g.idx(0, 0)] & FLOW_DIR_MASK;
        // From (0,0) the diagonal SE neighbor (1,1) is a wall, and a diagonal
        // to (1,1) is impossible anyway; what matters is no diagonal that
        // squeezes between (1,1) and an edge. (0,0) -> (1,0) or (0,1).
        let (dx, dy) = DIR_OFFSETS[dir as usize];
        assert!(dx == 0 || dy == 0, "must not move diagonally past a wall corner");
    }
}
