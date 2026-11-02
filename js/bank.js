/**
 * QB — Question Bank core.
 * Các file trong /data gọi QB.module(meta, questions) để đăng ký module và câu hỏi.
 * Câu hỏi được viết ở dạng rút gọn (xem README) và được chuẩn hóa về schema đầy đủ:
 * { id, module, topic, type, difficulty, category, question, code, codeLang, tables,
 *   options:[{id,text}], correctAnswers, explanation, optionExplanations, tags,
 *   estimatedSeconds, versionScope }
 */
const QB = (() => {
  const DIFFICULTY = { b: 'beginner', i: 'intermediate', a: 'advanced', s: 'senior' };
  const DIFFICULTY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', senior: 'Senior Interview' };
  const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced', 'senior'];
  const CATEGORY_LABEL = {
    theory: 'Lý thuyết',
    output: 'Dự đoán output',
    compile: 'Lỗi compile',
    runtime: 'Lỗi runtime',
    bug: 'Bug logic',
    sql: 'SQL',
    scenario: 'Tình huống thực tế',
    design: 'Chọn thiết kế',
    debug: 'Tìm nguyên nhân lỗi',
    perf: 'Tối ưu hiệu năng',
    tradeoff: 'Trade-off',
  };
  const LETTERS = 'ABCDEFGH'.split('');

  const modules = [];
  const questions = [];
  const byId = new Map();
  const errors = [];

  /** PRNG xác định theo ID để hoán vị lựa chọn ổn định giữa các lần tải trang. */
  function seededRandom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => {
      h = (h + 0x6D2B79F5) | 0;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Hoán vị thứ tự lựa chọn (trừ khi fixed: true) để đáp án đúng phân bố đều A/B/C/D.
   * Letter trong file data (ans, why) được ánh xạ sang letter mới tương ứng.
   */
  function arrange(raw) {
    const texts = (raw.opts || []).map(o => (typeof o === 'string' ? o : o.text));
    const order = texts.map((_, i) => i);
    if (!raw.fixed) {
      const rnd = seededRandom(raw.id);
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    }
    const map = {}; // letter gốc -> letter hiển thị
    order.forEach((orig, pos) => { map[LETTERS[orig]] = LETTERS[pos]; });
    const options = order.map((orig, pos) => ({ id: LETTERS[pos], text: texts[orig] }));
    const ans = (Array.isArray(raw.ans) ? raw.ans : [raw.ans]).map(a => map[a] || a).sort();
    const why = {};
    Object.entries(raw.why || {}).forEach(([k, v]) => { why[map[k] || k] = v; });
    return { options, ans, why };
  }

  function normalize(meta, raw) {
    const { options, ans: correct, why } = arrange(raw);
    const difficulty = DIFFICULTY[raw.d] || raw.d || 'intermediate';
    return {
      id: raw.id,
      module: meta.id,
      topic: raw.topic,
      type: raw.type || (correct.length > 1 ? 'multiple' : 'single'),
      difficulty,
      category: raw.cat || 'theory',
      question: raw.q,
      code: raw.code ? String(raw.code).replace(/^\n+|\s+$/g, '') : '',
      codeLang: raw.lang || (raw.code ? 'java' : ''),
      tables: raw.tables || null,
      options,
      correctAnswers: correct,
      explanation: raw.exp || '',
      optionExplanations: why,
      tags: raw.tags || [],
      estimatedSeconds: raw.sec || (raw.code || raw.tables ? 75 : 45),
      versionScope: raw.ver || '',
    };
  }

  function module(meta, list) {
    if (!meta || !meta.id) { errors.push('Module thiếu id'); return; }
    if (modules.some(m => m.id === meta.id)) { errors.push('Module trùng id: ' + meta.id); return; }
    modules.push(Object.assign({ topics: [] }, meta));
    (list || []).forEach(raw => {
      if (!raw || !raw.id) { errors.push('Câu hỏi thiếu id trong module ' + meta.id); return; }
      if (byId.has(raw.id)) { errors.push('ID câu hỏi trùng: ' + raw.id); return; }
      const q = normalize(meta, raw);
      questions.push(q);
      byId.set(q.id, q);
    });
    modules.sort((a, b) => a.order - b.order);
  }

  return {
    module,
    modules,
    questions,
    errors,
    get: id => byId.get(id),
    getModule: id => modules.find(m => m.id === id),
    byModule: id => questions.filter(q => q.module === id),
    DIFFICULTY_LABEL,
    DIFFICULTY_ORDER,
    CATEGORY_LABEL,
    normalize,
  };
})();
