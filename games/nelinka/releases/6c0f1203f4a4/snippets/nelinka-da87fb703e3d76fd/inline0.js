
export function ready() { document.querySelector('#glcanvas').dataset.ready = 'true'; }
export function frame() { const c=document.querySelector('#glcanvas'); c.dataset.frame=String(Number(c.dataset.frame || 0)+1); }
export function load(key) { try { return localStorage.getItem(key) || ''; } catch { return ''; } }
export function save(key,text) { try { localStorage.setItem(key,text);return true; } catch { return false; } }
export function player_mode() { return !!window.nelinkaCampaign; }
export function player_action() { return window.nelinkaCampaign?.actions.shift() || 0; }
export function player_input() { const p=window.nelinkaCampaign;return (p?.bits || 0)|(p?.latched || 0)|(p?.muted?16:0); }
export function player_consumed() { if(window.nelinkaCampaign)window.nelinkaCampaign.latched=0; }
export function publish(text) { window.nelinkaCampaign?.update(JSON.parse(text)); }
export function storage_error() { window.nelinkaCampaign?.storageError(); }
