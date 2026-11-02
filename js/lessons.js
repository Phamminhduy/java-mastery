/**
 * LS — Lesson Store: bài học lý thuyết theo từng topic của từng module.
 * File trong data/lessons/ gọi LS.add(moduleId, topic, blocks).
 *
 * blocks là mảng, mỗi phần tử:
 *   'Đoạn văn…'            → paragraph (hỗ trợ `inline code`, **đậm**)
 *   '## Tiêu đề'           → tiêu đề nhỏ
 *   '- Ý chính'            → bullet (các dòng liên tiếp gộp thành một danh sách)
 *   '! Lưu ý…'             → khung cảnh báo (lỗi thường gặp)
 *   '? Gợi ý phỏng vấn…'   → khung gợi ý phỏng vấn
 *   { lang, code }         → code block
 *   { table: [[header…], [row…], …] } → bảng so sánh
 */
const LS = (() => {
  const store = new Map();   // moduleId::topic -> blocks
  const errors = [];
  const key = (m, t) => m + '::' + t;

  function add(moduleId, topic, blocks) {
    const k = key(moduleId, topic);
    if (store.has(k)) { errors.push('Bài học trùng: ' + k); return; }
    store.set(k, blocks);
  }
  const get = (m, t) => store.get(key(m, t)) || null;
  const has = (m, t) => store.has(key(m, t));

  /** Văn bản thuần của bài học (phục vụ tìm kiếm). */
  function text(m, t) {
    const b = get(m, t);
    if (!b) return '';
    return b.map(x => (typeof x === 'string' ? x : x.code || (x.table || []).flat().join(' '))).join(' \n ');
  }

  function render(blocks) {
    let html = '', list = [];
    const flush = () => { if (list.length) { html += '<ul>' + list.map(li => '<li>' + UI.inline(li) + '</li>').join('') + '</ul>'; list = []; } };
    for (const b of blocks) {
      if (typeof b !== 'string') {
        flush();
        if (b.code) html += UI.codeBlock(b.code.replace(/^\n+|\s+$/g, ''), b.lang || 'java');
        else if (b.table) html += '<div class="table-wrap"><table class="table lesson-table"><thead><tr>' + b.table[0].map(h => '<th>' + UI.inline(h) + '</th>').join('') +
          '</tr></thead><tbody>' + b.table.slice(1).map(r => '<tr>' + r.map(c => '<td>' + UI.inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
        continue;
      }
      if (b.startsWith('- ')) { list.push(b.slice(2)); continue; }
      flush();
      if (b.startsWith('## ')) html += '<h4>' + UI.inline(b.slice(3)) + '</h4>';
      else if (b.startsWith('! ')) html += '<div class="callout warn"><strong>Lưu ý:</strong> ' + UI.inline(b.slice(2)) + '</div>';
      else if (b.startsWith('? ')) html += '<div class="callout tip"><strong>Phỏng vấn:</strong> ' + UI.inline(b.slice(2)) + '</div>';
      else html += '<p>' + UI.inline(b) + '</p>';
    }
    flush();
    return html;
  }

  return { add, get, has, text, render, errors, get size() { return store.size; } };
})();
