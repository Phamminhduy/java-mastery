/**
 * UI helpers: escape HTML, render text/code, syntax highlight, toast, modal, format.
 */
const UI = (() => {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);

  /** Văn bản thường: escape, hỗ trợ `inline code` và **bold**. */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  // ---------- Syntax highlight (an toàn: mọi đoạn text đều được escape) ----------
  const KW = {
    java: new Set(('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield true false null').split(' ')),
    sql: new Set(('select from where and or not in is null as join inner left right full outer on group by having order asc desc insert into values update set delete create table index primary key foreign references distinct count sum avg min max case when then else end with recursive over partition row_number rank dense_rank lag lead limit offset fetch first next rows only union all exists between like begin commit rollback for unique constraint alter add drop column varchar varchar2 int integer number bigint numeric decimal date timestamp text default lock share nowait skip locked transaction isolation level read committed uncommitted serializable repeatable explain analyze cross coalesce nulls returning conflict do nothing sequence nextval true false').split(' ')),
    json: new Set(['true', 'false', 'null']),
    yaml: new Set(['true', 'false', 'null']),
    bash: new Set(('sudo cd ls grep tail head cat ps kill top netstat ss lsof export echo docker git curl chmod chown find awk sed xargs systemctl journalctl df du free java jcmd jstack jmap if then fi for do done').split(' ')),
    http: new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'HTTP']),
  };
  const COMMENT = {
    java: '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',
    sql: '--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',
    yaml: '#[^\\n]*', bash: '#[^\\n]*', properties: '#[^\\n]*', dockerfile: '#[^\\n]*',
  };
  function highlight(code, lang) {
    lang = (lang || 'text').toLowerCase();
    if (lang === 'text') return esc(code);
    const kw = KW[lang] || (lang === 'dockerfile' ? new Set('FROM RUN COPY ADD WORKDIR ENV EXPOSE ENTRYPOINT CMD ARG USER AS'.split(' ')) : new Set());
    const parts = [];
    if (COMMENT[lang]) parts.push('(' + COMMENT[lang] + ')'); else parts.push('(\\u0000NEVER)');
    parts.push('("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')');
    parts.push('(@[A-Za-z_][\\w.]*)');
    parts.push('(\\b\\d+(?:\\.\\d+)?[LlFfDd]?\\b)');
    parts.push('([A-Za-z_][\\w]*)');
    const re = new RegExp(parts.join('|'), 'g');
    let out = '', last = 0, m;
    const ci = lang === 'sql';
    while ((m = re.exec(code)) !== null) {
      out += esc(code.slice(last, m.index));
      const t = m[0];
      if (m[1]) out += '<span class="tok-com">' + esc(t) + '</span>';
      else if (m[2]) out += '<span class="tok-str">' + esc(t) + '</span>';
      else if (m[3] && (lang === 'java')) out += '<span class="tok-ann">' + esc(t) + '</span>';
      else if (m[4]) out += '<span class="tok-num">' + esc(t) + '</span>';
      else if (m[5] && kw.has(ci ? t.toLowerCase() : t)) out += '<span class="tok-kw">' + esc(t) + '</span>';
      else if (m[5] && lang === 'java' && /^[A-Z][a-z0-9]\w*$/.test(t)) out += '<span class="tok-type">' + esc(t) + '</span>';
      else out += esc(t);
      last = m.index + t.length;
    }
    out += esc(code.slice(last));
    return out;
  }
  function codeBlock(code, lang) {
    if (!code) return '';
    return '<pre class="code"><span class="lang">' + esc(lang || '') + '</span><code>' + highlight(code, lang) + '</code></pre>';
  }
  function dataTables(tables) {
    if (!tables || !tables.length) return '';
    return '<div class="data-tables">' + tables.map(t =>
      '<table class="data"><caption>' + esc(t.name) + '</caption><thead><tr>' +
      t.columns.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
      t.rows.map(r => '<tr>' + r.map(v => '<td>' + (v === null ? '<i class="muted">NULL</i>' : esc(v)) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table>').join('') + '</div>';
  }

  // ---------- Toast & modal ----------
  function toast(msg, type) {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
  function modal(html, onMount) {
    const root = document.getElementById('modal-root');
    root.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
    const back = root.firstElementChild;
    const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey, true); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    back.addEventListener('mousedown', e => { if (e.target === back) close(); });
    if (onMount) onMount(back.firstElementChild, close);
    return close;
  }
  function confirm(message, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      modal(
        '<h3>' + esc(opts.title || 'Xác nhận') + '</h3><p>' + inline(message) + '</p>' +
        '<div class="actions"><button class="btn" data-a="no">' + esc(opts.cancelText || 'Hủy') + '</button>' +
        '<button class="btn ' + (opts.danger ? 'danger solid' : 'primary') + '" data-a="yes">' + esc(opts.okText || 'Đồng ý') + '</button></div>',
        (el, close) => {
          let done = false;
          const finish = v => { if (!done) { done = true; close(); resolve(v); } };
          el.querySelector('[data-a=yes]').onclick = () => finish(true);
          el.querySelector('[data-a=no]').onclick = () => finish(false);
          el.querySelector('[data-a=yes]').focus();
          const obs = new MutationObserver(() => { if (!document.body.contains(el)) { obs.disconnect(); finish(false); } });
          obs.observe(document.getElementById('modal-root'), { childList: true });
        });
    });
  }

  // ---------- Format ----------
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  function fmtDate(ts, withTime) {
    if (!ts) return '—';
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    const s = p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
    return withTime === false ? s : s + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function fmtDuration(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const p = n => String(n).padStart(2, '0');
    return (h ? h + ':' + p(m) : m) + ':' + p(s);
  }
  function relDay(ts) {
    if (!ts) return '—';
    const days = Math.round((startOfDay(ts) - startOfDay(Date.now())) / 86400000);
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Ngày mai';
    if (days === -1) return 'Hôm qua';
    return days > 0 ? 'Sau ' + days + ' ngày' : days * -1 + ' ngày trước';
  }
  function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

  const diffChip = d => '<span class="chip d-' + d + '">' + esc(QB.DIFFICULTY_LABEL[d] || d) + '</span>';
  const moduleName = id => { const m = QB.getModule(id); return m ? m.title : id; };
  function progressBar(value, cls) {
    return '<div class="progress ' + (cls || '') + '"><span style="width:' + Math.max(0, Math.min(100, value)) + '%"></span></div>';
  }
  function emptyState(icon, title, text, actions) {
    return '<div class="empty"><div class="big">' + icon + '</div><h3>' + esc(title) + '</h3><p>' + inline(text) + '</p>' + (actions || '') + '</div>';
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { esc, inline, highlight, codeBlock, dataTables, toast, modal, confirm, pct, fmtDate, fmtDuration, relDay, startOfDay, diffChip, moduleName, progressBar, emptyState, shuffle, download };
})();
