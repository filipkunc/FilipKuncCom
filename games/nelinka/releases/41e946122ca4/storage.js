"use strict";
(() => {
    if (!document.getElementById('library'))
        return;
    function element(id) {
        const value = document.getElementById(id);
        if (!value)
            throw new Error(`Missing element: ${id}`);
        return value;
    }
    const dialog = element('library');
    const canvas = element('glcanvas');
    const input = element('file');
    const campaignName = element('campaign-name');
    let tabs = [];
    let library = { name: '', levels: [], chapters: [] };
    let tabsSignature = '', librarySignature = '';
    let pending = null;
    function notice(text) {
        element('notice').textContent = text;
        element('notice').style.display = 'block';
        element('library-notice').textContent = text;
    }
    const errorMessage = (error) => error instanceof Error ? error.message : String(error);
    function run(action) {
        return async () => { try {
            await action();
        }
        catch (error) {
            notice(errorMessage(error));
        } };
    }
    const bridge = window.nelinkaWorkshop = {
        requests: [],
        state(value) {
            tabs = value.tabs;
            library = value.library;
            const nextTabs = JSON.stringify(tabs), nextLibrary = JSON.stringify(library);
            if (nextTabs !== tabsSignature) {
                tabsSignature = nextTabs;
                renderTabs();
            }
            if (nextLibrary !== librarySignature) {
                librarySignature = nextLibrary;
                renderLibrary();
            }
            const source = tabs.find(tab => tab.active)?.source;
            element('save-library').textContent = library.chapters.some(chapter => chapter.source === source) ? 'Save chapter' : 'Save to library';
        },
        reply(result) {
            const callback = pending;
            pending = null;
            if (callback)
                result.error ? callback.reject(new Error(result.error)) : callback.resolve(result.value);
        }
    };
    async function request(action, text = '', discard = false) {
        if (pending)
            throw new Error('Please wait for the current operation.');
        if (canvas.dataset.ready !== 'true')
            throw new Error('The editor is still loading.');
        // Responses come from the typed Rust models behind this bridge.
        return new Promise((resolve, reject) => {
            pending = { resolve, reject };
            bridge.requests.push(JSON.stringify({ action, text, discard }));
        });
    }
    async function mutate(action, text) {
        await request(action, text);
        notice('Saved on this device. Export JSON to back up or share.');
    }
    function download(value) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(value.name || 'nelinka').replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 80)}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function button(text, action) {
        const value = document.createElement('button');
        value.textContent = text;
        value.onclick = run(action);
        return value;
    }
    function renderTabs() {
        element('level-tabs').replaceChildren(...tabs.map(tab => {
            const item = document.createElement('div');
            item.className = 'level-tab';
            const select = button(`${tab.name}${tab.dirty ? ' *' : ''}`, async () => { await request('switch', String(tab.id)); canvas.focus(); });
            select.setAttribute('role', 'tab');
            select.setAttribute('aria-selected', String(tab.active));
            const close = button('×', async () => {
                if (tab.dirty && !confirm(`Discard unsaved changes to “${tab.name}”?`))
                    return;
                await request('close', String(tab.id), tab.dirty);
                canvas.focus();
            });
            close.disabled = tabs.length === 1;
            close.setAttribute('aria-label', `Close ${tab.name}`);
            item.append(select, close);
            return item;
        }));
    }
    async function open(action, source = '') { await request(action, source); dialog.close(); canvas.focus(); }
    function renderLibrary() {
        if (document.activeElement !== campaignName)
            campaignName.value = library.name;
        element('library-levels').replaceChildren(...library.levels.map(entry => {
            const row = document.createElement('li'), name = document.createElement('span');
            name.textContent = entry.name;
            row.append(name, button('Edit', () => open('library-open', entry.source)), button('Add to campaign', () => mutate('chapter-add', entry.source)), button('Export', async () => download(await request('library-export', entry.source))), button('Delete', async () => { if (confirm(`Delete “${entry.name}” from this device?`))
                await mutate('remove', entry.source); }));
            return row;
        }));
        element('campaign-levels').replaceChildren(...library.chapters.map((chapter, index) => {
            const row = document.createElement('li'), name = document.createElement('span');
            name.textContent = chapter.name;
            const up = button('↑', () => mutate('chapter-up', chapter.source));
            up.disabled = index === 0;
            up.setAttribute('aria-label', `Move ${chapter.name} up`);
            const down = button('↓', () => mutate('chapter-down', chapter.source));
            down.disabled = index === library.chapters.length - 1;
            down.setAttribute('aria-label', `Move ${chapter.name} down`);
            row.append(name, up, down, button('Edit chapter', () => open('library-open', chapter.source)), button('Remove', () => mutate('remove', chapter.source)));
            return row;
        }));
    }
    element('library-open').onclick = () => { renderLibrary(); dialog.showModal(); };
    element('library-close').onclick = () => { dialog.close(); canvas.focus(); };
    element('new-level').onclick = run(() => open('new'));
    element('export').onclick = run(async () => download(await request('snapshot')));
    element('save-library').onclick = run(async () => {
        const level = await request('snapshot');
        const name = prompt('Level name', level.name);
        if (name !== null)
            await mutate('save-library', name);
    });
    campaignName.onchange = run(() => mutate('campaign-name', campaignName.value));
    element('campaign-export').onclick = run(async () => download(await request('campaign-export')));
    element('campaign-open').onclick = run(() => open('campaign-open'));
    element('builtin-open').onclick = run(() => open('builtin-open'));
    element('campaign-play').onclick = run(async () => {
        const player = window.open('about:blank', '_blank');
        if (!player)
            throw new Error('Allow a new tab to play the campaign without closing your editor tabs.');
        try {
            const campaign = await request('campaign-export');
            player.sessionStorage.setItem('nelinka-custom-play', JSON.stringify(campaign));
            player.opener = null;
            player.location.href = `${document.body.dataset.player}?custom=1`;
        }
        catch (error) {
            player.close();
            throw error;
        }
    });
    window.addEventListener('beforeunload', event => {
        if (tabs.some(tab => tab.dirty)) {
            event.preventDefault();
            event.returnValue = '';
        }
    });
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file)
            return;
        try {
            if (file.size > 16000000)
                throw new Error('File exceeds 16 MB.');
            const text = await file.text();
            const result = await request('inspect-import', text);
            if (result.kind === 'campaign') {
                if (library.chapters.length && !confirm('Replace the campaign draft? Export it first to keep a portable copy.'))
                    return;
                await mutate('campaign-import', text);
                dialog.showModal();
            }
            else {
                await request('open', text);
                notice('Opened validated level in a new tab. Save to library to keep it.');
                canvas.focus();
            }
        }
        catch (error) {
            notice(errorMessage(error));
        }
        finally {
            input.value = '';
        }
    };
    canvas.addEventListener('keydown', event => {
        if (['Tab', 'F3', 'F5', 'F6', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)
            || ((event.ctrlKey || event.metaKey) && ['KeyA', 'KeyS', 'KeyO', 'KeyD', 'KeyZ', 'KeyY'].includes(event.code)))
            event.preventDefault();
    });
})();
