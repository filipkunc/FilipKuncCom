
export function unlock_audio(context) {
  const unlock = () => { if (context.state === 'suspended') context.resume().catch(() => {}); };
  window.addEventListener('pointerdown', unlock, {capture: true});
  window.addEventListener('keydown', unlock, {capture: true});
}
