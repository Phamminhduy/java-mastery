/**
 * Bộ test logic chạy bằng Node (không cần trình duyệt, không cần cài gói).
 * Chạy: node tools/test.js
 * Nạp toàn bộ script của ứng dụng vào một context giả lập (localStorage, document tối thiểu)
 * và kiểm tra: chấm điểm, chuẩn hóa ngân hàng câu hỏi, lưu trữ, tiến độ, spaced repetition,
 * kết thúc phiên, Interview Simulator, Code Challenge, thống kê và Import/Export.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const DAY = 86400000;

// ---------- Môi trường giả lập ----------
function createContext() {
  const store = new Map();
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
    clear: () => store.clear(),
    key: i => [...store.keys()][i] || null,
    get length() { return store.size; },
  };
  const fakeEl = () => ({ appendChild() {}, remove() {}, innerHTML: '', children: [], classList: { add() {}, remove() {}, toggle() {} }, querySelector: () => null, querySelectorAll: () => [] });
  const document = { addEventListener() {}, getElementById: () => fakeEl(), querySelector: () => null, querySelectorAll: () => [], createElement: fakeEl, body: fakeEl(), documentElement: { setAttribute() {}, removeAttribute() {}, getAttribute: () => null } };
  const ctx = vm.createContext({ console, localStorage, document, window: {}, location: { hash: '' }, setTimeout, clearTimeout, setInterval() {}, matchMedia: () => ({ matches: false }) });
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const raw = {};
  for (const s of scripts) {
    vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });
    if (s === 'js/bank.js') {
      // ghi lại dữ liệu gốc để kiểm tra việc hoán vị lựa chọn
      ctx.__raw = raw;
      vm.runInContext('const __orig = QB.module; QB.module = (m, list) => { (list || []).forEach(q => { __raw[q.id] = q; }); return __orig(m, list); };', ctx);
    }
  }
  vm.runInContext('UI.toast = () => {}; Storage.load();', ctx);
  return { ctx, store, raw, run: code => vm.runInContext(code, ctx) };
}

// ---------- Mini test framework ----------
let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ': ' + e.message); console.log('  ✗ ' + name + '\n      ' + e.message); }
}
function eq(a, b, msg) { const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) throw new Error((msg || 'expected equal') + ' — got ' + A + ', expected ' + B); }
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
function section(t) { console.log('\n' + t); }

// =====================================================================
section('1. Ngân hàng câu hỏi & chuẩn hóa');
{
  const { run, raw } = createContext();
  const QB = run('QB');
  test('không có lỗi đăng ký module/ID', () => eq(QB.errors.length, 0, QB.errors.join('; ')));
  test('hoán vị lựa chọn giữ nguyên nội dung đáp án đúng cho mọi câu', () => {
    for (const q of QB.questions) {
      const r = raw[q.id];
      const LET = 'ABCDEFGH';
      const rawCorrect = (Array.isArray(r.ans) ? r.ans : [r.ans]).map(a => r.opts[LET.indexOf(a)]).sort();
      const normCorrect = q.correctAnswers.map(a => q.options.find(o => o.id === a).text).sort();
      eq(normCorrect, rawCorrect, q.id);
      Object.entries(r.why || {}).forEach(([k, v]) => {
        const text = r.opts[LET.indexOf(k)];
        const newId = q.options.find(o => o.text === text).id;
        eq(q.optionExplanations[newId], v, q.id + ' why ' + k);
      });
    }
  });
  test('câu fixed: true giữ nguyên thứ tự lựa chọn', () => {
    for (const q of QB.questions.filter(q => raw[q.id].fixed)) eq(q.options.map(o => o.text), raw[q.id].opts, q.id);
  });
  test('hoán vị ổn định giữa các lần tải', () => {
    const b = createContext().run('QB');
    QB.questions.forEach((q, i) => eq(b.questions[i].correctAnswers, q.correctAnswers, q.id));
  });
  test('đáp án đúng phân bố tương đối đều (không chữ cái nào > 35%)', () => {
    const single = QB.questions.filter(q => q.type === 'single');
    const c = {}; single.forEach(q => { c[q.correctAnswers[0]] = (c[q.correctAnswers[0]] || 0) + 1; });
    Object.entries(c).forEach(([k, v]) => ok(v / single.length < 0.35, k + ' chiếm ' + v));
  });
  test('mọi câu có estimatedSeconds > 0 và option ≥ 2', () => QB.questions.forEach(q => ok(q.estimatedSeconds > 0 && q.options.length >= 2, q.id)));
}

// =====================================================================
section('2. Bộ máy chấm điểm (Quiz.grade)');
{
  const { run } = createContext();
  const QB = run('QB'), Quiz = run('Quiz');
  const single = QB.questions.find(q => q.type === 'single');
  const multi = QB.questions.find(q => q.type === 'multiple');
  const wrongOf = q => q.options.find(o => !q.correctAnswers.includes(o.id)).id;
  test('single: đúng → true', () => eq(Quiz.grade(single, single.correctAnswers), true));
  test('single: sai → false', () => eq(Quiz.grade(single, [wrongOf(single)]), false));
  test('bỏ trống → null (không tính đúng)', () => { eq(Quiz.grade(single, []), null); eq(Quiz.grade(single, undefined), null); });
  test('single: chọn thêm đáp án sai → false', () => eq(Quiz.grade(single, [single.correctAnswers[0], wrongOf(single)]), false));
  test('multi: đủ đáp án (mọi thứ tự) → true', () => { eq(Quiz.grade(multi, multi.correctAnswers), true); eq(Quiz.grade(multi, multi.correctAnswers.slice().reverse()), true); });
  test('multi: thiếu đáp án → false', () => eq(Quiz.grade(multi, [multi.correctAnswers[0]]), false));
  test('multi: lẫn đáp án sai → false', () => eq(Quiz.grade(multi, [multi.correctAnswers[0], wrongOf(multi)]), false));
  test('multi: lặp lại một đáp án không được tính là đủ', () => eq(Quiz.grade(multi, [multi.correctAnswers[0], multi.correctAnswers[0]]), false));
  test('id lựa chọn không tồn tại → false', () => eq(Quiz.grade(single, ['Z']), false));
}

// =====================================================================
section('3. Lưu trữ (Storage)');
{
  const { run, store } = createContext();
  const Storage = run('Storage');
  test('localStorage rỗng → dữ liệu mặc định', () => { eq(Object.keys(Storage.state.progress).length, 0); eq(Storage.state.version, 1); eq(Storage.state.settings.srsIntervals, [1, 3, 7, 14, 30]); });
  test('save/load giữ nguyên dữ liệu', () => {
    Storage.state.bookmarks['JC-001'] = 123; Storage.state.notes['JC-001'] = { text: 'a', updatedAt: 1 }; Storage.save();
    Storage.load(); eq(Storage.state.bookmarks['JC-001'], 123); eq(Storage.state.notes['JC-001'].text, 'a');
  });
  test('JSON hỏng → khởi tạo lại và sao lưu bản cũ', () => {
    store.set('jbm.data', '{broken'); Storage.load();
    eq(Object.keys(Storage.state.bookmarks).length, 0); ok(Storage.lastError);
    ok([...store.keys()].some(k => k.startsWith('jbm.data.corrupt.')));
  });
  test('dữ liệu cũ thiếu trường / sai kiểu được bổ sung an toàn', () => {
    store.set('jbm.data', JSON.stringify({ version: 1, settings: { theme: 'purple', srsIntervals: [0, -1] }, progress: { X: { correct: 3, wrong: 'a' }, Y: 'bad' }, sessions: [{ id: 's' }, 5] }));
    Storage.load();
    eq(Storage.state.settings.theme, 'system'); eq(Storage.state.settings.srsIntervals, [1, 3, 7, 14, 30]);
    eq(Storage.state.progress.X.attempts, 3); eq(Storage.state.progress.X.wrong, 0); ok(!Storage.state.progress.Y);
    eq(Storage.state.sessions.length, 0);
  });
}

// =====================================================================
section('4. Tiến độ & spaced repetition (Progress)');
{
  const { run } = createContext();
  const Progress = run('Progress'), Storage = run('Storage'), UI = run('UI');
  const t0 = new Date(2026, 0, 10, 9, 0).getTime();
  test('trả lời sai: tăng wrong, đưa vào lịch ôn, đến hạn ngay', () => {
    Progress.record('JC-001', ['A'], false, t0);
    const e = Progress.entry('JC-001');
    eq([e.attempts, e.correct, e.wrong, e.lastResult], [1, 0, 1, false]);
    eq(e.srs.level, 0); ok(e.srs.due <= t0);
  });
  test('đúng sau khi sai: giãn 1 ngày, rồi 3 ngày, tăng correctAfterWrong', () => {
    Progress.record('JC-001', ['B'], true, t0 + 1000);
    let e = Progress.entry('JC-001');
    eq(e.srs.level, 1); eq(e.srs.due, UI.startOfDay(t0) + 1 * DAY); eq(e.correctAfterWrong, 1);
    Progress.record('JC-001', ['B'], true, t0 + 2 * DAY);
    e = Progress.entry('JC-001');
    eq(e.srs.due, UI.startOfDay(t0 + 2 * DAY) + 3 * DAY);
  });
  test('mốc ôn tập dừng ở khoảng cuối (30 ngày)', () => {
    for (let i = 0; i < 8; i++) Progress.record('JC-001', ['B'], true, t0 + 10 * DAY);
    eq(Progress.entry('JC-001').srs.due, UI.startOfDay(t0 + 10 * DAY) + 30 * DAY);
  });
  test('câu đúng ngay từ đầu không vào lịch ôn', () => { Progress.record('JC-002', ['A'], true, t0); eq(Progress.entry('JC-002').srs, null); });
  test('sai lại khi đã "nắm vững" → bỏ trạng thái nắm vững', () => {
    Progress.setMastered('JC-001', true); Progress.record('JC-001', ['A'], false, t0);
    eq(Progress.entry('JC-001').mastered, false);
  });
  test('lịch sử lựa chọn giới hạn 20 bản ghi', () => {
    for (let i = 0; i < 30; i++) Progress.record('JC-003', ['A'], i % 2 === 0, t0 + i);
    eq(Progress.entry('JC-003').history.length, 20); eq(Progress.entry('JC-003').attempts, 30);
  });
  test('dueIds chỉ gồm câu đến hạn, chưa nắm vững', () => {
    const ids = Progress.dueIds();
    ok(ids.includes('JC-001')); ok(!ids.includes('JC-002'));
    Progress.setMastered('JC-001', true); ok(!Progress.dueIds().includes('JC-001'));
  });
  test('đánh dấu "cần ôn tập" thủ công xuất hiện trong danh sách ôn tập', () => {
    Progress.record('JC-004', ['A'], true, t0); Progress.markForReview('JC-004');
    ok(Progress.dueIds().includes('JC-004'), 'dueIds');
    ok(Progress.reviewIds().includes('JC-004'), 'reviewIds phải chứa câu được đánh dấu thủ công');
  });
  test('summary tính từ dữ liệu thực tế', () => {
    const s = Progress.summary();
    const p = Storage.state.progress;
    const att = Object.values(p).reduce((a, e) => a + e.attempts, 0);
    eq(s.attempts, att); eq(s.unique, Object.keys(p).length); eq(s.unlearned, s.total - s.unique);
  });
}

// =====================================================================
section('5. Phiên làm bài (Quiz.finalize)');
{
  const { run } = createContext();
  const Quiz = run('Quiz'), QB = run('QB'), Storage = run('Storage'), Progress = run('Progress');
  const ids = QB.questions.slice(0, 6).map(q => q.id);
  const wrongOf = q => q.options.find(o => !q.correctAnswers.includes(o.id)).id;
  const mk = (mode, extra) => Object.assign({ id: 'T' + mode, kind: 'quiz', mode, title: 't', questionIds: ids.slice(), answers: {}, checked: {}, flagged: {}, index: 0, startedAt: Date.now() - 60000, timeLimitMin: 0, deadline: null, meta: {} }, extra);
  test('exam: đúng/sai/bỏ trống và điểm chính xác', () => {
    const s = mk('exam');
    s.answers[ids[0]] = QB.get(ids[0]).correctAnswers.slice();
    s.answers[ids[1]] = QB.get(ids[1]).correctAnswers.slice();
    s.answers[ids[2]] = [wrongOf(QB.get(ids[2]))];
    Storage.state.activeSession = s;
    const r = Quiz.finalize(false);
    eq([r.total, r.correct, r.wrong, r.unanswered, r.score], [6, 2, 1, 3, 33]);
    eq(Storage.state.activeSession, null);
    eq(Progress.entry(ids[0]).attempts, 1); eq(Progress.entry(ids[3]), null, 'câu bỏ trống không ghi tiến độ');
  });
  test('practice: câu đã kiểm tra không bị ghi tiến độ lần hai', () => {
    const s = mk('practice');
    s.answers[ids[0]] = QB.get(ids[0]).correctAnswers.slice(); s.checked[ids[0]] = true;
    Progress.record(ids[0], s.answers[ids[0]], true);
    const before = Progress.entry(ids[0]).attempts;
    s.answers[ids[4]] = QB.get(ids[4]).correctAnswers.slice(); // chọn nhưng chưa bấm kiểm tra
    Storage.state.activeSession = s;
    const r = Quiz.finalize(false);
    eq(Progress.entry(ids[0]).attempts, before); eq(Progress.entry(ids[4]).attempts, 1);
    eq([r.correct, r.unanswered], [2, 4]);
  });
  test('kết quả đã lưu không bị thay đổi bởi thao tác sau đó', () => {
    const s = mk('exam'); s.answers[ids[0]] = ['A'];
    Storage.state.activeSession = s;
    const r = Quiz.finalize(false); const snap = JSON.stringify(r.answers);
    s.answers[ids[0]] = ['B']; s.answers[ids[1]] = ['C'];   // sửa object của phiên gốc sau khi nộp
    eq(JSON.stringify(r.answers), snap, 'answers của phiên đã nộp bị sửa');
  });
  test('hết giờ: thời lượng không vượt giới hạn', () => {
    const s = mk('exam', { timeLimitMin: 1, deadline: Date.now() - 30000, startedAt: Date.now() - 90000 });
    Storage.state.activeSession = s;
    const r = Quiz.finalize(true);
    ok(r.auto); ok(r.durationSec <= 60, 'durationSec=' + r.durationSec);
  });
  test('câu trùng lặp trong danh sách chỉ tính một lần', () => {
    const s = mk('exam', { questionIds: [ids[0], ids[0], ids[1]] });
    s.answers[ids[0]] = QB.get(ids[0]).correctAnswers.slice();
    Storage.state.activeSession = s;
    const r = Quiz.finalize(false);
    eq(r.total, 2);
  });
  test('câu không còn trong ngân hàng bị bỏ qua khi chấm', () => {
    const s = mk('exam', { questionIds: [ids[0], 'NOT-EXIST'] });
    Storage.state.activeSession = s;
    eq(Quiz.finalize(false).total, 1);
  });
}

// =====================================================================
section('6. Interview Simulator');
{
  const { run } = createContext();
  const Interview = run('Interview'), QB = run('QB');
  for (const lvl of Object.keys(Interview.LEVELS)) for (const m of [30, 45, 60]) {
    test(lvl + ' ' + m + ' phút: không trùng, đủ 8 vòng, không vượt ngân sách thời gian', () => {
      const b = Interview.buildSession(lvl, m);
      eq(new Set(b.ids).size, b.ids.length);
      const rounds = new Set(Object.values(b.rounds)); eq(rounds.size, 8);
      const secs = b.ids.reduce((a, id) => a + QB.get(id).estimatedSeconds, 0);
      ok(secs <= m * 60, 'tổng ' + secs + 's > ' + m * 60 + 's');
      b.ids.forEach(id => ok(Interview.ROUNDS[b.rounds[id]].match(QB.get(id)), id + ' sai vòng'));
    });
  }
  test('cấp Junior ưu tiên câu dễ, Senior Enterprise ưu tiên câu khó', () => {
    const share = (lvl, ds) => { let n = 0, t = 0; for (let i = 0; i < 20; i++) { const b = Interview.buildSession(lvl, 45); t += b.ids.length; n += b.ids.filter(id => ds.includes(QB.get(id).difficulty)).length; } return n / t; };
    ok(share('junior', ['beginner', 'intermediate']) > 0.7); ok(share('enterprise', ['advanced', 'senior']) > 0.6);
  });
}

// =====================================================================
section('7. Code Challenge & lọc câu hỏi');
{
  const { run } = createContext();
  const Quiz = run('Quiz'), QB = run('QB');
  test('pool Code Challenge chỉ gồm câu có code hoặc bảng dữ liệu', () => Quiz.filterPool({ codeOnly: true }).forEach(q => ok(q.code || q.tables, q.id)));
  test('lọc kết hợp module + độ khó + loại', () => {
    const r = Quiz.filterPool({ modules: ['database-sql'], difficulties: ['advanced'], categories: ['sql'] });
    ok(r.length > 0); r.forEach(q => ok(q.module === 'database-sql' && q.difficulty === 'advanced' && q.category === 'sql'));
  });
  test('pick trả về đúng số lượng, không trùng', () => { const p = Quiz.pick({ count: 20 }); eq(p.length, 20); eq(new Set(p).size, 20); });
  test('pick count = 0 lấy toàn bộ', () => eq(Quiz.pick({ modules: ['oop'], count: 0 }).length, QB.byModule('oop').length));
  test('includeDone=false loại câu đã làm', () => {
    run('Progress').record('OOP-001', ['A'], true);
    ok(!Quiz.pick({ modules: ['oop'], includeDone: false }).includes('OOP-001'));
  });
  test('prioritizeWrong đưa câu sai lên đầu', () => {
    run('Progress').record('OOP-002', ['A'], false);
    eq(Quiz.pick({ modules: ['oop'], prioritizeWrong: true, count: 1 }), ['OOP-002']);
  });
}

// =====================================================================
section('8. Import / Export');
{
  const { run } = createContext();
  const Storage = run('Storage'), Progress = run('Progress');
  Progress.record('JC-001', ['A'], false); Storage.state.bookmarks['JC-002'] = 1; Storage.save();
  const json = Storage.exportJSON();
  test('export → import khôi phục đủ dữ liệu', () => {
    const r = Storage.validateImport(json); ok(r.ok);
    const fresh = createContext().run('Storage'); fresh.replace(r.data);
    eq(fresh.state.progress['JC-001'].wrong, 1); eq(fresh.state.bookmarks['JC-002'], 1);
  });
  test('từ chối JSON hỏng', () => ok(!Storage.validateImport('{x').ok));
  test('từ chối file không phải của ứng dụng', () => ok(!Storage.validateImport('{"a":1}').ok));
  test('từ chối version mới hơn', () => ok(!Storage.validateImport(JSON.stringify({ app: 'java-backend-mastery', version: 99 })).ok));
  test('từ chối progress sai kiểu', () => ok(!Storage.validateImport(JSON.stringify({ app: 'java-backend-mastery', version: 1, progress: [] })).ok));
}

// =====================================================================
section('9. Bài học lý thuyết (LS)');
{
  const { run } = createContext();
  const QB = run('QB'), LS = run('LS'), Storage = run('Storage');
  test('mọi topic của mọi module đều có bài học, không bài thừa', () => {
    const total = QB.modules.reduce((a, m) => a + m.topics.length, 0);
    QB.modules.forEach(m => m.topics.forEach(t => ok(LS.has(m.id, t), m.id + ' / ' + t)));
    eq(LS.size, total); eq(LS.errors.length, 0);
  });
  test('render tạo HTML hợp lệ, escape ký tự đặc biệt', () => {
    const html = LS.render(['Đoạn <script>', '## Tiêu đề', '- a', '- b', '! cảnh báo', '? phỏng vấn', { lang: 'java', code: 'List<String> x;' }, { table: [['A', 'B'], ['1', '2']] }]);
    ok(!html.includes('<script>'), 'không escape <script>');
    ok(html.includes('<ul><li>a</li><li>b</li></ul>'), 'bullet gộp sai');
    ok(html.includes('callout warn') && html.includes('callout tip') && html.includes('<h4>') && html.includes('<table') && html.includes('pre class="code"'));
    ok(!html.includes('undefined'));
  });
  test('render toàn bộ 268 bài không lỗi', () => QB.modules.forEach(m => m.topics.forEach(t => { const h = LS.render(LS.get(m.id, t)); ok(h.length > 200 && !h.includes('undefined'), m.id + ' / ' + t); })));
  test('trạng thái "đã đọc" được lưu, sanitize và export/import', () => {
    Storage.state.lessons['oop::Encapsulation'] = 123; Storage.save(); Storage.load();
    eq(Storage.state.lessons['oop::Encapsulation'], 123);
    const r = Storage.validateImport(JSON.stringify(Object.assign(JSON.parse(Storage.exportJSON()), { lessons: { 'oop::Encapsulation': 5, bad: 1 } })));
    ok(r.ok); eq(r.data.lessons, { 'oop::Encapsulation': 5 });
  });
}

// =====================================================================
console.log('\n' + (failed ? '✗' : '✓') + ' ' + passed + ' passed, ' + failed + ' failed');
if (failed) { failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
