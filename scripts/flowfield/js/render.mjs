// WebGL2 renderer for the flow field demo: a NEAREST-filtered RGBA texture
// for the field underlay, gl.LINES for the flow arrows (rebuilt only when the
// field recomputes), and one instanced draw for all agents. Agent positions
// and velocities are uploaded each frame straight from the wasm memory views.

const QUAD_VS = `#version 300 es
layout(location = 0) in vec2 a_corner;
out vec2 v_uv;
void main() {
  v_uv = a_corner;
  gl_Position = vec4(a_corner * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
}`;

const QUAD_FS = `#version 300 es
precision mediump float;
uniform sampler2D u_field;
in vec2 v_uv;
out vec4 color;
void main() { color = texture(u_field, v_uv); }`;

const LINE_VS = `#version 300 es
layout(location = 0) in vec2 a_pos;
uniform vec2 u_grid;
void main() {
  vec2 clip = a_pos / u_grid * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const LINE_FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 color;
void main() { color = u_color; }`;

const AGENT_VS = `#version 300 es
layout(location = 0) in vec2 a_corner;   // base triangle, unit size
layout(location = 1) in vec2 a_pos;      // per instance, grid cells
layout(location = 2) in vec2 a_heading;  // per instance, unit vector
layout(location = 3) in float a_radius;  // per instance, grid cells
layout(location = 4) in float a_kind;    // per instance, 0 | 1 | 2
uniform vec2 u_grid;
out vec3 v_color;
// One color per agent kind; readable on both ends of the field palette.
const vec3 KIND_COLORS[3] = vec3[3](
  vec3(0.42, 0.85, 1.0),   // small: cyan
  vec3(0.55, 0.93, 0.55),  // medium: green
  vec3(1.0, 0.52, 0.76)    // large: pink
);
void main() {
  float len = length(a_heading);
  vec2 dir = len > 0.01 ? a_heading / len : vec2(1.0, 0.0);
  mat2 rot = mat2(dir.x, dir.y, -dir.y, dir.x);
  // Triangle scaled so its body roughly matches the collision disc.
  vec2 p = a_pos + rot * (a_corner * a_radius * 2.3);
  vec2 clip = p / u_grid * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_color = KIND_COLORS[int(a_kind + 0.5)];
}`;

const AGENT_FS = `#version 300 es
precision mediump float;
in vec3 v_color;
out vec4 color;
void main() { color = vec4(v_color, 1.0); }`;

