import { useEffect, useRef, useState } from 'react';

// A small client-side Mermaid renderer. Mermaid needs a DOM to measure and lay
// out text, so it cannot run during Astro's static build without a headless
// browser. Rendering in the browser keeps the build simple and the runtime
// image free of any of this: mermaid ships as a lazy JS chunk that is only
// fetched on a page that actually draws a diagram.
//
// The top level imports only React, so this module is SSR-safe. Mermaid itself
// touches `document` and is pulled in with a dynamic import inside the effect.

interface Props {
  // The Mermaid source (a flowchart, etc.).
  chart: string;
  // An optional caption rendered under the figure.
  caption?: string;
}

// Mermaid wants a unique id per render. A module-level counter avoids relying
// on randomness and keeps ids stable across a render pass.
let diagramSeq = 0;

// Map the site's CSS-variable palette (see Layout.astro) to Mermaid's theme
// variables so the diagram sits on the page instead of next to it. Mermaid
// bakes these colors into the SVG, so dark and light each get their own pass.
function themeVariables(dark: boolean) {
  const palette = dark
    ? { bg: '#0e0e10', fg: '#e9e9ea', muted: '#8a8a8e', accent: '#ff6b35', rule: '#2a2a2e', fill: '#17171a' }
    : { bg: '#fafafa', fg: '#1a1a1c', muted: '#5a5a5e', accent: '#c34a16', rule: '#d8d8dc', fill: '#ffffff' };
  return {
    background: 'transparent',
    primaryColor: palette.fill,
    primaryTextColor: palette.fg,
    primaryBorderColor: palette.rule,
    secondaryColor: palette.fill,
    tertiaryColor: palette.bg,
    mainBkg: palette.fill,
    nodeBorder: palette.rule,
    clusterBkg: 'transparent',
    clusterBorder: palette.rule,
    lineColor: palette.accent,
    textColor: palette.fg,
    titleColor: palette.fg,
    edgeLabelBackground: palette.bg,
    nodeTextColor: palette.fg,
  };
}

export default function Mermaid({ chart, caption }: Props) {
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`mermaid-${diagramSeq++}`);

  useEffect(() => {
    let cancelled = false;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        // Wait for fonts before measuring text. In the built site the bundled
        // Monaco CSS preloads a @font-face (codicon) that is still loading when
        // Mermaid measures its SVG labels, so it sizes nodes with transient
        // metrics and clips long labels (e.g. "value is Root"). Dev injects that
        // CSS later, so it never hits this. Waiting makes the metrics final.
        if (document.fonts?.ready) {
          try {
            await document.fonts.ready;
          } catch {
            /* ignore — fall through and render with whatever metrics we have */
          }
        }
        if (cancelled) return;
        mermaid.initialize({
          startOnLoad: false,
          // SVG text labels (not HTML), so the fill colors come from the theme
          // variables above and there is nothing to sanitize.
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: themeVariables(media.matches),
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          flowchart: { curve: 'basis', htmlLabels: false, padding: 14, nodeSpacing: 40, rankSpacing: 48 },
        });
        // A fresh id per pass avoids colliding with the leftover <style> block
        // Mermaid injects under the previous id.
        const { svg } = await mermaid.render(`${idRef.current}-${diagramSeq++}`, chart);
        if (!cancelled) {
          setSvg(svg);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    render();
    media.addEventListener('change', render);
    return () => {
      cancelled = true;
      media.removeEventListener('change', render);
    };
  }, [chart]);

  return (
    <figure className="mermaid-figure">
      {svg ? (
        <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="mermaid-placeholder">{failed ? 'Diagram failed to render.' : 'Rendering diagram…'}</div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
