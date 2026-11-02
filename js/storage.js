/**
 * Storage — lưu dữ liệu cá nhân trong localStorage với version schema,
 * giá trị mặc định, kiểm tra dữ liệu không hợp lệ và import/export JSON.
 * Không lưu thông tin bí mật hay dữ liệu xác thực.
 */
const Storage = (() => {
  const KEY = 'jbm.data';
  const VERSION = 1;
  const MAX_SESSIONS = 200;
  const MAX_HISTORY = 20;
  const DEFAULT_INTERVALS = [1, 3, 7, 14, 30];

  function defaults() {
    return {
      app: 'java-backend-mastery',
      version: VERSION,
      createdAt: Date.now(),
      settings: { theme: 'system', srsIntervals: DEFAULT_INTERVALS.slice(), showNotesInQuiz: true },
      progress: {},     // qid -> ProgressEntry
      bookmarks: {},    // qid -> timestamp
      notes: {},        // qid -> { text, updatedAt }
      lessons: {},      // "moduleId::topic" -> timestamp đã đọc
      sessions: [],     // lịch sử phiên làm bài đã kết thúc
      activeSession: null,
    };
  }

  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const num = (x, d) => (typeof x === 'number' && isFinite(x) ? x : d);

  function normEntry(e) {
    if (!isObj(e)) return null;
    const out = {
      attempts: Math.max(0, num(e.attempts, 0)),
      correct: Math.max(0, num(e.correct, 0)),
      wrong: Math.max(0, num(e.wrong, 0)),
      correctAfterWrong: Math.max(0, num(e.correctAfterWrong, 0)),
      firstAnswered: num(e.firstAnswered, null),
      lastAnswered: num(e.lastAnswered, null),
      lastResult: typeof e.lastResult === 'boolean' ? e.lastResult : null,
      history: Array.isArray(e.history)
        ? e.history.filter(h => isObj(h) && Array.isArray(h.sel)).slice(-MAX_HISTORY)
          .map(h => ({ t: num(h.t, 0), sel: h.sel.map(String), ok: !!h.ok }))
        : [],
      mastered: !!e.mastered,
      srs: null,
    };
    out.attempts = Math.max(out.attempts, out.correct + out.wrong); // giữ số liệu nhất quán khi dữ liệu cũ thiếu/sai
    if (isObj(e.srs)) out.srs = { level: Math.max(0, num(e.srs.level, 0)), due: num(e.srs.due, Date.now()) };
    return out;
  }

  /** Hợp nhất dữ liệu thô với mặc định; bỏ qua trường sai kiểu. */
  function sanitize(raw) {
    const d = defaults();
    if (!isObj(raw)) return d;
    const s = d;
    s.createdAt = num(raw.createdAt, d.createdAt);
    if (isObj(raw.settings)) {
      const st = raw.settings;
      if (['light', 'dark', 'system'].includes(st.theme)) s.settings.theme = st.theme;
      if (Array.isArray(st.srsIntervals) && st.srsIntervals.length && st.srsIntervals.every(n => typeof n === 'number' && n > 0 && n <= 365))
        s.settings.srsIntervals = st.srsIntervals.slice(0, 10);
      if (typeof st.showNotesInQuiz === 'boolean') s.settings.showNotesInQuiz = st.showNotesInQuiz;
    }
    if (isObj(raw.progress)) for (const [k, v] of Object.entries(raw.progress)) { const e = normEntry(v); if (e) s.progress[k] = e; }
    if (isObj(raw.bookmarks)) for (const [k, v] of Object.entries(raw.bookmarks)) if (v) s.bookmarks[k] = num(v, Date.now());
    if (isObj(raw.notes)) for (const [k, v] of Object.entries(raw.notes)) {
      if (typeof v === 'string' && v.trim()) s.notes[k] = { text: v, updatedAt: Date.now() };
      else if (isObj(v) && typeof v.text === 'string' && v.text.trim()) s.notes[k] = { text: v.text, updatedAt: num(v.updatedAt, Date.now()) };
    }
    if (isObj(raw.lessons)) for (const [k, v] of Object.entries(raw.lessons)) if (typeof k === 'string' && k.includes('::') && v) s.lessons[k] = num(v, Date.now());
    if (Array.isArray(raw.sessions))
      s.sessions = raw.sessions.filter(x => isObj(x) && x.id && Array.isArray(x.questionIds) && isObj(x.answers)).slice(-MAX_SESSIONS);
    if (isObj(raw.activeSession) && Array.isArray(raw.activeSession.questionIds) && raw.activeSession.questionIds.length && isObj(raw.activeSession.answers))
      s.activeSession = Object.assign({ checked: {}, flagged: {}, index: 0, meta: {} }, raw.activeSession);
    return migrate(s, num(raw.version, 0));
  }

  /** Nơi xử lý nâng cấp schema khi VERSION tăng. */
  function migrate(s, fromVersion) {
    // v0 -> v1: chưa có thay đổi cấu trúc, chỉ cần gắn version mới.
    s.version = VERSION;
    return s;
  }

  let state = defaults();
  let lastError = null;

  function load() {
    try {
      const txt = localStorage.getItem(KEY);
      if (!txt) { state = defaults(); return state; }
      try { state = sanitize(JSON.parse(txt)); }
      catch (parseErr) {
        // Dữ liệu hỏng: giữ bản sao để người dùng không mất hẳn, rồi khởi tạo lại.
        try { localStorage.setItem(KEY + '.corrupt.' + Date.now(), txt); } catch (e) { /* ignore */ }
        state = defaults();
        lastError = 'Dữ liệu lưu trữ bị hỏng, đã khởi tạo lại (bản cũ được sao lưu).';
      }
    } catch (e) {
      state = defaults();
      lastError = 'Không truy cập được localStorage. Dữ liệu sẽ không được lưu sau khi tải lại trang.';
    }
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) {
      // Thử thu gọn lịch sử khi đầy dung lượng
      if (state.sessions.length > 50) { state.sessions = state.sessions.slice(-50); try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e2) { /* fallthrough */ } }
      if (typeof UI !== 'undefined') UI.toast('Không lưu được dữ liệu (localStorage bị chặn hoặc đầy).', 'bad');
      return false;
    }
  }

  function exportJSON() {
    const copy = JSON.parse(JSON.stringify(state));
    copy.exportedAt = new Date().toISOString();
    return JSON.stringify(copy, null, 2);
  }

  /** Kiểm tra file import. Trả về { ok, data, error, summary }. */
  function validateImport(text) {
    let raw;
    try { raw = JSON.parse(text); } catch (e) { return { ok: false, error: 'File không phải JSON hợp lệ.' }; }
    if (!isObj(raw)) return { ok: false, error: 'Nội dung JSON phải là một object.' };
    if (raw.app !== 'java-backend-mastery') return { ok: false, error: 'File không phải dữ liệu xuất từ Java Backend Mastery (thiếu trường app).' };
    if (typeof raw.version !== 'number' || raw.version > VERSION) return { ok: false, error: 'Phiên bản dữ liệu không được hỗ trợ (version=' + raw.version + ').' };
    if (raw.progress !== undefined && !isObj(raw.progress)) return { ok: false, error: 'Trường progress không hợp lệ.' };
    if (raw.sessions !== undefined && !Array.isArray(raw.sessions)) return { ok: false, error: 'Trường sessions không hợp lệ.' };
    const data = sanitize(raw);
    return {
      ok: true, data,
      summary: Object.keys(data.progress).length + ' câu có tiến độ, ' + data.sessions.length + ' phiên làm bài, ' +
        Object.keys(data.bookmarks).length + ' bookmark, ' + Object.keys(data.notes).length + ' ghi chú, ' + Object.keys(data.lessons).length + ' bài học đã đọc',
    };
  }

  function replace(data) { state = data; save(); }
  function reset() { state = defaults(); save(); }

  return {
    load, save, exportJSON, validateImport, replace, reset,
    get state() { return state; },
    get lastError() { return lastError; },
    MAX_HISTORY, MAX_SESSIONS, DEFAULT_INTERVALS, VERSION,
  };
})();
