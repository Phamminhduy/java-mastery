/**
 * Progress — ghi nhận kết quả trả lời, lịch ôn tập (spaced repetition) và tính thống kê.
 * Mọi số liệu đều được tính từ dữ liệu thực tế trong Storage.
 */
const Progress = (() => {
  const DAY = 86400000;
  const S = () => Storage.state;

  function entry(qid) { return S().progress[qid] || null; }
  function ensure(qid) {
    const p = S().progress;
    if (!p[qid]) p[qid] = { attempts: 0, correct: 0, wrong: 0, correctAfterWrong: 0, firstAnswered: null, lastAnswered: null, lastResult: null, history: [], mastered: false, srs: null };
    return p[qid];
  }
  function intervals() { return S().settings.srsIntervals || Storage.DEFAULT_INTERVALS; }

  /**
   * Ghi nhận một lần trả lời. Gọi đúng một lần cho mỗi câu trong mỗi phiên.
   * Sai -> đưa về đầu lịch ôn tập (đến hạn ngay). Đúng khi đang ôn -> giãn khoảng cách.
   */
  function record(qid, selected, ok, now) {
    now = now || Date.now();
    const e = ensure(qid);
    e.attempts++;
    if (!e.firstAnswered) e.firstAnswered = now;
    e.lastAnswered = now;
    e.lastResult = ok;
    e.history.push({ t: now, sel: selected.slice(), ok });
    if (e.history.length > Storage.MAX_HISTORY) e.history = e.history.slice(-Storage.MAX_HISTORY);
    if (ok) {
      e.correct++;
      if (e.wrong > 0) e.correctAfterWrong++;
      if (e.srs) {
        const iv = intervals();
        const days = iv[Math.min(e.srs.level, iv.length - 1)];
        e.srs = { level: e.srs.level + 1, due: UI.startOfDay(now) + days * DAY };
      }
    } else {
      e.wrong++;
      e.mastered = false;
      e.srs = { level: 0, due: now };
    }
  }

  function setMastered(qid, value) {
    const e = ensure(qid);
    e.mastered = value;
    Storage.save();
  }
  /** Đánh dấu thủ công "cần ôn tập". */
  function markForReview(qid) {
    const e = ensure(qid);
    e.mastered = false;
    e.srs = { level: e.srs ? e.srs.level : 0, due: Date.now() };
    Storage.save();
  }
  function unmarkReview(qid) { const e = entry(qid); if (e) { e.srs = null; Storage.save(); } }

  const endOfToday = () => UI.startOfDay(Date.now()) + DAY - 1;
  function isDue(e) { return !!(e && e.srs && !e.mastered && e.srs.due <= endOfToday()); }
  function inReview(e) { return !!(e && e.srs && !e.mastered); }

  function dueIds() {
    return Object.entries(S().progress).filter(([id, e]) => QB.get(id) && isDue(e))
      .sort((a, b) => a[1].srs.due - b[1].srs.due).map(([id]) => id);
  }
  /** Câu thuộc phạm vi ôn tập: từng trả lời sai hoặc được đánh dấu "cần ôn tập" thủ công. */
  function reviewIds() {
    return Object.entries(S().progress).filter(([id, e]) => QB.get(id) && (e.wrong > 0 || e.srs)).map(([id]) => id);
  }
  function wrongIds() {
    return Object.entries(S().progress).filter(([id, e]) => QB.get(id) && e.wrong > 0).map(([id]) => id);
  }

  /** Trạng thái câu hỏi cho bộ lọc. */
  function status(qid) {
    const e = entry(qid);
    return {
      done: !!(e && e.attempts > 0),
      wrong: !!(e && e.wrong > 0),
      due: isDue(e),
      bookmarked: !!S().bookmarks[qid],
      mastered: !!(e && e.mastered),
      lastResult: e ? e.lastResult : null,
    };
  }

  // ---------- Thống kê ----------
  function summary() {
    const prog = S().progress;
    let attempts = 0, correct = 0, wrong = 0, unique = 0;
    for (const [id, e] of Object.entries(prog)) {
      if (!QB.get(id) || !e.attempts) continue;
      unique++; attempts += e.attempts; correct += e.correct; wrong += e.wrong;
    }
    const exams = S().sessions.filter(s => s.mode === 'exam');
    const last = exams[exams.length - 1];
    return {
      total: QB.questions.length,
      attempts, correct, wrong, unique,
      accuracy: UI.pct(correct, attempts),
      unlearned: QB.questions.length - unique,
      due: dueIds().length,
      inReview: Object.entries(prog).filter(([id, e]) => QB.get(id) && inReview(e)).length,
      mastered: Object.values(prog).filter(e => e.mastered).length,
      lastExam: last || null,
      avgExam: exams.length ? Math.round(exams.reduce((a, s) => a + s.score, 0) / exams.length) : null,
      examCount: exams.length,
      sessionCount: S().sessions.length,
    };
  }

  /** Gom nhóm theo key (module | difficulty | topic). */
  function groupBy(keyFn, keys) {
    const g = {};
    (keys || []).forEach(k => { g[k] = { key: k, total: 0, unique: 0, attempts: 0, correct: 0, wrong: 0 }; });
    for (const q of QB.questions) {
      const k = keyFn(q);
      if (!g[k]) g[k] = { key: k, total: 0, unique: 0, attempts: 0, correct: 0, wrong: 0 };
      g[k].total++;
      const e = entry(q.id);
      if (e && e.attempts) { g[k].unique++; g[k].attempts += e.attempts; g[k].correct += e.correct; g[k].wrong += e.wrong; }
    }
    Object.values(g).forEach(x => { x.accuracy = x.attempts ? UI.pct(x.correct, x.attempts) : null; x.coverage = UI.pct(x.unique, x.total); x.errorRate = x.attempts ? UI.pct(x.wrong, x.attempts) : null; });
    return g;
  }
  const byModule = () => groupBy(q => q.module, QB.modules.map(m => m.id));
  const byDifficulty = () => groupBy(q => q.difficulty, QB.DIFFICULTY_ORDER);
  const byTopic = () => groupBy(q => q.module + '::' + q.topic);

  /** Chủ đề có tỷ lệ sai cao (cần >= minAttempts lượt). */
  function weakTopics(limit, minAttempts) {
    minAttempts = minAttempts || 2;
    return Object.values(byTopic()).filter(t => t.attempts >= minAttempts && t.wrong > 0)
      .sort((a, b) => b.errorRate - a.errorRate || b.wrong - a.wrong).slice(0, limit || 5);
  }

  /** Chủ đề đang cải thiện: so sánh độ chính xác nửa đầu và nửa sau các lượt trả lời theo thời gian. */
  function improvingTopics(limit) {
    const map = {};
    for (const [id, e] of Object.entries(S().progress)) {
      const q = QB.get(id); if (!q) continue;
      const k = q.module + '::' + q.topic;
      (map[k] = map[k] || []).push(...e.history.map(h => ({ t: h.t, ok: h.ok })));
    }
    const res = [];
    for (const [k, hs] of Object.entries(map)) {
      if (hs.length < 4) continue;
      hs.sort((a, b) => a.t - b.t);
      const half = Math.floor(hs.length / 2);
      const acc = arr => arr.filter(h => h.ok).length / arr.length;
      const before = acc(hs.slice(0, half)), after = acc(hs.slice(half));
      if (after > before) res.push({ key: k, before: Math.round(before * 100), after: Math.round(after * 100), n: hs.length });
    }
    return res.sort((a, b) => (b.after - b.before) - (a.after - a.before)).slice(0, limit || 5);
  }

  function recentWrong(limit) {
    return Object.entries(S().progress).filter(([id, e]) => QB.get(id) && e.lastResult === false)
      .sort((a, b) => b[1].lastAnswered - a[1].lastAnswered).slice(0, limit || 8)
      .map(([id, e]) => ({ q: QB.get(id), e }));
  }

  /** Module tiếp theo nên học theo thứ tự lộ trình (module đầu tiên còn câu chưa làm). */
  function nextModule() {
    const bm = byModule();
    return QB.modules.find(m => bm[m.id] && bm[m.id].unique < bm[m.id].total) || null;
  }

  return { record, entry, setMastered, markForReview, unmarkReview, isDue, inReview, dueIds, wrongIds, reviewIds, status, summary, byModule, byDifficulty, byTopic, weakTopics, improvingTopics, recentWrong, nextModule };
})();
