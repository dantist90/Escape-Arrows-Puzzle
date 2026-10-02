// ---------- Dev cheat panel (F2) ----------
// Resources add / remove / set, level jump, boosters, and a full progress reset.
// Not part of the Poki build unless tools/build.mjs runs with --cheats.
(function () {
  const RES = [['coins', 'Монеты'], ['tickets', 'Билеты'], ['stars', 'Звёзды'], ['arrows', 'Стрелочки']];
  let el = null, timer = null;
  const css = `
  #cheats{position:fixed;inset:0;z-index:9999;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;background:rgba(30,12,80,.97);
    font:700 15px "ArrowsFont",sans-serif;color:#f1e9ff;user-select:none}
  #cheats .wrap{max-width:640px;margin:0 auto;padding:14px 16px 28px}
  #cheats h3{margin:0 0 10px;font-size:22px;color:#ff7ccc;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:rgba(30,12,80,.97);padding:6px 0;z-index:1}
  #cheats h4{margin:16px 0 8px;font-size:14px;color:#c9b8ff;text-transform:uppercase;letter-spacing:.04em}
  #cheats .row{display:flex;align-items:center;gap:6px;margin:6px 0;flex-wrap:nowrap}
  #cheats .row label{flex:0 0 92px}
  #cheats input{flex:1 1 60px;min-width:50px;padding:8px;border:2px solid #6b4fd0;background:#1a0b4a;border-radius:10px;font:inherit;color:inherit}
  #cheats button{padding:8px 10px;border:0;border-radius:10px;background:#4a2fa0;color:#fff;font:inherit;cursor:pointer;touch-action:manipulation}
  #cheats button:hover{filter:brightness(.95)} #cheats button.pos{background:#1f8a4c} #cheats button.neg{background:#a0305a}
  #cheats button.wide{width:100%;margin:4px 0;padding:11px} #cheats button.danger{background:#ff7a9c;color:#fff}
  #cheats button[data-a=close]{font-size:22px;width:44px;height:44px;padding:0}
  #cheats .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  #cheats .note{font-size:12px;color:#a08ad8;margin-top:12px}
  @media (max-width:420px){#cheats{font-size:13px} #cheats .row label{flex-basis:70px} #cheats button{padding:8px 7px}}`;

  const persist = () => { AP.persist(); refresh(); };
  const add = (k, n) => { AP.save[k] = Math.max(0, (AP.save[k] || 0) + n); persist(); };
  const set = (k, n) => { AP.save[k] = Math.max(0, Math.floor(+n || 0)); persist(); };
  const toast = m => { try { AP.ui.toast(m); } catch (e) { /* ui not ready */ } };

  function boostersAll(n) {
    const ids = Object.keys(AP.CONFIG.boosters).concat(Object.keys(AP.CONFIG.preBoosters)); ids.forEach(id => { AP.save.boosters[id] = n; });
    persist(); toast(n ? 'Бустеры: по ' + n : 'Бустеры обнулены');
  }
  function resetAll() {
    if (!confirm('Сбросить весь прогресс и начать игру сначала?')) return;
    try { localStorage.removeItem(AP.SAVE_KEY); } catch (e) { /* ignore */ }
    AP.persist = function () {}; // don't let anything write the old state back before the reload
    location.reload();
  }
  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div'); el.id = 'cheats';
    let h = `<h3>Чит-панель <button data-a="close">×</button></h3><h4>Ресурсы</h4>`;
    RES.forEach(([k, name]) => { h += `<div class="row"><label>${name}</label><button class="neg" data-a="add" data-k="${k}" data-n="-100">-100</button><button class="neg" data-a="add" data-k="${k}" data-n="-10">-10</button>
      <input data-k="${k}" type="number" min="0"><button class="pos" data-a="add" data-k="${k}" data-n="10">+10</button><button class="pos" data-a="add" data-k="${k}" data-n="1000">+1000</button></div>`; });
    h += `<div class="row"><label>Уровень</label><input data-k="level" type="number" min="1"><button class="pos" data-a="lvl">+1</button></div>
      <button class="wide pos" data-a="max">Всех ресурсов по 99 999</button><button class="wide neg" data-a="zero">Все ресурсы в 0</button>
      <h4>Бустеры</h4><div class="grid"><button class="pos" data-a="b10">Все по 10</button><button class="neg" data-a="b0">Все в 0</button></div>
      <h4>Разделы</h4><div class="grid"><button data-a="seen">Сбросить подсказки FTUE</button><button data-a="lobby">В лобби</button></div>
      <h4>Прогресс</h4><button class="wide danger" data-a="reset">Сбросить всё и начать заново</button>
      <div class="note">F2 — открыть / закрыть. Ввод числа и Enter задаёт значение.</div>`;
    el.innerHTML = '<div class="wrap">' + h + '</div>'; document.body.appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a; const k = b.dataset.k;
      if (a === 'close') return toggle(false);
      if (a === 'add') add(k, +b.dataset.n);
      if (a === 'lvl') { AP.save.level = (AP.save.level || 1) + 1; persist(); }
      if (a === 'max') { RES.forEach(([r]) => { AP.save[r] = 99999; }); persist(); }
      if (a === 'zero') { RES.forEach(([r]) => { AP.save[r] = 0; }); persist(); }
      if (a === 'b10') boostersAll(10);
      if (a === 'b0') boostersAll(0);
      if (a === 'seen') { AP.save.seen = {}; persist(); toast('Подсказки покажутся снова'); }
      if (a === 'lobby') { toggle(false); AP.game.go('lobby'); }
      if (a === 'reset') resetAll(); });
    el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && e.target.dataset.k) { const k = e.target.dataset.k; if (k === 'level') { AP.save.level = Math.max(1, Math.floor(+e.target.value || 1)); persist(); } else set(k, e.target.value); e.target.blur(); } });
    ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'touchstart', 'touchmove'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
  }
  function refresh() {
    if (!el) return; el.querySelectorAll('input[data-k]').forEach(inp => { if (document.activeElement !== inp) inp.value = AP.save[inp.dataset.k] || 0; });
  }
  function toggle(on) {
    if (!el) build(); const show = on === undefined ? el.style.display !== 'block' : on;
    el.style.display = show ? 'block' : 'none';
    clearInterval(timer); if (show) { refresh(); timer = setInterval(refresh, 400); }
  }
  window.addEventListener('keydown', e => { if (e.key === 'F2' || e.code === 'F2') { e.preventDefault(); toggle(); } });
  AP.cheats = { toggle, boostersAll, resetAll };
})();
