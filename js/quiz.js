/**
 * Quiz — bộ máy làm bài dùng chung cho Theory Quiz, Interview Simulator, Code Challenge và Review.
 * - Chế độ practice: kiểm tra ngay sau mỗi câu, hiển thị giải thích.
 * - Chế độ exam: không tiết lộ đáp án tới khi nộp, có timer, auto-submit khi hết giờ.
 * Phiên đang làm được lưu trong Storage.state.activeSession nên không mất khi tải lại trang.
 */
const Quiz = (() => {
  const S = () => Storage.state;
  let resultFilter = 'all';

  // ---------- Chấm điểm ----------
  function grade(q, sel) {
    if (!sel || !sel.length) return null; // bỏ trống: không tính đúng
    const a = q.correctAnswers.slice().sort().join('|');
    const b = Array.from(new Set(sel)).sort().join('|');
    return a === b;
  }

  // ---------- Chọn câu hỏi ----------
  /**
   * filters: { modules:[], topic, difficulties:[], categories:[], codeOnly, count, includeDone, prioritizeWrong, ids:[] }
   */
  function filterPool(f) {
    f = f || {};
    let pool = f.ids ? f.ids.map(QB.get).filter(Boolean) : QB.questions.slice();
    if (f.modules && f.modules.length) pool = pool.filter(q => f.modules.includes(q.module));
    if (f.topic) pool = pool.filter(q => q.topic === f.topic);
    if (f.difficulties && f.difficulties.length) pool = pool.filter(q => f.difficulties.includes(q.difficulty));
    if (f.categories && f.categories.length) pool = pool.filter(q => f.categories.includes(q.category));
    if (f.codeOnly) pool = pool.filter(q => q.code || q.tables);
    if (f.includeDone === false) pool = pool.filter(q => !Progress.status(q.id).done);
    return pool;
  }
  function pick(f) {
    let pool = UI.shuffle(filterPool(f));
    if (f.prioritizeWrong) {
      const rank = q => { const st = Progress.status(q.id); return st.due ? 0 : st.lastResult === false ? 1 : st.wrong ? 2 : 3; };
      pool.sort((a, b) => rank(a) - rank(b));
    }
    const n = f.count && f.count > 0 ? f.count : pool.length;
    return pool.slice(0, n).map(q => q.id);
  }

  // ---------- Phiên làm bài ----------
  const clone = o => JSON.parse(JSON.stringify(o || {}));
  const pickKeys = (obj, keys) => { const r = {}; keys.forEach(k => { if (obj && obj[k] !== undefined) r[k] = obj[k]; }); return r; };

  function newSession(o) {
    const now = Date.now();
    return {
      id: 'S' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      kind: o.kind || 'quiz',
      mode: o.mode === 'exam' ? 'exam' : 'practice',
      title: o.title || 'Bài luyện tập',
      questionIds: Array.from(new Set(o.questionIds)).filter(id => QB.get(id)), // mỗi câu chỉ xuất hiện một lần
      answers: {}, checked: {}, flagged: {},
      index: 0,
      startedAt: now,
      timeLimitMin: o.timeLimitMin || 0,
      deadline: o.timeLimitMin ? now + o.timeLimitMin * 60000 : null,
      meta: o.meta || {},
    };
  }

  async function start(o) {
    if (!o.questionIds || !o.questionIds.length) { UI.toast('Không có câu hỏi phù hợp với bộ lọc đã chọn.', 'bad'); return false; }
    const cur = S().activeSession;
    if (cur) {
      const ok = await UI.confirm('Bạn đang có bài **' + cur.title + '** chưa hoàn thành. Bắt đầu bài mới sẽ hủy bài đó (những câu đã kiểm tra ở chế độ luyện tập vẫn được giữ trong tiến độ). Tiếp tục?', { okText: 'Hủy bài cũ và bắt đầu', danger: true });
      if (!ok) return false;
    }
    S().activeSession = newSession(o);
    Storage.save();
    App.navigate('session');
    return true;
  }

  async function abandon() {
    const s = S().activeSession; if (!s) return;
    const ok = await UI.confirm('Hủy bài **' + s.title + '**? Bài sẽ không được lưu vào lịch sử.', { okText: 'Hủy bài', danger: true });
    if (!ok) return;
    S().activeSession = null; Storage.save();
    App.navigate('dashboard');
  }

  /** Kết thúc phiên: chấm điểm, ghi tiến độ (mỗi câu đúng 1 lần), lưu lịch sử. */
  function finalize(auto) {
    const s = S().activeSession; if (!s) return null;
    const now = Date.now();
    const ids = Array.from(new Set(s.questionIds)).filter(id => QB.get(id));
    let correct = 0, wrong = 0, unanswered = 0;
    const byModule = {}, byTopic = {}, byRound = {};
    const rounds = s.meta.rounds || {};
    const bump = (obj, k, ok) => { obj[k] = obj[k] || { total: 0, correct: 0 }; obj[k].total++; if (ok) obj[k].correct++; };
    for (const id of ids) {
      const q = QB.get(id);
      const sel = s.answers[id] || [];
      const ok = grade(q, sel);
      if (ok === null) unanswered++; else if (ok) correct++; else wrong++;
      // Exam: ghi tiến độ lúc nộp. Practice: câu đã chọn nhưng chưa bấm kiểm tra cũng được chấm lúc kết thúc.
      if (ok !== null && !s.checked[id]) { Progress.record(id, sel, ok, now); s.checked[id] = true; }
      bump(byModule, q.module, ok === true);
      bump(byTopic, q.module + '::' + q.topic, ok === true);
      if (rounds[id] != null) bump(byRound, rounds[id], ok === true);
    }
    const record = {
      id: s.id, kind: s.kind, mode: s.mode, title: s.title,
      startedAt: s.startedAt, finishedAt: now, auto: !!auto,
      durationSec: Math.round(((auto && s.deadline ? Math.min(now, s.deadline) : now) - s.startedAt) / 1000),
      timeLimitMin: s.timeLimitMin,
      total: ids.length, correct, wrong, unanswered, score: UI.pct(correct, ids.length),
      // bản sao độc lập: kết quả đã nộp là chỉ đọc, không chia sẻ object với phiên khác
      questionIds: ids, answers: clone(pickKeys(s.answers, ids)), flagged: clone(pickKeys(s.flagged, ids)), meta: clone(s.meta),
      byModule, byTopic, byRound,
    };
    S().sessions.push(record);
    if (S().sessions.length > Storage.MAX_SESSIONS) S().sessions = S().sessions.slice(-Storage.MAX_SESSIONS);
    S().activeSession = null;
    Storage.save();
    return record;
  }

  function submit(auto) {
    const rec = finalize(auto);
    if (!rec) return;
    document.getElementById('modal-root').innerHTML = ''; // đóng hộp thoại "Nộp bài?" nếu hết giờ khi đang mở
    UI.toast((auto ? 'Hết giờ! Bài đã được tự động nộp. ' : 'Đã hoàn thành bài. ') + 'Điểm: ' + rec.score + '/100', auto ? 'bad' : 'ok');
    App.navigate('result/' + rec.id);
  }

  /** Gọi mỗi giây từ App: cập nhật đồng hồ và tự nộp khi hết giờ (kể cả sau khi tải lại trang). */
  function tick() {
    const s = S().activeSession;
    if (!s || !s.deadline) return;
    const left = Math.round((s.deadline - Date.now()) / 1000);
    if (left <= 0) { submit(true); return; }
    const el = document.getElementById('timer');
    if (el) { el.textContent = '⏱ ' + UI.fmtDuration(left); el.classList.toggle('low', left <= 60); }
  }

  // ---------- Render câu hỏi (dùng chung) ----------
  function metaChips(q) {
    return '<span class="chip">' + UI.esc(UI.moduleName(q.module)) + '</span>' +
      '<span class="chip">' + UI.esc(q.topic) + '</span>' + UI.diffChip(q.difficulty) +
      '<span class="chip">' + UI.esc(QB.CATEGORY_LABEL[q.category] || q.category) + '</span>' +
      (q.versionScope ? '<span class="chip">' + UI.esc(q.versionScope) + '</span>' : '') +
      (q.type === 'multiple' ? '<span class="chip warn">Nhiều đáp án</span>' : '');
  }
  function questionBody(q) {
    return '<div class="q-text">' + UI.inline(q.question) + '</div>' +
      UI.dataTables(q.tables) + UI.codeBlock(q.code, q.codeLang) +
      (q.type === 'multiple' ? '<div class="q-hint">Chọn ' + q.correctAnswers.length + ' đáp án đúng.</div>' : '');
  }
  /** reveal: hiển thị đúng/sai cho từng lựa chọn. */
  function optionsHTML(q, sel, opts) {
    opts = opts || {};
    sel = sel || [];
    return '<div class="opts' + (q.type === 'multiple' ? ' multi' : '') + '" role="' + (q.type === 'multiple' ? 'group' : 'radiogroup') + '">' + q.options.map((o, i) => {
      const isSel = sel.includes(o.id), isCor = q.correctAnswers.includes(o.id);
      let cls = '';
      if (opts.reveal) cls = isCor ? (isSel ? 'correct' : 'correct missed') : isSel ? 'wrong' : '';
      else if (isSel) cls = 'selected';
      const why = opts.reveal && q.optionExplanations[o.id] ? '<span class="why">' + UI.inline(q.optionExplanations[o.id]) + '</span>' : '';
      return '<button class="opt ' + cls + '" data-act="opt" data-opt="' + UI.esc(o.id) + '"' + (opts.disabled ? ' disabled' : '') +
        ' role="' + (q.type === 'multiple' ? 'checkbox' : 'radio') + '" aria-checked="' + isSel + '">' +
        '<span class="letter">' + UI.esc(o.id) + '</span><span class="otext">' + UI.inline(o.text) +
        (opts.reveal && isCor ? ' <span class="chip ok">Đáp án đúng</span>' : '') +
        (opts.reveal && isSel && !isCor ? ' <span class="chip bad">Bạn chọn</span>' : '') +
        (opts.reveal && isSel && isCor ? ' <span class="chip ok">Bạn chọn</span>' : '') + why + '</span></button>';
    }).join('') + '</div>';
  }
  function explanationHTML(q, sel) {
    const ok = grade(q, sel);
    const cls = ok === null ? 'none' : ok ? 'ok' : 'bad';
    const head = ok === null ? 'Chưa trả lời' : ok ? '✓ Chính xác' : '✗ Chưa chính xác';
    return '<div class="feedback ' + cls + '"><h4>' + head + ' — Đáp án đúng: ' + q.correctAnswers.join(', ') + '</h4>' +
      '<div class="exp">' + UI.inline(q.explanation) + '</div>' +
      (typeof App !== 'undefined' ? App.lessonLink(q.module, q.topic) : '') + '</div>';
  }
  function noteHTML(qid, open) {
    const n = S().notes[qid];
    return '<details class="note-box"' + (open || n ? ' open' : '') + '><summary>Ghi chú cá nhân' + (n ? ' (đã có)' : '') + '</summary>' +
      '<textarea class="input mt" data-note="' + UI.esc(qid) + '" placeholder="Ghi lại điểm cần nhớ cho câu này…">' + UI.esc(n ? n.text : '') + '</textarea>' +
      '<div class="row mt"><button class="btn sm" data-act="save-note" data-qid="' + UI.esc(qid) + '">Lưu ghi chú</button></div></details>';
  }
  function saveNote(qid, text) {
    if (text.trim()) S().notes[qid] = { text: text.trim(), updatedAt: Date.now() };
    else delete S().notes[qid];
    Storage.save();
    UI.toast('Đã lưu ghi chú.', 'ok');
  }
  function toggleBookmark(qid) {
    if (S().bookmarks[qid]) delete S().bookmarks[qid]; else S().bookmarks[qid] = Date.now();
    Storage.save();
    return !!S().bookmarks[qid];
  }
  function starBtn(qid) {
    const on = !!S().bookmarks[qid];
    return '<button class="star ' + (on ? 'on' : '') + '" data-act="bookmark" data-qid="' + UI.esc(qid) + '" title="Yêu thích (Shift+B)" aria-label="Đánh dấu yêu thích">' + (on ? '★' : '☆') + '</button>';
  }

  // ---------- Runner ----------
  function render(el) {
    const s = S().activeSession;
    if (!s) {
      el.innerHTML = UI.emptyState('✎', 'Không có bài đang làm', 'Hãy bắt đầu một bài từ Theory Quiz, Interview Simulator, Code Challenge hoặc Review Mistakes.',
        '<a class="btn primary" href="#/quiz">Tạo bài trắc nghiệm</a>');
      return;
    }
    s.questionIds = s.questionIds.filter(id => QB.get(id));
    if (!s.questionIds.length) { S().activeSession = null; Storage.save(); return render(el); }
    if (s.deadline && Date.now() >= s.deadline) { submit(true); return; }
    s.index = Math.min(Math.max(0, s.index || 0), s.questionIds.length - 1);

    const qid = s.questionIds[s.index];
    const q = QB.get(qid);
    const sel = s.answers[qid] || [];
    const practice = s.mode === 'practice';
    const checked = practice && s.checked[qid];
    const answeredCount = s.questionIds.filter(id => (s.answers[id] || []).length).length;
    const total = s.questionIds.length;
    const rounds = s.meta.rounds || null;
    const roundName = rounds && s.meta.roundNames ? s.meta.roundNames[rounds[qid]] : null;

    let actions = '';
    if (practice) {
      actions += '<button class="btn" data-act="prev"' + (s.index === 0 ? ' disabled' : '') + '>← Câu trước</button>';
      if (!checked) actions += '<button class="btn primary" data-act="check"' + (sel.length ? '' : ' disabled') + '>Kiểm tra đáp án</button>';
      actions += '<button class="btn' + (checked ? ' primary' : '') + '" data-act="next">' + (s.index === total - 1 ? 'Kết thúc bài' : (checked ? 'Câu tiếp →' : 'Bỏ qua →')) + '</button>';
      if (checked) {
        const e = Progress.entry(qid);
        actions += '<span class="spacer"></span><button class="btn sm" data-act="review-mark" data-qid="' + qid + '">' + (Progress.inReview(e) ? '✓ Trong lịch ôn tập — bấm để gỡ' : '↻ Đánh dấu cần ôn tập') + '</button>';
      }
    } else {
      actions += '<button class="btn" data-act="prev"' + (s.index === 0 ? ' disabled' : '') + '>← Câu trước</button>';
      actions += '<button class="btn ' + (s.flagged[qid] ? 'active' : '') + '" data-act="flag">⚑ ' + (s.flagged[qid] ? 'Bỏ đánh dấu' : 'Đánh dấu xem lại') + '</button>';
      if (sel.length) actions += '<button class="btn ghost" data-act="clear">Xóa lựa chọn</button>';
      actions += '<button class="btn primary" data-act="next"' + (s.index === total - 1 ? ' disabled' : '') + '>Câu tiếp →</button>';
    }

    // Navigator
    let navCells = '', lastRound = null;
    s.questionIds.forEach((id, i) => {
      if (rounds && rounds[id] !== lastRound) { lastRound = rounds[id]; navCells += '<div class="round-label">' + UI.esc(s.meta.roundNames[lastRound] || '') + '</div>'; }
      const a = (s.answers[id] || []).length;
      let c = '';
      if (practice && s.checked[id]) c = grade(QB.get(id), s.answers[id]) ? 'correct' : 'wrong';
      else if (a) c = 'answered';
      navCells += '<button class="nav-cell ' + c + (s.flagged[id] ? ' flagged' : '') + (i === s.index ? ' current' : '') + '" data-act="goto" data-i="' + i + '" aria-label="Câu ' + (i + 1) + '">' + (i + 1) + '</button>';
    });
    const legend = practice
      ? '<span><i style="background:var(--ok)"></i>Đúng</span><span><i style="background:var(--bad)"></i>Sai</span><span><i style="background:var(--primary-soft)"></i>Đã chọn</span><span><i style="border:1px solid var(--border)"></i>Chưa làm</span>'
      : '<span><i style="background:var(--primary-soft)"></i>Đã trả lời</span><span><i style="border:1px solid var(--border)"></i>Chưa trả lời</span><span><i style="background:var(--warn);border-radius:50%"></i>Xem lại</span>';
    const showNote = practice ? checked : S().settings.showNotesInQuiz && !!S().notes[qid];

    el.innerHTML =
      '<div class="runner-head"><h2>' + UI.esc(s.title) + '</h2>' +
      '<span class="chip ' + (practice ? 'ok' : 'warn') + '">' + (practice ? 'Luyện tập' : 'Thi') + '</span>' +
      '<span class="spacer"></span>' +
      (s.deadline ? '<span class="timer" id="timer">⏱ ' + UI.fmtDuration((s.deadline - Date.now()) / 1000) + '</span>' : '') +
      (practice ? '<button class="btn" data-act="finish">Kết thúc</button>' : '<button class="btn primary" data-act="submit">Nộp bài</button>') +
      '<button class="btn ghost" data-act="abandon" title="Hủy bài">✕</button></div>' +
      '<div class="row between small muted" style="margin-bottom:6px"><span>Câu ' + (s.index + 1) + '/' + total + (roundName ? ' · ' + UI.esc(roundName) : '') + '</span><span>Đã trả lời ' + answeredCount + '/' + total + '</span></div>' +
      UI.progressBar(UI.pct(answeredCount, total)) +
      '<div class="runner mt"><div><div class="q-card">' +
      '<div class="q-meta"><span class="q-num">Câu ' + (s.index + 1) + '</span>' + metaChips(q) + '<span class="spacer"></span>' + starBtn(qid) + '</div>' +
      questionBody(q) +
      optionsHTML(q, sel, { reveal: checked, disabled: checked }) +
      (checked ? explanationHTML(q, sel) : '') +
      '<div class="q-actions">' + actions + '</div>' +
      (showNote ? noteHTML(qid) : '') +
      '<div class="kbd-hint"><kbd>1</kbd>–<kbd>' + q.options.length + '</kbd> hoặc <kbd>A</kbd>–<kbd>' + q.options[q.options.length - 1].id + '</kbd> chọn đáp án · ' +
      (practice ? '<kbd>Enter</kbd> kiểm tra / câu tiếp · ' : '<kbd>F</kbd> đánh dấu · ') + '<kbd>←</kbd><kbd>→</kbd> chuyển câu · <kbd>Shift</kbd>+<kbd>B</kbd> yêu thích</div>' +
      '</div></div>' +
      '<aside class="navigator"><div class="row between small"><strong>Danh sách câu</strong><span class="muted">' + answeredCount + '/' + total + '</span></div>' +
      '<div class="nav-grid mt">' + navCells + '</div><div class="legend">' + legend + '</div>' +
      (!practice ? '<button class="btn primary mt" style="width:100%" data-act="submit">Nộp bài</button>' : '') + '</aside></div>';

    el.onclick = e => onClick(e, el);
  }

  function onClick(e, el) {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const s = S().activeSession; if (!s) return;
    const act = b.dataset.act;
    if (act === 'opt') return selectOption(b.dataset.opt, el);
    if (act === 'check') return check(el);
    if (act === 'next') return next(el);
    if (act === 'prev') return go(s.index - 1, el);
    if (act === 'goto') return go(+b.dataset.i, el);
    if (act === 'flag') { const id = s.questionIds[s.index]; if (s.flagged[id]) delete s.flagged[id]; else s.flagged[id] = true; Storage.save(); return render(el); }
    if (act === 'clear') { delete s.answers[s.questionIds[s.index]]; Storage.save(); return render(el); }
    if (act === 'bookmark') { const on = toggleBookmark(b.dataset.qid); UI.toast(on ? 'Đã thêm vào yêu thích.' : 'Đã bỏ khỏi yêu thích.'); return render(el); }
    if (act === 'review-mark') { const en = Progress.entry(b.dataset.qid); if (Progress.inReview(en)) Progress.unmarkReview(b.dataset.qid); else Progress.markForReview(b.dataset.qid); return render(el); }
    if (act === 'save-note') { const ta = el.querySelector('textarea[data-note]'); saveNote(b.dataset.qid, ta.value); return render(el); }
    if (act === 'submit') return confirmSubmit();
    if (act === 'finish') return confirmFinish();
    if (act === 'abandon') return abandon();
  }

  function selectOption(optId, el) {
    const s = S().activeSession;
    const qid = s.questionIds[s.index];
    const q = QB.get(qid);
    if (s.mode === 'practice' && s.checked[qid]) return; // đã kiểm tra: không đổi đáp án
    if (!q.options.some(o => o.id === optId)) return;
    let sel = (s.answers[qid] || []).slice();
    if (q.type === 'multiple') {
      if (sel.includes(optId)) sel = sel.filter(x => x !== optId);
      else if (sel.length < q.correctAnswers.length) sel.push(optId);
      else { UI.toast('Câu này chỉ có ' + q.correctAnswers.length + ' đáp án đúng. Bỏ chọn một đáp án trước.'); return; }
    } else sel = [optId]; // câu một đáp án: luôn chỉ giữ một lựa chọn
    if (sel.length) s.answers[qid] = sel; else delete s.answers[qid];
    Storage.save();
    render(el);
  }
  function check(el) {
    const s = S().activeSession;
    const qid = s.questionIds[s.index];
    const sel = s.answers[qid] || [];
    if (!sel.length || s.checked[qid]) return;
    const q = QB.get(qid);
    if (q.type === 'multiple' && sel.length !== q.correctAnswers.length) { UI.toast('Hãy chọn đủ ' + q.correctAnswers.length + ' đáp án.'); return; }
    Progress.record(qid, sel, grade(q, sel));
    s.checked[qid] = true;
    Storage.save();
    render(el);
  }
  function next(el) {
    const s = S().activeSession;
    if (s.index >= s.questionIds.length - 1) { if (s.mode === 'practice') return confirmFinish(); return; }
    go(s.index + 1, el);
  }
  function go(i, el) {
    const s = S().activeSession;
    if (i < 0 || i >= s.questionIds.length) return;
    s.index = i; Storage.save(); render(el);
    window.scrollTo({ top: 0 });
  }
  async function confirmSubmit() {
    const s = S().activeSession;
    const un = s.questionIds.filter(id => !(s.answers[id] || []).length).length;
    const fl = Object.keys(s.flagged).length;
    const msg = (un ? 'Còn **' + un + '** câu chưa trả lời (sẽ tính là không đúng). ' : 'Bạn đã trả lời tất cả câu hỏi. ') +
      (fl ? 'Có ' + fl + ' câu đang đánh dấu xem lại. ' : '') + 'Sau khi nộp, đáp án không thể thay đổi.';
    if (await UI.confirm(msg, { title: 'Nộp bài?', okText: 'Nộp bài' })) { if (S().activeSession === s) submit(false); }
  }
  async function confirmFinish() {
    const s = S().activeSession;
    const un = s.questionIds.filter(id => !(s.answers[id] || []).length).length;
    const msg = un ? 'Còn ' + un + ' câu chưa trả lời. Kết thúc bài luyện tập và xem kết quả?' : 'Kết thúc bài luyện tập và xem kết quả?';
    if (await UI.confirm(msg, { title: 'Kết thúc bài', okText: 'Kết thúc' })) { if (S().activeSession === s) submit(false); }
  }

  function onKey(e) {
    const s = S().activeSession;
    if (!s || document.getElementById('modal-root').children.length) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'textarea' || tag === 'input' || tag === 'select' || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = document.getElementById('view');
    const q = QB.get(s.questionIds[s.index]);
    const k = e.key;
    // Shift+B: yêu thích (B thường dùng để chọn đáp án B). F: đánh dấu xem lại khi câu không có đáp án F.
    if (k === 'B' && e.shiftKey) { toggleBookmark(q.id); render(el); e.preventDefault(); return; }
    if (k.toLowerCase() === 'f' && s.mode === 'exam' && q.options.length < 6) { const id = q.id; if (s.flagged[id]) delete s.flagged[id]; else s.flagged[id] = true; Storage.save(); render(el); e.preventDefault(); return; }
    let optIdx = -1;
    if (/^[1-8]$/.test(k)) optIdx = +k - 1;
    else if (/^[a-hA-H]$/.test(k)) optIdx = k.toUpperCase().charCodeAt(0) - 65;
    if (optIdx >= 0 && optIdx < q.options.length) { selectOption(q.options[optIdx].id, el); e.preventDefault(); return; }
    if (k === 'ArrowRight') { go(s.index + 1, el); e.preventDefault(); }
    else if (k === 'ArrowLeft') { go(s.index - 1, el); e.preventDefault(); }
    else if (k === 'Enter') {
      if (s.mode === 'practice') { if (!s.checked[q.id] && (s.answers[q.id] || []).length) check(el); else next(el); }
      else next(el);
      e.preventDefault();
    }
  }

  // ---------- Kết quả ----------
  function renderResult(el, id) {
    const r = S().sessions.find(x => x.id === id);
    if (!r) { el.innerHTML = UI.emptyState('?', 'Không tìm thấy kết quả', 'Phiên làm bài này không tồn tại hoặc đã bị xóa.', '<a class="btn" href="#/dashboard">Về Dashboard</a>'); return; }
    const color = r.score >= 80 ? 'var(--ok)' : r.score >= 50 ? 'var(--warn)' : 'var(--bad)';
    const items = r.questionIds.map((qid, i) => ({ i, q: QB.get(qid), sel: r.answers[qid] || [] })).filter(x => x.q)
      .map(x => Object.assign(x, { ok: grade(x.q, x.sel) }));
    const filtered = items.filter(x => resultFilter === 'all' || (resultFilter === 'ok' && x.ok === true) || (resultFilter === 'bad' && x.ok === false) || (resultFilter === 'none' && x.ok === null) || (resultFilter === 'flag' && r.flagged && r.flagged[x.q.id]));
    const modRows = Object.entries(r.byModule || {}).map(([m, v]) =>
      '<div class="bar-row"><span class="name">' + UI.esc(UI.moduleName(m)) + '</span>' + UI.progressBar(UI.pct(v.correct, v.total), UI.pct(v.correct, v.total) >= 70 ? 'ok' : UI.pct(v.correct, v.total) >= 40 ? 'warn' : 'bad') + '<span class="val">' + v.correct + '/' + v.total + '</span></div>').join('');
    const wrongIds = items.filter(x => x.ok !== true).map(x => x.q.id);
    const seg = [['all', 'Tất cả', items.length], ['ok', 'Đúng', r.correct], ['bad', 'Sai', r.wrong], ['none', 'Chưa trả lời', r.unanswered]];
    if (r.flagged && Object.keys(r.flagged).length) seg.push(['flag', 'Đã đánh dấu', Object.keys(r.flagged).length]);

    el.innerHTML =
      '<div class="page-head"><div><h1>Kết quả: ' + UI.esc(r.title) + '</h1><p>' + (r.mode === 'exam' ? 'Chế độ thi' : 'Chế độ luyện tập') + ' · ' + UI.fmtDate(r.finishedAt) + (r.auto ? ' · <span class="chip bad">Tự động nộp khi hết giờ</span>' : '') + '</p></div>' +
      '<div class="row">' + (wrongIds.length ? '<button class="btn primary" data-act="retry">Luyện lại ' + wrongIds.length + ' câu sai/bỏ trống</button>' : '') + '<a class="btn" href="#/dashboard">Về Dashboard</a></div></div>' +
      '<div class="card"><div class="score-hero"><div class="score-ring" style="background:conic-gradient(' + color + ' ' + r.score * 3.6 + 'deg, var(--surface-2) 0)"><div style="color:' + color + '">' + r.score + '</div></div>' +
      '<div class="stats" style="flex:1;margin:0">' +
      '<div class="stat"><div class="label">Tổng số câu</div><div class="value">' + r.total + '</div></div>' +
      '<div class="stat ok"><div class="label">Đúng</div><div class="value">' + r.correct + '</div></div>' +
      '<div class="stat bad"><div class="label">Sai</div><div class="value">' + r.wrong + '</div></div>' +
      '<div class="stat"><div class="label">Chưa trả lời</div><div class="value">' + r.unanswered + '</div></div>' +
      '<div class="stat"><div class="label">Thời gian</div><div class="value">' + UI.fmtDuration(r.durationSec) + '</div>' + (r.timeLimitMin ? '<div class="sub">Giới hạn ' + r.timeLimitMin + ' phút</div>' : '') + '</div>' +
      '</div></div></div>' +
      (r.kind === 'interview' && typeof Interview !== 'undefined' ? Interview.resultExtra(r) : '') +
      (modRows ? '<div class="card"><h3>Kết quả theo module</h3>' + modRows + '</div>' : '') +
      '<div class="card"><div class="card-title"><h3>Chi tiết từng câu</h3><div class="seg" id="res-seg">' +
      seg.map(([k, l, n]) => '<button data-f="' + k + '" class="' + (resultFilter === k ? 'on' : '') + '">' + l + ' (' + n + ')</button>').join('') + '</div></div>' +
      (filtered.length ? filtered.map(x => resultItem(x, r)).join('') : '<p class="muted">Không có câu nào trong nhóm này.</p>') + '</div>';

    el.querySelector('#res-seg').onclick = e => { const b = e.target.closest('button'); if (b) { resultFilter = b.dataset.f; renderResult(el, id); } };
    el.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'retry') start({ kind: 'quiz', mode: 'practice', title: 'Luyện lại câu sai — ' + r.title, questionIds: wrongIds });
      if (b.dataset.act === 'bookmark') { toggleBookmark(b.dataset.qid); b.outerHTML = starBtn(b.dataset.qid); }
      if (b.dataset.act === 'save-note') { const ta = b.closest('.note-box').querySelector('textarea'); saveNote(b.dataset.qid, ta.value); }
    };
  }
  function resultItem(x, r) {
    const cls = x.ok === null ? 'none' : x.ok ? 'ok' : 'bad';
    const label = x.ok === null ? '<span class="chip">Chưa trả lời</span>' : x.ok ? '<span class="chip ok">Đúng</span>' : '<span class="chip bad">Sai</span>';
    const round = r.meta && r.meta.rounds && r.meta.roundNames ? '<span class="chip">' + UI.esc(r.meta.roundNames[r.meta.rounds[x.q.id]] || '') + '</span>' : '';
    return '<details class="result-q ' + cls + '"><summary><strong>' + (x.i + 1) + '.</strong><span style="flex:1">' + UI.inline(x.q.question) + '</span>' + round + label + '</summary>' +
      '<div class="body"><div class="q-meta">' + metaChips(x.q) + '<span class="qid">' + x.q.id + '</span><span class="spacer"></span>' + starBtn(x.q.id) + '</div>' +
      UI.dataTables(x.q.tables) + UI.codeBlock(x.q.code, x.q.codeLang) +
      optionsHTML(x.q, x.sel, { reveal: true, disabled: true }) + explanationHTML(x.q, x.sel) + noteHTML(x.q.id) + '</div></details>';
  }

  return { grade, filterPool, pick, start, finalize, submit, tick, render, renderResult, onKey, metaChips, questionBody, optionsHTML, explanationHTML, noteHTML, saveNote, toggleBookmark, starBtn };
})();
