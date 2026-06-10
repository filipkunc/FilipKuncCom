// GPU elapsed-time measurement via EXT_disjoint_timer_query_webgl2.
// Results arrive asynchronously a frame or two later; `last` holds the most
// recent completed measurement in ms, or null if the extension is missing
// (SwiftShader and some ANGLE configs don't expose it).
export function createGpuTimer(gl) {
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) {
    return { available: false, begin() {}, end() {}, poll() {}, last: null };
  }

  const pending = [];
  let last = null;
  let active = null;

  return {
    available: true,
    get last() {
      return last;
    },
    begin() {
      if (active) return; // one query at a time; skip frames while one is open
      active = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, active);
    },
    end() {
      if (!active) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(active);
      active = null;
    },
    poll() {
      while (pending.length) {
        const q = pending[0];
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
        if (disjoint) {
          pending.shift();
          gl.deleteQuery(q);
          continue;
        }
        if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
        last = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; // ns -> ms
        pending.shift();
        gl.deleteQuery(q);
      }
    },
  };
}
