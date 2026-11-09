/* 스키마 (Schema) — 개인 맞춤 영어독해 학습 앱
 * 단어 · 듣기 · 말하기 · 문법 · 독해 + My Learning (학습 결과 · 오답 관리)
 * 서버 없이 브라우저만으로 동작합니다. 학습 기록(AI 메모리)은 이 브라우저의 localStorage에 저장됩니다.
 */
(() => {
  'use strict';

  // ---------- 공통 유틸 ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const DAY = 864e5;
  const today = () => new Date().toLocaleDateString('sv');
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const KEYS = '①②③④⑤';
  const view = $('#view');

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
  }

  // ---------- 상태 (AI 메모리) ----------
  const STORE = 'schema-app-v1';
  const defaults = () => ({
    pid: 'sleep', custom: null, customMeanings: {},
    wrongWords: {}, wrongGrammar: {}, wrongReading: {}, mastered: 0,
    gStats: {}, results: [], days: [],
    reminder: { enabled: false, time: '21:00', last: '' },
    rate: 1, voice: '', tab: {}
  });
  let S = (() => {
    try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(STORE) || '{}')); }
    catch { return defaults(); }
  })();
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { /* 저장 불가 환경 */ }
    updateBadge();
  }
  function markStudy() { const d = today(); if (!S.days.includes(d)) S.days.push(d); }
  function addResult(area, score, total, label) {
    S.results.push({ area, pid: S.pid, score, total, label, date: Date.now() });
    if (S.results.length > 500) S.results = S.results.slice(-500);
    markStudy(); save();
  }

  // ---------- 지문 ----------
  function splitSentences(t) {
    return t.replace(/\s+/g, ' ').trim()
      .split(/(?<=[.!?]["”’)]?)\s+(?=["“‘(]?[A-Z0-9])/)
      .map(s => s.trim()).filter(s => s.length > 1);
  }
  function passageById(id) {
    if (id === 'custom' && S.custom) {
      return {
        id: 'custom', title: S.custom.title || '내가 입력한 지문', ko: S.custom.ai ? 'AI가 만든 맞춤 지문' : '직접 입력한 지문', topic: S.custom.topic || '사용자 지문', custom: true,
        items: S.custom.items && S.custom.items.length ? S.custom.items : splitSentences(S.custom.text).map(en => ({ en, ko: '' }))
      };
    }
    return PASSAGES.find(p => p.id === id) || PASSAGES[0];
  }
  const passage = () => passageById(S.pid);
  const sentences = (p = passage()) => p.items.filter(x => x.en);
  const roundNo = id => PASSAGES.findIndex(p => p.id === id) + 1;

  const STOP = new Set(('about above after again against because before being below between could does doing during each every further having other should their there these those through under until where which while would yours itself themselves another without within around however although always already people really little nothing something anything everything become becomes became before many much more most such than that them then they this were what when with your will from have into only over also just like even very some same said says year years first second third world things think') .split(' '));
  function stem(w) { w = w.toLowerCase(); return w.length > 5 ? w.replace(/(e|y)$/, '') : w; }
  function wordRegex(w, flags = 'i') { return new RegExp('\\b' + stem(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-z]*', flags); }
  function findSentence(w, sents) { const r = wordRegex(w); return sents.find(s => r.test(s.en)); }

  function extractVocab(p) {
    const sents = sentences(p), freq = {}, proper = new Set();
    sents.forEach(s => {
      const toks = s.en.match(/[A-Za-z][A-Za-z'-]*/g) || [];
      toks.forEach((t, i) => {
        if (i > 0 && /^[A-Z]/.test(t)) proper.add(t.toLowerCase());
        const w = t.toLowerCase().replace(/'s$/, '');
        if (w.length < 6 || STOP.has(w) || w.includes("'")) return;
        freq[w] = (freq[w] || 0) + 1;
      });
    });
    return Object.keys(freq).filter(w => !proper.has(w))
      .sort((a, b) => (freq[b] * 2 + b.length * 0.6) - (freq[a] * 2 + a.length * 0.6))
      .slice(0, 12)
      .map(w => ({ w, pos: '', m: S.customMeanings[w] || '', syn: '', ant: '' }));
  }

  function contentFor(p = passage()) {
    if (CONTENT[p.id]) return CONTENT[p.id];
    const aiVocab = S.custom && Array.isArray(S.custom.vocab) && S.custom.vocab.length ? S.custom.vocab.map(v => ({ w: v.w, pos: v.pos || '', m: v.m || '', syn: v.syn || '', ant: '' })) : null;
    const vocab = aiVocab || extractVocab(p);
    const keyWords = vocab.slice(0, 8).map(v => v.w);
    return {
      vocab,
      grammar: null, // 사용자 지문은 문법 문제 은행에서 출제
      reading: S.custom && Array.isArray(S.custom.questions) && S.custom.questions.length ? S.custom.questions : null, // 없으면 빈칸 추론 자동 생성
      speaking: [
        { q: 'Can you summarize the main idea of this passage in two or three sentences?', keys: keyWords },
        { q: 'What is your opinion about the topic of this passage? Give one reason and one example.', keys: ['think', 'opinion', 'because', 'example', 'agree', 'believe'] },
        { q: 'What is one new thing you learned from this passage?', keys: keyWords.concat(['learned', 'interesting']) }
      ]
    };
  }
  function vocabFor(p = passage()) {
    const sents = sentences(p);
    return contentFor(p).vocab.map(v => {
      const s = findSentence(v.w, sents);
      return { ...v, pid: p.id, m: v.m || S.customMeanings[v.w] || '', ex: s ? s.en : '', exKo: s ? s.ko : '' };
    });
  }
  const allVocab = () => PASSAGES.flatMap(p => vocabFor(p)).concat(S.pid === 'custom' && S.custom ? vocabFor(passageById('custom')) : []);

  // ---------- 문법 자동 탐지 ----------
  const ING_EXCL = new Set('thing something nothing anything everything during morning evening spring string king bring sing ring ceiling building nothing'.split(' '));
  const GP = [
    ['form5', /\b(?:caus|forc|allow|encourag|enabl|requir|ask|want|help|expect)\w*\s+(?:[\w’'-]+\s+){1,5}?to\s+[a-z]+/gi],
    ['tense', /\b(?:has|have|had)\s+(?:not\s+|already\s+|probably\s+|always\s+|never\s+|just\s+|also\s+)?(?:been|[a-z]+ed|seen|done|made|gone|known|shown|grown|risen|taken|given|become|begun|found|met)\b/gi],
    ['voice', /\b(?:am|is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(?:[a-z]+ed|built|sent|known|shown|seen|given|taken|made|done|written|sold|born|meant|paid|held|spoken|found|thought|brought|left|led)\b(?:\s+by\b)?/gi],
    ['toinf', /\bto\s+(?!the\b|a\b|an\b|his\b|her\b|its\b|their\b|our\b|my\b|your\b|him\b|them\b|us\b|me\b|it\b|job\b|life\b|mark\b|avoid\s+\w+’s)[a-z]+\b/g],
    ['gerund', /(?:^|\b(?:in|of|about|without|by|for|on|from|after|before|at)\s+)[A-Z]?[a-z]+ing\b/g],
    ['particip', /,\s+(?:[a-z]+ing|[a-z]+ed)\b/g],
    ['relative', /\b(?:who|which|whose|whom)\b/gi],
    ['cond', /\b(?:even if|if|unless|without|whatever|wherever)\b/gi],
    ['compare', /\b(?:\w+\s+as\s+\w+\s+as|not all|more\s+\w+\s+than|\w+er\s+than|[Bb]elow are|It\s+(?:is|was)\s+[^.]*?\bthat)\b/g]
  ];
  function detectGrammar(text) {
    const found = [];
    GP.forEach(([cat, re]) => {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text))) {
        const last = m[0].trim().split(/\s+/).pop().toLowerCase();
        if ((cat === 'gerund' || cat === 'particip') && ING_EXCL.has(last)) continue;
        if (cat === 'gerund' && /^(?:[A-Z][a-z]+ing)$/.test(m[0]) && m.index !== 0) continue;
        found.push({ cat, s: m.index, e: m.index + m[0].length });
        if (m[0].length === 0) re.lastIndex++;
      }
    });
    found.sort((a, b) => a.s - b.s || b.e - a.e);
    const out = []; let end = -1;
    found.forEach(f => { if (f.s >= end) { out.push(f); end = f.e; } });
    return out;
  }
  function grammarHtml(text, filter) {
    const ms = detectGrammar(text).filter(m => !filter || m.cat === filter);
    let html = '', pos = 0;
    ms.forEach(m => {
      html += esc(text.slice(pos, m.s));
      html += `<mark class="g g-${m.cat}" title="${esc(GRAMMAR_CATS[m.cat].name)}">${esc(text.slice(m.s, m.e))}</mark>`;
      pos = m.e;
    });
    return html + esc(text.slice(pos));
  }
  const grammarCats = text => [...new Set(detectGrammar(text).map(m => m.cat))];

  function vocabHtml(text, vocab) {
    let html = esc(text);
    vocab.forEach(v => {
      const r = new RegExp('\\b(' + stem(v.w) + '[a-z]*)', 'i');
      html = html.replace(r, `<mark class="w" title="${esc(v.m)}">$1</mark>`);
    });
    return html;
  }

  // ---------- 음성 (TTS) ----------
  const TTS = 'speechSynthesis' in window;
  let voices = [], ttsToken = 0;
  function loadVoices() { if (TTS) voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); }
  if (TTS) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function speak(text, { rate = S.rate, onend } = {}) {
    if (!TTS) { toast('이 브라우저는 음성 읽기를 지원하지 않습니다.'); return; }
    const token = ttsToken;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate;
    const v = voices.find(x => x.name === S.voice) || voices.find(x => /en-US/i.test(x.lang));
    if (v) u.voice = v;
    u.onend = u.onerror = () => { if (token === ttsToken && onend) onend(); };
    speechSynthesis.speak(u);
  }
  function stopAudio() { ttsToken++; if (TTS) speechSynthesis.cancel(); $$('.sent.playing').forEach(x => x.classList.remove('playing')); }

  // ---------- 녹음 + 음성 인식 ----------
  // claude.ai 아티팩트(웹 공유 버전)에서는 마이크와 파일 다운로드가 막혀 있음
  const IN_ARTIFACT = !!(window.claude && window.claude.use) || /claude|anthropic/i.test(location.hostname);
  const MIC_BLOCKED = '이 웹 공유 버전에서는 마이크를 쓸 수 없어요. 발음 점수와 녹음은 앱 폴더의 index.html을 Chrome으로 직접 열면 사용할 수 있어요. 원어민 듣기와 AI 대화(입력)는 여기서도 됩니다.';
  const SR = IN_ARTIFACT ? null : (window.SpeechRecognition || window.webkitSpeechRecognition);
  const recordings = []; // 세션 동안의 내 녹음 {url, text, score, time}
  async function startCapture(onStop, { continuous = false } = {}) {
    let stream = null;
    if (IN_ARTIFACT) { onStop({ error: MIC_BLOCKED }); return null; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { stream = null; }
    if (!stream && !SR) { onStop({ error: '마이크를 사용할 수 없습니다. 브라우저의 마이크 권한을 확인해 주세요.' }); return null; }
    const res = { transcript: '', url: null };
    let waitRec = false, waitSr = false, done = false, mr = null, sr = null;
    const chunks = [];
    const maybeDone = () => {
      if (waitRec || waitSr || done) return;
      done = true; clearTimeout(timer);
      if (stream) stream.getTracks().forEach(t => t.stop());
      onStop(res);
    };
    if (stream && window.MediaRecorder) {
      mr = new MediaRecorder(stream); waitRec = true;
      mr.ondataavailable = e => e.data.size && chunks.push(e.data);
      mr.onstop = () => { res.url = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })) : null; waitRec = false; maybeDone(); };
      mr.start();
    }
    if (SR) {
      sr = new SR(); sr.lang = 'en-US'; sr.interimResults = false; sr.continuous = continuous; waitSr = true;
      sr.onresult = e => { res.transcript = Array.from(e.results).map(r => r[0].transcript).join(' ').trim(); };
      sr.onerror = e => { res.srError = e.error; };
      sr.onend = () => { waitSr = false; if (mr && mr.state === 'recording') mr.stop(); maybeDone(); };
      try { sr.start(); } catch { waitSr = false; }
    }
    const timer = setTimeout(stop, 30000);
    function stop() {
      if (sr && waitSr) { try { sr.stop(); } catch { /* 이미 종료 */ } }
      if (mr && mr.state === 'recording') mr.stop();
      maybeDone();
    }
    return { stop };
  }
  const normWords = t => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  function matchWords(target, spoken) {
    const a = normWords(target), b = normWords(spoken);
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ok = new Array(a.length).fill(false);
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { ok[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
    }
    return { words: a, ok, score: pct(ok.filter(Boolean).length, a.length) };
  }

  // ---------- 오답 메모리 (간격 반복) ----------
  const INTERVALS = [0, 1, 3]; // 연속 정답 횟수에 따른 다음 복습까지 일수
  const MASTER = 3;
  function wrongWord(v, source) {
    const k = v.pid + ':' + v.w;
    const e = S.wrongWords[k] || { w: v.w, m: v.m, pid: v.pid, wrong: 0, streak: 0, source };
    e.wrong++; e.streak = 0; e.due = Date.now(); e.m = v.m || e.m;
    S.wrongWords[k] = e; save();
  }
  function reviewWord(k, ok) {
    const e = S.wrongWords[k]; if (!e) return false;
    if (!ok) { e.streak = 0; e.wrong++; e.due = Date.now(); save(); return false; }
    e.streak++;
    if (e.streak >= MASTER) { delete S.wrongWords[k]; S.mastered++; save(); return true; }
    e.due = Date.now() + INTERVALS[e.streak] * DAY; save(); return false;
  }
  const dueWords = () => Object.entries(S.wrongWords).filter(([, e]) => (e.due || 0) <= Date.now());
  function updateBadge() {
    const n = dueWords().length + Object.keys(S.wrongGrammar).length;
    const b = $('#dueBadge'); b.hidden = !n; b.textContent = n;
    const ban = $('#reminderBanner');
    if (n && !S.days.includes(today())) {
      ban.hidden = false;
      ban.innerHTML = `🔔 오늘 복습할 오답이 <b>${n}개</b> 있어요. <a href="#mylearning">My Learning에서 복습하기 →</a>`;
    } else ban.hidden = true;
  }

  // ---------- 퀴즈 엔진 ----------
  function pickOthers(pool, exclude, n = 3) {
    return shuffle([...new Set(pool.filter(x => x && x !== exclude))]).slice(0, n);
  }
  function runQuiz(el, qs, { onAnswer, onFinish, title = '' } = {}) {
    if (!qs.length) { el.innerHTML = '<div class="empty">출제할 문제가 없습니다.</div>'; return; }
    let i = 0, right = 0; const wrongs = [];
    qs = qs.map(q => {
      const order = shuffle(q.options.map((_, k) => k));
      return { ...q, opts: order.map(k => q.options[k]), ans: order.indexOf(q.answer) };
    });
    const show = () => {
      if (i >= qs.length) return finish();
      const q = qs[i];
      el.innerHTML = `
        <div class="row">${q.tag ? `<span class="chip">${esc(q.tag)}</span>` : ''}${title ? `<span class="tiny">${esc(title)}</span>` : ''}<span class="spacer"></span><span class="tiny">${i + 1} / ${qs.length}</span></div>
        <div class="progress"><i style="width:${(i / qs.length) * 100}%"></i></div>
        <div class="quiz-q">${q.prompt}</div>
        <div class="options">${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${KEYS[k]}</span><span>${esc(o)}</span></button>`).join('')}</div>
        <div class="fbk"></div>`;
      $$('.opt', el).forEach(b => b.onclick = () => {
        const k = +b.dataset.k, ok = k === q.ans;
        $$('.opt', el).forEach(x => { x.disabled = true; if (+x.dataset.k === q.ans) x.classList.add('correct'); });
        if (!ok) { b.classList.add('wrong'); wrongs.push(q); } else right++;
        const extra = onAnswer ? onAnswer(q, ok) : '';
        $('.fbk', el).innerHTML = `
          <div class="explain ${ok ? '' : 'bad'}"><b>${ok ? '정답입니다 ✓' : '오답입니다 · 정답: ' + esc(q.opts[q.ans])}</b>
          ${q.explain ? `<div style="margin-top:6px">${q.explain}</div>` : ''}${extra || ''}</div>
          <div class="row" style="margin-top:12px"><span class="spacer"></span><button class="btn primary next">${i + 1 < qs.length ? '다음 문제 →' : '결과 보기'}</button></div>`;
        const nx = $('.next', el); nx.onclick = () => { i++; show(); }; nx.focus();
      });
    };
    const finish = () => {
      const s = pct(right, qs.length);
      el.innerHTML = `
        <div class="row" style="align-items:flex-end;gap:16px">
          <div><div class="tiny">결과</div><div class="score-big">${right} / ${qs.length}</div></div>
          <div class="muted">${s >= 90 ? '훌륭해요! 이 영역은 거의 숙달했어요.' : s >= 60 ? '좋아요. 틀린 문제는 오답 노트에 저장되었어요.' : '틀린 문제를 AI 메모리에 저장했어요. 반복 학습으로 숙달해 봅시다.'}</div>
        </div>
        ${wrongs.length ? `<h3 style="margin-top:18px">틀린 문제</h3><table class="list"><tr><th>문제</th><th>정답</th></tr>${wrongs.map(w => `<tr><td>${w.prompt}</td><td>${esc(w.opts[w.ans])}</td></tr>`).join('')}</table>` : ''}
        <div class="row after" style="margin-top:16px"></div>`;
      if (onFinish) onFinish(right, qs.length, wrongs, $('.after', el));
    };
    show();
  }

  // 단어 문제 생성
  function vocabQuestion(v, pool, type) {
    const sameWords = pool.map(x => x.w), meanings = pool.map(x => x.m).filter(Boolean);
    const types = [];
    if (v.m) types.push('meaning', 'word');
    if (v.ex) types.push('cloze');
    if (!types.length) return null;
    const t = type && types.includes(type) ? type : types[Math.floor(Math.random() * types.length)];
    const base = { v, tag: '단어', answer: 0 };
    if (t === 'meaning') return { ...base, prompt: `<span class="en"><b>${esc(v.w)}</b></span> <small>${esc(v.pos)}</small> 의 뜻으로 알맞은 것은?`, options: [v.m, ...pickOthers(meanings, v.m)], explain: wordExplain(v) };
    if (t === 'word') return { ...base, prompt: `"<b>${esc(v.m)}</b>" 에 해당하는 영어 단어는?`, options: [v.w, ...pickOthers(sameWords, v.w)], explain: wordExplain(v) };
    const m = v.ex.match(wordRegex(v.w));
    const blanked = esc(v.ex).replace(wordRegex(v.w), '<u>　　　　</u>');
    return { ...base, tag: '문맥 빈칸', prompt: `빈칸에 들어갈 단어는? <div class="en" style="margin-top:8px">${blanked}</div>`, options: [m ? m[0] : v.w, ...pickOthers(sameWords, v.w).map(w => w)], explain: wordExplain(v) };
  }
  function wordExplain(v) {
    return `<b>${esc(v.w)}</b> ${esc(v.pos)} ${esc(v.m)}${v.syn ? ` · 유의어 ${esc(v.syn)}` : ''}${v.ant ? ` · 반의어 ${esc(v.ant)}` : ''}${v.ex ? `<div class="en" style="font-size:.95rem;margin-top:4px">${vocabHtml(v.ex, [v])}</div>` : ''}`;
  }

  // 문법 문제 조회
  function grammarQ(id) {
    const [src, n] = id.split(':');
    if (src === 'bank') return { ...GRAMMAR_BANK[+n], id };
    if (src === 'ai') return S.aiGrammar && S.aiGrammar[+n] ? { ...S.aiGrammar[+n], id } : null;
    const c = CONTENT[src]; if (!c) return null;
    return { ...c.grammar[+n.slice(1)], id, pid: src };
  }
  function grammarIds(pid) {
    if (CONTENT[pid] && CONTENT[pid].grammar) return CONTENT[pid].grammar.map((_, i) => `${pid}:g${i}`);
    return shuffle(GRAMMAR_BANK.map((_, i) => `bank:${i}`)).slice(0, 8);
  }
  function toGrammarQuiz(q) {
    return {
      id: q.id, cat: q.cat, tag: GRAMMAR_CATS[q.cat].name, answer: q.a, options: q.o,
      prompt: `<div class="en">${esc(q.s).replace('___', '<u>　　　　</u>')}</div>`,
      explain: `${esc(q.ex)}<div class="tiny" style="margin-top:6px">📘 ${esc(GRAMMAR_CATS[q.cat].name)} — ${esc(GRAMMAR_CATS[q.cat].desc)}</div>`
    };
  }
  function recordGrammar(q, ok) {
    const g = S.gStats[q.cat] || { r: 0, w: 0 };
    ok ? g.r++ : g.w++; S.gStats[q.cat] = g;
    const e = S.wrongGrammar[q.id];
    if (!ok) S.wrongGrammar[q.id] = { cat: q.cat, wrong: (e ? e.wrong : 0) + 1, streak: 0, at: Date.now() };
    else if (e) {
      e.streak++;
      if (e.streak >= 2) { delete S.wrongGrammar[q.id]; S.mastered++; save(); return '<div class="tiny" style="margin-top:6px">🎉 이 문제를 숙달해서 오답 노트에서 졸업했어요!</div>'; }
    }
    save(); return '';
  }

  // ---------- 화면 공통 ----------
  function head(eyebrow, title, desc) {
    return `<div class="page-head"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div>`;
  }
  function tabs(name, list) {
    const cur = S.tab[name] && list.some(t => t[0] === S.tab[name]) ? S.tab[name] : list[0][0];
    return { cur, html: `<div class="tabs" role="tablist">${list.map(([id, label]) => `<button role="tab" data-tab="${id}" class="${id === cur ? 'active' : ''}">${label}</button>`).join('')}</div>` };
  }
  function bindTabs(name, rerender) {
    $$('.tabs [data-tab]', view).forEach(b => b.onclick = () => { S.tab[name] = b.dataset.tab; save(); stopAudio(); rerender(); });
  }
  const passageLabel = p => p.custom ? `✎ ${p.title}` : `${roundNo(p.id)}회차 · ${p.title}`;

  // ======================================================
  // 홈
  // ======================================================
  function home() {
    const dueW = dueWords().length, dueG = Object.keys(S.wrongGrammar).length;
    const total = S.results.reduce((a, r) => a + r.total, 0);
    view.innerHTML = `
      <div class="card hero">
        <h1>스키마, 나에게 부족한 부분만 반복하는 영어독해</h1>
        <p>지문 하나로 단어 · 듣기 · 말하기 · 문법 · 독해를 모두 연습하고, 틀린 문제는 AI 메모리가 기억했다가 숙달할 때까지 다시 출제합니다.</p>
      </div>

      <div class="grid g3 stats">
        <div class="card stat"><div class="v">${dueW + dueG}</div><div class="l">오늘 복습할 오답</div></div>
        <div class="card stat"><div class="v">${S.days.length}일</div><div class="l">누적 학습일</div></div>
        <div class="card stat"><div class="v">${S.mastered}</div><div class="l">숙달해서 졸업한 오답</div></div>
      </div>
      ${dueW + dueG ? `<div class="card flat row"><div><b>오늘의 복습</b><div class="tiny">틀린 단어 ${dueW}개 · 틀린 문법 ${dueG}개가 기다리고 있어요.</div></div><span class="spacer"></span>
        ${dueW ? '<button class="btn primary" data-go="vocab:review">단어 오답 복습</button>' : ''}${dueG ? '<button class="btn" data-go="grammar:weak">약점 문법 집중</button>' : ''}</div>` : ''}

      <h2 style="margin-top:22px">1. 학습할 지문 고르기</h2>
      <div class="grid g3">
        ${PASSAGES.map(p => `
          <div class="card passage-card ${S.pid === p.id ? 'sel' : ''}" data-pid="${p.id}" tabindex="0">
            <span class="tiny">${roundNo(p.id)}회차 · ${esc(p.topic)}</span>
            <span class="t">${esc(p.title)}</span>
            <span class="muted" style="font-size:.88rem">${esc(p.ko)}</span>
            <span class="tiny">${sentences(p).length}문장 · 핵심 어휘 ${CONTENT[p.id].vocab.length}개</span>
          </div>`).join('')}
      </div>
      <div class="card" id="customCard">
        <h3>✎ 내 지문으로 학습하기</h3>
        <p class="tiny">원하는 영어 지문(기사, 교재, AI가 만든 맞춤 지문 등)을 붙여넣으면 핵심 어휘 추출 · 문법 탐지 · 듣기 · 받아쓰기 · 말하기를 바로 할 수 있어요.</p>
        <input type="text" id="cTitle" placeholder="지문 제목 (선택)" style="width:100%;margin-bottom:8px" value="${esc(S.custom ? S.custom.title : '')}">
        <textarea id="cText" placeholder="Paste an English passage here...">${esc(S.custom ? S.custom.text : '')}</textarea>
        <div class="row" style="margin-top:10px"><span class="spacer"></span><button class="btn primary" id="cUse">이 지문으로 학습 시작</button></div>
      </div>

      <h2 style="margin-top:22px">2. 영역 선택하기</h2>
      <div class="grid g3 module-grid">
        ${[['vocab', 'Aa', 'Vocabulary', '회차별 단어 시험 · 틀린 단어 반복 숙달 · 시험 알림'],
          ['listening', '♪', 'Listening', '문장별 듣기 · 속도 조절 · 받아쓰기 · 틀린 단어 예문 듣기'],
          ['speaking', '◉', 'Speaking', '따라 읽기 발음 점수 · 내 녹음 다시 듣기 · AI 대화'],
          ['grammar', '¶', 'Grammar', '지문 속 문법 자동 탐지 · 오답 해설 · 약점 문법 자동 출제'],
          ['reading', '≡', 'Reading', '문장별 해석 · 구문 분석 · 독해 문제 · 맞춤 지문 생성'],
          ['mylearning', '★', 'My Learning', '학습 결과 · 오답 노트 · 다음 학습 추천']]
          .map(([id, ico, t, d]) => `<a href="#${id}" class="card module"><span class="ico">${ico}</span><span><b>${t}</b><span>${d}</span></span></a>`).join('')}
      </div>`;
    $$('.passage-card', view).forEach(c => {
      const pick = () => { setPassage(c.dataset.pid); toast(`${passageLabel(passage())} 선택됨`); home(); };
      c.onclick = pick; c.onkeydown = e => { if (e.key === 'Enter') pick(); };
    });
    $('#cUse').onclick = () => {
      const text = $('#cText').value.trim();
      if (splitSentences(text).length < 2) { toast('영어 문장을 2개 이상 입력해 주세요.'); return; }
      S.custom = { title: $('#cTitle').value.trim() || '내가 입력한 지문', text };
      setPassage('custom'); toast('내 지문이 준비되었어요. 단어 학습부터 시작해 볼까요?');
      location.hash = '#vocab';
    };
    $$('[data-go]', view).forEach(b => b.onclick = () => { const [v, t] = b.dataset.go.split(':'); S.tab[v] = t; save(); location.hash = '#' + v; });
  }

  function setPassage(id) { S.pid = id; save(); fillPassageSelect(); }
  function fillPassageSelect() {
    const sel = $('#passageSelect');
    const opts = PASSAGES.map(p => `<option value="${p.id}">${esc(passageLabel(p))}</option>`);
    if (S.custom) opts.push(`<option value="custom">${esc(passageLabel(passageById('custom')))}</option>`);
    opts.push('<option value="__new">+ 새 지문 입력하기…</option>');
    sel.innerHTML = opts.join('');
    sel.value = S.pid === 'custom' && !S.custom ? PASSAGES[0].id : S.pid;
  }
  $('#passageSelect').onchange = e => {
    if (e.target.value === '__new') {
      fillPassageSelect();
      if (location.hash !== '#home') location.hash = '#home'; else home();
      setTimeout(() => { $('#customCard').scrollIntoView({ behavior: 'smooth' }); $('#cText').focus(); }, 60);
      return;
    }
    setPassage(e.target.value); route();
  };

  // ======================================================
  // Vocabulary
  // ======================================================
  let flashIdx = 0;
  function vocab() {
    const p = passage(), list = vocabFor(p);
    const t = tabs('vocab', [['cards', '단어장'], ['test', '회차별 단어 시험'], ['review', `오답 반복 숙달 (${Object.keys(S.wrongWords).length})`], ['alarm', '시험 알림']]);
    view.innerHTML = head('Vocabulary · 단어', '단어 학습', `${esc(passageLabel(p))} — 지문에서 뽑은 핵심 어휘 ${list.length}개`) + t.html + '<div id="pane"></div>';
    bindTabs('vocab', vocab);
    const pane = $('#pane');
    ({ cards: vocabCards, test: vocabTest, review: vocabReview, alarm: vocabAlarm })[t.cur](pane, p, list);
  }

  function vocabCards(pane, p, list) {
    if (!list.length) { pane.innerHTML = '<div class="empty">지문에서 어휘를 찾지 못했어요.</div>'; return; }
    flashIdx = Math.min(flashIdx, list.length - 1);
    const v = list[flashIdx];
    pane.innerHTML = `
      <div class="card">
        <div class="row"><span class="tiny">${flashIdx + 1} / ${list.length} · 카드를 누르면 뜻이 보여요</span><span class="spacer"></span>
          <button class="btn sm" id="say">🔊 발음 듣기</button></div>
        <div class="flash" id="flash">
          <div class="front"><div class="word">${esc(v.w)}</div><div class="pos">${esc(v.pos)}</div></div>
          <div class="back">
            <div class="word" style="font-size:1.5rem">${esc(v.w)} <small>${esc(v.pos)}</small></div>
            <div style="font-size:1.25rem;margin-top:4px">${esc(v.m || '(뜻을 아래 단어 목록에서 입력해 주세요)')}</div>
            <dl class="kv">
              ${v.syn ? `<dt>유의어</dt><dd>${esc(v.syn)}</dd>` : ''}
              ${v.ant ? `<dt>반의어</dt><dd>${esc(v.ant)}</dd>` : ''}
              ${v.ex ? `<dt>지문 예문</dt><dd><span class="en" style="font-size:.98rem">${vocabHtml(v.ex, [v])}</span>${v.exKo ? `<div class="ko">${esc(v.exKo)}</div>` : ''}</dd>` : ''}
            </dl>
          </div>
        </div>
        <div class="row">
          <button class="btn" id="prev">← 이전</button><span class="spacer"></span>
          <button class="btn danger" id="dunno">✗ 몰라요 (오답노트)</button>
          <button class="btn primary" id="know">✓ 알아요</button>
          <span class="spacer"></span><button class="btn" id="next">다음 →</button>
        </div>
      </div>
      <div class="card">
        <h3>전체 단어 목록</h3>
        <table class="list"><tr><th>단어</th><th>뜻</th><th>유의어 / 반의어</th><th></th></tr>
          ${list.map((x, i) => `<tr><td><b>${esc(x.w)}</b> <small>${esc(x.pos)}</small></td>
            <td>${p.custom ? `<input type="text" class="mean" data-w="${esc(x.w)}" value="${esc(x.m)}" placeholder="뜻 입력" style="width:100%">` : esc(x.m)}</td>
            <td class="muted">${esc([x.syn, x.ant && '↔ ' + x.ant].filter(Boolean).join('  '))}</td>
            <td><button class="btn sm ghost" data-say="${i}" aria-label="${esc(x.w)} 발음">🔊</button></td></tr>`).join('')}
        </table>
        ${p.custom ? `<p class="tiny" style="margin-top:8px">사용자 지문은 어휘를 빈도·길이로 자동 추출합니다. 뜻을 입력하면 뜻 맞히기 문제에도 출제돼요. <a href="https://en.dict.naver.com/" target="_blank" rel="noopener">네이버 영어사전 열기</a></p>` : ''}
      </div>`;
    const flash = $('#flash');
    flash.onclick = () => flash.classList.toggle('flipped');
    $('#say').onclick = () => speak(v.w);
    const go = d => { flashIdx = (flashIdx + d + list.length) % list.length; vocabCards(pane, p, list); };
    $('#prev').onclick = () => go(-1); $('#next').onclick = () => go(1);
    $('#know').onclick = () => { markStudy(); save(); go(1); };
    $('#dunno').onclick = () => { wrongWord(v, 'cards'); toast(`'${v.w}'를 오답 노트에 담았어요.`); go(1); };
    $$('[data-say]', pane).forEach(b => b.onclick = () => speak(list[+b.dataset.say].w));
    $$('.mean', pane).forEach(inp => inp.onchange = () => { S.customMeanings[inp.dataset.w] = inp.value.trim(); save(); });
  }

  function vocabTest(pane, p, list) {
    const rounds = PASSAGES.map(x => x.id).concat(S.custom ? ['custom'] : []);
    const best = id => { const rs = S.results.filter(r => r.area === 'vocab' && r.pid === id && r.label === '단어 시험'); return rs.length ? Math.max(...rs.map(r => pct(r.score, r.total))) : null; };
    pane.innerHTML = `
      <div class="card" id="quizBox">
        <h3>${esc(passageLabel(p))} 단어 시험</h3>
        <p class="muted">뜻 고르기 · 단어 고르기 · 문맥 빈칸 세 가지 유형으로 10문제가 출제됩니다. 틀린 단어는 자동으로 오답 노트(AI 메모리)에 저장돼요.</p>
        <button class="btn primary" id="start">시험 시작</button>
      </div>
      <div class="card"><h3>회차별 기록</h3>
        <table class="list"><tr><th>회차</th><th>최고 점수</th><th>응시 횟수</th></tr>
        ${rounds.map(id => { const b = best(id); const n = S.results.filter(r => r.area === 'vocab' && r.pid === id && r.label === '단어 시험').length; return `<tr><td>${esc(passageLabel(passageById(id)))}</td><td>${b === null ? '<span class="tiny">미응시</span>' : `<span class="chip ${b >= 80 ? 'good' : b >= 50 ? 'warn' : 'bad'}">${b}점</span>`}</td><td>${n}</td></tr>`; }).join('')}
        </table></div>`;
    $('#start').onclick = () => {
      const pool = allVocab();
      const qs = shuffle(list).slice(0, 10).map(v => vocabQuestion(v, pool.filter(x => x.pid === v.pid).length >= 4 ? pool.filter(x => x.pid === v.pid) : pool)).filter(Boolean);
      if (!qs.length) { toast('사용자 지문은 단어 목록에서 뜻을 입력하거나 예문이 있어야 시험을 볼 수 있어요.'); return; }
      runQuiz($('#quizBox'), qs, {
        title: '단어 시험',
        onAnswer: (q, ok) => { if (!ok) wrongWord(q.v, 'test'); },
        onFinish: (r, n, wrongs, after) => {
          addResult('vocab', r, n, '단어 시험');
          after.innerHTML = `<button class="btn" id="again">다시 응시</button>${wrongs.length ? '<button class="btn primary" id="toReview">틀린 단어 바로 복습 →</button>' : ''}`;
          $('#again', after).onclick = () => vocab();
          if (wrongs.length) $('#toReview', after).onclick = () => { S.tab.vocab = 'review'; save(); vocab(); };
        }
      });
    };
  }

  function vocabReview(pane) {
    const all = Object.entries(S.wrongWords), due = dueWords();
    if (!all.length) { pane.innerHTML = `<div class="card empty">오답 노트가 비어 있어요. 단어 시험을 보거나 단어장에서 "몰라요"를 누르면 여기에 저장됩니다.<br><br>지금까지 숙달한 단어: <b>${S.mastered}</b>개</div>`; return; }
    pane.innerHTML = `
      <div class="card" id="revBox">
        <h3>AI 메모리 반복 숙달</h3>
        <p class="muted">틀린 단어는 <b>3번 연속</b> 맞힐 때까지 다시 출제됩니다. 맞힐 때마다 다음 복습까지 간격이 늘어나요(바로 → 1일 → 3일).</p>
        <div class="row"><button class="btn primary" id="revDue" ${due.length ? '' : 'disabled'}>오늘 복습할 단어 ${due.length}개 풀기</button>
        <button class="btn" id="revAll">전체 ${all.length}개 모두 풀기</button></div>
      </div>
      <div class="card"><h3>오답 단어 목록</h3>
        <table class="list"><tr><th>단어</th><th>뜻</th><th>틀린 횟수</th><th>숙달</th><th>다음 복습</th></tr>
        ${all.sort((a, b) => b[1].wrong - a[1].wrong).map(([, e]) => `<tr><td><b>${esc(e.w)}</b></td><td>${esc(e.m || '-')}</td><td>${e.wrong}</td>
          <td><span class="dots">${[0, 1, 2].map(i => `<i class="${i < e.streak ? 'on' : ''}"></i>`).join('')}</span></td>
          <td class="tiny">${(e.due || 0) <= Date.now() ? '<span class="chip warn">오늘</span>' : new Date(e.due).toLocaleDateString('ko')}</td></tr>`).join('')}
        </table></div>`;
    const start = entries => {
      const pool = allVocab();
      const qs = shuffle(entries).map(([k, e]) => {
        const v = pool.find(x => x.pid + ':' + x.w === k) || { w: e.w, m: e.m, pid: e.pid, pos: '', ex: '' };
        const q = vocabQuestion(v, pool); return q && { ...q, key: k };
      }).filter(Boolean);
      runQuiz($('#revBox'), qs, {
        title: '오답 복습',
        onAnswer: (q, ok) => reviewWord(q.key, ok) ? '<div class="tiny" style="margin-top:6px">🎉 3회 연속 정답! 이 단어는 숙달 완료되어 오답 노트에서 졸업했어요.</div>' : (ok ? `<div class="tiny" style="margin-top:6px">연속 정답 ${S.wrongWords[q.key] ? S.wrongWords[q.key].streak : MASTER} / ${MASTER}</div>` : ''),
        onFinish: (r, n, w, after) => { addResult('vocab', r, n, '오답 복습'); after.innerHTML = '<button class="btn primary" id="back">오답 목록 보기</button>'; $('#back', after).onclick = () => vocab(); }
      });
    };
    $('#revDue').onclick = () => start(due);
    $('#revAll').onclick = () => start(all);
  }

  function vocabAlarm(pane) {
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    pane.innerHTML = `
      <div class="card">
        <h3>🔔 시험 알림 서비스</h3>
        <p class="muted">매일 정한 시간에 단어 시험과 오답 복습을 알려 드려요. 앱이 열려 있으면 브라우저 알림이 뜨고, 캘린더에 등록하면 앱을 닫아도 휴대폰·PC 캘린더가 알려 줍니다.</p>
        <div class="row" style="margin:12px 0">
          <label class="row"><input type="checkbox" id="remOn" ${S.reminder.enabled ? 'checked' : ''}> 매일 알림 켜기</label>
          <input type="time" id="remTime" value="${esc(S.reminder.time)}">
          <span class="chip ${perm === 'granted' ? 'good' : 'warn'}">브라우저 알림: ${({ granted: '허용됨', denied: '차단됨', default: '미설정', unsupported: '미지원' })[perm]}</span>
        </div>
        <div class="row">
          <button class="btn" id="remTest">알림 테스트</button>
          <a class="btn primary" id="remGcal" href="${esc(gcalUrl())}" target="_blank" rel="noopener">📅 Google 캘린더에 매일 일정 추가</a>
          ${IN_ARTIFACT ? '' : '<button class="btn" id="remIcs">캘린더 파일 받기 (.ics)</button>'}
        </div>
        <p class="tiny" style="margin-top:12px">현재 복습 대기 중인 오답: 단어 ${dueWords().length}개 · 문법 ${Object.keys(S.wrongGrammar).length}개</p>
      </div>`;
    const ask = async () => { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); };
    $('#remOn').onchange = async e => { S.reminder.enabled = e.target.checked; save(); if (e.target.checked) { await ask(); toast(`매일 ${S.reminder.time}에 알려 드릴게요.`); } vocab(); };
    $('#remTime').onchange = e => { S.reminder.time = e.target.value; S.reminder.last = ''; save(); $('#remGcal').href = gcalUrl(); toast(`알림 시간: ${e.target.value}`); };
    $('#remTest').onclick = async () => { await ask(); notify(true); };
    const ics = $('#remIcs'); if (ics) ics.onclick = downloadIcs;
  }
  function gcalUrl() {
    const [h, m] = (S.reminder.time || '21:00').split(':');
    const s = new Date(); s.setHours(+h, +m, 0, 0);
    const e = new Date(s.getTime() + 20 * 60000);
    const f = x => String(x).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}${f(d.getMonth() + 1)}${f(d.getDate())}T${f(d.getHours())}${f(d.getMinutes())}00`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent('스키마 단어 시험 & 오답 복습')
      + '&details=' + encodeURIComponent('스키마 앱에서 오늘의 단어 시험과 오답 반복 숙달을 진행하세요.')
      + '&dates=' + fmt(s) + '/' + fmt(e) + '&ctz=' + encodeURIComponent(tz) + '&recur=' + encodeURIComponent('RRULE:FREQ=DAILY');
  }
  function notify(test) {
    const n = dueWords().length + Object.keys(S.wrongGrammar).length;
    const body = n ? `복습할 오답 ${n}개가 기다리고 있어요. 오늘의 단어 시험도 잊지 마세요!` : '오늘의 단어 시험을 볼 시간이에요!';
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('스키마 · 영어 학습 알림', { body }); } catch { toast(body); }
    } else toast((test ? '[테스트] ' : '') + body);
  }
  function downloadIcs() {
    const [h, m] = (S.reminder.time || '21:00').split(':');
    const d = new Date(); d.setHours(+h, +m, 0, 0);
    const f = x => String(x).padStart(2, '0');
    const dt = `${d.getFullYear()}${f(d.getMonth() + 1)}${f(d.getDate())}T${f(d.getHours())}${f(d.getMinutes())}00`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Schema English//KO', 'BEGIN:VEVENT', `UID:schema-${Date.now()}@schema.app`, `DTSTAMP:${stamp}`,
      `DTSTART:${dt}`, 'DURATION:PT20M', 'RRULE:FREQ=DAILY', 'SUMMARY:스키마 단어 시험 & 오답 복습',
      'DESCRIPTION:스키마 앱에서 오늘의 단어 시험과 오답 반복 숙달을 진행하세요.', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY',
      'DESCRIPTION:스키마 영어 학습 시간', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'schema-study-reminder.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  setInterval(() => {
    if (!S.reminder.enabled) return;
    const now = new Date(), hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (hm === S.reminder.time && S.reminder.last !== today()) { S.reminder.last = today(); save(); notify(); }
  }, 20000);

  // ======================================================
  // Listening
  // ======================================================
  let dictIdx = 0;
  function audioControls() {
    return `<div class="card flat row">
      <label class="range">속도 <input type="range" id="rate" min="0.5" max="1.5" step="0.1" value="${S.rate}"> <b id="rateV">${S.rate.toFixed(1)}x</b></label>
      ${voices.length ? `<label class="range">음성 <select id="voiceSel"><option value="">기본 (미국 영어)</option>${voices.map(v => `<option ${v.name === S.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>` : ''}
      ${TTS ? '' : '<span class="chip bad">이 브라우저는 음성 읽기(TTS)를 지원하지 않아요</span>'}
    </div>`;
  }
  function bindAudioControls() {
    const r = $('#rate'); if (r) r.oninput = () => { S.rate = +r.value; $('#rateV').textContent = S.rate.toFixed(1) + 'x'; save(); };
    const vs = $('#voiceSel'); if (vs) vs.onchange = () => { S.voice = vs.value; save(); };
  }
  function listening() {
    const p = passage();
    const t = tabs('listening', [['sent', '문장별 · 전체 듣기'], ['dict', '받아쓰기'], ['wrong', '틀린 단어 예문 듣기']]);
    view.innerHTML = head('Listening · 듣기', '듣기 학습', `${esc(passageLabel(p))} — 원어민 음성(TTS)으로 지문을 듣고 받아써 보세요.`) + audioControls() + t.html + '<div id="pane"></div>';
    bindAudioControls(); bindTabs('listening', listening);
    ({ sent: listenSentences, dict: listenDictation, wrong: listenWrong })[t.cur]($('#pane'), p);
  }

  function playSentenceList(rows, startAt = 0, loop = false) {
    stopAudio();
    const token = ttsToken;
    const playAt = i => {
      if (token !== ttsToken) return;
      if (i >= rows.length) { if (loop) return playAt(0); return; }
      rows.forEach(r => r.el.classList.remove('playing'));
      rows[i].el.classList.add('playing');
      rows[i].el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      speak(rows[i].text, { onend: () => setTimeout(() => { rows[i].el.classList.remove('playing'); playAt(i + 1); }, 350) });
    };
    playAt(startAt);
  }

  function listenSentences(pane, p) {
    const sents = sentences(p);
    pane.innerHTML = `
      <div class="card">
        <div class="row" style="margin-bottom:8px">
          <button class="btn primary" id="playAll">▶ 전체 듣기</button>
          <button class="btn" id="stop">■ 정지</button>
          <label class="row tiny"><input type="checkbox" id="loop"> 문장 반복 재생</label>
          <span class="spacer"></span>
          <label class="row tiny"><input type="checkbox" id="blind"> 블라인드 듣기 (영문 가리기)</label>
          ${p.custom ? '' : '<label class="row tiny"><input type="checkbox" id="showKo"> 해석 보기</label>'}
        </div>
        <div class="sent-list" id="sl">
          ${sents.map((s, i) => `<div class="sent" data-i="${i}">
            <button class="btn icon-btn" data-play="${i}" aria-label="${i + 1}번 문장 듣기">▶</button>
            <div class="body"><div class="en">${esc(s.en)}</div>${s.ko ? `<div class="ko hidden">${esc(s.ko)}</div>` : ''}</div>
          </div>`).join('')}
        </div>
      </div>`;
    const rows = $$('.sent', pane).map((el, i) => ({ el, text: sents[i].en }));
    $('#playAll').onclick = () => playSentenceList(rows, 0);
    $('#stop').onclick = stopAudio;
    $$('[data-play]', pane).forEach(b => b.onclick = () => {
      const i = +b.dataset.play;
      if ($('#loop').checked) {
        stopAudio(); const token = ttsToken;
        const rep = () => { if (token !== ttsToken) return; rows[i].el.classList.add('playing'); speak(rows[i].text, { onend: () => setTimeout(rep, 600) }); };
        rep();
      } else { stopAudio(); rows[i].el.classList.add('playing'); speak(rows[i].text, { onend: () => rows[i].el.classList.remove('playing') }); }
      markStudy(); save();
    });
    $('#blind').onchange = e => $$('.en', pane).forEach(x => x.classList.toggle('blur', e.target.checked));
    pane.addEventListener('click', e => { if (e.target.classList.contains('blur')) e.target.classList.remove('blur'); });
    const ko = $('#showKo'); if (ko) ko.onchange = e => $$('.ko', pane).forEach(x => x.classList.toggle('hidden', !e.target.checked));
  }

  function blanksFor(sentence, vocabList) {
    const words = sentence.match(/[A-Za-z][A-Za-z'-]*/g) || [];
    const vocabHits = words.filter(w => vocabList.some(v => wordRegex(v.w).test(w) && w.toLowerCase().startsWith(stem(v.w))));
    const pool = vocabHits.length ? vocabHits : words.filter(w => w.length >= 6 && !STOP.has(w.toLowerCase())).sort((a, b) => b.length - a.length);
    const chosen = [...new Set(pool)].slice(0, sentence.length > 110 ? 2 : 1);
    if (!chosen.length) { const longest = [...words].sort((a, b) => b.length - a.length)[0]; if (longest) chosen.push(longest); }
    return chosen;
  }
  function listenDictation(pane, p) {
    const sents = sentences(p), vl = vocabFor(p);
    dictIdx = Math.min(dictIdx, sents.length - 1);
    const s = sents[dictIdx], blanks = blanksFor(s.en, vl);
    let html = esc(s.en);
    blanks.forEach((w, i) => { html = html.replace(new RegExp('\\b' + w + '\\b'), `<input class="blank-input" data-b="${i}" autocomplete="off" spellcheck="false" aria-label="빈칸 ${i + 1}">`); });
    pane.innerHTML = `
      <div class="card">
        <div class="row"><span class="tiny">문장 ${dictIdx + 1} / ${sents.length}</span><span class="spacer"></span>
          <button class="btn primary" id="dPlay">▶ 듣기</button><button class="btn" id="dSlow">🐢 천천히</button></div>
        <p class="muted" style="margin-top:12px">음성을 듣고 빈칸에 들어갈 단어를 입력하세요.</p>
        <div class="en" style="line-height:2.2">${html}</div>
        ${s.ko ? `<div class="ko blur" title="눌러서 해석 보기" style="margin-top:8px">${esc(s.ko)}</div>` : ''}
        <div id="dRes"></div>
        <div class="row" style="margin-top:14px"><button class="btn" id="dPrev">← 이전</button><span class="spacer"></span>
          <button class="btn" id="dShow">정답 보기</button><button class="btn primary" id="dCheck">채점하기</button><button class="btn" id="dNext">다음 →</button></div>
      </div>`;
    $('#dPlay').onclick = () => { stopAudio(); speak(s.en); };
    $('#dSlow').onclick = () => { stopAudio(); speak(s.en, { rate: Math.max(0.5, S.rate - 0.3) }); };
    const ko = $('.ko.blur', pane); if (ko) ko.onclick = () => ko.classList.remove('blur');
    const inputs = $$('.blank-input', pane);
    inputs[0] && inputs[0].focus();
    inputs.forEach(inp => inp.onkeydown = e => { if (e.key === 'Enter') $('#dCheck').click(); });
    let checked = false;
    $('#dCheck').onclick = () => {
      let right = 0;
      inputs.forEach(inp => {
        const ans = blanks[+inp.dataset.b], ok = inp.value.trim().toLowerCase() === ans.toLowerCase();
        inp.classList.toggle('ok', ok); inp.classList.toggle('no', !ok);
        if (ok) right++;
        else if (!checked) {
          const v = vl.find(x => ans.toLowerCase().startsWith(stem(x.w)));
          wrongWord(v || { w: ans.toLowerCase(), m: '', pid: p.id }, 'listening');
        }
      });
      if (!checked) addResult('listening', right, inputs.length, '받아쓰기');
      checked = true;
      $('#dRes').innerHTML = `<div class="explain ${right === inputs.length ? '' : 'bad'}"><b>${right === inputs.length ? '완벽해요 ✓' : `${right} / ${inputs.length} 정답`}</b>
        ${right < inputs.length ? `<div>정답: ${blanks.map(b => `<b>${esc(b)}</b>`).join(', ')} — 틀린 단어는 오답 노트에 저장되어 '틀린 단어 예문 듣기'에서 다시 연습할 수 있어요.</div>` : ''}</div>`;
    };
    $('#dShow').onclick = () => inputs.forEach(inp => { inp.value = blanks[+inp.dataset.b]; });
    const go = d => { dictIdx = (dictIdx + d + sents.length) % sents.length; stopAudio(); listenDictation(pane, p); };
    $('#dPrev').onclick = () => go(-1); $('#dNext').onclick = () => go(1);
  }

  function listenWrong(pane) {
    const words = Object.values(S.wrongWords);
    if (!words.length) { pane.innerHTML = '<div class="card empty">아직 틀린 단어가 없어요. 단어 시험이나 받아쓰기에서 틀린 단어가 생기면, 그 단어가 들어간 예문을 모든 지문에서 찾아 들려드려요.</div>'; return; }
    const allS = PASSAGES.flatMap(p => sentences(p).map(s => ({ ...s, pid: p.id }))).concat(S.custom ? sentences(passageById('custom')).map(s => ({ ...s, pid: 'custom' })) : []);
    const groups = words.map(e => ({ e, ss: allS.filter(s => wordRegex(e.w).test(s.en)).slice(0, 3) })).filter(g => g.ss.length);
    pane.innerHTML = `
      <div class="card">
        <div class="row"><p class="muted" style="margin:0">내가 틀린 단어 ${words.length}개가 들어간 예문을 모든 지문에서 찾아 모았어요.</p><span class="spacer"></span>
        <button class="btn primary" id="wAll">▶ 모두 듣기</button><button class="btn" id="wStop">■ 정지</button></div>
      </div>
      ${groups.map(g => `<div class="card"><div class="row"><b class="en">${esc(g.e.w)}</b><span class="muted">${esc(g.e.m)}</span><span class="spacer"></span><span class="chip bad">틀린 횟수 ${g.e.wrong}</span></div>
        <div class="sent-list">${g.ss.map(s => `<div class="sent"><button class="btn icon-btn wplay" aria-label="예문 듣기">▶</button><div class="body"><div class="en">${vocabHtml(s.en, [g.e])}</div>${s.ko ? `<div class="ko">${esc(s.ko)}</div>` : ''}<div class="tiny">${esc(passageLabel(passageById(s.pid)))}</div></div></div>`).join('')}</div></div>`).join('')}`;
    const rows = $$('.sent', pane).map(el => ({ el, text: $('.en', el).textContent }));
    $$('.wplay', pane).forEach((b, i) => b.onclick = () => playSentenceList([rows[i]]));
    $('#wAll').onclick = () => playSentenceList(rows);
    $('#wStop').onclick = stopAudio;
  }

  // ======================================================
  // Speaking
  // ======================================================
  let shadowIdx = 0, chat = null, capture = null;
  function speaking() {
    const p = passage();
    const t = tabs('speaking', [['shadow', '따라 읽기 · 발음 점수'], ['chat', 'AI 대화 튜터'], ['rec', `내 녹음 다시 듣기 (${recordings.length})`]]);
    view.innerHTML = head('Speaking · 말하기', '말하기 학습', `${esc(passageLabel(p))} — 예문을 따라 읽으면 AI가 점수를 매기고, 지문 주제로 영어 대화를 연습해요.`) + t.html + '<div id="pane"></div>';
    bindTabs('speaking', speaking);
    ({ shadow: speakShadow, chat: speakChat, rec: speakRecs })[t.cur]($('#pane'), p);
  }
  const srNote = () => IN_ARTIFACT ? `<div class="explain bad" style="margin-bottom:12px">${esc(MIC_BLOCKED)}</div>` : SR ? '' : '<div class="explain bad" style="margin-bottom:12px">이 브라우저는 음성 인식을 지원하지 않아 점수를 매길 수 없어요. <b>Chrome 또는 Edge</b>에서 열면 발음 점수 기능을 쓸 수 있습니다. (녹음·다시 듣기는 가능)</div>';

  function speakShadow(pane, p) {
    const sents = sentences(p).filter(s => s.en.split(' ').length <= 32);
    shadowIdx = Math.min(shadowIdx, sents.length - 1);
    const s = sents[shadowIdx];
    pane.innerHTML = `${srNote()}
      <div class="card">
        <div class="row"><span class="tiny">예문 ${shadowIdx + 1} / ${sents.length}</span><span class="spacer"></span>
          <button class="btn" id="sPrev">←</button><button class="btn" id="sNext">→</button></div>
        <div class="en" style="font-size:1.25rem;margin:14px 0 6px">${esc(s.en)}</div>
        ${s.ko ? `<div class="ko">${esc(s.ko)}</div>` : ''}
        <div class="row" style="margin-top:16px">
          <button class="btn" id="sListen">🔊 원어민 듣기</button>
          <button class="btn primary" id="sRec">● 녹음하고 점수 받기</button>
        </div>
        <div id="sRes"></div>
      </div>
      <div class="card flat"><h3>점수 기준</h3><p class="tiny" style="margin:0">음성 인식으로 받아 적은 내 문장을 원문과 단어 단위로 비교합니다. 정확히 인식된 단어 비율이 점수예요. 90점 이상 원어민 수준 · 70점 이상 양호 · 그 아래는 빨간 단어를 다시 연습해 보세요.</p></div>`;
    const go = d => { shadowIdx = (shadowIdx + d + sents.length) % sents.length; stopAudio(); speakShadow(pane, p); };
    $('#sPrev').onclick = () => go(-1); $('#sNext').onclick = () => go(1);
    $('#sListen').onclick = () => { stopAudio(); speak(s.en); };
    const btn = $('#sRec');
    btn.onclick = async () => {
      if (capture) { capture.stop(); return; }
      stopAudio();
      btn.classList.add('rec'); btn.textContent = '■ 녹음 중… (말하고 나서 누르세요)';
      capture = await startCapture(res => {
        capture = null; btn.classList.remove('rec'); btn.textContent = '● 다시 녹음하기';
        if (!res.error && !res.url && /not-allowed|service-not-allowed|audio-capture/.test(res.srError || '')) res.error = MIC_BLOCKED;
        if (res.error) { $('#sRes').innerHTML = `<div class="explain bad">${esc(res.error)}</div>`; return; }
        let html = '';
        if (SR) {
          const m = matchWords(s.en, res.transcript || '');
          const msg = m.score >= 90 ? '원어민 수준이에요! 🎉' : m.score >= 70 ? '좋아요! 빨간 단어만 다시 연습해 볼까요?' : '빨간 단어에 집중해서 원어민 음성을 다시 듣고 따라 해 보세요.';
          html += `<div class="row" style="align-items:flex-end;gap:16px;margin-top:16px"><div><div class="tiny">발음 점수</div><div class="score-big">${m.score}</div></div><div class="muted">${msg}</div></div>
            <div class="word-diff" style="margin-top:10px">${m.words.map((w, i) => `<span class="${m.ok[i] ? 'ok' : 'miss'}">${esc(w)}</span>`).join('')}</div>
            <p class="tiny" style="margin-top:6px">인식된 문장: "${esc(res.transcript || '(인식된 음성이 없어요)')}"${res.srError ? ` · 오류: ${esc(res.srError)}` : ''}</p>`;
          addResult('speaking', m.score, 100, '따라 읽기');
          recordings.unshift({ url: res.url, text: s.en, score: m.score, time: new Date() });
        } else recordings.unshift({ url: res.url, text: s.en, score: null, time: new Date() });
        if (res.url) html += `<div class="row" style="margin-top:10px"><span class="tiny">내 녹음</span><audio controls src="${res.url}"></audio></div>`;
        $('#sRes').innerHTML = html;
      });
      if (!capture) { btn.classList.remove('rec'); btn.textContent = '● 녹음하고 점수 받기'; }
    };
  }

  function speakRecs(pane) {
    if (!recordings.length) { pane.innerHTML = '<div class="card empty">아직 녹음이 없어요. \'따라 읽기\'에서 녹음하면 여기서 원어민 음성과 내 녹음을 번갈아 들어 볼 수 있어요.<br><span class="tiny">녹음은 개인정보 보호를 위해 이 화면을 새로고침하면 사라집니다.</span></div>'; return; }
    pane.innerHTML = `<div class="card"><table class="list"><tr><th>문장</th><th>점수</th><th>원어민</th><th>내 녹음</th></tr>
      ${recordings.map((r, i) => `<tr><td class="en" style="font-size:.95rem">${esc(r.text)}<div class="tiny">${r.time.toLocaleTimeString('ko')}</div></td>
        <td>${r.score === null ? '-' : `<span class="chip ${r.score >= 90 ? 'good' : r.score >= 70 ? 'warn' : 'bad'}">${r.score}</span>`}</td>
        <td><button class="btn sm" data-n="${i}">🔊</button></td><td>${r.url ? `<audio controls src="${r.url}" style="max-width:220px"></audio>` : '<span class="tiny">녹음 없음</span>'}</td></tr>`).join('')}
    </table></div>`;
    $$('[data-n]', pane).forEach(b => b.onclick = () => { stopAudio(); speak(recordings[+b.dataset.n].text); });
  }

  // 규칙 기반 AI 튜터 피드백
  const CONNECTORS = ['because', 'however', 'for example', 'for instance', 'therefore', 'also', 'in addition', 'first', 'second', 'finally', 'although', 'so', 'but', 'in my opinion', 'i think', 'i believe'];
  function analyzeAnswer(ans, keys) {
    const words = normWords(ans), low = ' ' + words.join(' ') + ' ';
    const hit = [...new Set(keys.filter(k => words.some(w => w.startsWith(k.toLowerCase()))))];
    const conns = CONNECTORS.filter(c => low.includes(' ' + c + ' '));
    const issues = [];
    if (/(^|\s)i(\s|')/.test(ans)) issues.push(['대문자', '1인칭 대명사 <b>i</b>는 항상 대문자 <b>I</b>로 써요.']);
    if (ans && /^[a-z]/.test(ans.trim())) issues.push(['대문자', '문장은 대문자로 시작해요.']);
    if (/\b(he|she|it)\s+don't\b/i.test(ans)) issues.push(['수 일치', '3인칭 단수 주어 뒤에는 <b>doesn\'t</b>를 써요.']);
    if (/\b(he|she|it)\s+(have|do|go|make|think|want)\b/i.test(ans)) issues.push(['수 일치', '3인칭 단수 주어 뒤 동사에는 <b>-s</b>를 붙여요. (예: he thinks)']);
    if (/\bpeople\s+(is|was|has)\b/i.test(ans)) issues.push(['수 일치', '<b>people</b>은 복수예요 → people are / were / have']);
    if (/\bmore\s+\w+er\b/i.test(ans)) issues.push(['비교급', '<b>more + -er</b>을 겹쳐 쓰지 않아요. (more better → better)']);
    if (/\ba\s+[aeiou]\w+/i.test(ans) && !/\ba\s+(uni|use|one|eu)/i.test(ans)) issues.push(['관사', '모음 소리 앞에서는 <b>an</b>을 써요. (an idea, an artist)']);
    if (/\bdiscuss about\b/i.test(ans)) issues.push(['어법', '<b>discuss</b>는 타동사라 about 없이 써요.']);
    if (ans && !/[.!?]$/.test(ans.trim())) issues.push(['문장 부호', '문장 끝에 마침표를 찍어 주세요.']);
    const lenScore = Math.min(40, words.length * 2);
    const keyScore = Math.min(30, hit.length * 10);
    const conScore = Math.min(15, conns.length * 8);
    const mech = Math.max(0, 15 - issues.length * 5);
    return { words, hit, conns, issues, score: lenScore + keyScore + conScore + mech };
  }
  function speakChat(pane, p) {
    const qs = contentFor(p).speaking;
    if (!chat || chat.pid !== p.id) chat = { pid: p.id, qi: 0, log: [{ ai: true, html: `Hi! I'm your Schema AI tutor. 😊 Let's talk about <b>${esc(p.title)}</b>.<br><br><b>Q1.</b> ${esc(qs[0].q)}` }], scores: [] };
    const done = chat.qi >= qs.length;
    pane.innerHTML = `${SR ? '' : '<p class="tiny">이 브라우저는 음성 입력을 지원하지 않아요. 답을 직접 입력해 주세요.</p>'}
      <div class="card">
        <div class="chat" id="chatLog">${chat.log.map(m => `<div class="msg ${m.ai ? 'ai' : 'me'}">${m.html}</div>`).join('')}</div>
        <div class="chat-input">
          ${SR ? '<button class="btn icon-btn" id="mic" aria-label="음성으로 답하기" title="음성으로 답하기">🎤</button>' : ''}
          <input type="text" id="ans" placeholder="${done ? '대화가 끝났어요. 다시 시작해 보세요.' : 'Type your answer in English...'}" ${done ? 'disabled' : ''}>
          <button class="btn primary" id="send" ${done ? 'disabled' : ''}>보내기</button>
        </div>
        <div class="row" style="margin-top:10px"><button class="btn sm" id="restart">↺ 처음부터</button>
          <button class="btn sm" id="hint">💡 답변 틀 보기</button><span class="spacer"></span>
          <button class="btn sm" id="copyPrompt" title="ChatGPT·Claude·Gemini 등 무료 생성형 AI에 붙여넣어 더 자세한 피드백을 받을 수 있어요">📋 생성형 AI 피드백 프롬프트 복사</button></div>
      </div>
      <p class="tiny">${aiBtnAvailable() ? '✨ 답변을 보내면 점수 피드백과 함께 Claude 튜터가 문장을 직접 첨삭해 줘요. (처음 한 번은 AI 사용 허용을 묻는 창이 떠요)' : '이 튜터는 오프라인에서도 동작하는 규칙 기반 AI예요. 답변 길이 · 지문 핵심어 사용 · 연결어 · 기본 어법을 확인해 피드백합니다. 더 깊은 교정이 필요하면 프롬프트를 복사해 생성형 AI에 물어보세요.'}</p>`;
    const log = $('#chatLog'); log.scrollTop = log.scrollHeight;
    const send = () => {
      const inp = $('#ans'), ans = inp.value.trim();
      if (!ans || chat.qi >= qs.length) return;
      const q = qs[chat.qi], a = analyzeAnswer(ans, q.keys);
      chat.log.push({ ai: false, html: esc(ans) });
      chat.scores.push(a.score);
      const praise = a.score >= 80 ? 'Excellent answer! 👏' : a.score >= 55 ? 'Good job! 👍' : 'Nice try! Let\'s make it a bit richer. 💪';
      const tips = [];
      if (a.words.length < 12) tips.push('답변이 짧아요. <b>이유(because ~)</b>나 <b>예시(For example, ~)</b>를 한 문장 더 붙여 보세요.');
      if (!a.hit.length) tips.push(`지문의 핵심어를 활용해 보세요: ${q.keys.slice(0, 5).map(k => `<i>${esc(k)}</i>`).join(', ')}`);
      if (!a.conns.length) tips.push('연결어(because, however, for example 등)를 쓰면 더 논리적으로 들려요.');
      a.issues.forEach(([k, m]) => tips.push(`[${k}] ${m}`));
      const good = [];
      if (a.hit.length) good.push(`지문 핵심어 사용: ${a.hit.map(esc).join(', ')}`);
      if (a.conns.length) good.push(`연결어 사용: ${a.conns.map(esc).join(', ')}`);
      if (a.words.length >= 20) good.push(`충분한 길이 (${a.words.length}단어)`);
      chat.qi++;
      const next = chat.qi < qs.length ? `<br><br><b>Q${chat.qi + 1}.</b> ${esc(qs[chat.qi].q)}` : `<br><br>That's all for today! 평균 말하기 점수는 <b>${Math.round(chat.scores.reduce((x, y) => x + y, 0) / chat.scores.length)}점</b>이에요. Great work! 🎉`;
      chat.log.push({ ai: true, html: `${praise} <span class="chip ${a.score >= 80 ? 'good' : a.score >= 55 ? 'warn' : 'bad'}">${a.score}점</span>
        <div class="fb">${good.length ? `<b>잘한 점</b><ul>${good.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}${tips.length ? `<b>더 좋아지려면</b><ul>${tips.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}</div>${next}` });
      addResult('speaking', a.score, 100, 'AI 대화');
      if (aiBtnAvailable()) {
        const myChat = chat;
        const entry = { ai: true, html: '<span class="tiny">✨ Claude 튜터가 답변을 첨삭하고 있어요…</span>' };
        chat.log.splice(chat.log.length - 1, 0, entry);
        const passageText = sentences(p).map(s => s.en).join(' ').slice(0, 2500);
        ai(`너는 한국 대학생을 가르치는 친절한 영어 말하기 튜터야.\n지문 제목: ${p.title}\n지문(일부): ${passageText}\n\n질문: ${q.q}\n학생 답변: ${ans}\n\n한국어로 짧게 첨삭해 줘(120단어 이내, 마크다운 기호 없이 일반 텍스트):\n1) 교정한 영어 문장 (틀린 곳이 없으면 그대로)\n2) 더 자연스러운 표현 1~2개\n3) 내용에 대한 한 줄 조언`, { o: { modelTier: 'quick' } })
          .then(r => { entry.html = `<b>✨ Claude 튜터 첨삭</b><div style="white-space:pre-wrap;margin-top:4px">${esc(r.text)}</div>`; })
          .catch(e => { entry.html = `<span class="tiny">${esc(e.code === 'unavailable' ? 'AI 첨삭은 claude.ai 웹 버전에서만 쓸 수 있어요.' : aiErrMsg(e))}</span>`; })
          .finally(() => { if (chat === myChat && pane.isConnected) { speakChat(pane, p); } });
      }
      speakChat(pane, p);
      if (chat.qi < qs.length) { $('#ans').focus(); speak(qs[chat.qi].q); }
    };
    if (!done) { $('#send').onclick = send; $('#ans').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) send(); }; }
    $('#restart').onclick = () => { chat = null; speakChat(pane, p); };
    $('#hint').onclick = () => toast('In my opinion, ___ because ___. For example, ___. So I think ___.');
    $('#copyPrompt').onclick = () => {
      const mine = chat.log.filter(m => !m.ai).map((m, i) => `Q${i + 1}. ${qs[i] ? qs[i].q : ''}\nMy answer: ${m.html.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')}`).join('\n\n');
      const prompt = `너는 대학생 영어 말하기 튜터야. 아래는 내가 "${p.title}" 지문을 읽고 한 영어 답변이야.\n각 답변의 문법 오류를 고쳐 주고, 더 자연스러운 표현과 모범 답안을 제시해 줘. 설명은 한국어로 해 줘.\n\n${mine || '(아직 답변이 없어요)'}`;
      copyText(prompt);
    };
    const mic = $('#mic');
    if (mic && !done) mic.onclick = async () => {
      if (capture) { capture.stop(); return; }
      mic.classList.add('rec'); mic.textContent = '■';
      capture = await startCapture(res => {
        capture = null; mic.classList.remove('rec'); mic.textContent = '🎤';
        if (res.transcript) { const inp = $('#ans'); inp.value = (inp.value + ' ' + res.transcript).trim(); inp.focus(); }
        else toast(res.error || '음성이 인식되지 않았어요. 다시 시도해 주세요.');
      }, { continuous: true });
      if (!capture) { mic.classList.remove('rec'); mic.textContent = '🎤'; }
    };
  }
  // ---------- 진짜 AI (claude.ai 웹 버전에서 Claude 연결) ----------
  let aiFn = null;
  const aiReady = (async () => {
    try { if (window.claude && window.claude.use) aiFn = await window.claude.use('sample'); } catch { aiFn = null; }
    return aiFn;
  })();
  const AI_ERR = {
    not_granted: 'AI 사용이 허용되지 않았어요. 페이지를 새로고침하고 허용을 누르면 쓸 수 있어요.',
    sampling_disabled: '이 계정에서는 AI를 쓸 수 없어요.',
    rate_limited: 'AI 요청이 너무 많아요. 잠시 후 다시 눌러 주세요.',
    session_expired: 'claude.ai에 다시 로그인해 주세요.',
    refused: 'AI가 이 요청에 답하지 않았어요. 내용을 바꿔 다시 시도해 주세요.',
    invalid_json: 'AI 답변 형식이 올바르지 않았어요. 한 번 더 눌러 주세요.',
    prompt_too_large: '지문이 너무 길어요. 조금 줄여서 다시 시도해 주세요.'
  };
  const aiErrMsg = e => (e && AI_ERR[e.code]) || 'AI 연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
  async function ai(prompt, opts = {}) {
    const f = await aiReady;
    if (!f) throw { code: 'unavailable' };
    return opts.json ? f.json(prompt, { cache: false, ...opts.o }) : f(prompt, { cache: false, ...opts.o });
  }
  const AI_NOTE = '<span class="chip good">✨ Claude AI 연결됨</span>';
  const aiBtnAvailable = () => IN_ARTIFACT;

  function copyText(t) {
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      () => toast('프롬프트를 복사했어요. ChatGPT · Claude · Gemini에 붙여넣어 보세요.'),
      () => {
        const ta = $('#gPrompt');
        if (ta && ta.value === t) { ta.focus(); ta.select(); toast('자동 복사가 막혀 있어요. 선택된 텍스트를 Ctrl+C로 복사해 주세요.'); }
        else toast('자동 복사가 막혀 있어요. 텍스트를 직접 선택해서 복사해 주세요.');
      }
    );
  }

  // ======================================================
  // Grammar
  // ======================================================
  let gFilter = '';
  function grammar() {
    const p = passage();
    const t = tabs('grammar', [['find', '지문 속 문법 찾기'], ['quiz', '문법 문제'], ['weak', `약점 문법 집중 (${Object.keys(S.wrongGrammar).length})`]]);
    view.innerHTML = head('Grammar · 문법', '문법 학습', `${esc(passageLabel(p))} — 독해 핵심 문법인 5형식 · 동사(일치 · 시제 · 태) · 준동사를 지문 속에서 찾아요.`) + t.html + '<div id="pane"></div>';
    bindTabs('grammar', grammar);
    ({ find: grammarFind, quiz: grammarQuiz, weak: grammarWeak })[t.cur]($('#pane'), p);
  }
  function grammarFind(pane, p) {
    const sents = sentences(p);
    const counts = {}; sents.forEach(s => grammarCats(s.en).forEach(c => counts[c] = (counts[c] || 0) + 1));
    pane.innerHTML = `
      <div class="card flat">
        <div class="legend">
          <button class="chip ${gFilter ? '' : 'on'}" data-f="">전체</button>
          ${Object.entries(GRAMMAR_CATS).map(([k, c]) => `<button class="chip ${gFilter === k ? 'on' : ''}" data-f="${k}"><mark class="g g-${k}" style="padding:0 4px">${esc(c.name)}</mark> ${counts[k] || 0}</button>`).join('')}
        </div>
        ${gFilter ? `<div class="explain" style="margin-top:12px"><b>${esc(GRAMMAR_CATS[gFilter].name)}</b><div>${esc(GRAMMAR_CATS[gFilter].desc)}</div></div>` : '<p class="tiny" style="margin:10px 0 0">색칠된 부분은 문법 패턴을 자동 탐지한 결과예요(참고용). 문장을 누르면 설명과 구조 분석을 볼 수 있어요.</p>'}
      </div>
      <div class="card"><div class="sent-list">
        ${sents.map((s, i) => ({ s, i, cats: grammarCats(s.en) })).filter(x => !gFilter || x.cats.includes(gFilter)).map(({ s, i, cats }) => `
          <div class="sent" data-i="${i}" style="cursor:pointer"><span class="num">${i + 1}</span><div class="body">
            <div class="en">${grammarHtml(s.en, gFilter)}</div>
            <div class="detail hidden">
              ${s.st ? `<div><b>구조</b> ${esc(s.st)}</div>` : ''}
              ${cats.length ? cats.map(c => `<div><b>${esc(GRAMMAR_CATS[c].name)}</b> ${esc(GRAMMAR_CATS[c].desc)}</div>`).join('') : '<div class="tiny">탐지된 문법 패턴이 없어요.</div>'}
              ${s.ko ? `<div style="margin-top:6px"><b>해석</b> ${esc(s.ko)}</div>` : ''}
            </div></div></div>`).join('') || '<div class="empty">이 문법이 쓰인 문장을 찾지 못했어요.</div>'}
      </div></div>`;
    $$('[data-f]', pane).forEach(b => b.onclick = () => { gFilter = b.dataset.f; grammarFind(pane, p); });
    $$('.sent', pane).forEach(el => el.onclick = () => $('.detail', el).classList.toggle('hidden'));
  }
  function grammarQuiz(pane, p) {
    const ids = grammarIds(p.id);
    pane.innerHTML = `<div class="card" id="gBox">
      <h3>${esc(passageLabel(p))} 문법 문제 ${ids.length}개</h3>
      <p class="muted">${p.custom ? '사용자 지문은 문법 문제 은행에서 출제됩니다.' : '지문에 실제로 나온 문장으로 만든 문제예요.'} 문제마다 정답 이유와 오답 해설을 보여 드리고, 틀린 문제는 AI 메모리에 저장돼 '약점 문법 집중'에서 다시 나와요.</p>
      <button class="btn primary" id="gStart">문제 풀기</button></div>`;
    $('#gStart').onclick = () => runQuiz($('#gBox'), ids.map(grammarQ).map(toGrammarQuiz), {
      title: '문법', onAnswer: recordGrammar,
      onFinish: (r, n, w, after) => { addResult('grammar', r, n, '문법 문제'); after.innerHTML = `<button class="btn" id="ga">다시 풀기</button>${w.length ? '<button class="btn primary" id="gw">약점 문법 집중 →</button>' : ''}`; $('#ga', after).onclick = () => grammar(); if (w.length) $('#gw', after).onclick = () => { S.tab.grammar = 'weak'; save(); grammar(); }; }
    });
  }
  function weakCats() {
    return Object.entries(S.gStats).map(([cat, g]) => ({ cat, r: g.r, w: g.w, acc: pct(g.r, g.r + g.w) }))
      .filter(x => x.w > 0).sort((a, b) => a.acc - b.acc || b.w - a.w);
  }
  function grammarWeak(pane) {
    const weak = weakCats(), wrongIds = Object.keys(S.wrongGrammar);
    if (!weak.length && !wrongIds.length) { pane.innerHTML = '<div class="card empty">아직 틀린 문법이 없어요. \'문법 문제\'를 풀면 자주 틀리는 문법을 분석해서 맞춤 문제를 자동으로 만들어 드려요.</div>'; return; }
    const top = weak.slice(0, 3).map(x => x.cat);
    const exSents = top.length ? PASSAGES.flatMap(p => sentences(p).map(s => ({ ...s, pid: p.id }))).filter(s => grammarCats(s.en).includes(top[0])).slice(0, 4) : [];
    pane.innerHTML = `
      <div class="grid g2">
        <div class="card"><h3>문법별 정답률</h3><div class="bars">
          ${Object.entries(S.gStats).sort((a, b) => pct(a[1].r, a[1].r + a[1].w) - pct(b[1].r, b[1].r + b[1].w)).map(([c, g]) => { const a = pct(g.r, g.r + g.w); return `<div class="bar-row"><span>${esc(GRAMMAR_CATS[c].name)}</span><span class="bar"><i class="${a < 50 ? 'low' : a < 80 ? 'mid' : ''}" style="width:${a}%"></i></span><span class="n">${a}% (${g.r}/${g.r + g.w})</span></div>`; }).join('')}
        </div></div>
        <div class="card" id="wBox"><h3>AI 맞춤 문제 자동 생성</h3>
          <p class="muted">지속적으로 틀리는 문법: ${top.map(c => `<span class="chip bad">${esc(GRAMMAR_CATS[c].name)}</span>`).join(' ') || '-'}</p>
          <p class="tiny">내가 틀린 문제 ${wrongIds.length}개 + 약점 문법의 새 문제를 섞어 출제해요. 틀렸던 문제를 2번 연속 맞히면 오답 노트에서 졸업합니다.</p>
          <div class="row"><button class="btn primary" id="wStart">맞춤 문제 풀기</button>
          ${aiBtnAvailable() ? '<button class="btn" id="wAi">✨ AI로 약점 문법 새 문제 만들기</button>' : ''}</div>
          <div id="wAiMsg" class="tiny" style="margin-top:8px"></div></div>
      </div>
      ${exSents.length ? `<div class="card"><h3>지문 속 '${esc(GRAMMAR_CATS[top[0]].name)}' 예문</h3><p class="tiny">${esc(GRAMMAR_CATS[top[0]].desc)}</p><div class="sent-list">${exSents.map(s => `<div class="sent"><div class="body"><div class="en">${grammarHtml(s.en, top[0])}</div><div class="ko">${esc(s.ko)}</div></div></div>`).join('')}</div></div>` : ''}`;
    $('#wStart').onclick = () => {
      const allIds = [...PASSAGES.flatMap(p => grammarIds(p.id)), ...GRAMMAR_BANK.map((_, i) => `bank:${i}`)];
      const extra = shuffle(allIds.filter(id => !S.wrongGrammar[id] && top.includes(grammarQ(id).cat))).slice(0, Math.max(3, 8 - wrongIds.length));
      const ids = shuffle([...wrongIds, ...extra]).slice(0, 10);
      runQuiz($('#wBox'), ids.map(grammarQ).filter(Boolean).map(toGrammarQuiz), {
        title: '약점 집중', onAnswer: recordGrammar,
        onFinish: (r, n, w, after) => { addResult('grammar', r, n, '약점 문법'); after.innerHTML = '<button class="btn primary" id="wb">분석 다시 보기</button>'; $('#wb', after).onclick = () => grammar(); }
      });
    };
    const wAi = $('#wAi');
    if (wAi) wAi.onclick = async () => {
      const cats = top.length ? top : Object.keys(S.wrongGrammar).map(id => S.wrongGrammar[id].cat).slice(0, 3);
      const catList = [...new Set(cats)].map(c => `${c} (${GRAMMAR_CATS[c].name}: ${GRAMMAR_CATS[c].desc})`).join('\n');
      wAi.disabled = true; $('#wAiMsg').textContent = '✨ Claude가 내 약점 문법으로 새 문제를 만들고 있어요… (10~30초)';
      try {
        const arr = await ai(`한국 대학생을 위한 영어 문법 객관식 문제 5개를 만들어 줘. 학생이 자주 틀리는 문법:\n${catList}\n\n규칙:\n- 각 문제는 영어 문장 하나에 빈칸 ___ 하나.\n- 보기는 정확히 4개, 정답은 하나뿐이어야 함.\n- 해설(ex)은 한국어로, 왜 정답인지와 오답이 왜 틀렸는지 1~2문장.\n- cat 값은 위 목록의 영문 키 중 하나.\n\n다른 말 없이 JSON 배열만 출력: [{"cat":"voice","s":"The bridge ___ in 1990.","o":["was built","built","has built","was building"],"a":0,"ex":"..."}]`, { json: true });
        const valid = (Array.isArray(arr) ? arr : []).filter(q => q && GRAMMAR_CATS[q.cat] && typeof q.s === 'string' && q.s.includes('___') && Array.isArray(q.o) && q.o.length === 4 && Number.isInteger(q.a) && q.a >= 0 && q.a < 4)
          .map(q => ({ cat: q.cat, s: q.s, o: q.o.map(String), a: q.a, ex: String(q.ex || '') }));
        if (!valid.length) throw { code: 'invalid_json' };
        S.aiGrammar = (S.aiGrammar || []).concat(valid).slice(-60); save();
        const start = S.aiGrammar.length - valid.length;
        runQuiz($('#wBox'), valid.map((_, i) => toGrammarQuiz(grammarQ(`ai:${start + i}`))), {
          title: 'AI 생성 문제', onAnswer: recordGrammar,
          onFinish: (r, n, w, after) => { addResult('grammar', r, n, 'AI 문법 문제'); after.innerHTML = '<button class="btn primary" id="wb2">분석 다시 보기</button>'; $('#wb2', after).onclick = () => grammar(); }
        });
      } catch (e) { $('#wAiMsg').textContent = aiErrMsg(e); wAi.disabled = false; }
    };
  }

  // ======================================================
  // Reading
  // ======================================================
  function reading() {
    const p = passage();
    const t = tabs('reading', [['sent', '문장별 해석 · 구문 분석'], ['quiz', '독해 문제'], ['gen', '맞춤 지문 생성']]);
    view.innerHTML = head('Reading · 독해', '독해 학습', `${esc(passageLabel(p))} — 문장별로 해석과 구문을 확인하고 주제 · 내용 일치 · 추론 문제를 풀어요.`) + t.html + '<div id="pane"></div>';
    bindTabs('reading', reading);
    ({ sent: readSentences, quiz: readQuiz, gen: readGen })[t.cur]($('#pane'), p);
  }
  function readSentences(pane, p) {
    const sents = sentences(p), vl = vocabFor(p);
    const avg = Math.round(sents.reduce((a, s) => a + s.en.split(/\s+/).length, 0) / sents.length);
    const heads = p.items.filter(x => x.h);
    let n = 0;
    pane.innerHTML = `
      <div class="grid g3 stats">
        <div class="card stat"><div class="v">${sents.length}</div><div class="l">문장 수</div></div>
        <div class="card stat"><div class="v">${avg}</div><div class="l">문장당 평균 단어</div></div>
        <div class="card stat"><div class="v">${avg >= 22 ? '상' : avg >= 15 ? '중' : '하'}</div><div class="l">추정 난이도</div></div>
      </div>
      ${p.custom && aiBtnAvailable() && sents.some(s => !s.ko) ? `<div class="card flat row"><span>이 지문은 해석이 아직 없어요.</span><span class="spacer"></span><span id="trMsg" class="tiny"></span><button class="btn primary" id="aiTr">✨ AI 해석 · 구문 분석 받기</button></div>` : ''}
      ${heads.length ? `<div class="card"><h3>글의 흐름</h3><div class="row" style="gap:6px">${heads.map((h, i) => `${i ? '<span class="tiny">→</span>' : ''}<span class="chip">${esc(h.h)}${h.hk ? ` <small>${esc(h.hk)}</small>` : ''}</span>`).join('')}</div></div>` : ''}
      <div class="card">
        <div class="row" style="margin-bottom:6px"><label class="row tiny"><input type="checkbox" id="allKo"> 해석 · 구문 모두 펼치기</label><span class="spacer"></span><span class="tiny"><mark class="w">노란 단어</mark> = 핵심 어휘 (마우스를 올리면 뜻)</span></div>
        <div class="sent-list">
          ${p.items.map(it => {
            if (it.h) return `<div class="sent-head">${esc(it.h)}${it.hk ? `<small>${esc(it.hk)}</small>` : ''}</div>`;
            const i = n++, cats = grammarCats(it.en);
            return `<div class="sent"><span class="num">${i + 1}</span><div class="body">
              <div class="en">${vocabHtml(it.en, vl)}</div>
              <div class="row" style="margin-top:4px"><button class="btn sm ghost tog">해석 · 구문 ▾</button><button class="btn sm ghost say" data-i="${i}">🔊</button></div>
              <div class="detail hidden">
                ${it.ko ? `<div><b>해석</b> ${esc(it.ko)}</div>` : '<div class="tiny">사용자 지문은 해석이 제공되지 않아요. 생성형 AI 프롬프트로 해석을 요청해 보세요.</div>'}
                ${it.st ? `<div><b>구조</b> ${esc(it.st)}</div>` : cats.length ? `<div><b>구문 포인트</b> ${cats.map(c => esc(GRAMMAR_CATS[c].name)).join(' · ')}</div>` : ''}
                ${it.vo ? `<div><b>어휘</b> ${esc(it.vo)}</div>` : ''}
              </div></div></div>`;
          }).join('')}
        </div>
      </div>`;
    $$('.tog', pane).forEach(b => b.onclick = () => b.closest('.body').querySelector('.detail').classList.toggle('hidden'));
    $$('.say', pane).forEach(b => b.onclick = () => { stopAudio(); speak(sents[+b.dataset.i].en); });
    $('#allKo').onchange = e => { $$('.detail', pane).forEach(d => d.classList.toggle('hidden', !e.target.checked)); markStudy(); save(); };
    const tr = $('#aiTr');
    if (tr) tr.onclick = async () => {
      tr.disabled = true; $('#trMsg').textContent = '✨ Claude가 문장별로 해석하고 있어요…';
      try {
        const list = sents.slice(0, 40).map((s, i) => `${i}. ${s.en}`).join('\n');
        const arr = await ai(`다음 영어 문장들을 한국 대학생을 위해 문장별로 분석해 줘.\n각 문장마다 자연스러운 한국어 해석(ko)과, 문장 구조를 짧게 설명한 구문 분석(st, 한국어, 예: "주어 + 현재완료 + that절(목적어)")을 줘.\n\n${list}\n\n다른 말 없이 JSON 배열만 출력, 문장 순서대로: [{"ko":"...","st":"..."}]`, { json: true });
        if (!Array.isArray(arr) || !arr.length) throw { code: 'invalid_json' };
        S.custom.items = sents.map((s, i) => ({ en: s.en, ko: (arr[i] && String(arr[i].ko || '')) || s.ko || '', st: (arr[i] && String(arr[i].st || '')) || '' }));
        save(); toast('해석과 구문 분석을 저장했어요.'); reading();
      } catch (e) { $('#trMsg').textContent = aiErrMsg(e); tr.disabled = false; }
    };
  }
  function readingQuestions(p) {
    const c = contentFor(p);
    if (c.reading) return c.reading.map((q, i) => ({ id: `${p.id}:r${i}`, tag: q.type, prompt: esc(q.q), options: q.o, answer: q.a, explain: esc(q.ex) }));
    const vl = vocabFor(p).filter(v => v.ex);
    return shuffle(vl).slice(0, 6).map(v => ({ ...vocabQuestion(v, vl, 'cloze'), tag: '빈칸 추론', id: `custom:${v.w}` }));
  }
  function readQuiz(pane, p) {
    const qs = readingQuestions(p);
    pane.innerHTML = `<div class="card" id="rBox"><h3>${esc(passageLabel(p))} 독해 문제 ${qs.length}개</h3>
      <p class="muted">${p.custom && !contentFor(p).reading ? '사용자 지문은 핵심 어휘가 들어간 문장으로 빈칸 추론 문제를 자동 생성해요.' : '주제 찾기 · 내용 일치 · 추론 문제로 구성되어 있어요.'}</p>
      <button class="btn primary" id="rStart">문제 풀기</button></div>`;
    $('#rStart').onclick = () => runQuiz($('#rBox'), qs, {
      title: '독해',
      onAnswer: (q, ok) => { if (!ok) { S.wrongReading[q.id] = { tag: q.tag, prompt: q.prompt, ans: q.options[q.answer], pid: p.id, at: Date.now() }; } else delete S.wrongReading[q.id]; save(); },
      onFinish: (r, n, w, after) => { addResult('reading', r, n, '독해 문제'); after.innerHTML = '<button class="btn" id="ra">다시 풀기</button>'; $('#ra', after).onclick = () => reading(); }
    });
  }
  function readGen(pane, p) {
    const ww = Object.values(S.wrongWords).sort((a, b) => b.wrong - a.wrong).slice(0, 8);
    const wc = weakCats().slice(0, 2).map(x => x.cat);
    pane.innerHTML = `
      <div class="card">
        <h3>나만의 맞춤 연습 지문</h3>
        <p class="muted">AI 메모리에 저장된 <b>내가 틀린 단어</b>와 <b>약한 문법</b>이 들어간 문장을 모든 지문에서 골라 하나의 연습 지문으로 엮어 드려요.</p>
        <div class="row" style="margin:8px 0">
          <span class="tiny">약점 단어</span>${ww.length ? ww.map(e => `<span class="chip bad">${esc(e.w)}</span>`).join('') : '<span class="tiny">없음</span>'}
        </div>
        <div class="row" style="margin-bottom:12px">
          <span class="tiny">약점 문법</span>${wc.length ? wc.map(c => `<span class="chip bad">${esc(GRAMMAR_CATS[c].name)}</span>`).join('') : '<span class="tiny">없음</span>'}
        </div>
        ${!ww.length && !wc.length ? '<p class="tiny">아직 오답 기록이 없어서, 현재 지문의 핵심 어휘가 많이 들어간 문장으로 만들어요. 단어 · 문법 문제를 풀수록 더 정확해집니다.</p>' : ''}
        <button class="btn primary" id="gen">맞춤 지문 만들기</button>
        <div id="genOut"></div>
      </div>
      <div class="card">
        <div class="row"><h3 style="margin:0">생성형 AI로 새 지문 만들기</h3>${aiBtnAvailable() ? AI_NOTE : ''}</div>
        <p class="muted">${aiBtnAvailable() ? '원하는 주제와 수준을 정하면 Claude가 내 약점 단어 · 문법을 넣은 새 지문과 해석 · 어휘 · 독해 문제를 바로 만들어 드려요. 만든 지문으로 다섯 영역 학습을 모두 할 수 있어요.' : '원하는 주제와 수준을 정하면, 내 약점 단어 · 문법을 넣은 지문을 만들어 달라는 프롬프트를 만들어 드려요. 무료 생성형 AI에 붙여넣고, 받은 지문을 홈의 \'내 지문으로 학습하기\'에 넣으면 다섯 영역 학습이 모두 가능해요.'}</p>
        <div class="grid g2" style="margin-bottom:10px">
          <input type="text" id="gTopic" placeholder="원하는 주제 (예: 인공지능과 일자리, 영화, 우주 탐사)" value="${esc(p.topic.split('·')[0].trim())}">
          <select id="gLevel"><option value="수능 수준">수능 수준</option><option value="대학 교양 수준" selected>대학 교양 수준</option><option value="영자 신문 수준">영자 신문 수준</option></select>
        </div>
        ${aiBtnAvailable() ? '<div class="row" style="margin-bottom:10px"><button class="btn primary" id="aiGen">✨ Claude로 지금 바로 지문 만들기</button><span id="aiGenMsg" class="tiny"></span></div><div id="aiOut"></div><details style="margin-top:10px"><summary class="tiny">다른 생성형 AI에 쓸 프롬프트 보기</summary>' : ''}
        <textarea id="gPrompt" readonly style="min-height:150px"></textarea>
        <div class="row" style="margin-top:10px"><button class="btn ${aiBtnAvailable() ? '' : 'primary'}" id="gCopy">📋 프롬프트 복사</button>
          <a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a><a class="btn" href="https://claude.ai/" target="_blank" rel="noopener">Claude</a><a class="btn" href="https://gemini.google.com/" target="_blank" rel="noopener">Gemini</a>
          <span class="spacer"></span><a class="btn" href="#home" id="toCustom">받은 지문 붙여넣기 →</a></div>
        ${aiBtnAvailable() ? '</details>' : ''}
      </div>`;
    const aiGen = $('#aiGen');
    if (aiGen) aiGen.onclick = async () => {
      const words = ww.map(e => e.w).join(', ') || vocabFor(p).slice(0, 6).map(v => v.w).join(', ');
      const gram = wc.map(c => GRAMMAR_CATS[c].name).join(', ') || '현재완료, 수동태, 분사구문';
      const topic = $('#gTopic').value.trim() || '자유 주제', level = $('#gLevel').value;
      aiGen.disabled = true; $('#aiGenMsg').textContent = '✨ Claude가 지문을 쓰고 있어요… (20~60초)'; $('#aiOut').innerHTML = '';
      try {
        const d = await ai(`너는 한국 대학생을 위한 영어독해 교재 집필자야. 새 오리지널 영어 지문을 써 줘.\n주제: ${topic}\n수준: ${level}\n조건:\n- 150~200단어, 7~10문장, 사실에 맞는 내용\n- 다음 단어를 자연스럽게 포함: ${words}\n- 다음 문법이 들어간 문장을 2개 이상 포함: ${gram}\n\n다른 말 없이 아래 형식의 JSON 객체 하나만 출력:\n{"title":"영어 제목","sentences":[{"en":"영어 문장","ko":"한국어 해석","st":"짧은 한국어 구문 분석"}],"vocab":[{"w":"영어 단어(지문에 나온 형태의 원형)","m":"한국어 뜻","pos":"n./v./adj./adv."}],"questions":[{"type":"주제","q":"한국어 질문","o":["보기1","보기2","보기3","보기4"],"a":0,"ex":"한국어 해설"}]}\nvocab은 8~10개, questions는 주제 1개 · 내용 일치 2개 · 추론 1개, a는 정답 보기의 0부터 시작하는 번호.`, { json: true, o: { onText: () => { $('#aiGenMsg').textContent = '✨ 거의 다 됐어요…'; } } });
        const sentsAi = (d && Array.isArray(d.sentences) ? d.sentences : []).filter(s => s && typeof s.en === 'string' && s.en.trim()).map(s => ({ en: s.en.trim(), ko: String(s.ko || ''), st: String(s.st || '') }));
        if (sentsAi.length < 3) throw { code: 'invalid_json' };
        const vocabAi = (Array.isArray(d.vocab) ? d.vocab : []).filter(v => v && v.w && v.m).map(v => ({ w: String(v.w).toLowerCase(), m: String(v.m), pos: String(v.pos || '') }));
        const qsAi = (Array.isArray(d.questions) ? d.questions : []).filter(q => q && q.q && Array.isArray(q.o) && q.o.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length)
          .map(q => ({ type: String(q.type || '독해'), q: String(q.q), o: q.o.map(String), a: q.a, ex: String(q.ex || '') }));
        const draft = { title: String(d.title || topic), text: sentsAi.map(s => s.en).join(' '), items: sentsAi, vocab: vocabAi, questions: qsAi, topic: topic, ai: true };
        $('#aiGenMsg').textContent = '';
        $('#aiOut').innerHTML = `<div class="detail" style="background:var(--surface-2)">
          <div class="row"><b class="en">${esc(draft.title)}</b><span class="spacer"></span><button class="btn sm" id="aiPlay">🔊 듣기</button><label class="row tiny"><input type="checkbox" id="aiKo"> 해석</label></div>
          ${sentsAi.map(s => `<p class="en" style="margin:8px 0 2px">${vocabHtml(s.en, vocabAi)}</p><div class="ko hidden">${esc(s.ko)}</div>`).join('')}
          <p class="tiny" style="margin-top:8px">핵심 어휘 ${vocabAi.length}개 · 독해 문제 ${qsAi.length}개 포함</p>
          <div class="row"><span class="spacer"></span><button class="btn primary" id="aiUse">이 지문으로 5개 영역 학습하기 →</button></div></div>`;
        $('#aiPlay').onclick = () => { stopAudio(); speak(draft.text); };
        $('#aiKo').onchange = e => $$('#aiOut .ko').forEach(k => k.classList.toggle('hidden', !e.target.checked));
        $('#aiUse').onclick = () => {
          S.custom = draft; vocabAi.forEach(v => { S.customMeanings[v.w] = v.m; });
          setPassage('custom'); S.tab.reading = 'sent'; save(); toast('AI 지문이 학습 지문으로 설정되었어요.'); reading();
        };
        markStudy(); save();
      } catch (e) { $('#aiGenMsg').textContent = aiErrMsg(e); }
      aiGen.disabled = false;
    };
    const buildPrompt = () => {
      const words = ww.map(e => e.w).join(', ') || vocabFor(p).slice(0, 6).map(v => v.w).join(', ');
      const gram = wc.map(c => GRAMMAR_CATS[c].name).join(', ') || '현재완료, 수동태, 분사구문';
      $('#gPrompt').value = `너는 대학생을 위한 영어독해 교재 집필자야.\n주제: ${$('#gTopic').value || '자유 주제'}\n수준: ${$('#gLevel').value}\n\n다음 조건으로 영어 지문을 만들어 줘.\n1. 150~200단어, 6~10문장\n2. 다음 단어를 반드시 자연스럽게 포함: ${words}\n3. 다음 문법이 들어간 문장을 2개 이상 포함: ${gram}\n4. 지문 아래에 문장별 한국어 해석, 핵심 어휘 뜻, 주제 찾기 1문제와 내용 일치 1문제(정답 포함)를 붙여 줘.`;
    };
    buildPrompt();
    $('#gTopic').oninput = buildPrompt; $('#gLevel').onchange = buildPrompt;
    $('#gCopy').onclick = () => copyText($('#gPrompt').value);
    $('#toCustom').onclick = () => setTimeout(() => { const c = $('#customCard'); if (c) { c.scrollIntoView({ behavior: 'smooth' }); $('#cText').focus(); } }, 80);
    $('#gen').onclick = () => {
      const pool = PASSAGES.flatMap(pp => sentences(pp).map((s, i) => ({ ...s, pid: pp.id, i })));
      const targets = ww.length ? ww : vocabFor(p).map(v => ({ w: v.w, m: v.m }));
      const scored = pool.map(s => {
        const wHits = targets.filter(e => wordRegex(e.w).test(s.en));
        const gHits = grammarCats(s.en).filter(c => wc.includes(c));
        return { s, wHits, gHits, score: wHits.length * 2 + gHits.length + (ww.length || s.pid === p.id ? 0 : -5) };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 7)
        .sort((a, b) => (a.s.pid === b.s.pid ? a.s.i - b.s.i : PASSAGES.findIndex(x => x.id === a.s.pid) - PASSAGES.findIndex(x => x.id === b.s.pid)));
      if (!scored.length) { $('#genOut').innerHTML = '<div class="empty">조건에 맞는 문장을 찾지 못했어요.</div>'; return; }
      const usedWords = [...new Map(scored.flatMap(x => x.wHits).map(e => [e.w, e])).values()];
      $('#genOut').innerHTML = `
        <div class="detail" style="margin-top:16px;background:var(--surface-2)">
          <div class="row"><b>📄 맞춤 연습 지문</b><span class="spacer"></span><button class="btn sm" id="gPlay">🔊 듣기</button><label class="row tiny"><input type="checkbox" id="gKo"> 해석</label></div>
          ${scored.map(x => `<p class="en" style="margin:10px 0 2px">${wc.length ? grammarHtml(x.s.en, null).replace(/<mark class="g g-(\w+)"/g, (m, c) => wc.includes(c) ? m : '<mark class="g"') : esc(x.s.en)}</p><div class="ko hidden">${esc(x.s.ko)}</div>`).join('')}
          <p class="tiny" style="margin-top:8px">출처: ${[...new Set(scored.map(x => passageById(x.s.pid).title))].map(esc).join(', ')}</p>
        </div>
        ${usedWords.length ? '<div id="gQuiz" style="margin-top:14px"></div>' : ''}`;
      // 약점 단어 강조
      $$('#genOut p.en').forEach(el => { usedWords.forEach(e => { el.innerHTML = el.innerHTML.replace(new RegExp('\\b(' + stem(e.w) + '[a-z]*)(?![^<]*>)', 'i'), `<mark class="w" title="${esc(e.m)}">$1</mark>`); }); });
      $('#gPlay').onclick = () => { stopAudio(); speak(scored.map(x => x.s.en).join(' ')); };
      $('#gKo').onchange = e => $$('#genOut .ko').forEach(k => k.classList.toggle('hidden', !e.target.checked));
      markStudy(); save();
      if (usedWords.length) {
        const pool2 = allVocab();
        const qs = usedWords.slice(0, 5).map(e => {
          const v = pool2.find(x => x.w === e.w) || { w: e.w, m: e.m, pid: p.id, pos: '' };
          const sx = scored.find(x => wordRegex(e.w).test(x.s.en));
          return vocabQuestion({ ...v, ex: sx ? sx.s.en : v.ex }, pool2, 'cloze');
        }).filter(Boolean);
        const box = $('#gQuiz');
        box.innerHTML = `<div class="row"><b>이 지문으로 약점 단어 확인 문제 ${qs.length}개</b><span class="spacer"></span><button class="btn primary sm" id="gq">풀기</button></div>`;
        $('#gq').onclick = () => runQuiz(box, qs, {
          title: '맞춤 지문', onAnswer: (q, ok) => { const k = q.v.pid + ':' + q.v.w; if (S.wrongWords[k]) return reviewWord(k, ok) ? '<div class="tiny">🎉 숙달 완료!</div>' : ''; if (!ok) wrongWord(q.v, 'reading'); return ''; },
          onFinish: (r, n) => addResult('reading', r, n, '맞춤 지문')
        });
      }
    };
  }

  // ======================================================
  // My Learning
  // ======================================================
  const AREAS = [['vocab', 'Vocabulary 단어'], ['listening', 'Listening 듣기'], ['speaking', 'Speaking 말하기'], ['grammar', 'Grammar 문법'], ['reading', 'Reading 독해']];
  function streakDays() {
    let n = 0; const d = new Date();
    if (!S.days.includes(today())) d.setDate(d.getDate() - 1);
    while (S.days.includes(d.toLocaleDateString('sv'))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function areaAcc(area) { const rs = S.results.filter(r => r.area === area); const s = rs.reduce((a, r) => a + r.score, 0), t = rs.reduce((a, r) => a + r.total, 0); return { acc: pct(s, t), n: rs.length }; }
  function mylearning() {
    const quizRs = S.results.filter(r => r.area !== 'speaking');
    const solved = quizRs.reduce((a, r) => a + r.total, 0), right = quizRs.reduce((a, r) => a + r.score, 0);
    const accs = AREAS.map(([k, l]) => ({ k, l, ...areaAcc(k) }));
    const tried = accs.filter(a => a.n);
    const weakest = tried.sort((a, b) => a.acc - b.acc)[0];
    const untried = accs.filter(a => !a.n);
    const wc = weakCats();
    const dueW = dueWords().length, wg = Object.keys(S.wrongGrammar).length;
    const recs = [];
    if (dueW) recs.push(['vocab:review', `오늘 복습할 단어 ${dueW}개를 먼저 풀어 보세요.`, '단어 오답 복습']);
    if (wc.length) recs.push(['grammar:weak', `'${GRAMMAR_CATS[wc[0].cat].name}' 정답률이 ${wc[0].acc}%예요. 맞춤 문제로 보완해 봐요.`, '약점 문법 집중']);
    if (weakest && weakest.acc < 70) recs.push([weakest.k + ':', `${weakest.l} 영역 정답률이 ${weakest.acc}%로 가장 낮아요.`, weakest.l.split(' ')[0] + ' 학습']);
    if (untried.length) recs.push([untried[0].k + ':', `아직 ${untried.map(a => a.l.split(' ')[1]).join(' · ')} 영역을 시작하지 않았어요.`, untried[0].l.split(' ')[0] + ' 시작']);
    if (Object.keys(S.wrongWords).length + wg >= 3) recs.push(['reading:gen', '틀린 단어와 문법으로 나만의 맞춤 지문을 만들어 읽어 보세요.', '맞춤 지문 생성']);
    if (!recs.length) recs.push(['vocab:test', '첫 단어 시험으로 학습을 시작해 보세요!', '단어 시험 보기']);

    view.innerHTML = head('My Learning', '학습 결과 · 오답 관리', 'AI 메모리가 기억한 나의 학습 기록과 오답을 한눈에 확인하고, 부족한 부분만 골라서 반복해요.') + `
      <div class="grid g4 stats">
        <div class="card stat"><div class="v">${S.days.length}일</div><div class="l">누적 학습일 · 연속 ${streakDays()}일</div></div>
        <div class="card stat"><div class="v">${solved}</div><div class="l">푼 문제 수</div></div>
        <div class="card stat"><div class="v">${pct(right, solved)}%</div><div class="l">전체 정답률</div></div>
        <div class="card stat"><div class="v">${S.mastered}</div><div class="l">숙달해서 졸업한 오답</div></div>
      </div>
      <div class="card"><h3>🤖 AI 학습 추천</h3>
        ${recs.slice(0, 3).map(([go, msg, btn]) => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(msg)}</span><span class="spacer"></span><button class="btn sm primary" data-go="${go}">${esc(btn)} →</button></div>`).join('')}
      </div>
      <div class="grid g2">
        <div class="card"><h3>영역별 정답률</h3><div class="bars">
          ${accs.map(a => `<div class="bar-row"><span>${esc(a.l)}</span><span class="bar"><i class="${a.acc < 50 ? 'low' : a.acc < 80 ? 'mid' : ''}" style="width:${a.n ? a.acc : 0}%"></i></span><span class="n">${a.n ? a.acc + '%' : '-'}</span></div>`).join('')}
        </div><p class="tiny" style="margin-top:10px">말하기는 발음 · 대화 점수(100점 만점)의 평균이에요.</p></div>
        <div class="card"><h3>문법별 정답률</h3>${Object.keys(S.gStats).length ? `<div class="bars">
          ${Object.entries(S.gStats).map(([c, g]) => { const a = pct(g.r, g.r + g.w); return `<div class="bar-row"><span>${esc(GRAMMAR_CATS[c].name)}</span><span class="bar"><i class="${a < 50 ? 'low' : a < 80 ? 'mid' : ''}" style="width:${a}%"></i></span><span class="n">${a}%</span></div>`; }).join('')}
        </div>` : '<div class="empty">문법 문제를 풀면 여기에 표시돼요.</div>'}</div>
      </div>

      <div class="card"><div class="row"><h3 style="margin:0">📒 오답 노트 — 단어 (${Object.keys(S.wrongWords).length})</h3><span class="spacer"></span>${dueW ? '<button class="btn sm primary" data-go="vocab:review">복습하기</button>' : ''}</div>
        ${Object.keys(S.wrongWords).length ? `<table class="list" style="margin-top:8px"><tr><th>단어</th><th>뜻</th><th>지문</th><th>틀림</th><th>숙달</th></tr>
          ${Object.values(S.wrongWords).sort((a, b) => b.wrong - a.wrong).map(e => `<tr><td><b>${esc(e.w)}</b></td><td>${esc(e.m || '-')}</td><td class="tiny">${esc(passageById(e.pid).title)}</td><td>${e.wrong}</td><td><span class="dots">${[0, 1, 2].map(i => `<i class="${i < e.streak ? 'on' : ''}"></i>`).join('')}</span></td></tr>`).join('')}</table>` : '<div class="empty">틀린 단어가 없어요.</div>'}
      </div>
      <div class="card"><div class="row"><h3 style="margin:0">📒 오답 노트 — 문법 (${wg})</h3><span class="spacer"></span>${wg ? '<button class="btn sm primary" data-go="grammar:weak">맞춤 문제 풀기</button>' : ''}</div>
        ${wg ? `<table class="list" style="margin-top:8px"><tr><th>문제</th><th>문법</th><th>틀림</th></tr>
          ${Object.entries(S.wrongGrammar).map(([id, e]) => { const q = grammarQ(id); return q ? `<tr><td class="en" style="font-size:.95rem">${esc(q.s)}<div class="tiny">정답: ${esc(q.o[q.a])}</div></td><td><span class="chip">${esc(GRAMMAR_CATS[e.cat].name)}</span></td><td>${e.wrong}</td></tr>` : ''; }).join('')}</table>` : '<div class="empty">틀린 문법 문제가 없어요.</div>'}
      </div>
      <div class="card"><h3>📒 오답 노트 — 독해 (${Object.keys(S.wrongReading).length})</h3>
        ${Object.keys(S.wrongReading).length ? `<table class="list"><tr><th>유형</th><th>문제</th><th>정답</th></tr>${Object.values(S.wrongReading).map(e => `<tr><td><span class="chip">${esc(e.tag)}</span></td><td>${e.prompt}<div class="tiny">${esc(passageById(e.pid).title)}</div></td><td>${esc(e.ans)}</td></tr>`).join('')}</table>` : '<div class="empty">틀린 독해 문제가 없어요.</div>'}
      </div>
      <div class="card"><h3>최근 학습 기록</h3>
        ${S.results.length ? `<table class="list"><tr><th>날짜</th><th>영역</th><th>활동</th><th>지문</th><th>결과</th></tr>
          ${S.results.slice(-12).reverse().map(r => `<tr><td class="tiny">${new Date(r.date).toLocaleString('ko', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${esc((AREAS.find(a => a[0] === r.area) || ['', r.area])[1])}</td><td>${esc(r.label)}</td><td class="tiny">${esc(passageById(r.pid).title)}</td><td>${r.total === 100 && r.area === 'speaking' ? r.score + '점' : `${r.score}/${r.total}`}</td></tr>`).join('')}</table>` : '<div class="empty">아직 학습 기록이 없어요.</div>'}
      </div>
      <div class="row"><span class="tiny">학습 기록은 이 브라우저에만 저장됩니다.</span><span class="spacer"></span><button class="btn sm danger" id="reset">학습 기록 초기화</button></div>`;
    $$('[data-go]', view).forEach(b => b.onclick = () => { const [v, t] = b.dataset.go.split(':'); if (t) S.tab[v] = t; save(); location.hash = '#' + v; });
    $('#reset').onclick = e => {
      const b = e.currentTarget;
      if (!b.dataset.armed) {
        b.dataset.armed = '1'; b.textContent = '한 번 더 누르면 모두 삭제돼요 (되돌릴 수 없음)';
        setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = '학습 기록 초기화'; } }, 4000);
        return;
      }
      const keep = { custom: S.custom, customMeanings: S.customMeanings, reminder: S.reminder, rate: S.rate, voice: S.voice, pid: S.pid };
      S = Object.assign(defaults(), keep); save(); mylearning(); toast('학습 기록을 초기화했어요.');
    };
  }

  // ---------- 라우터 ----------
  const VIEWS = { home, vocab, listening, speaking, grammar, reading, mylearning };
  function route() {
    const name = (location.hash.slice(1) || 'home').split('/')[0];
    stopAudio();
    if (capture) { capture.stop(); capture = null; }
    (VIEWS[name] || home)();
    $$('#nav a, .brand').forEach(a => a.classList.toggle('active', a.dataset.nav === (VIEWS[name] ? name : 'home')));
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  fillPassageSelect();
  updateBadge();
  route();
})();
