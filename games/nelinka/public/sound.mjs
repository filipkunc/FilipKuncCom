// Preload the local sample before play; unlock/resume only from user gestures.
export function createBarkSound() {
  let context,
    buffer,
    bytes,
    muted = false;
  const active = new Set();
  let loading;
  function load() {
    return (loading ??= fetch("/nelinka-classic/assets/nelinka-bark.wav")
      .then((r) => {
        if (!r.ok) throw new Error("Bark unavailable");
        return r.arrayBuffer();
      })
      .then((data) => {
        bytes = data;
      })
      .catch(() => {
        loading = null;
      }));
  }
  async function prepare(audio) {
    context = audio;
    await load();
    if (!buffer && bytes)
      buffer = await context.decodeAudioData(bytes.slice(0));
  }
  async function play(audio) {
    if (muted || !audio) return;
    await prepare(audio);
    if (context.state === "suspended") await context.resume();
    if (muted || !buffer || context.state !== "running") return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.75;
    source.connect(gain).connect(context.destination);
    active.add(source);
    source.onended = () => {
      active.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  }
  function setMuted(value) {
    muted = value;
    if (muted) for (const source of active) source.stop();
  }
  return { load, prepare, play, setMuted };
}
