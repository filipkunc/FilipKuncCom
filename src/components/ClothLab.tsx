import { useRef, useEffect, useState, useCallback } from 'react';
import { GRID_STEPS, trianglesFor } from '../lib/gpu-cloth/grid';
import type { ClothHandle, NormalsMode, ClothStats } from '../lib/gpu-cloth/cloth-renderer';

// SSR-safe: only React, types, and the pure grid helpers at module scope. The
// WebGPU cloth renderer is pulled in with dynamic import() inside the effect.

type Status = 'probing' | 'ready' | 'unsupported' | 'error';

const fmtCount = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : `${n}`);
const fmtBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MiB` : `${(n / 1024).toFixed(0)} KiB`);

export default function ClothLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ClothHandle | null>(null);

  const [status, setStatus] = useState<Status>('probing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [gridStep, setGridStep] = useState(2); // ~250k triangles
  const [mode, setMode] = useState<NormalsMode>('gpu');
  const [wind, setWind] = useState(true);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<ClothStats | null>(null);

  const initial = useRef({ gridStep, mode, wind });

  useEffect(() => {
    let disposed = false;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const gpu = await import('../lib/gpu-cloth/cloth-renderer');
        if (disposed) return;
        const handle = await gpu.create(canvas, {
          gridStep: initial.current.gridStep,
          normalsMode: initial.current.mode,
          wind: initial.current.wind,
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
        setStatus('ready');
        if (import.meta.env.DEV) {
          (window as unknown as { __clothLab?: ClothHandle }).__clothLab = handle;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the renderer's stats a few times a second for the readout.
  useEffect(() => {
    if (status !== 'ready') return;
    const id = setInterval(() => {
      if (handleRef.current) setStats(handleRef.current.stats());
    }, 250);
    return () => clearInterval(id);
  }, [status]);

  const onGrid = (step: number) => {
    setGridStep(step);
    handleRef.current?.setGrid(step);
  };
  const onMode = (m: NormalsMode) => {
    setMode(m);
    handleRef.current?.setNormalsMode(m);
  };
  const onWind = (on: boolean) => {
    setWind(on);
    handleRef.current?.setWind(on);
  };
  const onPause = (on: boolean) => {
    setPaused(on);
    handleRef.current?.setPaused(on);
  };

  const pointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>, active: boolean) => {
    const handle = handleRef.current;
    if (!handle) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    handle.setPointer(ndcX, ndcY, active);
  }, []);

  const ready = status === 'ready';
  const tris = trianglesFor(GRID_STEPS[gridStep]);

  return (
    <div className="cl">
      <div className="cl-controls">
        <label className="cl-field">
          <span>Cloth resolution — {fmtCount(tris)} triangles</span>
          <input
            type="range"
            min={0}
            max={GRID_STEPS.length - 1}
            step={1}
            value={gridStep}
            onChange={(e) => onGrid(Number(e.target.value))}
            disabled={!ready}
          />
        </label>

        <div className="cl-field">
          <span>Normals computed</span>
          <div className="cl-seg" role="group" aria-label="Normals mode">
            <button type="button" className={mode === 'gpu' ? 'on' : ''} onClick={() => onMode('gpu')} disabled={!ready}>
              On the GPU (WGSL)
            </button>
            <button type="button" className={mode === 'cpu' ? 'on' : ''} onClick={() => onMode('cpu')} disabled={!ready}>
              On the CPU (JS)
            </button>
          </div>
        </div>
      </div>

      <div className="cl-toggles">
        <label>
          <input type="checkbox" checked={wind} onChange={(e) => onWind(e.target.checked)} disabled={!ready} /> Wind
        </label>
        <label>
          <input type="checkbox" checked={paused} onChange={(e) => onPause(e.target.checked)} disabled={!ready} /> Pause
        </label>
        <span className="cl-hint">Move the pointer over the cloth to push it.</span>
      </div>

      <div className="cl-stage">
        <canvas
          ref={canvasRef}
          className="cl-canvas"
          onPointerMove={(e) => pointer(e, true)}
          onPointerLeave={(e) => pointer(e, false)}
        />
        {status !== 'ready' && (
          <div className="cl-overlay">
            {status === 'probing' && <p>Initializing WebGPU…</p>}
            {status === 'unsupported' && (
              <div className="cl-msg">
                <p><strong>This demo needs WebGPU.</strong></p>
                <p>
                  Your browser is not handing out a GPU adapter. WebGPU only runs in a secure context,
                  so it has to be served over https or from localhost.
                </p>
                <p>
                  Many Android phones still gate it: open <code>chrome://flags</code>, enable
                  {' '}<strong>Unsafe WebGPU Support</strong>, and relaunch Chrome.
                </p>
              </div>
            )}
            {status === 'error' && (
              <div className="cl-msg">
                <p><strong>WebGPU failed to start.</strong></p>
                {errorMsg && <p className="cl-mono">{errorMsg}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="cl-readout">
        {ready && stats ? (
          <>
            <span className={`cl-fps ${stats.fps < 30 ? 'slow' : ''}`}>{stats.fps.toFixed(0)} fps</span>
            <span>{fmtCount(stats.triangles)} triangles</span>
            {stats.mode === 'cpu' ? (
              <span className="cl-cost">
                normals on the CPU (JS): {stats.cpuNormalsMs.toFixed(1)} ms · reads back {fmtBytes(stats.readbackBytes)}/frame
              </span>
            ) : (
              <span className="cl-cost good">
                normals on the GPU ({stats.api}):{' '}
                {stats.gpuNormalsMs > 0 ? `${stats.gpuNormalsMs.toFixed(3)} ms` : 'resident'} · 0 bytes read back
              </span>
            )}
          </>
        ) : (
          <span>—</span>
        )}
      </div>

      <style>{`
        .cl { margin: 1.5rem 0; }
        .cl-controls { display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: end; margin-bottom: 0.75rem; }
        .cl-field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.82rem; color: var(--muted); min-width: 16rem; }
        .cl-field input[type="range"] { width: 100%; accent-color: var(--accent); }
        .cl button {
          font: inherit; color: var(--fg); background: color-mix(in srgb, var(--fg) 5%, transparent);
          border: 1px solid var(--rule); border-radius: 6px; padding: 0.4rem 0.7rem; cursor: pointer;
        }
        .cl button:hover:not(:disabled) { border-color: var(--accent); }
        .cl button:disabled { opacity: 0.5; cursor: default; }
        .cl-seg { display: inline-flex; }
        .cl-seg button { border-radius: 0; margin-left: -1px; font-size: 0.82rem; }
        .cl-seg button:first-child { border-radius: 6px 0 0 6px; margin-left: 0; }
        .cl-seg button:last-child { border-radius: 0 6px 6px 0; }
        .cl-seg button.on { background: color-mix(in srgb, var(--accent) 22%, transparent); border-color: var(--accent); }
        .cl-toggles { display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: center; font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem; }
        .cl-toggles label { display: inline-flex; gap: 0.4rem; align-items: center; cursor: pointer; }
        .cl-hint { opacity: 0.8; }
        .cl-stage {
          position: relative; width: 100%; aspect-ratio: 16 / 10;
          border: 1px solid var(--rule); border-radius: 8px; overflow: hidden;
          background: radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--fg) 6%, transparent), transparent 70%);
        }
        .cl-canvas { display: block; width: 100%; height: 100%; touch-action: none; }
        .cl-overlay {
          position: absolute; inset: 0; display: grid; place-items: center; padding: 1.5rem;
          text-align: center; color: var(--muted); background: color-mix(in srgb, var(--bg) 80%, transparent);
        }
        .cl-msg { max-width: 38ch; }
        .cl-msg p { margin: 0.4rem 0; font-size: 0.9rem; }
        .cl-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.78rem; word-break: break-word; }
        .cl-readout {
          display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap;
          margin-top: 0.7rem; font-size: 0.82rem; color: var(--muted);
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }
        .cl-fps { font-weight: 600; color: var(--fg); }
        .cl-fps.slow { color: var(--accent); }
        .cl-cost.good { color: #2da44e; }
      `}</style>
    </div>
  );
}
