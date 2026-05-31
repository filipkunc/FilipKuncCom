import { useRef, useEffect, useState, useCallback } from 'react';
import type { MeshName } from '../lib/gpu-normals/mesh';
import type { ComputeMode, RendererHandle, ReadbackResult } from '../lib/gpu-normals/webgpu-renderer';

// This top-level module is SSR-safe: it imports only React and types. The
// WebGPU renderer (which touches navigator.gpu) is pulled in with a dynamic
// import() inside the mount effect, never on the server and never before the
// island scrolls into view.

type Status = 'probing' | 'ready' | 'unsupported' | 'error';

const MESHES: { id: MeshName; label: string }[] = [
  { id: 'faceted', label: 'Faceted (icosahedron)' },
  { id: 'icosphere', label: 'Icosphere' },
  { id: 'torus', label: 'Torus' },
];

const DETAILS = [1, 2, 3, 4];

export default function NormalsLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<RendererHandle | null>(null);

  const [status, setStatus] = useState<Status>('probing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mesh, setMesh] = useState<MeshName>('faceted');
  const [detail, setDetail] = useState(3);
  const [mode, setMode] = useState<ComputeMode>('gpu');
  const [showNormals, setShowNormals] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  const [stats, setStats] = useState({ vertices: 0, triangles: 0 });
  const [readback, setReadback] = useState<ReadbackResult | null>(null);
  const [measuring, setMeasuring] = useState(false);

  // Read the live state through refs so the mount effect can run once without
  // re-creating the device when a control changes.
  const initial = useRef({ mesh, detail, mode, showNormals, autoRotate });

  const refreshStats = useCallback(() => {
    const h = handleRef.current;
    if (h) setStats({ vertices: h.vertexCount(), triangles: h.triangleCount() });
  }, []);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const gpu = await import('../lib/gpu-normals/webgpu-renderer');
        if (disposed) return;
        const handle = await gpu.create(canvas, {
          mesh: initial.current.mesh,
          mode: initial.current.mode,
          showNormals: initial.current.showNormals,
          autoRotate: initial.current.autoRotate,
          subdivisions: initial.current.detail,
          onDeviceLost: (reason) => {
            if (disposed) return;
            setErrorMsg(`The GPU device was lost: ${reason}`);
            setStatus('error');
          },
        });
        if (disposed) {
          handle.destroy();
          return;
        }
        handleRef.current = handle;
        setStats({ vertices: handle.vertexCount(), triangles: handle.triangleCount() });
        setStatus('ready');

        // Dev-only hook for the Playwright suite. Stripped from production
        // builds. Lets a test drive the renderer and read back the GPU result.
        if (import.meta.env.DEV) {
          (window as unknown as { __normalsLab?: RendererHandle }).__normalsLab = handle;
        }
      } catch (err) {
        if (disposed) return;
        if (err instanceof Error && err.name === 'WebGPUUnavailableError') {
          setStatus('unsupported');
        } else {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    })();

    return () => {
      disposed = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // Mount once. Control changes are pushed imperatively below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMesh = (id: MeshName) => {
    setMesh(id);
    setReadback(null);
    handleRef.current?.setMesh(id, detail);
    refreshStats();
  };
  const onDetail = (n: number) => {
    setDetail(n);
    setReadback(null);
    if (mesh === 'icosphere') {
      handleRef.current?.setMesh('icosphere', n);
      refreshStats();
    }
  };
  const onMode = (m: ComputeMode) => {
    setMode(m);
    handleRef.current?.setComputeMode(m);
  };
  const onShowNormals = (v: boolean) => {
    setShowNormals(v);
    handleRef.current?.setShowNormals(v);
  };
  const onAutoRotate = (v: boolean) => {
    setAutoRotate(v);
    handleRef.current?.setAutoRotate(v);
  };
  const onMeasure = async () => {
    const h = handleRef.current;
    if (!h) return;
    setMeasuring(true);
    try {
      setReadback(await h.measureReadback());
    } finally {
      setMeasuring(false);
    }
  };

  const ready = status === 'ready';
  const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KiB`);

  return (
    <div className="nl">
      <div className="nl-controls">
        <label className="nl-field">
          <span>Mesh</span>
          <select value={mesh} onChange={(e) => onMesh(e.target.value as MeshName)} disabled={!ready}>
            {MESHES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <div className="nl-field">
          <span>Normals computed on</span>
          <div className="nl-seg" role="group" aria-label="Compute mode">
            <button
              type="button"
              className={mode === 'gpu' ? 'on' : ''}
              onClick={() => onMode('gpu')}
              disabled={!ready}
            >
              GPU compute shader
            </button>
            <button
              type="button"
              className={mode === 'cpu' ? 'on' : ''}
              onClick={() => onMode('cpu')}
              disabled={!ready}
            >
              CPU (JavaScript)
            </button>
          </div>
        </div>

        {/* Subdivisions only mean something for the icosphere. Kept last so it
            appears and disappears at the trailing edge without shoving the Mesh
            and compute-mode controls around. */}
        {mesh === 'icosphere' && (
          <label className="nl-field">
            <span>Detail</span>
            <select value={detail} onChange={(e) => onDetail(Number(e.target.value))} disabled={!ready}>
              {DETAILS.map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? 'subdivision' : 'subdivisions'}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="nl-toggles">
        <label>
          <input type="checkbox" checked={showNormals} onChange={(e) => onShowNormals(e.target.checked)} disabled={!ready} />
          Show normal vectors
        </label>
        <label>
          <input type="checkbox" checked={autoRotate} onChange={(e) => onAutoRotate(e.target.checked)} disabled={!ready} />
          Auto-rotate
        </label>
      </div>

      <div className="nl-stage">
        <canvas ref={canvasRef} className="nl-canvas" />
        {(status === 'unsupported' || status === 'error') && (
          <>
            <img
              className="nl-fallback"
              src="/img/gpu-normals/normals.webp"
              alt="A still frame of the normals lab: an icosphere with its per-vertex normals drawn as short orange lines."
              loading="lazy"
              decoding="async"
            />
            <span className="nl-badge">Static preview</span>
          </>
        )}
        {status === 'probing' && (
          <div className="nl-overlay"><p>Initializing WebGPU…</p></div>
        )}
      </div>

      {status === 'unsupported' && (
        <p className="nl-fallback-note">
          <strong>The live demo needs WebGPU,</strong> and your browser is not handing out a GPU
          adapter. WebGPU only runs in a secure context, so it has to be served over https or from
          localhost. Many Android phones still gate it: open <code>chrome://flags</code>, enable
          {' '}<strong>Unsafe WebGPU Support</strong>, and relaunch Chrome. The CPU walkthrough and the
          verified snippet below explain the same algorithm without a GPU.
        </p>
      )}
      {status === 'error' && (
        <p className="nl-fallback-note">
          <strong>WebGPU failed to start.</strong> The frame above is a still of the live lab.
          {errorMsg && <> <span className="nl-mono">{errorMsg}</span></>}
        </p>
      )}

      <div className="nl-foot">
        <span className="nl-stats">
          {ready ? (
            <>
              {stats.vertices.toLocaleString()} vertices · {stats.triangles.toLocaleString()} triangles ·
              normals buffer {fmtBytes(stats.vertices * 12)}
            </>
          ) : (
            '—'
          )}
        </span>
        <span className="nl-bw">
          <button type="button" onClick={() => void onMeasure()} disabled={!ready || measuring}>
            {measuring ? 'Measuring…' : 'Measure readback to CPU'}
          </button>
          {readback && (
            <span className="nl-bw-out">
              copied {fmtBytes(readback.bytes)} in {readback.ms.toFixed(2)} ms · CPU↔GPU max delta{' '}
              {readback.maxDelta.toExponential(1)}
            </span>
          )}
        </span>
      </div>
      {readback && (
        <p className="nl-note">
          The render pipeline never pays this cost. It reads the normals buffer in place on the GPU,
          so its path moves <strong>0 bytes</strong> back to the CPU.
        </p>
      )}

      <style>{`
        .nl { margin: 1.5rem 0; }
        .nl-controls { display: flex; flex-wrap: wrap; gap: 1rem 1.25rem; align-items: end; margin-bottom: 0.75rem; }
        .nl-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; color: var(--muted); }
        .nl select, .nl button {
          font: inherit; color: var(--fg); background: color-mix(in srgb, var(--fg) 5%, transparent);
          border: 1px solid var(--rule); border-radius: 6px; padding: 0.4rem 0.6rem;
        }
        .nl select { color-scheme: light dark; }
        .nl select option { background: var(--bg); color: var(--fg); }
        .nl button { cursor: pointer; }
        .nl button:hover:not(:disabled) { border-color: var(--accent); }
        .nl button:disabled { opacity: 0.5; cursor: default; }
        .nl-seg { display: inline-flex; }
        .nl-seg button { border-radius: 0; margin-left: -1px; font-size: 0.82rem; padding: 0.4rem 0.7rem; }
        .nl-seg button:first-child { border-radius: 6px 0 0 6px; margin-left: 0; }
        .nl-seg button:last-child { border-radius: 0 6px 6px 0; }
        .nl-seg button.on { background: color-mix(in srgb, var(--accent) 22%, transparent); border-color: var(--accent); color: var(--fg); }
        .nl-toggles { display: flex; gap: 1.25rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem; }
        .nl-toggles label { display: inline-flex; gap: 0.4rem; align-items: center; cursor: pointer; }
        .nl-stage {
          position: relative; width: 100%; aspect-ratio: 16 / 10;
          border: 1px solid var(--rule); border-radius: 8px; overflow: hidden;
          background:
            radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--fg) 6%, transparent), transparent 70%);
        }
        .nl-canvas { display: block; width: 100%; height: 100%; }
        .nl-fallback { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
        .nl-badge {
          position: absolute; top: 0.5rem; right: 0.5rem; font-size: 0.68rem; letter-spacing: 0.03em;
          text-transform: uppercase; color: var(--muted); background: color-mix(in srgb, var(--bg) 78%, transparent);
          border: 1px solid var(--rule); border-radius: 999px; padding: 0.18rem 0.55rem; backdrop-filter: blur(3px);
        }
        .nl-overlay {
          position: absolute; inset: 0; display: grid; place-items: center; padding: 1.5rem;
          text-align: center; color: var(--muted);
          background: color-mix(in srgb, var(--bg) 80%, transparent);
        }
        .nl-fallback-note { font-size: 0.85rem; color: var(--muted); margin-top: 0.6rem; line-height: 1.55; }
        .nl-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.78rem; word-break: break-word; }
        .nl-foot {
          display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;
          margin-top: 0.7rem; font-size: 0.82rem; color: var(--muted);
        }
        .nl-stats { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .nl-bw { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
        .nl-bw button { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
        .nl-bw-out { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .nl-note { font-size: 0.85rem; color: var(--muted); margin-top: 0.5rem; }
      `}</style>
    </div>
  );
}
