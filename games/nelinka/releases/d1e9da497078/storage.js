// Local workshop. Rust validates documents before they enter the library.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('library')) return;
  const key = 'nelinka-workshop-library-v1';
  let library = {version: 1, levels: [], campaign: {format: 'nelinka-campaign', version: 1, name: 'My adventure', levels: []}};
  let active = null, pending = null;
  function notice(text) { $('notice').textContent = text; $('notice').style.display = 'block'; $('library-notice').textContent = text; }
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.version !== 1 || !Array.isArray(parsed.levels) || !Array.isArray(parsed.campaign?.levels)) throw Error('Invalid library');
      library = parsed;
    }
  } catch { notice('Could not load the local library. Export your work before closing this tab.'); }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(library)); notice('Saved on this device. Export JSON to back up or share.'); }
    catch { notice('Browser storage is full or unavailable. Your work is still open; export JSON before closing.'); }
    render();
  }
  window.nelinkaWorkshop = {
    requests: [],
    reply(result) { const callback = pending; pending = null; if (callback) result.error ? callback.reject(Error(result.error)) : callback.resolve(result.value); }
  };
  function request(action, text = '') {
    if (pending) return Promise.reject(Error('Please wait for the current operation.'));
    if ($('glcanvas').dataset.ready !== 'true') return Promise.reject(Error('The editor is still loading.'));
    return new Promise((resolve, reject) => { pending = {resolve, reject}; window.nelinkaWorkshop.requests.push(JSON.stringify({action, text})); });
  }
  function run(action) { return async () => { try { await action(); } catch (e) { notice(e.message); } }; }
  function download(value, name) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a'); link.href = url;
    link.download = `${(name || 'nelinka').replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 80)}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function button(text, action) { const el = document.createElement('button'); el.textContent = text; el.onclick = run(action); return el; }
  function render() {
    $('campaign-name').value = library.campaign.name;
    $('library-levels').replaceChildren(...library.levels.map(entry => {
      const row = document.createElement('li'); const name = document.createElement('span'); name.textContent = entry.level.name;
      row.append(name,
        button('Edit', async () => { await request('open', JSON.stringify(entry.level)); active = entry.id; $('library').close(); $('glcanvas').focus(); }),
        button('Add to campaign', async () => {
          const level = await request('campaign', JSON.stringify({format:'nelinka-campaign',version:1,name:'Validation',levels:[entry.level]}));
          if (library.campaign.levels.length >= 100) throw Error('Campaigns support up to 100 levels.');
          library.campaign.levels.push(level.levels[0]); persist();
        }),
        button('Export', () => download(entry.level, entry.level.name)),
        button('Delete', () => { if (!confirm(`Delete “${entry.level.name}” from this device?`)) return; library.levels = library.levels.filter(e => e.id !== entry.id); if(active === entry.id) active = null; persist(); }));
      return row;
    }));
    $('campaign-levels').replaceChildren(...library.campaign.levels.map((level, i) => {
      const row = document.createElement('li'); const name = document.createElement('span'); name.textContent = level.name;
      const up = button('↑', () => { [library.campaign.levels[i-1], library.campaign.levels[i]] = [level, library.campaign.levels[i-1]]; persist(); });
      up.disabled = i === 0; up.setAttribute('aria-label', `Move ${level.name} up`);
      const down = button('↓', () => { [library.campaign.levels[i+1], library.campaign.levels[i]] = [level, library.campaign.levels[i+1]]; persist(); });
      down.disabled = i === library.campaign.levels.length - 1; down.setAttribute('aria-label', `Move ${level.name} down`);
      row.append(name, up, down, button('Edit copy', async () => { await request('open', JSON.stringify(level)); active = null; $('library').close(); $('glcanvas').focus(); }), button('Remove', () => { library.campaign.levels.splice(i, 1); persist(); })); return row;
    }));
  }
  $('library-open').onclick = () => { render(); $('library').showModal(); };
  $('library-close').onclick = () => { $('library').close(); $('glcanvas').focus(); };
  $('new-level').onclick = run(async () => { await request('new'); active = null; $('glcanvas').focus(); });
  $('export').onclick = run(async () => { const level = await request('snapshot'); download(level, level.name); });
  $('save-library').onclick = run(async () => {
    const level = await request('snapshot');
    const name = prompt('Level name', level.name); if (name === null) return;
    const renamed = await request('rename', name);
    const entry = library.levels.find(e => e.id === active);
    if (entry) entry.level = renamed;
    else { active = crypto.randomUUID(); library.levels.push({id:active,level:renamed}); }
    persist();
  });
  $('campaign-name').onchange = () => { library.campaign.name = $('campaign-name').value; persist(); };
  $('campaign-export').onclick = run(async () => { const c = await request('campaign', JSON.stringify(library.campaign)); download(c, c.name); });
  $('campaign-play').onclick = run(async () => {
    const c = await request('campaign', JSON.stringify(library.campaign));
    const current = await request('snapshot');
    // Preserve the open editor document before navigating to the player.
    localStorage.setItem('nelinka-workshop-level-v2', JSON.stringify(current));
    sessionStorage.setItem('nelinka-custom-play', JSON.stringify(c));
    location.href = `${document.body.dataset.player}?custom=1`;
  });
  $('file').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 16000000) throw Error('File exceeds 16 MB.');
      const text = await file.text(); const value = JSON.parse(text);
      if (value.format === 'nelinka-campaign') {
        const campaign = await request('campaign', text);
        if (library.campaign.levels.length && !confirm('Replace the campaign draft? Export it first to keep a portable copy.')) return;
        library.campaign = campaign; persist(); $('library').showModal();
      } else {
        await request('open', text); active = null; notice('Opened validated level. Undo restores the previous document. Save to library to keep it.'); $('glcanvas').focus();
      }
    } catch (e) { notice(e.message); }
    finally { event.target.value = ''; }
  };
  $('glcanvas').addEventListener('keydown', event => {
    if (['Tab','F3','F5','F6','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)
        || ((event.ctrlKey || event.metaKey) && ['KeyA','KeyS','KeyO','KeyD','KeyZ','KeyY'].includes(event.code))) event.preventDefault();
  });
})();
