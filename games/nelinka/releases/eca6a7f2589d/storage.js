// Local workshop. Rust validates documents before they enter the library.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('library')) return;
  const key = 'nelinka-workshop-library-v1';
  let library = {version: 1, levels: [], campaign: {format: 'nelinka-campaign', version: 1, name: 'My adventure', levels: []}};
  let pending = null, tabs = [], tabsSignature = '';
  let chapterIds = [];
  const currentTab = () => tabs.find(tab => tab.active);
  const source = () => currentTab()?.source || '';
  const chapterIndex = () => chapterIds.indexOf(source().replace(/^chapter:/, ''));
  function notice(text) { $('notice').textContent = text; $('notice').style.display = 'block'; $('library-notice').textContent = text; }
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.version !== 1 || !Array.isArray(parsed.levels) || !Array.isArray(parsed.campaign?.levels)) throw Error('Invalid library');
      library = parsed;
    }
  } catch { notice('Could not load the local library. Export your work before closing this tab.'); }
  chapterIds = library.campaign.levels.map(() => crypto.randomUUID());
  function persist() {
    let saved = false;
    try { localStorage.setItem(key, JSON.stringify(library)); saved = true; notice('Saved on this device. Export JSON to back up or share.'); }
    catch { notice('Browser storage is full or unavailable. Your work is still open; export JSON before closing.'); }
    render();
    return saved;
  }
  window.nelinkaWorkshop = {
    requests: [],
    saved(level) {
      const index = chapterIndex();
      const entry = library.levels.find(e => `library:${e.id}` === source());
      if (index >= 0) library.campaign.levels[index] = level;
      else if (entry) entry.level = level;
      else return true;
      return persist();
    },
    tabs(value) {
      tabs = value;
      const signature = JSON.stringify(value);
      if (signature === tabsSignature) return;
      tabsSignature = signature;
      $('level-tabs').replaceChildren(...tabs.map(tab => {
        const item = document.createElement('div'); item.className = 'level-tab';
        const select = button(`${tab.name}${tab.dirty ? ' *' : ''}`, async () => { await request('switch', String(tab.id)); $('glcanvas').focus(); });
        select.setAttribute('role', 'tab'); select.setAttribute('aria-selected', String(tab.active));
        const close = button('×', async () => {
          if (tab.dirty && !confirm(`Discard unsaved changes to “${tab.name}”?`)) return;
          await request('close', String(tab.id), {discard: tab.dirty}); $('glcanvas').focus();
        });
        close.disabled = tabs.length === 1; close.setAttribute('aria-label', `Close ${tab.name}`);
        item.append(select, close); return item;
      }));
      $('save-library').textContent = chapterIndex() >= 0 ? 'Save chapter' : 'Save to library';
    },
    reply(result) { const callback = pending; pending = null; if (callback) result.error ? callback.reject(Error(result.error)) : callback.resolve(result.value); }
  };
  function request(action, text = '', options = {}) {
    if (pending) return Promise.reject(Error('Please wait for the current operation.'));
    if ($('glcanvas').dataset.ready !== 'true') return Promise.reject(Error('The editor is still loading.'));
    return new Promise((resolve, reject) => { pending = {resolve, reject}; window.nelinkaWorkshop.requests.push(JSON.stringify({action, text, ...options})); });
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
    $('save-library').textContent = chapterIndex() >= 0 ? 'Save chapter' : 'Save to library';
    $('campaign-name').value = library.campaign.name;
    $('library-levels').replaceChildren(...library.levels.map(entry => {
      const row = document.createElement('li'); const name = document.createElement('span'); name.textContent = entry.level.name;
      row.append(name,
        button('Edit', async () => { await request('open', JSON.stringify(entry.level), {source:`library:${entry.id}`}); $('library').close(); $('glcanvas').focus(); }),
        button('Add to campaign', async () => {
          const level = await request('campaign', JSON.stringify({format:'nelinka-campaign',version:1,name:'Validation',levels:[entry.level]}));
          if (library.campaign.levels.length >= 100) throw Error('Campaigns support up to 100 levels.');
          library.campaign.levels.push(level.levels[0]); chapterIds.push(crypto.randomUUID()); persist();
        }),
        button('Export', () => download(entry.level, entry.level.name)),
        button('Delete', () => { if (!confirm(`Delete “${entry.level.name}” from this device?`)) return; library.levels = library.levels.filter(e => e.id !== entry.id); persist(); }));
      return row;
    }));
    $('campaign-levels').replaceChildren(...library.campaign.levels.map((level, i) => {
      const row = document.createElement('li'); const name = document.createElement('span'); name.textContent = level.name;
      const up = button('↑', () => { [library.campaign.levels[i-1], library.campaign.levels[i]] = [level, library.campaign.levels[i-1]]; [chapterIds[i-1],chapterIds[i]] = [chapterIds[i],chapterIds[i-1]]; persist(); });
      up.disabled = i === 0; up.setAttribute('aria-label', `Move ${level.name} up`);
      const down = button('↓', () => { [library.campaign.levels[i+1], library.campaign.levels[i]] = [level, library.campaign.levels[i+1]]; [chapterIds[i+1],chapterIds[i]] = [chapterIds[i],chapterIds[i+1]]; persist(); });
      down.disabled = i === library.campaign.levels.length - 1; down.setAttribute('aria-label', `Move ${level.name} down`);
      row.append(name, up, down, button('Edit chapter', async () => { await request('open', JSON.stringify(level), {source:`chapter:${chapterIds[i]}`}); $('library').close(); $('glcanvas').focus(); }), button('Remove', () => { library.campaign.levels.splice(i, 1); chapterIds.splice(i, 1); persist(); })); return row;
    }));
  }
  $('library-open').onclick = () => { render(); $('library').showModal(); };
  $('library-close').onclick = () => { $('library').close(); $('glcanvas').focus(); };
  $('new-level').onclick = run(async () => { await request('new'); $('glcanvas').focus(); });
  $('export').onclick = run(async () => { const level = await request('snapshot'); download(level, level.name); });
  $('save-library').onclick = run(async () => {
    const level = await request('snapshot');
    const name = prompt('Level name', level.name); if (name === null) return;
    const renamed = await request('rename', name);
    const index = chapterIndex();
    let binding = source();
    if (index >= 0) library.campaign.levels[index] = renamed;
    else {
      const entry = library.levels.find(e => `library:${e.id}` === source());
      if (entry) entry.level = renamed;
      else { const id = crypto.randomUUID(); binding = `library:${id}`; library.levels.push({id,level:renamed}); }
    }
    if (persist()) await request('bind', binding);
  });
  $('campaign-name').onchange = () => { library.campaign.name = $('campaign-name').value; persist(); };
  $('campaign-export').onclick = run(async () => { const c = await request('campaign', JSON.stringify(library.campaign)); download(c, c.name); });
  $('campaign-open').onclick = run(async () => {
    for (let i = 0; i < library.campaign.levels.length; i++) {
      await request('open', JSON.stringify(library.campaign.levels[i]), {source:`chapter:${chapterIds[i]}`});
    }
    $('library').close(); $('glcanvas').focus();
  });
  $('builtin-open').onclick = run(async () => {
    const levels = await request('builtin');
    for (let i = 0; i < levels.length; i++) await request('open', JSON.stringify(levels[i]), {source:`builtin:${i}`});
    $('library').close(); $('glcanvas').focus();
  });
  $('campaign-play').onclick = run(async () => {
    const player = window.open('about:blank', '_blank');
    if (!player) throw Error('Allow a new tab to play the campaign without closing your editor tabs.');
    try {
      const c = await request('campaign', JSON.stringify(library.campaign));
      player.sessionStorage.setItem('nelinka-custom-play', JSON.stringify(c));
      player.opener = null;
      player.location.href = `${document.body.dataset.player}?custom=1`;
    } catch (error) { player.close(); throw error; }
  });
  window.addEventListener('beforeunload', event => {
    if (tabs.some(tab => tab.dirty)) { event.preventDefault(); event.returnValue = ''; }
  });
  $('file').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 16000000) throw Error('File exceeds 16 MB.');
      const text = await file.text(); const value = JSON.parse(text);
      if (value.format === 'nelinka-campaign') {
        const campaign = await request('campaign', text);
        if (library.campaign.levels.length && !confirm('Replace the campaign draft? Export it first to keep a portable copy.')) return;
        library.campaign = campaign; chapterIds = campaign.levels.map(() => crypto.randomUUID()); persist(); $('library').showModal();
      } else {
        await request('open', text); notice('Opened validated level in a new tab. Save to library to keep it.'); $('glcanvas').focus();
      }
    } catch (e) { notice(e.message); }
    finally { event.target.value = ''; }
  };
  $('glcanvas').addEventListener('keydown', event => {
    if (['Tab','F3','F5','F6','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)
        || ((event.ctrlKey || event.metaKey) && ['KeyA','KeyS','KeyO','KeyD','KeyZ','KeyY'].includes(event.code))) event.preventDefault();
  });
})();
