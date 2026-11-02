/**
 * Interview — mô phỏng 8 vòng phỏng vấn Java Backend bằng câu hỏi trắc nghiệm.
 * Chọn câu hỏi theo vòng (module/topic), cấp độ ứng viên và ngân sách thời gian.
 */
const Interview = (() => {
  const ROUNDS = [
    { name: 'Round 1: Java Core', desc: 'Java nền tảng, OOP, Collections, Exception.', match: q => ['java-core', 'oop', 'collections'].includes(q.module) && !isDesignTopic(q) },
    { name: 'Round 2: JVM & Concurrency', desc: 'Memory, GC, Multithreading, Thread Safety.', match: q => ['jvm', 'concurrency'].includes(q.module) },
    { name: 'Round 3: Spring & Spring Boot', desc: 'IoC, DI, Bean Lifecycle, AOP, Transaction, Auto-Configuration.', match: q => ['spring', 'spring-boot'].includes(q.module) },
    { name: 'Round 4: SQL & Database', desc: 'SQL, Execution Plan, Index, Transaction, Locking.', match: q => q.module === 'database-sql' },
    { name: 'Round 5: JPA, Hibernate & REST API', desc: 'Persistence Context, Fetching, N+1, HTTP, API Design, Security.', match: q => ['hibernate-jpa', 'rest-api', 'security'].includes(q.module) },
    { name: 'Round 6: Testing & Software Design', desc: 'Unit/Integration Test, Design Patterns, SOLID, kiến trúc.', match: q => q.module === 'testing' || isDesignTopic(q) },
    { name: 'Round 7: Microservices & System Design', desc: 'Quyết định kiến trúc, khả năng mở rộng, xử lý lỗi hệ thống.', match: q => ['microservices', 'system-design'].includes(q.module) && !isDesignTopic(q) },
    { name: 'Round 8: Production Troubleshooting', desc: 'Tình huống thực tế trong dự án Enterprise.', match: q => q.module === 'troubleshooting' || q.module === 'devops-git-linux' && ['scenario', 'debug'].includes(q.category) },
  ];
  const DESIGN_TOPICS = ['SOLID Principles', 'Design Patterns', 'Composition và Inheritance', 'Coupling và Cohesion', 'Layered Architecture', 'Clean Architecture', 'Hexagonal Architecture', 'SOLID'];
  function isDesignTopic(q) { return (q.module === 'oop' || q.module === 'system-design') && DESIGN_TOPICS.includes(q.topic); }

  /** Trọng số độ khó theo cấp độ ứng viên. */
  const LEVELS = {
    junior: { label: 'Junior', w: { beginner: 4, intermediate: 3, advanced: 0.5, senior: 0 } },
    middle: { label: 'Middle', w: { beginner: 1, intermediate: 4, advanced: 3, senior: 0.5 } },
    senior: { label: 'Senior', w: { beginner: 0, intermediate: 1.5, advanced: 4, senior: 3 } },
    enterprise: { label: 'Senior Enterprise Java Backend', w: { beginner: 0, intermediate: 0.5, advanced: 3, senior: 5 } },
  };
  /** Ưu tiên câu tình huống/trade-off cho cấp Senior Enterprise. */
  const CAT_BOOST = { scenario: 1.6, debug: 1.5, tradeoff: 1.5, design: 1.4, perf: 1.3 };

  let cfg = { level: 'middle', minutes: 45 };

  function buildSession(level, minutes) {
    const L = LEVELS[level];
    const budget = minutes * 60 * 0.9; // chừa 10% thời gian cho việc rà soát
    const perRound = budget / ROUNDS.length;
    const used = new Set();
    const ids = [], rounds = {};
    ROUNDS.forEach((r, ri) => {
      const pool = QB.questions.filter(q => !used.has(q.id) && r.match(q));
      // Sắp xếp theo khóa ngẫu nhiên có trọng số (Efraimidis–Spirakis)
      const keyed = pool.map(q => {
        let w = L.w[q.difficulty] || 0;
        if (level === 'enterprise' || level === 'senior') w *= CAT_BOOST[q.category] || 1;
        return { q, k: w > 0 ? Math.pow(Math.random(), 1 / w) : -Math.random() };
      }).sort((a, b) => b.k - a.k);
      let spent = 0;
      for (const { q } of keyed) {
        if (spent + q.estimatedSeconds > perRound) {
          if (spent >= perRound * 0.85) break; // đã gần đủ ngân sách của vòng
          continue;                              // thử câu ngắn hơn
        }
        ids.push(q.id); rounds[q.id] = ri; used.add(q.id); spent += q.estimatedSeconds;
      }
    });
    return { ids, rounds };
  }

  async function start() {
    const { ids, rounds } = buildSession(cfg.level, cfg.minutes);
    await Quiz.start({
      kind: 'interview', mode: 'exam',
      title: 'Phỏng vấn ' + LEVELS[cfg.level].label + ' (' + cfg.minutes + ' phút)',
      questionIds: ids, timeLimitMin: cfg.minutes,
      meta: { rounds, roundNames: ROUNDS.map(r => r.name), level: cfg.level },
    });
  }

  function render(el) {
    const counts = ROUNDS.map(r => QB.questions.filter(r.match).length);
    const preview = buildSession(cfg.level, cfg.minutes);
    const prevCount = ROUNDS.map((_, i) => Object.values(preview.rounds).filter(x => x === i).length);
    const past = Storage.state.sessions.filter(s => s.kind === 'interview').slice(-5).reverse();
    el.innerHTML =
      '<div class="page-head"><div><h1>Interview Simulator</h1><p>Mô phỏng 8 vòng phỏng vấn Java Backend bằng câu hỏi trắc nghiệm: lý thuyết, phân tích code, tình huống, thiết kế, trade-off và troubleshooting.</p></div></div>' +
      '<div class="grid grid-2"><div class="card"><h3>Thiết lập buổi phỏng vấn</h3>' +
      '<div class="field mt"><span class="label">Cấp độ</span><div class="seg" id="iv-level">' +
      Object.entries(LEVELS).map(([k, v]) => '<button data-v="' + k + '" class="' + (cfg.level === k ? 'on' : '') + '">' + v.label + '</button>').join('') + '</div></div>' +
      '<div class="field mt"><span class="label">Thời lượng</span><div class="seg" id="iv-min">' +
      [30, 45, 60].map(m => '<button data-v="' + m + '" class="' + (cfg.minutes === m ? 'on' : '') + '">' + m + ' phút</button>').join('') + '</div></div>' +
      '<p class="small muted mt">Hệ thống chọn khoảng <strong>' + preview.ids.length + '</strong> câu dựa trên thời gian dự kiến của từng câu, phân bổ đều 8 vòng và ưu tiên độ khó phù hợp cấp độ. Bài làm theo chế độ thi: không hiện đáp án đến khi nộp, tự nộp khi hết giờ.</p>' +
      '<button class="btn primary lg mt" id="iv-start">Bắt đầu phỏng vấn</button>' +
      '<div class="notice mt">Điểm trắc nghiệm là công cụ <strong>tự đánh giá kiến thức</strong>, không phản ánh đầy đủ năng lực trong buổi phỏng vấn thực tế (giao tiếp, giải thích, live coding, kinh nghiệm dự án).</div></div>' +
      '<div class="card"><h3>Các vòng phỏng vấn</h3><div class="table-wrap"><table class="table"><thead><tr><th>Vòng</th><th class="num">Ngân hàng</th><th class="num">Dự kiến</th></tr></thead><tbody>' +
      ROUNDS.map((r, i) => '<tr><td><strong>' + UI.esc(r.name) + '</strong><div class="tiny muted">' + UI.esc(r.desc) + '</div></td><td class="num">' + counts[i] + '</td><td class="num">' + prevCount[i] + '</td></tr>').join('') +
      '</tbody></table></div></div></div>' +
      '<div class="card"><h3>Lịch sử phỏng vấn gần đây</h3>' + (past.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Thời gian</th><th>Buổi</th><th class="num">Điểm</th><th></th></tr></thead><tbody>' +
        past.map(s => '<tr><td>' + UI.fmtDate(s.finishedAt) + '</td><td>' + UI.esc(s.title) + '</td><td class="num"><strong>' + s.score + '</strong></td><td><a href="#/result/' + s.id + '">Xem</a></td></tr>').join('') + '</tbody></table></div>'
        : '<p class="muted">Chưa có buổi phỏng vấn nào.</p>') + '</div>';

    el.querySelector('#iv-level').onclick = e => { const b = e.target.closest('button'); if (b) { cfg.level = b.dataset.v; render(el); } };
    el.querySelector('#iv-min').onclick = e => { const b = e.target.closest('button'); if (b) { cfg.minutes = +b.dataset.v; render(el); } };
    el.querySelector('#iv-start').onclick = start;
  }

  /** Phần bổ sung trong trang kết quả: điểm theo vòng, chủ đề yếu, gợi ý. */
  function resultExtra(r) {
    const names = (r.meta && r.meta.roundNames) || ROUNDS.map(x => x.name);
    const rows = names.map((n, i) => {
      const v = (r.byRound || {})[i];
      if (!v) return '';
      const p = UI.pct(v.correct, v.total);
      return '<div class="bar-row"><span class="name">' + UI.esc(n) + '</span>' + UI.progressBar(p, p >= 70 ? 'ok' : p >= 40 ? 'warn' : 'bad') + '<span class="val">' + v.correct + '/' + v.total + ' (' + p + '%)</span></div>';
    }).join('');
    const topics = Object.entries(r.byTopic || {}).map(([k, v]) => ({ k, v, p: UI.pct(v.correct, v.total) }));
    const weak = topics.filter(t => t.p < 60).sort((a, b) => a.p - b.p || b.v.total - a.v.total);
    const strong = topics.filter(t => t.p === 100 && t.v.total >= 2);
    const label = k => { const [m, t] = k.split('::'); return UI.esc(t) + ' <span class="muted tiny">(' + UI.esc(UI.moduleName(m)) + ')</span>'; };
    const weakModules = Object.entries(r.byModule || {}).map(([m, v]) => ({ m, p: UI.pct(v.correct, v.total) })).filter(x => x.p < 60).sort((a, b) => a.p - b.p);
    return '<div class="grid grid-2 mt"><div class="card"><h3>Điểm theo từng vòng</h3>' + (rows || '<p class="muted">Không có dữ liệu vòng.</p>') + '</div>' +
      '<div class="card"><h3>Kiến thức còn yếu (&lt; 60%)</h3>' +
      (weak.length ? '<ul class="small">' + weak.slice(0, 10).map(t => '<li>' + label(t.k) + ' — ' + t.v.correct + '/' + t.v.total + '</li>').join('') + '</ul>' : '<p class="muted">Không có chủ đề nào dưới 60%. Tốt lắm!</p>') +
      (strong.length ? '<h4 class="mt">Chủ đề làm tốt</h4><div class="chips">' + strong.slice(0, 10).map(t => '<span class="chip ok">' + UI.esc(t.k.split('::')[1]) + '</span>').join('') + '</div>' : '') +
      '<h4 class="mt">Gợi ý học tiếp</h4>' +
      (weakModules.length ? '<ul class="small">' + weakModules.map(x => '<li>Ôn lại module <a href="#/path">' + UI.esc(UI.moduleName(x.m)) + '</a> (' + x.p + '% đúng), sau đó luyện tập lại các câu sai ở tab <a href="#/review">Review Mistakes</a>.</li>').join('') + '</ul>'
        : '<p class="small muted">Duy trì ôn tập theo lịch ở tab Review Mistakes và thử cấp độ khó hơn.</p>') +
      '<div class="notice mt tiny">Đây là công cụ tự đánh giá kiến thức. Kết quả trắc nghiệm không thay thế đánh giá năng lực trong phỏng vấn thực tế.</div></div></div>';
  }

  return { render, resultExtra, ROUNDS, LEVELS, buildSession };
})();
