/**
 * Kiểm tra chất lượng cấu trúc ngân hàng câu hỏi.
 * Chạy: node tools/validate.js
 * Kiểm tra: ID trùng, thiếu đáp án/giải thích, đáp án không tồn tại trong options,
 * câu một đáp án có nhiều đáp án đúng, topic không thuộc module, câu hỏi trùng nội dung,
 * và thống kê số lượng thực tế theo module / độ khó / loại.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = vm.createContext({ console });
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="((?:js\/bank|js\/lessons|data\/)[^"]+)"/g)].map(m => m[1]);
for (const s of scripts) if (!fs.existsSync(path.join(root, s))) console.log('! Thiếu file ' + s); else vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });
const QB = vm.runInContext('QB', ctx);
const LS = vm.runInContext('LS', ctx);

const errors = [...QB.errors, ...LS.errors];

// ---------- Bài học lý thuyết ----------
let lessonWords = 0;
for (const m of QB.modules) {
  for (const t of m.topics) {
    const blocks = LS.get(m.id, t);
    if (!blocks) { errors.push('Thiếu bài học: ' + m.id + ' / ' + t); continue; }
    const words = LS.text(m.id, t).split(/\s+/).length;
    if (!Array.isArray(blocks) || words < 50) errors.push('Bài học quá ngắn (' + words + ' từ): ' + m.id + ' / ' + t);
    blocks.forEach((b, i) => {
      const okBlock = typeof b === 'string' ? b.trim().length > 0 : (b && (typeof b.code === 'string' || Array.isArray(b.table)));
      if (!okBlock) errors.push('Block không hợp lệ: ' + m.id + ' / ' + t + ' #' + i);
      if (b && Array.isArray(b.table) && b.table.some(r => r.length !== b.table[0].length)) errors.push('Bảng sai số cột: ' + m.id + ' / ' + t);
    });
    lessonWords += words;
  }
}
const warns = [];
const VALID_DIFF = ['beginner', 'intermediate', 'advanced', 'senior'];
const seenText = new Map();
const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();

for (const q of QB.questions) {
  const where = q.id;
  if (!q.question || q.question.length < 10) errors.push(where + ': thiếu nội dung câu hỏi');
  if (!q.explanation || q.explanation.length < 30) errors.push(where + ': giải thích quá ngắn hoặc thiếu');
  if (!q.options || q.options.length < 2) errors.push(where + ': cần ít nhất 2 lựa chọn');
  const ids = q.options.map(o => o.id);
  if (new Set(ids).size !== ids.length) errors.push(where + ': trùng id lựa chọn');
  if (new Set(q.options.map(o => o.text.trim())).size !== ids.length) errors.push(where + ': trùng nội dung lựa chọn');
  if (!q.correctAnswers.length) errors.push(where + ': thiếu đáp án đúng');
  q.correctAnswers.forEach(a => { if (!ids.includes(a)) errors.push(where + ': đáp án ' + a + ' không có trong options'); });
  if (new Set(q.correctAnswers).size !== q.correctAnswers.length) errors.push(where + ': trùng đáp án đúng');
  if (q.type === 'single' && q.correctAnswers.length !== 1) errors.push(where + ': câu single có ' + q.correctAnswers.length + ' đáp án');
  if (q.type === 'multiple' && q.correctAnswers.length < 2) errors.push(where + ': câu multiple cần >= 2 đáp án');
  if (!VALID_DIFF.includes(q.difficulty)) errors.push(where + ': difficulty không hợp lệ ' + q.difficulty);
  if (!QB.CATEGORY_LABEL[q.category]) errors.push(where + ': category không hợp lệ ' + q.category);
  const mod = QB.getModule(q.module);
  if (!mod.topics.includes(q.topic)) errors.push(where + ': topic "' + q.topic + '" không thuộc module ' + q.module);
  Object.keys(q.optionExplanations).forEach(k => { if (!ids.includes(k)) errors.push(where + ': optionExplanations có key lạ ' + k); });
  if (q.tables) q.tables.forEach(t => t.rows.forEach(r => { if (r.length !== t.columns.length) errors.push(where + ': bảng ' + t.name + ' sai số cột'); }));
  if (/([đĐ]áp án|[lL]ựa chọn|[pP]hương án|[cC]ách)\s+[A-H]\b/.test(q.explanation)) warns.push(where + ': giải thích nhắc tới letter cố định — sẽ sai khi options được hoán vị');
  if (['output', 'bug'].includes(q.category) && !q.code) warns.push(where + ': câu dạng ' + q.category + ' nhưng không có code');
  if (q.category === 'sql' && !q.code && !q.tables) warns.push(where + ': câu SQL không có schema/dữ liệu');
  const key = norm(q.question + '|' + q.code);
  if (seenText.has(key)) errors.push(where + ': trùng nội dung với ' + seenText.get(key));
  else seenText.set(key, q.id);
  if (!/^[A-Z]+-\d{3}$/.test(q.id)) warns.push(where + ': ID không theo định dạng PREFIX-000');
}

// Thống kê
const pad = (s, n) => String(s).padEnd(n);
console.log('\n=== Ngân hàng câu hỏi: ' + QB.questions.length + ' câu, ' + QB.modules.length + ' module ===\n');
console.log(pad('Module', 42) + VALID_DIFF.map(d => pad(d.slice(0, 5), 7)).join('') + 'Tổng  Topic có câu');
for (const m of QB.modules) {
  const qs = QB.questions.filter(q => q.module === m.id);
  const covered = m.topics.filter(t => qs.some(q => q.topic === t)).length;
  console.log(pad(m.order + '. ' + m.title, 42) + VALID_DIFF.map(d => pad(qs.filter(q => q.difficulty === d).length, 7)).join('') + pad(qs.length, 6) + covered + '/' + m.topics.length);
}
const byCat = {};
QB.questions.forEach(q => { byCat[q.category] = (byCat[q.category] || 0) + 1; });
console.log('\nTheo loại: ' + Object.entries(byCat).map(([k, v]) => k + '=' + v).join(', '));
console.log('Câu có code/bảng dữ liệu: ' + QB.questions.filter(q => q.code || q.tables).length);
console.log('Câu nhiều đáp án: ' + QB.questions.filter(q => q.type === 'multiple').length);
const dist = {};
QB.questions.filter(q => q.type === 'single').forEach(q => { dist[q.correctAnswers[0]] = (dist[q.correctAnswers[0]] || 0) + 1; });
console.log('Phân bố đáp án đúng (câu single): ' + JSON.stringify(dist));

console.log('Bài học lý thuyết: ' + LS.size + ' bài / ' + QB.modules.reduce((a, m) => a + m.topics.length, 0) + ' topic (~' + lessonWords + ' từ)');
if (LS.size !== QB.modules.reduce((a, m) => a + m.topics.length, 0)) errors.push('Có bài học không khớp topic nào (sai tên topic/module)');

if (warns.length) { console.log('\nCảnh báo (' + warns.length + '):'); warns.forEach(w => console.log('  - ' + w)); }
if (errors.length) { console.log('\nLỖI (' + errors.length + '):'); errors.forEach(e => console.log('  ✗ ' + e)); process.exit(1); }
console.log('\n✓ Không có lỗi cấu trúc.');
