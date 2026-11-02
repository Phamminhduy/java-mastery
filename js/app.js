/**
 * App — router (hash), các view và khởi tạo.
 */
const App = (() => {
  const S = () => Storage.state;
  const view = () => document.getElementById('view');
  const DIFFS = QB.DIFFICULTY_ORDER;
  const CODE_CATS = ['output', 'compile', 'runtime', 'bug', 'sql', 'debug', 'perf'];

  // Trạng thái bộ lọc của từng tab (giữ khi chuyển tab)
  const state = {
    quiz: { modules: [], topic: '', difficulties: [], count: 10, minutes: 0, mode: 'practice', includeDone: true, prioritizeWrong: false },
    challenge: { modules: [], categories: [], difficulties: [], count: 10, mode: 'practice' },
    bank: { kw: '', module: '', topic: '', difficulty: '', category: '', status: '', page: 1 },
    review: { module: '', topic: '', difficulty: '', minWrong: 1, status: 'active' },
    bookmarks: { kw: '', module: '', difficulty: '', show: 'all' },
    learn: { kw: '' },
  };

  // ---------- Router ----------
  const routes = { dashboard, learn, path: learningPath, quiz: quizSetup, interview: el => Interview.render(el), challenge, review, bookmarks, bank, analytics, settings, session: el => Quiz.render(el), result: (el, id) => Quiz.renderResult(el, id) };

  let lastRoute = null;
  function navigate(path) {
    const h = '#/' + path;
    if (location.hash === h) render(); else location.hash = h;
  }
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, query] = raw.split('?');
    const parts = path.split('/');
    return { name: parts[0] || 'dashboard', arg: parts.slice(1).join('/'), query: new URLSearchParams(query || '') };
  }
  function render() {
    const { name, arg, query } = parseHash();
    const fn = routes[name] || dashboard;
    if (name === 'bank' && query.has('kw')) { state.bank.kw = query.get('kw'); state.bank.page = 1; }
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === (name === 'result' || name === 'session' ? '' : name)));
    closeSidebar();
    if (lastRoute !== location.hash) { window.scrollTo(0, 0); lastRoute = location.hash; }
    // Gỡ handler của view trước: mỗi view gán onclick/onchange lên #view, nếu không gỡ thì
    // handler cũ (ví dụ onchange của Theory Quiz) chạy cả trong màn hình làm bài.
    const el = view();
    el.onclick = null; el.onchange = null; el.oninput = null;
    try { fn(el, decodeURIComponent(arg || '')); }
    catch (err) { console.error(err); view().innerHTML = UI.emptyState('⚠', 'Đã xảy ra lỗi', 'Không thể hiển thị trang này: ' + err.message, '<a class="btn" href="#/dashboard">Về Dashboard</a>'); }
    renderChrome(name);
  }
  /** Banner bài đang làm dở + badge số câu đến hạn. */
  function renderChrome(name) {
    const a = S().activeSession;
    const banner = document.getElementById('active-banner');
    if (a && name !== 'session') {
      const answered = a.questionIds.filter(id => (a.answers[id] || []).length).length;
      banner.innerHTML = '<div class="banner">⏳ Bạn đang làm dở <strong>' + UI.esc(a.title) + '</strong> (' + answered + '/' + a.questionIds.length + ' câu' +
        (a.deadline ? ', còn <span id="banner-timer">' + UI.fmtDuration((a.deadline - Date.now()) / 1000) + '</span>' : '') + ').<span class="spacer"></span><a class="btn sm primary" href="#/session">Tiếp tục làm bài</a></div>';
    } else banner.innerHTML = '';
    const due = Progress.dueIds().length;
    const badge = document.getElementById('badge-due');
    badge.hidden = !due; badge.textContent = due;
    document.getElementById('sidebar-foot').innerHTML = QB.questions.length + ' câu hỏi · ' + QB.modules.length + ' module<br>Dữ liệu lưu cục bộ trên trình duyệt';
  }

  // ---------- Helpers ----------
  function statCard(label, value, cls, sub) {
    return '<div class="stat ' + (cls || '') + '"><div class="label">' + label + '</div><div class="value">' + value + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
  }
  function moduleOptions(sel, allLabel) {
    return '<option value="">' + (allLabel || 'Tất cả module') + '</option>' + QB.modules.map(m => '<option value="' + m.id + '"' + (sel === m.id ? ' selected' : '') + '>' + m.order + '. ' + UI.esc(m.title) + '</option>').join('');
  }
  function topicOptions(moduleId, sel) {
    const m = QB.getModule(moduleId);
    const topics = m ? m.topics.filter(t => QB.questions.some(q => q.module === m.id && q.topic === t)) : [];
    return '<option value="">Tất cả topic</option>' + topics.map(t => '<option' + (sel === t ? ' selected' : '') + '>' + UI.esc(t) + '</option>').join('');
  }
  function diffOptions(sel) {
    return '<option value="">Mọi độ khó</option>' + DIFFS.map(d => '<option value="' + d + '"' + (sel === d ? ' selected' : '') + '>' + QB.DIFFICULTY_LABEL[d] + '</option>').join('');
  }
  function catOptions(sel) {
    return '<option value="">Mọi loại câu hỏi</option>' + Object.entries(QB.CATEGORY_LABEL).map(([k, v]) => '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + v + '</option>').join('');
  }
  function bar(name, value, label, cls) {
    return '<div class="bar-row"><span class="name" title="' + UI.esc(name.replace(/<[^>]+>/g, '')) + '">' + name + '</span>' + UI.progressBar(value, cls) + '<span class="val">' + label + '</span></div>';
  }
  const accCls = p => (p == null ? '' : p >= 75 ? 'ok' : p >= 50 ? 'warn' : 'bad');
  const topicLabel = k => { const [m, t] = k.split('::'); return UI.esc(t) + ' <span class="muted tiny">· ' + UI.esc(UI.moduleName(m)) + '</span>'; };

  /** Danh sách câu hỏi dạng mở rộng được (dùng cho Bank, Review, Bookmarks). */
  function questionRow(q, extra) {
    const st = Progress.status(q.id);
    const badge = st.lastResult === true ? '<span class="chip ok">Đúng gần nhất</span>' : st.lastResult === false ? '<span class="chip bad">Sai gần nhất</span>' : '<span class="chip">Chưa làm</span>';
    return '<details class="qrow" data-qid="' + q.id + '"><summary>' + Quiz.starBtn(q.id) +
      '<span class="qtitle"><span class="t">' + UI.inline(q.question) + (q.code ? ' <span class="muted tiny">[code]</span>' : '') + '</span>' +
      '<span class="chips mt" style="margin-top:4px"><span class="qid">' + q.id + '</span><span class="chip">' + UI.esc(UI.moduleName(q.module)) + '</span><span class="chip">' + UI.esc(q.topic) + '</span>' + UI.diffChip(q.difficulty) + badge + (st.due ? '<span class="chip warn">Đến hạn ôn</span>' : '') + (S().notes[q.id] ? '<span class="chip">📝 Ghi chú</span>' : '') + '</span></span>' +
      (extra && extra.side ? extra.side : '') + '</summary><div class="qbody"></div></details>';
  }
  /** Lazy render phần thân khi mở. */
  function bindQuestionRows(container, opts) {
    opts = opts || {};
    container.addEventListener('toggle', e => {
      const d = e.target;
      if (!d.classList || !d.classList.contains('qrow') || !d.open) return;
      const body = d.querySelector('.qbody');
      if (body.dataset.loaded) return;
      body.dataset.loaded = '1';
      const q = QB.get(d.dataset.qid);
      body.innerHTML = '<div class="mt">' + Quiz.questionBody(q) + '</div><div class="reveal-zone">' +
        Quiz.optionsHTML(q, [], { disabled: true }) + '<div class="row mt"><button class="btn sm" data-act="reveal">Hiện đáp án &amp; giải thích</button>' +
        '<button class="btn sm primary" data-act="practice-one">Làm câu này</button>' + (opts.actions ? opts.actions(q) : '') + '</div></div>' +
        (opts.detail ? opts.detail(q) : '') + Quiz.noteHTML(q.id);
    }, true);
    container.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const row = b.closest('.qrow');
      const qid = b.dataset.qid || (row && row.dataset.qid);
      const act = b.dataset.act;
      if (act === 'bookmark') { e.preventDefault(); e.stopPropagation(); Quiz.toggleBookmark(qid); b.outerHTML = Quiz.starBtn(qid); if (opts.onChange) opts.onChange(); return; }
      if (act === 'reveal') { const q = QB.get(qid); b.closest('.reveal-zone').innerHTML = Quiz.optionsHTML(q, [], { reveal: true, disabled: true }) + Quiz.explanationHTML(q, q.correctAnswers).replace('✓ Chính xác — ', '') + '<div class="row mt"><button class="btn sm primary" data-act="practice-one">Làm lại câu này</button>' + (opts.actions ? opts.actions(q) : '') + '</div>'; return; }
      if (act === 'practice-one') { Quiz.start({ kind: 'quiz', mode: 'practice', title: 'Luyện câu ' + qid, questionIds: [qid] }); return; }
      if (act === 'save-note') { Quiz.saveNote(qid, row.querySelector('textarea[data-note]').value); if (opts.onChange) opts.onChange(); return; }
      if (opts.onAction) opts.onAction(act, qid, b);
    });
  }
  function pager(total, page, per) {
    const pages = Math.ceil(total / per);
    if (pages <= 1) return '';
    return '<div class="pager"><button class="btn sm" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>←</button><span class="small muted">Trang ' + page + '/' + pages + '</span><button class="btn sm" data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>→</button></div>';
  }

  // ---------- Dashboard ----------
  function dashboard(el) {
    const s = Progress.summary();
    const fresh = s.attempts === 0 && s.sessionCount === 0;
    const head = '<div class="page-head"><div><h1>Dashboard</h1><p>Tổng quan quá trình ôn luyện Java Backend của bạn.</p></div>' +
      '<div class="row"><button class="btn primary" data-act="continue">▶ Tiếp tục học</button><button class="btn" data-act="quick">⚡ Thi nhanh 10 câu</button><button class="btn" data-act="review"' + (s.due || Progress.reviewIds().some(id => !Progress.status(id).mastered) ? '' : ' disabled') + '>↻ Ôn tập câu sai' + (s.due ? ' (' + s.due + ')' : '') + '</button></div></div>';
    if (fresh) {
      el.innerHTML = head + '<div class="card">' + UI.emptyState('🚀', 'Bắt đầu hành trình ôn luyện',
        'Ngân hàng hiện có **' + s.total + '** câu hỏi trong **' + QB.modules.length + '** module. Bạn chưa làm câu nào — các số liệu thống kê sẽ xuất hiện sau khi bạn trả lời câu đầu tiên.',
        '<div class="row" style="justify-content:center"><a class="btn primary lg" href="#/learn/' + QB.modules[0].id + '">📖 Đọc bài học ' + UI.esc(QB.modules[0].title) + '</a><button class="btn lg" data-act="continue">Luyện câu hỏi ' + UI.esc(QB.modules[0].title) + '</button><a class="btn lg" href="#/path">Xem Learning Path</a><a class="btn lg" href="#/interview">Thử Interview Simulator</a></div>') + '</div>' +
        '<div class="card"><h3>Các module trong ngân hàng câu hỏi</h3>' + QB.modules.map(m => bar(m.order + '. ' + UI.esc(m.title), 0, QB.byModule(m.id).length + ' câu')).join('') + '</div>';
    } else {
      const bm = Progress.byModule();
      const weak = Progress.weakTopics(6);
      const recent = Progress.recentWrong(6);
      el.innerHTML = head +
        '<div class="stats">' +
        statCard('Tổng câu hỏi', s.total, '', QB.modules.length + ' module') +
        statCard('Lượt đã làm', s.attempts, 'primary', s.unique + ' câu duy nhất') +
        statCard('Trả lời đúng', s.correct, 'ok') +
        statCard('Trả lời sai', s.wrong, 'bad') +
        statCard('Tỷ lệ chính xác', s.accuracy + '%', accCls(s.accuracy)) +
        statCard('Chưa học', s.unlearned, '', UI.pct(s.unique, s.total) + '% đã phủ') +
        statCard('Cần ôn tập', s.due, s.due ? 'warn' : '', s.inReview + ' câu trong lịch ôn') +
        statCard('Bài thi gần nhất', s.lastExam ? s.lastExam.score : '—', '', s.lastExam ? UI.fmtDate(s.lastExam.finishedAt) : 'Chưa có bài thi') +
        statCard('Điểm TB bài thi', s.avgExam != null ? s.avgExam : '—', '', s.examCount + ' bài thi') +
        '</div>' +
        '<div class="card mb"><div class="row between small"><strong>Tiến độ phủ ngân hàng câu hỏi</strong><span class="muted">' + s.unique + '/' + s.total + '</span></div><div class="mt">' + UI.progressBar(UI.pct(s.unique, s.total)) + '</div></div>' +
        '<div class="grid grid-2"><div class="card"><div class="card-title"><h3>Tiến độ theo module</h3><a class="small" href="#/path">Learning Path →</a></div>' +
        QB.modules.map(m => { const x = bm[m.id]; return bar(m.order + '. ' + UI.esc(m.title), x.coverage, x.unique + '/' + x.total, ''); }).join('') + '</div>' +
        '<div><div class="card"><h3>Chủ đề sai nhiều nhất</h3>' + (weak.length ? weak.map(t => bar(topicLabel(t.key), t.errorRate, t.errorRate + '% sai', 'bad')).join('') : '<p class="muted small">Chưa đủ dữ liệu (cần ít nhất 2 lượt trả lời mỗi chủ đề và có câu sai).</p>') + '</div>' +
        '<div class="card"><div class="card-title"><h3>Câu sai gần đây</h3><a class="small" href="#/review">Review Mistakes →</a></div>' +
        (recent.length ? '<div class="list">' + recent.map(({ q, e }) => '<div class="list-item"><div class="small">' + UI.inline(q.question.length > 140 ? q.question.slice(0, 140) + '…' : q.question) + '</div><div class="chips mt" style="margin-top:4px"><span class="qid">' + q.id + '</span><span class="chip">' + UI.esc(q.topic) + '</span><span class="chip bad">Sai ' + e.wrong + ' lần</span><span class="tiny muted">' + UI.fmtDate(e.lastAnswered) + '</span></div></div>').join('') + '</div>' : '<p class="muted small">Không có câu sai gần đây. 👍</p>') +
        '</div></div></div>';
    }
    el.onclick = async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'continue') continueLearning();
      if (b.dataset.act === 'quick') Quiz.start({ kind: 'quiz', mode: 'exam', title: 'Thi nhanh 10 câu', questionIds: Quiz.pick({ count: 10 }), timeLimitMin: 15 });
      if (b.dataset.act === 'review') startReviewSession();
    };
  }
  function continueLearning() {
    if (S().activeSession) return navigate('session');
    const m = Progress.nextModule();
    if (!m) { UI.toast('Bạn đã làm hết ngân hàng câu hỏi! Hãy ôn tập câu sai hoặc thi thử.', 'ok'); return startReviewSession(); }
    const ids = QB.byModule(m.id).filter(q => !Progress.status(q.id).done)
      .sort((a, b) => DIFFS.indexOf(a.difficulty) - DIFFS.indexOf(b.difficulty) || m.topics.indexOf(a.topic) - m.topics.indexOf(b.topic)).slice(0, 10).map(q => q.id);
    Quiz.start({ kind: 'quiz', mode: 'practice', title: 'Học tiếp: ' + m.title, questionIds: ids });
  }
  function startReviewSession() {
    let ids = Progress.dueIds();
    let title = 'Ôn tập câu đến hạn';
    if (!ids.length) { ids = UI.shuffle(Progress.reviewIds().filter(id => !Progress.status(id).mastered)); title = 'Ôn tập câu chưa nắm vững'; }
    if (!ids.length) { UI.toast('Chưa có câu nào cần ôn tập.'); return; }
    Quiz.start({ kind: 'review', mode: 'practice', title, questionIds: ids.slice(0, 30) });
  }

  // ---------- Learning Path ----------
  function learningPath(el) {
    const bm = Progress.byModule();
    const bt = Progress.byTopic();
    el.innerHTML = '<div class="page-head"><div><h1>Learning Path</h1><p>Lộ trình từ nền tảng đến nâng cao. Bấm vào một topic để luyện tập riêng chủ đề đó.</p></div></div>' +
      '<div class="grid grid-2">' + QB.modules.map(m => {
        const x = bm[m.id];
        const topics = m.topics.map(t => {
          const k = bt[m.id + '::' + t];
          if (!k || !k.total) return '<span class="topic empty-t" title="Chưa có câu hỏi cho topic này">' + UI.esc(t) + '</span>';
          const done = k.unique === k.total;
          return '<button class="topic' + (done ? ' done' : '') + '" data-m="' + m.id + '" data-t="' + UI.esc(t) + '" title="' + k.unique + '/' + k.total + ' câu đã làm' + (k.accuracy != null ? ', đúng ' + k.accuracy + '%' : '') + '">' + UI.esc(t) + '<span class="cnt">' + k.unique + '/' + k.total + '</span></button>';
        }).join('');
        return '<div class="card module-card"><div class="module-head"><div class="module-no">' + m.order + '</div><div style="flex:1"><h3 style="margin:0">' + UI.esc(m.title) + '</h3><div class="small muted">' + UI.esc(m.description || '') + '</div></div></div>' +
          '<div class="row between small"><span>' + x.unique + '/' + x.total + ' câu đã làm' + (x.accuracy != null ? ' · đúng ' + x.accuracy + '%' : '') + '</span><span class="muted">' + x.coverage + '%</span></div>' + UI.progressBar(x.coverage, x.coverage === 100 ? 'ok' : '') +
          '<div class="topic-list">' + topics + '</div>' +
          '<div class="row"><a class="btn sm" href="#/learn/' + m.id + '">📖 Đọc bài học</a><button class="btn sm primary" data-act="learn" data-m="' + m.id + '">Học module này</button><button class="btn sm" data-act="exam" data-m="' + m.id + '">Thi 20 câu</button><a class="btn sm ghost" href="#/bank?kw=" data-act="bank" data-m="' + m.id + '">Xem câu hỏi</a></div></div>';
      }).join('') + '</div>';
    el.onclick = e => {
      const t = e.target.closest('.topic[data-t]');
      if (t) { const ids = Quiz.pick({ modules: [t.dataset.m], topic: t.dataset.t, prioritizeWrong: true }); return Quiz.start({ kind: 'quiz', mode: 'practice', title: 'Topic: ' + t.dataset.t, questionIds: ids }); }
      const b = e.target.closest('[data-act]'); if (!b) return;
      const m = QB.getModule(b.dataset.m);
      if (b.dataset.act === 'learn') {
        const ids = QB.byModule(m.id).slice().sort((a, b2) => {
          const da = Progress.status(a.id).done, db = Progress.status(b2.id).done;
          return (da - db) || DIFFS.indexOf(a.difficulty) - DIFFS.indexOf(b2.difficulty) || m.topics.indexOf(a.topic) - m.topics.indexOf(b2.topic);
        }).slice(0, 15).map(q => q.id);
        Quiz.start({ kind: 'quiz', mode: 'practice', title: 'Học: ' + m.title, questionIds: ids });
      }
      if (b.dataset.act === 'exam') Quiz.start({ kind: 'quiz', mode: 'exam', title: 'Thi module ' + m.title, questionIds: Quiz.pick({ modules: [m.id], count: 20 }), timeLimitMin: 30 });
      if (b.dataset.act === 'bank') { e.preventDefault(); Object.assign(state.bank, { kw: '', module: m.id, topic: '', difficulty: '', category: '', status: '', page: 1 }); navigate('bank'); }
    };
  }

  // ---------- Học lý thuyết (bài học theo topic) ----------
  const lessonKey = (m, t) => m + '::' + t;
  const isRead = (m, t) => !!S().lessons[lessonKey(m, t)];
  function lessonStats(m) {
    const topics = m.topics.filter(t => LS.has(m.id, t));
    return { total: topics.length, read: topics.filter(t => isRead(m.id, t)).length };
  }
  /** Link tới bài học của một topic (dùng trong giải thích đáp án). */
  function lessonLink(moduleId, topic) {
    const m = QB.getModule(moduleId);
    if (!m || !LS.has(moduleId, topic)) return '';
    return '<a class="lesson-link" href="#/learn/' + moduleId + '/' + m.topics.indexOf(topic) + '">📖 Đọc bài học: ' + UI.esc(topic) + '</a>';
  }

  function learn(el, arg) {
    const [moduleId, idx] = (arg || '').split('/');
    const m = moduleId && QB.getModule(moduleId);
    if (m) return learnModule(el, m, idx === undefined || idx === '' ? null : +idx);
    learnIndex(el);
  }

  function learnIndex(el) {
    const f = state.learn;
    const all = QB.modules.reduce((a, m) => { const s = lessonStats(m); a.total += s.total; a.read += s.read; return a; }, { total: 0, read: 0 });
    const kw = f.kw.trim().toLowerCase();
    const matches = kw ? QB.modules.flatMap(m => m.topics.filter(t => LS.has(m.id, t) && (t.toLowerCase().includes(kw) || LS.text(m.id, t).toLowerCase().includes(kw))).map(t => ({ m, t }))) : null;
    el.innerHTML = '<div class="page-head"><div><h1>Học lý thuyết</h1><p>Bài học tóm tắt kiến thức cốt lõi cho từng topic, kèm ví dụ code, lỗi thường gặp và gợi ý trả lời phỏng vấn. Đọc xong hãy luyện câu hỏi của topic đó.</p></div>' +
      '<div class="row"><button class="btn primary" data-act="next-lesson"' + (all.read < all.total ? '' : ' disabled') + '>▶ Đọc bài tiếp theo</button></div></div>' +
      '<div class="card mb"><div class="row between small"><strong>Đã đọc ' + all.read + '/' + all.total + ' bài học</strong><span class="muted">' + UI.pct(all.read, all.total) + '%</span></div><div class="mt">' + UI.progressBar(UI.pct(all.read, all.total), 'ok') + '</div>' +
      '<input class="input mt" id="ls-kw" type="search" placeholder="Tìm trong bài học (ví dụ: volatile, N+1, Saga)…" value="' + UI.esc(f.kw) + '"></div>' +
      (matches
        ? '<div class="card"><h3>Kết quả tìm kiếm (' + matches.length + ')</h3>' + (matches.length ? '<div class="list">' + matches.map(({ m, t }) =>
          '<div class="list-item"><a href="#/learn/' + m.id + '/' + m.topics.indexOf(t) + '">' + (isRead(m.id, t) ? '✓ ' : '') + UI.esc(t) + '</a> <span class="muted small">· ' + UI.esc(m.title) + '</span></div>').join('') + '</div>' : '<p class="muted">Không tìm thấy bài học phù hợp.</p>') + '</div>'
        : '<div class="grid grid-2">' + QB.modules.map(m => {
          const s = lessonStats(m);
          return '<div class="card module-card"><div class="module-head"><div class="module-no">' + m.order + '</div><div style="flex:1"><h3 style="margin:0"><a href="#/learn/' + m.id + '">' + UI.esc(m.title) + '</a></h3><div class="small muted">' + s.read + '/' + s.total + ' bài đã đọc</div></div></div>' +
            UI.progressBar(UI.pct(s.read, s.total), s.read === s.total && s.total ? 'ok' : '') +
            '<ol class="lesson-index">' + m.topics.map((t, i) => LS.has(m.id, t)
              ? '<li><a href="#/learn/' + m.id + '/' + i + '"' + (isRead(m.id, t) ? ' class="read"' : '') + '>' + UI.esc(t) + '</a></li>'
              : '<li class="muted">' + UI.esc(t) + ' <span class="tiny">(chưa có bài)</span></li>').join('') + '</ol></div>';
        }).join('') + '</div>');
    const kwInput = el.querySelector('#ls-kw');
    kwInput.oninput = debounce(() => { f.kw = kwInput.value; learnIndex(el); const k = el.querySelector('#ls-kw'); k.focus(); k.setSelectionRange(k.value.length, k.value.length); }, 250);
    el.onclick = e => {
      const b = e.target.closest('[data-act=next-lesson]'); if (!b) return;
      for (const m of QB.modules) { const i = m.topics.findIndex(t => LS.has(m.id, t) && !isRead(m.id, t)); if (i >= 0) return navigate('learn/' + m.id + '/' + i); }
    };
  }

  function learnModule(el, m, focusIdx) {
    const s = lessonStats(m);
    const mi = QB.modules.indexOf(m);
    const prev = QB.modules[mi - 1], next = QB.modules[mi + 1];
    const qCount = t => QB.questions.filter(q => q.module === m.id && q.topic === t).length;
    el.innerHTML = '<div class="page-head"><div><div class="small muted"><a href="#/learn">Học lý thuyết</a> / Module ' + m.order + '</div><h1>' + UI.esc(m.title) + '</h1><p>' + UI.esc(m.description || '') + '</p></div>' +
      '<div class="row">' + (prev ? '<a class="btn sm" href="#/learn/' + prev.id + '">← ' + UI.esc(prev.title) + '</a>' : '') + (next ? '<a class="btn sm" href="#/learn/' + next.id + '">' + UI.esc(next.title) + ' →</a>' : '') + '</div></div>' +
      '<div class="lesson-layout"><aside class="lesson-toc"><div class="row between small"><strong>Mục lục</strong><span class="muted">' + s.read + '/' + s.total + '</span></div>' + UI.progressBar(UI.pct(s.read, s.total), 'ok') +
      '<ol>' + m.topics.map((t, i) => '<li><button class="toc-link' + (isRead(m.id, t) ? ' read' : '') + '" data-scroll="' + i + '">' + UI.esc(t) + '</button></li>').join('') + '</ol>' +
      '<button class="btn sm primary mt" style="width:100%" data-act="practice-module">Luyện câu hỏi module này</button></aside>' +
      '<div class="lesson-main">' + m.topics.map((t, i) => {
        const blocks = LS.get(m.id, t);
        const read = isRead(m.id, t), n = qCount(t);
        return '<article class="card lesson" id="t-' + i + '"><div class="card-title"><h2>' + (i + 1) + '. ' + UI.esc(t) + '</h2>' + (read ? '<span class="chip ok">Đã đọc</span>' : '') + '</div>' +
          (blocks ? LS.render(blocks) : '<p class="muted">Chưa có bài học cho topic này.</p>') +
          '<div class="row mt lesson-actions"><button class="btn sm' + (read ? '' : ' primary') + '" data-act="toggle-read" data-t="' + i + '">' + (read ? '↺ Đánh dấu chưa đọc' : '✓ Đánh dấu đã đọc') + '</button>' +
          (n ? '<button class="btn sm" data-act="practice-topic" data-t="' + i + '">Luyện ' + n + ' câu về topic này</button><button class="btn sm ghost" data-act="bank-topic" data-t="' + i + '">Xem câu hỏi</button>' : '') + '</div></article>';
      }).join('') + '</div></div>';

    if (focusIdx !== null && focusIdx >= 0) { const target = el.querySelector('#t-' + focusIdx); if (target) setTimeout(() => target.scrollIntoView({ block: 'start' }), 0); }
    el.onclick = e => {
      const sc = e.target.closest('[data-scroll]');
      if (sc) { const t = el.querySelector('#t-' + sc.dataset.scroll); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const b = e.target.closest('[data-act]'); if (!b) return;
      const topic = m.topics[+b.dataset.t];
      if (b.dataset.act === 'toggle-read') {
        const k = lessonKey(m.id, topic);
        if (S().lessons[k]) delete S().lessons[k]; else S().lessons[k] = Date.now();
        Storage.save();
        const y = window.scrollY; learnModule(el, m, null); window.scrollTo(0, y);
      }
      if (b.dataset.act === 'practice-topic') Quiz.start({ kind: 'quiz', mode: 'practice', title: 'Luyện sau bài học: ' + topic, questionIds: Quiz.pick({ modules: [m.id], topic, prioritizeWrong: true }) });
      if (b.dataset.act === 'bank-topic') { Object.assign(state.bank, { kw: '', module: m.id, topic, difficulty: '', category: '', status: '', page: 1 }); navigate('bank'); }
      if (b.dataset.act === 'practice-module') Quiz.start({ kind: 'quiz', mode: 'practice', title: 'Luyện module ' + m.title, questionIds: Quiz.pick({ modules: [m.id], count: 20, prioritizeWrong: true }) });
    };
  }

  // ---------- Theory Quiz ----------
  function quizSetup(el) {
    const f = state.quiz;
    const singleModule = f.modules.length === 1 ? f.modules[0] : '';
    if (!singleModule) f.topic = '';
    const pool = Quiz.filterPool({ modules: f.modules, topic: f.topic, difficulties: f.difficulties, includeDone: f.includeDone });
    const n = f.count === 0 ? pool.length : Math.min(f.count, pool.length);
    el.innerHTML = '<div class="page-head"><div><h1>Theory Quiz</h1><p>Tạo bài trắc nghiệm theo module, chủ đề và độ khó. Chọn chế độ luyện tập (giải thích ngay) hoặc chế độ thi (chấm khi nộp).</p></div></div>' +
      '<div class="card"><h3>1. Module</h3><div class="row mt"><button class="btn sm" data-act="mod-all">Chọn tất cả</button><button class="btn sm" data-act="mod-none">Bỏ chọn</button><span class="small muted">' + (f.modules.length ? f.modules.length + ' module được chọn' : 'Không chọn = tất cả module') + '</span></div>' +
      '<div class="form-grid mt">' + QB.modules.map(m => '<label class="check"><input type="checkbox" data-mod="' + m.id + '"' + (f.modules.includes(m.id) ? ' checked' : '') + '> ' + m.order + '. ' + UI.esc(m.title) + ' <span class="muted tiny">(' + QB.byModule(m.id).length + ')</span></label>').join('') + '</div></div>' +
      '<div class="card"><h3>2. Bộ lọc &amp; cấu hình</h3><div class="form-grid mt">' +
      '<div class="field"><label>Chủ đề cụ thể</label><select class="input" id="qz-topic"' + (singleModule ? '' : ' disabled title="Chọn đúng 1 module để lọc theo chủ đề"') + '>' + topicOptions(singleModule, f.topic) + '</select>' + (singleModule ? '' : '<span class="tiny muted">Chọn đúng 1 module để lọc chủ đề</span>') + '</div>' +
      '<div class="field"><label>Số lượng câu</label><select class="input" id="qz-count">' + [10, 20, 30, 50, 0].map(c => '<option value="' + c + '"' + (f.count === c ? ' selected' : '') + '>' + (c ? c + ' câu' : 'Toàn bộ câu phù hợp') + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Thời gian làm bài</label><select class="input" id="qz-min">' + [0, 10, 15, 20, 30, 45, 60, 90].map(c => '<option value="' + c + '"' + (f.minutes === c ? ' selected' : '') + '>' + (c ? c + ' phút' : 'Không giới hạn') + '</option>').join('') + '</select></div>' +
      '<div class="field"><span class="label">Chế độ</span><div class="seg" id="qz-mode"><button data-v="practice" class="' + (f.mode === 'practice' ? 'on' : '') + '">Luyện tập</button><button data-v="exam" class="' + (f.mode === 'exam' ? 'on' : '') + '">Thi</button></div></div>' +
      '</div><div class="field mt"><span class="label">Mức độ khó (không chọn = tất cả)</span><div class="row">' +
      DIFFS.map(d => '<label class="check"><input type="checkbox" data-diff="' + d + '"' + (f.difficulties.includes(d) ? ' checked' : '') + '> ' + QB.DIFFICULTY_LABEL[d] + '</label>').join('') + '</div></div>' +
      '<div class="row mt"><label class="check"><input type="checkbox" id="qz-done"' + (f.includeDone ? ' checked' : '') + '> Lấy cả câu đã làm</label>' +
      '<label class="check"><input type="checkbox" id="qz-wrong"' + (f.prioritizeWrong ? ' checked' : '') + '> Ưu tiên câu trả lời sai trước đó</label></div></div>' +
      '<div class="card row between"><div><strong>' + pool.length + '</strong> câu phù hợp bộ lọc → bài làm gồm <strong>' + n + '</strong> câu' + (f.mode === 'exam' && !f.minutes ? ' <span class="chip warn">Chế độ thi nên đặt thời gian</span>' : '') + '</div>' +
      '<button class="btn primary lg" data-act="start"' + (n ? '' : ' disabled') + '>Bắt đầu làm bài</button></div>';

    el.onchange = e => {
      const t = e.target;
      if (t.dataset.mod) { f.modules = t.checked ? f.modules.concat(t.dataset.mod) : f.modules.filter(x => x !== t.dataset.mod); }
      else if (t.dataset.diff) { f.difficulties = t.checked ? f.difficulties.concat(t.dataset.diff) : f.difficulties.filter(x => x !== t.dataset.diff); }
      else if (t.id === 'qz-topic') f.topic = t.value;
      else if (t.id === 'qz-count') f.count = +t.value;
      else if (t.id === 'qz-min') f.minutes = +t.value;
      else if (t.id === 'qz-done') f.includeDone = t.checked;
      else if (t.id === 'qz-wrong') f.prioritizeWrong = t.checked;
      quizSetup(el);
    };
    el.onclick = e => {
      const m = e.target.closest('#qz-mode button'); if (m) { f.mode = m.dataset.v; return quizSetup(el); }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'mod-all') { f.modules = QB.modules.map(x => x.id); quizSetup(el); }
      if (b.dataset.act === 'mod-none') { f.modules = []; quizSetup(el); }
      if (b.dataset.act === 'start') {
        const ids = Quiz.pick({ modules: f.modules, topic: f.topic, difficulties: f.difficulties, includeDone: f.includeDone, prioritizeWrong: f.prioritizeWrong, count: f.count });
        const scope = f.topic ? f.topic : f.modules.length === 1 ? UI.moduleName(f.modules[0]) : f.modules.length ? f.modules.length + ' module' : 'Tổng hợp';
        Quiz.start({ kind: 'quiz', mode: f.mode, title: (f.mode === 'exam' ? 'Thi: ' : 'Luyện tập: ') + scope, questionIds: ids, timeLimitMin: f.minutes });
      }
    };
  }

  // ---------- Code Challenge ----------
  function challenge(el) {
    const f = state.challenge;
    const base = Quiz.filterPool({ codeOnly: true });
    const pool = Quiz.filterPool({ codeOnly: true, modules: f.modules, categories: f.categories, difficulties: f.difficulties });
    const catCount = c => base.filter(q => q.category === c).length;
    const n = f.count ? Math.min(f.count, pool.length) : pool.length;
    el.innerHTML = '<div class="page-head"><div><h1>Code Challenge</h1><p>Đọc hiểu code và suy luận: dự đoán output, tìm lỗi compile/runtime, bug logic, phân tích SQL, Transaction, HTTP. Code không được thực thi trên trình duyệt — bạn tự suy luận, hệ thống giải thích từng bước.</p></div></div>' +
      '<div class="card"><h3>Dạng bài</h3><div class="row mt">' +
      CODE_CATS.concat(['theory', 'scenario', 'design', 'tradeoff']).filter(c => catCount(c)).map(c => '<label class="check"><input type="checkbox" data-cat="' + c + '"' + (f.categories.includes(c) ? ' checked' : '') + '> ' + QB.CATEGORY_LABEL[c] + ' <span class="muted tiny">(' + catCount(c) + ')</span></label>').join('') +
      '</div><h3 class="mt">Module</h3><div class="form-grid mt">' +
      QB.modules.filter(m => base.some(q => q.module === m.id)).map(m => '<label class="check"><input type="checkbox" data-mod="' + m.id + '"' + (f.modules.includes(m.id) ? ' checked' : '') + '> ' + UI.esc(m.title) + ' <span class="muted tiny">(' + base.filter(q => q.module === m.id).length + ')</span></label>').join('') +
      '</div><div class="form-grid mt"><div class="field"><label>Độ khó</label><select class="input" id="cc-diff">' + diffOptions(f.difficulties[0] || '') + '</select></div>' +
      '<div class="field"><label>Số lượng</label><select class="input" id="cc-count">' + [5, 10, 20, 0].map(c => '<option value="' + c + '"' + (f.count === c ? ' selected' : '') + '>' + (c ? c + ' bài' : 'Tất cả') + '</option>').join('') + '</select></div>' +
      '<div class="field"><span class="label">Chế độ</span><div class="seg" id="cc-mode"><button data-v="practice" class="' + (f.mode === 'practice' ? 'on' : '') + '">Luyện tập</button><button data-v="exam" class="' + (f.mode === 'exam' ? 'on' : '') + '">Thi</button></div></div></div></div>' +
      '<div class="card row between"><div><strong>' + pool.length + '</strong> bài phù hợp (tổng ' + base.length + ' bài có code/SQL) → làm <strong>' + n + '</strong> bài</div><button class="btn primary lg" id="cc-start"' + (n ? '' : ' disabled') + '>Bắt đầu</button></div>' +
      '<div class="card"><h3>Ví dụ</h3><p class="small muted">Một bài ngẫu nhiên trong bộ lọc hiện tại:</p>' + (pool.length ? (q => Quiz.questionBody(q) + '<div class="tiny muted">' + q.id + ' · ' + UI.esc(q.topic) + '</div>')(pool[Math.floor(Math.random() * pool.length)]) : '<p class="muted">Không có bài nào.</p>') + '</div>';
    el.onchange = e => {
      const t = e.target;
      if (t.dataset.cat) f.categories = t.checked ? f.categories.concat(t.dataset.cat) : f.categories.filter(x => x !== t.dataset.cat);
      else if (t.dataset.mod) f.modules = t.checked ? f.modules.concat(t.dataset.mod) : f.modules.filter(x => x !== t.dataset.mod);
      else if (t.id === 'cc-diff') f.difficulties = t.value ? [t.value] : [];
      else if (t.id === 'cc-count') f.count = +t.value;
      challenge(el);
    };
    el.onclick = e => {
      const m = e.target.closest('#cc-mode button'); if (m) { f.mode = m.dataset.v; return challenge(el); }
      if (e.target.id === 'cc-start') {
        const ids = Quiz.pick({ codeOnly: true, modules: f.modules, categories: f.categories, difficulties: f.difficulties, count: f.count });
        Quiz.start({ kind: 'challenge', mode: f.mode, title: 'Code Challenge', questionIds: ids, timeLimitMin: f.mode === 'exam' ? Math.ceil(ids.reduce((a, id) => a + QB.get(id).estimatedSeconds, 0) / 60) + 2 : 0 });
      }
    };
  }

  // ---------- Review Mistakes ----------
  function review(el) {
    const f = state.review;
    const due = Progress.dueIds();
    let items = Progress.reviewIds().map(id => ({ q: QB.get(id), e: Progress.entry(id) }));
    const totalWrong = items.length;
    const activeReview = items.filter(x => !x.e.mastered).map(x => x.q.id);
    if (f.module) items = items.filter(x => x.q.module === f.module);
    if (f.topic) items = items.filter(x => x.q.topic === f.topic);
    if (f.difficulty) items = items.filter(x => x.q.difficulty === f.difficulty);
    if (f.minWrong > 1) items = items.filter(x => x.e.wrong >= f.minWrong);
    if (f.status === 'active') items = items.filter(x => !x.e.mastered);
    if (f.status === 'due') items = items.filter(x => Progress.isDue(x.e));
    if (f.status === 'mastered') items = items.filter(x => x.e.mastered);
    items.sort((a, b) => (Progress.isDue(b.e) - Progress.isDue(a.e)) || b.e.wrong - a.e.wrong || b.e.lastAnswered - a.e.lastAnswered);
    const bmCount = Object.keys(S().bookmarks).filter(id => QB.get(id)).length;

    const side = x => '<span class="tiny muted" style="text-align:right;min-width:120px">Sai <strong style="color:var(--bad)">' + x.e.wrong + '</strong> · Đúng sau ôn ' + x.e.correctAfterWrong +
      '<br>Lần cuối: ' + UI.fmtDate(x.e.lastAnswered) + '<br>' + (x.e.mastered ? '<span class="chip ok">Đã nắm vững</span>' : x.e.srs ? 'Ôn: ' + UI.relDay(x.e.srs.due) : '') +
      (!x.e.wrong ? '<br><span class="chip warn">Tự đánh dấu</span>' : '') + '</span>';
    el.innerHTML = '<div class="page-head"><div><h1>Review Mistakes</h1><p>Câu trả lời sai được tự động lưu và lên lịch ôn tập theo khoảng thời gian tăng dần (' + S().settings.srsIntervals.join(', ') + ' ngày — có thể chỉnh trong Cài đặt).</p></div></div>' +
      '<div class="stats">' + statCard('Đến hạn hôm nay', due.length, due.length ? 'warn' : '') + statCard('Trong danh sách ôn', totalWrong, 'bad', 'câu sai + tự đánh dấu') +
      statCard('Đã nắm vững', Progress.reviewIds().filter(id => Progress.entry(id).mastered).length, 'ok') + statCard('Yêu thích', bmCount) + '</div>' +
      '<div class="card row"><button class="btn primary" data-act="due"' + (due.length ? '' : ' disabled') + '>↻ Ôn câu đến hạn (' + due.length + ')</button>' +
      '<button class="btn" data-act="all-wrong"' + (activeReview.length ? '' : ' disabled') + '>Luyện tất cả câu chưa nắm vững (' + activeReview.length + ')</button>' +
      '<button class="btn" data-act="filtered"' + (items.length ? '' : ' disabled') + '>Luyện ' + items.length + ' câu đang lọc</button>' +
      '<button class="btn" data-act="bookmarked"' + (bmCount ? '' : ' disabled') + '>★ Luyện câu đã đánh dấu (' + bmCount + ')</button></div>' +
      (totalWrong ? '<div class="card"><div class="filters">' +
        '<select class="input" id="rv-module">' + moduleOptions(f.module) + '</select>' +
        '<select class="input" id="rv-topic"' + (f.module ? '' : ' disabled') + '>' + topicOptions(f.module, f.topic) + '</select>' +
        '<select class="input" id="rv-diff">' + diffOptions(f.difficulty) + '</select>' +
        '<select class="input" id="rv-min">' + [1, 2, 3, 5].map(n => '<option value="' + n + '"' + (f.minWrong === n ? ' selected' : '') + '>Sai ≥ ' + n + ' lần</option>').join('') + '</select>' +
        '<select class="input" id="rv-status">' + [['active', 'Chưa nắm vững'], ['due', 'Đến hạn ôn'], ['mastered', 'Đã nắm vững'], ['all', 'Tất cả']].map(([k, v]) => '<option value="' + k + '"' + (f.status === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>' +
        '</div><div id="rv-list">' + (items.length ? items.map(x => questionRow(x.q, { side: side(x) })).join('') : '<p class="muted">Không có câu nào khớp bộ lọc.</p>') + '</div></div>'
        : '<div class="card">' + UI.emptyState('✓', 'Chưa có câu trả lời sai', 'Khi bạn trả lời sai một câu, câu đó sẽ xuất hiện ở đây và được đưa vào lịch ôn tập.', '<a class="btn primary" href="#/quiz">Làm bài trắc nghiệm</a>') + '</div>');

    el.onchange = e => {
      const t = e.target;
      if (t.id === 'rv-module') { f.module = t.value; f.topic = ''; }
      else if (t.id === 'rv-topic') f.topic = t.value;
      else if (t.id === 'rv-diff') f.difficulty = t.value;
      else if (t.id === 'rv-min') f.minWrong = +t.value;
      else if (t.id === 'rv-status') f.status = t.value;
      else return;
      review(el);
    };
    el.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b || b.closest('.qrow')) return;
      const act = b.dataset.act;
      if (act === 'due') Quiz.start({ kind: 'review', mode: 'practice', title: 'Ôn tập câu đến hạn', questionIds: due });
      if (act === 'all-wrong') Quiz.start({ kind: 'review', mode: 'practice', title: 'Luyện câu cần ôn tập', questionIds: UI.shuffle(activeReview) });
      if (act === 'filtered') Quiz.start({ kind: 'review', mode: 'practice', title: 'Luyện câu sai (đang lọc)', questionIds: items.map(x => x.q.id) });
      if (act === 'bookmarked') Quiz.start({ kind: 'review', mode: 'practice', title: 'Luyện câu đã đánh dấu', questionIds: UI.shuffle(Object.keys(S().bookmarks).filter(id => QB.get(id))) });
    };
    const list = el.querySelector('#rv-list');
    if (list) bindQuestionRows(list, {
      detail: q => {
        const e = Progress.entry(q.id);
        return '<h4 class="mt">Lịch sử lựa chọn</h4><div class="table-wrap"><table class="table"><thead><tr><th>Thời gian</th><th>Đã chọn</th><th>Kết quả</th></tr></thead><tbody>' +
          e.history.slice().reverse().map(h => '<tr><td>' + UI.fmtDate(h.t) + '</td><td>' + UI.esc(h.sel.join(', ')) + '</td><td>' + (h.ok ? '<span class="chip ok">Đúng</span>' : '<span class="chip bad">Sai</span>') + '</td></tr>').join('') + '</tbody></table></div>';
      },
      actions: q => { const e = Progress.entry(q.id); return '<button class="btn sm" data-act="master" data-qid="' + q.id + '">' + (e && e.mastered ? 'Bỏ đánh dấu đã nắm vững' : '✓ Đã nắm vững') + '</button>'; },
      onAction: (act, qid) => { if (act === 'master') { const e = Progress.entry(qid); Progress.setMastered(qid, !(e && e.mastered)); UI.toast(e.mastered ? 'Đã đánh dấu nắm vững.' : 'Đã đưa lại vào danh sách ôn tập.'); review(el); } },
    });
  }

  // ---------- Bookmarks & Notes ----------
  function bookmarks(el) {
    const f = state.bookmarks;
    const ids = new Set([...Object.keys(S().bookmarks), ...Object.keys(S().notes)]);
    let items = [...ids].map(QB.get).filter(Boolean);
    const total = items.length;
    if (f.show === 'bookmarked') items = items.filter(q => S().bookmarks[q.id]);
    if (f.show === 'notes') items = items.filter(q => S().notes[q.id]);
    if (f.module) items = items.filter(q => q.module === f.module);
    if (f.difficulty) items = items.filter(q => q.difficulty === f.difficulty);
    if (f.kw.trim()) { const kw = f.kw.trim().toLowerCase(); items = items.filter(q => searchText(q).includes(kw) || (S().notes[q.id] && S().notes[q.id].text.toLowerCase().includes(kw))); }
    items.sort((a, b) => (S().bookmarks[b.id] || 0) - (S().bookmarks[a.id] || 0));
    el.innerHTML = '<div class="page-head"><div><h1>Bookmarks &amp; Notes</h1><p>Câu hỏi yêu thích và ghi chú cá nhân. Ghi chú cũng hiển thị khi bạn làm bài.</p></div>' +
      '<div class="row"><button class="btn" data-act="export">⇩ Export JSON</button><button class="btn" data-act="import">⇧ Import JSON</button></div></div>' +
      (total ? '<div class="card"><div class="filters"><input class="input" id="bm-kw" type="search" placeholder="Tìm trong câu hỏi và ghi chú…" value="' + UI.esc(f.kw) + '">' +
        '<select class="input" id="bm-show">' + [['all', 'Yêu thích + ghi chú'], ['bookmarked', 'Chỉ yêu thích'], ['notes', 'Chỉ có ghi chú']].map(([k, v]) => '<option value="' + k + '"' + (f.show === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>' +
        '<select class="input" id="bm-module">' + moduleOptions(f.module) + '</select><select class="input" id="bm-diff">' + diffOptions(f.difficulty) + '</select></div>' +
        '<div class="row mb"><span class="small muted">' + items.length + ' câu</span><span class="spacer"></span><button class="btn sm primary" data-act="practice"' + (items.length ? '' : ' disabled') + '>Luyện ' + items.length + ' câu này</button></div>' +
        '<div id="bm-list">' + (items.length ? items.map(q => questionRow(q, { side: S().notes[q.id] ? '<span class="tiny muted" style="max-width:240px">📝 ' + UI.esc(S().notes[q.id].text.slice(0, 80)) + (S().notes[q.id].text.length > 80 ? '…' : '') + '</span>' : '' })).join('') : '<p class="muted">Không có câu nào khớp bộ lọc.</p>') + '</div></div>'
        : '<div class="card">' + UI.emptyState('★', 'Chưa có bookmark hoặc ghi chú', 'Bấm biểu tượng ☆ trên bất kỳ câu hỏi nào để thêm vào yêu thích, hoặc mở phần "Ghi chú cá nhân" để ghi lại điểm cần nhớ.', '<a class="btn primary" href="#/bank">Duyệt ngân hàng câu hỏi</a>') + '</div>');
    const kwInput = el.querySelector('#bm-kw');
    if (kwInput) kwInput.oninput = debounce(() => { f.kw = kwInput.value; bookmarks(el); const k = el.querySelector('#bm-kw'); k.focus(); k.setSelectionRange(k.value.length, k.value.length); }, 250);
    el.onchange = e => {
      const t = e.target;
      if (t.id === 'bm-show') f.show = t.value; else if (t.id === 'bm-module') f.module = t.value; else if (t.id === 'bm-diff') f.difficulty = t.value; else return;
      bookmarks(el);
    };
    el.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b || b.closest('.qrow')) return;
      if (b.dataset.act === 'practice') Quiz.start({ kind: 'review', mode: 'practice', title: 'Luyện câu yêu thích', questionIds: items.map(q => q.id) });
      if (b.dataset.act === 'export') exportData();
      if (b.dataset.act === 'import') importData();
    };
    const list = el.querySelector('#bm-list');
    if (list) bindQuestionRows(list, {});
  }

  // ---------- Question Bank (search & filter) ----------
  function searchText(q) {
    if (!q._search) q._search = [q.id, q.question, q.code, q.explanation, q.topic, UI.moduleName(q.module), q.tags.join(' '), q.options.map(o => o.text).join(' '), Object.values(q.optionExplanations).join(' ')].join(' \n ').toLowerCase();
    return q._search;
  }
  function bank(el) {
    const f = state.bank;
    const PER = 30;
    const kws = f.kw.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let items = QB.questions.filter(q => {
      if (f.module && q.module !== f.module) return false;
      if (f.topic && q.topic !== f.topic) return false;
      if (f.difficulty && q.difficulty !== f.difficulty) return false;
      if (f.category && q.category !== f.category) return false;
      if (f.status) {
        const st = Progress.status(q.id);
        if (f.status === 'done' && !st.done) return false;
        if (f.status === 'todo' && st.done) return false;
        if (f.status === 'wrong' && !st.wrong) return false;
        if (f.status === 'bookmarked' && !st.bookmarked) return false;
        if (f.status === 'due' && !st.due) return false;
      }
      if (kws.length) { const t = searchText(q); return kws.every(k => t.includes(k)); }
      return true;
    });
    const pages = Math.max(1, Math.ceil(items.length / PER));
    f.page = Math.min(f.page, pages);
    const pageItems = items.slice((f.page - 1) * PER, f.page * PER);
    el.innerHTML = '<div class="page-head"><div><h1>Ngân hàng câu hỏi</h1><p>Tìm kiếm trên nội dung câu hỏi, code, đáp án, giải thích và tag. Các bộ lọc được kết hợp với nhau (AND).</p></div></div>' +
      '<div class="card"><div class="filters">' +
      '<input class="input" id="bk-kw" type="search" placeholder="Từ khóa (nhiều từ = AND)…" value="' + UI.esc(f.kw) + '" style="grid-column: span 2">' +
      '<select class="input" id="bk-module">' + moduleOptions(f.module) + '</select>' +
      '<select class="input" id="bk-topic"' + (f.module ? '' : ' disabled') + '>' + topicOptions(f.module, f.topic) + '</select>' +
      '<select class="input" id="bk-diff">' + diffOptions(f.difficulty) + '</select>' +
      '<select class="input" id="bk-cat">' + catOptions(f.category) + '</select>' +
      '<select class="input" id="bk-status">' + [['', 'Mọi trạng thái'], ['done', 'Câu đã làm'], ['todo', 'Câu chưa làm'], ['wrong', 'Câu từng trả lời sai'], ['bookmarked', 'Câu yêu thích'], ['due', 'Câu cần ôn tập']].map(([k, v]) => '<option value="' + k + '"' + (f.status === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>' +
      '</div><div class="row mb"><span class="small muted">Tìm thấy <strong>' + items.length + '</strong>/' + QB.questions.length + ' câu</span><span class="spacer"></span>' +
      '<button class="btn sm" data-act="clear">Xóa bộ lọc</button><button class="btn sm primary" data-act="practice"' + (items.length ? '' : ' disabled') + '>Luyện tập ' + Math.min(items.length, 50) + ' câu này</button></div>' +
      '<div id="bk-list">' + (pageItems.length ? pageItems.map(q => questionRow(q)).join('') : UI.emptyState('⌕', 'Không tìm thấy câu hỏi', 'Thử từ khóa khác hoặc bỏ bớt bộ lọc.')) + '</div>' + pager(items.length, f.page, PER) + '</div>';
    const kw = el.querySelector('#bk-kw');
    kw.oninput = debounce(() => { f.kw = kw.value; f.page = 1; bank(el); const k = el.querySelector('#bk-kw'); k.focus(); k.setSelectionRange(k.value.length, k.value.length); }, 250);
    el.onchange = e => {
      const t = e.target;
      if (t.id === 'bk-module') { f.module = t.value; f.topic = ''; }
      else if (t.id === 'bk-topic') f.topic = t.value;
      else if (t.id === 'bk-diff') f.difficulty = t.value;
      else if (t.id === 'bk-cat') f.category = t.value;
      else if (t.id === 'bk-status') f.status = t.value;
      else return;
      f.page = 1; bank(el);
    };
    el.onclick = e => {
      const p = e.target.closest('[data-page]'); if (p && !p.disabled) { f.page = +p.dataset.page; bank(el); window.scrollTo({ top: 0 }); return; }
      const b = e.target.closest('[data-act]'); if (!b || b.closest('.qrow')) return;
      if (b.dataset.act === 'clear') { Object.assign(f, { kw: '', module: '', topic: '', difficulty: '', category: '', status: '', page: 1 }); document.getElementById('global-search-input').value = ''; bank(el); }
      if (b.dataset.act === 'practice') Quiz.start({ kind: 'quiz', mode: 'practice', title: 'Luyện tập từ kết quả tìm kiếm', questionIds: UI.shuffle(items.map(q => q.id)).slice(0, 50) });
    };
    bindQuestionRows(el.querySelector('#bk-list'), {});
  }

  // ---------- Progress & Analytics ----------
  function analytics(el) {
    const s = Progress.summary();
    const head = '<div class="page-head"><div><h1>Progress &amp; Analytics</h1><p>Báo cáo học tập tính từ kết quả trả lời thực tế của bạn.</p></div></div>';
    if (!s.attempts && !s.sessionCount) {
      el.innerHTML = head + '<div class="card">' + UI.emptyState('▤', 'Chưa có dữ liệu', 'Hãy làm ít nhất một bài để xem báo cáo học tập.', '<a class="btn primary" href="#/quiz">Làm bài ngay</a>') + '</div>';
      return;
    }
    const bm = Progress.byModule(), bd = Progress.byDifficulty();
    const weak = Progress.weakTopics(8), imp = Progress.improvingTopics(8);
    const exams = S().sessions.filter(x => x.mode === 'exam');
    const sessions = S().sessions.slice().reverse();
    el.innerHTML = head + '<div class="stats">' +
      statCard('Tổng lượt trả lời', s.attempts, 'primary') + statCard('Câu duy nhất đã học', s.unique, '', UI.pct(s.unique, s.total) + '% ngân hàng') +
      statCard('Tỷ lệ chính xác', s.accuracy + '%', accCls(s.accuracy), s.correct + ' đúng / ' + s.wrong + ' sai') +
      statCard('Cần ôn tập', s.due, s.due ? 'warn' : '') + statCard('Chưa từng trả lời', s.unlearned) + statCard('Số phiên làm bài', s.sessionCount, '', s.examCount + ' bài thi') + '</div>' +
      '<div class="grid grid-2"><div class="card"><h3>Tỷ lệ chính xác theo module</h3>' +
      QB.modules.map(m => { const x = bm[m.id]; return bar(UI.esc(m.title), x.accuracy || 0, x.accuracy == null ? 'chưa làm' : x.accuracy + '% (' + x.attempts + ')', accCls(x.accuracy)); }).join('') + '</div>' +
      '<div><div class="card"><h3>Tỷ lệ chính xác theo độ khó</h3>' + DIFFS.map(d => { const x = bd[d]; return bar(QB.DIFFICULTY_LABEL[d], x.accuracy || 0, x.accuracy == null ? 'chưa làm' : x.accuracy + '% (' + x.attempts + ')', accCls(x.accuracy)); }).join('') + '</div>' +
      '<div class="card"><h3>Điểm các bài thi theo thời gian</h3>' + (exams.length ? scoreChart(exams.slice(-30)) : '<p class="muted small">Chưa có bài thi (chế độ thi hoặc Interview Simulator).</p>') + '</div></div></div>' +
      '<div class="grid grid-2 mt"><div class="card"><h3>Chủ đề có tỷ lệ sai cao</h3>' + (weak.length ? weak.map(t => bar(topicLabel(t.key), t.errorRate, t.errorRate + '% sai (' + t.attempts + ')', 'bad')).join('') : '<p class="muted small">Chưa đủ dữ liệu.</p>') + '</div>' +
      '<div class="card"><h3>Chủ đề đang cải thiện</h3><p class="tiny muted">So sánh tỷ lệ đúng nửa đầu và nửa sau các lượt trả lời (cần ≥ 4 lượt).</p>' + (imp.length ? imp.map(t => bar(topicLabel(t.key), t.after, t.before + '% → ' + t.after + '%', 'ok')).join('') : '<p class="muted small">Chưa có chủ đề nào thể hiện xu hướng cải thiện.</p>') + '</div></div>' +
      '<div class="card mt"><h3>Lịch sử các phiên làm bài</h3>' + (sessions.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Kết thúc</th><th>Bài</th><th>Chế độ</th><th class="num">Đúng</th><th class="num">Sai</th><th class="num">Bỏ trống</th><th class="num">Điểm</th><th class="num">Thời gian</th><th></th></tr></thead><tbody>' +
        sessions.slice(0, 50).map(x => '<tr><td>' + UI.fmtDate(x.finishedAt) + '</td><td>' + UI.esc(x.title) + '</td><td>' + (x.mode === 'exam' ? '<span class="chip warn">Thi</span>' : '<span class="chip ok">Luyện tập</span>') + '</td><td class="num">' + x.correct + '</td><td class="num">' + x.wrong + '</td><td class="num">' + x.unanswered + '</td><td class="num"><strong>' + x.score + '</strong></td><td class="num">' + UI.fmtDuration(x.durationSec) + '</td><td><a href="#/result/' + x.id + '">Chi tiết</a></td></tr>').join('') +
        '</tbody></table></div>' + (sessions.length > 50 ? '<p class="tiny muted">Hiển thị 50 phiên gần nhất.</p>' : '') : '<p class="muted small">Chưa có phiên nào.</p>') + '</div>';
  }
  function scoreChart(exams) {
    const W = 420, H = 170, P = 30;
    const n = exams.length;
    const x = i => P + (n === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (n - 1));
    const y = v => H - P - v * (H - 2 * P) / 100;
    const pts = exams.map((e, i) => x(i) + ',' + y(e.score)).join(' ');
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Biểu đồ điểm bài thi">' +
      [0, 50, 100].map(v => '<line class="axis" x1="' + P + '" x2="' + (W - P) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="4" y="' + (y(v) + 3) + '">' + v + '</text>').join('') +
      '<polyline class="line" points="' + pts + '"/>' +
      exams.map((e, i) => '<circle class="dot" cx="' + x(i) + '" cy="' + y(e.score) + '" r="3.5"><title>' + UI.esc(e.title) + ' — ' + e.score + ' điểm (' + UI.fmtDate(e.finishedAt) + ')</title></circle>').join('') +
      '</svg></div><p class="tiny muted">' + n + ' bài thi gần nhất · TB ' + Math.round(exams.reduce((a, e) => a + e.score, 0) / n) + ' điểm</p>';
  }

  // ---------- Settings & data ----------
  function settings(el) {
    const st = S().settings;
    const size = (() => { try { return Math.round((localStorage.getItem('jbm.data') || '').length / 1024); } catch (e) { return 0; } })();
    el.innerHTML = '<div class="page-head"><div><h1>Cài đặt &amp; Dữ liệu</h1><p>Mọi dữ liệu cá nhân được lưu cục bộ trong trình duyệt (localStorage). Không có thông tin nào được gửi lên server.</p></div></div>' +
      '<div class="grid grid-2"><div class="card"><h3>Giao diện</h3><div class="seg mt" id="st-theme">' + [['system', 'Theo hệ thống'], ['light', 'Light'], ['dark', 'Dark']].map(([k, v]) => '<button data-v="' + k + '" class="' + (st.theme === k ? 'on' : '') + '">' + v + '</button>').join('') + '</div>' +
      '<h3 class="mt">Làm bài</h3><label class="check"><input type="checkbox" id="st-notes"' + (st.showNotesInQuiz ? ' checked' : '') + '> Hiển thị ghi chú cá nhân trong chế độ thi</label>' +
      '<h3 class="mt">Lịch ôn tập (Spaced Repetition)</h3><p class="small muted">Khoảng cách (ngày) giữa các lần ôn khi trả lời đúng liên tiếp. Trả lời sai sẽ đưa câu về đầu lịch (đến hạn ngay). Đây là lịch gợi ý — bạn có thể điều chỉnh.</p>' +
      '<div class="row"><input class="input" id="st-srs" style="max-width:220px" value="' + st.srsIntervals.join(', ') + '"><button class="btn" id="st-srs-save">Lưu</button><button class="btn ghost" id="st-srs-reset">Mặc định</button></div></div>' +
      '<div class="card"><h3>Sao lưu dữ liệu</h3><p class="small muted">Dữ liệu hiện tại: ' + Object.keys(S().progress).length + ' câu có tiến độ, ' + S().sessions.length + ' phiên, ' + Object.keys(S().bookmarks).length + ' bookmark, ' + Object.keys(S().notes).length + ' ghi chú (~' + size + ' KB). Schema version ' + Storage.VERSION + '.</p>' +
      '<div class="row"><button class="btn primary" data-act="export">⇩ Export JSON</button><button class="btn" data-act="import">⇧ Import JSON</button></div>' +
      '<h3 class="mt">Xóa dữ liệu</h3><p class="small muted">Xóa toàn bộ tiến độ, lịch sử, bookmark, ghi chú và cài đặt. Không thể hoàn tác — hãy export trước.</p><button class="btn danger" data-act="reset">Reset toàn bộ dữ liệu</button></div></div>' +
      '<div class="card mt"><h3>Ngân hàng câu hỏi</h3><div class="table-wrap"><table class="table"><thead><tr><th>Module</th>' + DIFFS.map(d => '<th class="num">' + QB.DIFFICULTY_LABEL[d] + '</th>').join('') + '<th class="num">Tổng</th></tr></thead><tbody>' +
      QB.modules.map(m => { const qs = QB.byModule(m.id); return '<tr><td>' + m.order + '. ' + UI.esc(m.title) + '</td>' + DIFFS.map(d => '<td class="num">' + qs.filter(q => q.difficulty === d).length + '</td>').join('') + '<td class="num"><strong>' + qs.length + '</strong></td></tr>'; }).join('') +
      '<tr><td><strong>Tổng</strong></td>' + DIFFS.map(d => '<td class="num"><strong>' + QB.questions.filter(q => q.difficulty === d).length + '</strong></td>').join('') + '<td class="num"><strong>' + QB.questions.length + '</strong></td></tr></tbody></table></div>' +
      (QB.errors.length ? '<div class="notice warn mt">Lỗi dữ liệu: ' + QB.errors.map(UI.esc).join('; ') + '</div>' : '') + '</div>';
    el.onclick = async e => {
      const t = e.target.closest('#st-theme button'); if (t) { setTheme(t.dataset.v); return settings(el); }
      if (e.target.id === 'st-srs-save') {
        const vals = el.querySelector('#st-srs').value.split(/[,\s]+/).filter(Boolean).map(Number);
        if (!vals.length || vals.some(v => !Number.isInteger(v) || v < 1 || v > 365)) return UI.toast('Nhập các số nguyên 1–365, cách nhau bởi dấu phẩy.', 'bad');
        st.srsIntervals = vals; Storage.save(); UI.toast('Đã lưu lịch ôn tập.', 'ok'); return;
      }
      if (e.target.id === 'st-srs-reset') { st.srsIntervals = Storage.DEFAULT_INTERVALS.slice(); Storage.save(); return settings(el); }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'export') exportData();
      if (b.dataset.act === 'import') importData();
      if (b.dataset.act === 'reset') {
        if (await UI.confirm('Toàn bộ tiến độ, lịch sử bài làm, bookmark, ghi chú và cài đặt sẽ bị **xóa vĩnh viễn**. Bạn có chắc chắn?', { title: 'Reset dữ liệu', okText: 'Xóa toàn bộ', danger: true })) {
          Storage.reset(); applyTheme(); UI.toast('Đã xóa toàn bộ dữ liệu.', 'ok'); navigate('dashboard');
        }
      }
    };
    el.onchange = e => { if (e.target.id === 'st-notes') { st.showNotesInQuiz = e.target.checked; Storage.save(); } };
  }
  function exportData() {
    const d = new Date();
    UI.download('java-backend-mastery-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.json', Storage.exportJSON());
    UI.toast('Đã xuất dữ liệu ra file JSON.', 'ok');
  }
  function importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024) return UI.toast('File quá lớn (> 5MB).', 'bad');
      const reader = new FileReader();
      reader.onload = async () => {
        const res = Storage.validateImport(String(reader.result));
        if (!res.ok) return UI.toast('Import thất bại: ' + res.error, 'bad');
        if (await UI.confirm('File hợp lệ: ' + res.summary + '. Dữ liệu hiện tại sẽ được **thay thế** bằng dữ liệu trong file. Tiếp tục?', { title: 'Import dữ liệu', okText: 'Import' })) {
          Storage.replace(res.data); applyTheme(); UI.toast('Import thành công.', 'ok'); render();
        }
      };
      reader.onerror = () => UI.toast('Không đọc được file.', 'bad');
      reader.readAsText(file);
    };
    input.click();
  }

  // ---------- Theme, sidebar, misc ----------
  function applyTheme() {
    const t = S().settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  function setTheme(t) { S().settings.theme = t; Storage.save(); applyTheme(); }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(cur === 'dark' ? 'light' : 'dark');
  }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-backdrop').classList.remove('show'); }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  function init() {
    Storage.load();
    applyTheme();
    if (Storage.lastError) setTimeout(() => UI.toast(Storage.lastError, 'bad'), 300);
    if (QB.errors.length) console.error('Question bank errors:', QB.errors);
    // Bài thi hết giờ trong lúc đóng trang: tự nộp ngay khi mở lại.
    const a = S().activeSession;
    if (a && a.deadline && Date.now() >= a.deadline) {
      const rec = Quiz.finalize(true);
      if (rec) { setTimeout(() => UI.toast('Bài "' + rec.title + '" đã hết giờ khi bạn rời trang và được tự động nộp. Điểm: ' + rec.score, 'bad'), 300); location.hash = '#/result/' + rec.id; }
    }
    window.addEventListener('hashchange', render);
    document.getElementById('theme-btn').onclick = toggleTheme;
    document.getElementById('menu-btn').onclick = () => { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-backdrop').classList.add('show'); };
    document.getElementById('sidebar-backdrop').onclick = closeSidebar;
    document.getElementById('global-search').onsubmit = e => {
      e.preventDefault();
      const kw = document.getElementById('global-search-input').value;
      Object.assign(state.bank, { kw, module: '', topic: '', difficulty: '', category: '', status: '', page: 1 });
      navigate('bank');
    };
    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && !['input', 'textarea', 'select'].includes(tag)) { e.preventDefault(); document.getElementById('global-search-input').focus(); return; }
      if (parseHash().name === 'session') Quiz.onKey(e);
    });
    // Lưu khi đóng tab để không mất vị trí câu đang làm.
    window.addEventListener('beforeunload', () => Storage.save());
    setInterval(() => {
      Quiz.tick();
      const bt = document.getElementById('banner-timer');
      const s = S().activeSession;
      if (bt && s && s.deadline) bt.textContent = UI.fmtDuration((s.deadline - Date.now()) / 1000);
      if (!s && document.querySelector('#active-banner .banner')) renderChrome(parseHash().name);
    }, 1000);
    render();
  }

  return { init, navigate, render, state, lessonLink };
})();

document.addEventListener('DOMContentLoaded', App.init);