const MARKER_VS = `#version 300 es
layout(location = 0) in vec2 a_corner;   // -1..1 quad
uniform vec2 u_grid;
uniform vec2 u_pos;     // grid cells
uniform float u_radius; // grid cells
out vec2 v_p;
void main() {
  v_p = a_corner;
  vec2 p = u_pos + a_corner * u_radius;
  vec2 clip = p / u_grid * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

// Center dot + pulsing ring, signed-distance style so it stays crisp at any
// canvas size.
const MARKER_FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
uniform float u_time;
in vec2 v_p;
out vec4 color;
void main() {
  float d = length(v_p);
  float dot_ = 1.0 - smoothstep(0.16, 0.22, d);
  float r = 0.62 + 0.07 * sin(u_time * 4.0);
  float ring = 1.0 - smoothstep(0.05, 0.09, abs(d - r));
  float a = clamp(dot_ + ring * 0.9, 0.0, 1.0);
  color = vec4(u_color.rgb, u_color.a * a);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(`shader: ${gl.getShaderInfoLog(sh)}`);
  }
  return sh;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`link: ${gl.getProgramInfoLog(p)}`);
  }
  return p;
}

export function createRenderer(canvas, gridW, gridH) {
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) throw new Error('WebGL2 not available');

  const quadProg = program(gl, QUAD_VS, QUAD_FS);
  const lineProg = program(gl, LINE_VS, LINE_FS);
  const agentProg = program(gl, AGENT_VS, AGENT_FS);
  const markerProg = program(gl, MARKER_VS, MARKER_FS);

  // Field underlay -----------------------------------------------------------
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const fieldTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, fieldTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Flow arrows --------------------------------------------------------------
  const lineVao = gl.createVertexArray();
  gl.bindVertexArray(lineVao);
  const lineBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  let lineVerts = 0;

  // Agents ---------------------------------------------------------------
  const agentVao = gl.createVertexArray();
  gl.bindVertexArray(agentVao);
  const triBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triBuf);
  // Slim triangle pointing +x, centered on the agent position.
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0.7, 0, -0.5, 0.45, -0.5, -0.45]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  const velBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, velBuf);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(2, 1);
  const radiusBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, radiusBuf);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(3, 1);
  const kindBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, kindBuf);
  gl.enableVertexAttribArray(4);
  gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(4, 1);

  // Goal marker ---------------------------------------------------------
  const markerVao = gl.createVertexArray();
  gl.bindVertexArray(markerVao);
  const markerBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, markerBuf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const gridUniform = (prog) => {
    gl.useProgram(prog);
    gl.uniform2f(gl.getUniformLocation(prog, 'u_grid'), gridW, gridH);
  };
  gridUniform(lineProg);
  gridUniform(agentProg);

  return {
    gl,

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    },

    /** @param {Uint8Array} rgba length gridW*gridH*4 */
    uploadField(rgba) {
      gl.bindTexture(gl.TEXTURE_2D, fieldTex);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gridW, gridH, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba,
      );
    },

    /** @param {Float32Array} verts x,y pairs in grid space, gl.LINES */
    uploadArrows(verts) {
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
      lineVerts = verts.length / 2;
    },

    /**
     * @param {Float32Array} positions interleaved, from wasm memory
     * @param {Float32Array} headings interleaved unit vectors, from wasm memory
     * @param {Float32Array} radii per-agent body radius, from wasm memory
     * @param {Float32Array} kinds per-agent kind as floats (attribute-friendly)
     * @param {boolean} arrows draw the flow direction overlay
     * @param {{x: number, y: number} | null} goal cell coords for the marker
     * @param {number} time seconds, for the marker pulse
     */
    frame(positions, headings, radii, kinds, arrows, goal, time) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(quadProg);
      gl.bindVertexArray(quadVao);
      gl.bindTexture(gl.TEXTURE_2D, fieldTex);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (arrows && lineVerts > 0) {
        gl.useProgram(lineProg);
        gl.bindVertexArray(lineVao);
        gl.uniform4f(gl.getUniformLocation(lineProg, 'u_color'), 1, 1, 1, 0.55);
        gl.drawArrays(gl.LINES, 0, lineVerts);
      }

      const count = positions.length / 2;
      if (count > 0) {
        gl.useProgram(agentProg);
        gl.bindVertexArray(agentVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, velBuf);
        gl.bufferData(gl.ARRAY_BUFFER, headings, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, radiusBuf);
        gl.bufferData(gl.ARRAY_BUFFER, radii, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, kindBuf);
        gl.bufferData(gl.ARRAY_BUFFER, kinds, gl.STREAM_DRAW);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, count);
      }

      if (goal) {
        gl.useProgram(markerProg);
        gl.bindVertexArray(markerVao);
        gl.uniform2f(gl.getUniformLocation(markerProg, 'u_grid'), gridW, gridH);
        gl.uniform2f(gl.getUniformLocation(markerProg, 'u_pos'), goal.x + 0.5, goal.y + 0.5);
        gl.uniform1f(gl.getUniformLocation(markerProg, 'u_radius'), 2.6);
        gl.uniform1f(gl.getUniformLocation(markerProg, 'u_time'), time);
        gl.uniform4f(gl.getUniformLocation(markerProg, 'u_color'), 1.0, 0.36, 0.36, 0.95);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.bindVertexArray(null);
    },
  };
}
