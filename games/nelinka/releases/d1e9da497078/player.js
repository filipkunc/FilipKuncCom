(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let current, cardsSignature = '';
  let muted = false;
  try { muted = localStorage.getItem('nelinka-campaign-muted') === 'true'; } catch {}
  function soundLabel() { $('sound-icon').textContent = muted ? '♩' : '♪'; $('sound-text').textContent = muted ? ' Vypnuto' : ' Zvuk'; $('sound').setAttribute('aria-pressed', String(muted)); $('sound').setAttribute('aria-label', muted ? 'Zapnout zvuk' : 'Vypnout zvuk'); }
  soundLabel();
  $('sound').onclick = () => { muted = !muted; soundLabel(); try { localStorage.setItem('nelinka-campaign-muted', String(muted)); } catch {} $('glcanvas').focus(); };
  const held = new Map();
  const player = window.nelinkaCampaign = {
    actions: [], bits: 0, latched: 0,
    get muted() { return muted; },
    storageError() { $('notice').hidden = false; $('notice').textContent = 'Prohlížeč nemůže uložit postup. Hra pokračuje, ale po zavření se postup může ztratit.'; },
    update(state) {
      if (new URLSearchParams(location.search).has('custom') && !state.campaignName) {
        $('overlay').hidden = false;
        $('title').textContent = 'Campaign unavailable';
        $('description').textContent = 'Open the workshop and choose Play campaign again. This tab has no valid custom campaign.';
        for (const id of ['continue', 'next', 'restart', 'menu', 'chapters', 'hud', 'touch']) $(id).hidden = true;
        return;
      }
      const changedMode = current?.mode !== state.mode;
      current = state;
      $('overlay').hidden = state.mode === 'playing';
      $('hud').hidden = state.mode !== 'playing';
      $('touch').hidden = state.mode !== 'playing';
      $('chapter').textContent = state.chapters[state.index].title;
      $('stats').textContent = `Kachňátka ${state.rescued}/${state.ducks}  ·  Pamlsky ${state.treats}/${state.totalTreats}  ·  Klíč ${state.key ? '✓' : '—'}`;
      $('stats-compact').textContent = `🦆 ${state.rescued}/${state.ducks} · 🍪 ${state.treats}/${state.totalTreats} · 🔑 ${state.key ? '✓' : '—'}`;
      $('stats-compact').parentElement.setAttribute('aria-label', `${$('chapter').textContent}. ${$('stats').textContent}`);
      $('performance').hidden = state.mode !== 'paused';
      $('performance').setAttribute('aria-pressed', String(!!state.performanceOpen));
      $('performance').textContent = `Výkon (F10): ${state.performanceOpen ? 'zapnutý' : 'vypnutý'}`;
      const menu = state.mode === 'menu', won = state.mode === 'won';
      $('title').textContent = menu ? (state.campaignName || 'Nelinka') : won ? (state.index === state.chapters.length - 1 ? 'Všichni jsou doma!' : 'Hurá, jsme doma!') : 'Chvilka na oddech';
      $('description').textContent = menu ? (state.campaignName ? 'Vlastní dobrodružství · vyberte kapitolu.' : 'Pět cest lesem a pod zemí, malí kamarádi a jedna odvážná fenka. Kam se dnes vydáme?') : won ? `${state.chapters[state.index].title} je za námi. Zachráněná kachňátka: ${state.rescued}/${state.ducks}. Pamlsky: ${state.treats}/${state.totalTreats}.` : state.chapters[state.index].description;
      $('continue').hidden = won;
      $('continue').textContent = menu ? `Pokračovat · ${state.chapters[state.progress.current].title}` : 'Pokračovat ve hře';
      $('next').hidden = !won || state.index === state.chapters.length - 1;
      $('restart').hidden = menu;
      $('menu').hidden = menu;
      $('chapters').hidden = !menu;
      const signature = JSON.stringify([state.progress.completed, state.progress.best_treats, state.progress.secrets]);
      if (signature !== cardsSignature) {
        cardsSignature = signature;
        $('chapters').replaceChildren(...state.chapters.map((chapter, i) => {
          const card = document.createElement('button');
          card.className = `chapter${state.progress.completed[i] ? ' done' : ''}`;
          card.dataset.level = i;
          const number = document.createElement('span'); number.className = 'number'; number.textContent = `0${i + 1}${state.progress.completed[i] ? ' ✓' : ''}`;
          const title = document.createElement('strong'); title.textContent = chapter.title;
          const subtitle = document.createElement('small'); subtitle.textContent = state.progress.completed[i] ? `${state.progress.best_treats[i]} pamlsků${state.progress.secrets[i] ? ' · tajemství nalezeno' : ''}` : chapter.subtitle;
          card.append(number, title, subtitle); card.onclick = () => action(10 + i);
          return card;
        }));
      }
      if (changedMode) {
        clearInput();
        if (state.mode === 'playing') $('glcanvas').focus();
        else (won && state.index < state.chapters.length - 1 ? $('next') : won ? $('menu') : $('continue')).focus({preventScroll: true});
      }
    }
  };
  function clearInput() { held.clear(); player.bits = 0; player.latched = 0; bits(); }
  function action(value) { clearInput(); player.actions.push(value); }
  document.querySelectorAll('[data-action]').forEach(button => button.onclick = () => action(Number(button.dataset.action)));
  function bits() {
    player.bits = [...held.values()].reduce((a, b) => a | b, 0);
    document.querySelectorAll('[data-bit]').forEach(button => button.classList.toggle('held', !!(player.bits & Number(button.dataset.bit))));
  }
  document.querySelectorAll('[data-bit]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      held.set(event.pointerId, Number(button.dataset.bit)); player.latched |= Number(button.dataset.bit) & 12; bits();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, event => { held.delete(event.pointerId); bits(); });
  });
  const keys = {ArrowLeft: 1, KeyA: 1, ArrowRight: 2, KeyD: 2, Space: 4, ArrowUp: 4, KeyW: 4, KeyE: 8, ArrowDown: 32};
  window.addEventListener('keydown', event => {
    if (event.code === 'Escape' && !event.repeat) { if (current?.mode === 'playing') action(5); else if (current?.mode === 'paused') action(2); }
    if (current?.mode === 'playing' && keys[event.code]) { event.preventDefault(); held.set(event.code, keys[event.code]); if (!event.repeat) player.latched |= keys[event.code] & 12; bits(); }
  }, {capture: true});
  window.addEventListener('keyup', event => { held.delete(event.code); bits(); }, {capture: true});
  function suspend() { clearInput(); if (current?.mode === 'playing') action(5); }
  window.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
})();
