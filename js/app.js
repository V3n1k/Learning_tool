/* ============================================================
 * Learning Tool — оффлайн-платформа для учёбы.
 * Без сборки, без сервера, без внешних зависимостей.
 * Данные: контент из content/*.js + правки/прогресс в localStorage.
 * ============================================================ */

"use strict";

/* ---------------- хранилище ---------------- */

const LS = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// прогресс: { "courseId::moduleId::lessonId": {status:"done"|"", hw:""|"sent"|"checked", doneAt} }
let progress = LS.get("lt_progress", {});
// посещения: { "2026-07-14": 3 }
let visits = LS.get("lt_visits", {});
// пользовательские правки контента
let user = LS.get("lt_user", {
  courses: [],      // полностью свои курсы (та же схема, что в content/*.js)
  overrides: {},    // "c::m::l" -> {title, theory, homework} для встроенных уроков
  addModules: {},   // courseId -> [модули]
  addLessons: {},   // "courseId::moduleId" -> [уроки]
  deleted: []       // ключи удалённого: "c" | "c::m" | "c::m::l"
});
// «планирую узнать»: [{id, title, url, note, status: "new"|"done", createdAt}]
let inbox = LS.get("lt_inbox", []);
// код студента в редакторе практики: "courseId::moduleId::lessonId::practiceId" -> код
let practiceCode = LS.get("lt_practice_code", {});
// повторение практики (интервальные повторения): тот же ключ ->
// { successCount, lastSuccessAt, nextDueAt }
let practiceReview = LS.get("lt_practice_review", {});

function saveProgress() { LS.set("lt_progress", progress); scheduleAutosave(); }
function saveVisits() { LS.set("lt_visits", visits); scheduleAutosave(); }
function saveUser() { LS.set("lt_user", user); scheduleAutosave(); }
function saveInbox() { LS.set("lt_inbox", inbox); scheduleAutosave(); }
function savePracticeReview() { LS.set("lt_practice_review", practiceReview); scheduleAutosave(); }
function savePracticeCode() { LS.set("lt_practice_code", practiceCode); scheduleAutosave(); }

/* ---------------- автосохранение в файл на диске ----------------
 * Всё и так автоматически сохраняется в localStorage при каждом действии.
 * Это — дополнительный слой: копия данных пишется в JSON-файл в выбранную
 * папку (File System Access API, работает в Chrome/Edge/Яндекс.Браузере). */

const IDB_NAME = "lt_fs";

function idbGet(key) {
  return new Promise(resolve => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onerror = () => resolve(undefined);
    req.onsuccess = () => {
      const tx = req.result.transaction("kv", "readonly");
      const get = tx.objectStore("kv").get(key);
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => resolve(undefined);
    };
  });
}

function idbSet(key, value) {
  return new Promise(resolve => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onerror = () => resolve(false);
    req.onsuccess = () => {
      const tx = req.result.transaction("kv", "readwrite");
      tx.objectStore("kv").put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    };
  });
}

let autosaveDir = null;         // FileSystemDirectoryHandle
let autosaveState = "off";      // off | on | paused (нужно разрешение) | unsupported
let autosaveTimer = null;

function backupData() {
  return { exportedAt: new Date().toISOString(), progress, visits, user, inbox, practiceCode, practiceReview };
}

async function writeAutosave() {
  if (!autosaveDir) return;
  try {
    const fh = await autosaveDir.getFileHandle("learning-tool-autosave.json", { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(backupData(), null, 2));
    await w.close();
    autosaveState = "on";
  } catch (e) {
    autosaveState = "paused";
  }
}

function scheduleAutosave() {
  if (!autosaveDir) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(writeAutosave, 1500);
}

async function enableAutosave() {
  if (!window.showDirectoryPicker) {
    toast("Браузер не поддерживает — пользуйся экспортом в настройках");
    return;
  }
  try {
    autosaveDir = await window.showDirectoryPicker({ mode: "readwrite" });
    await idbSet("dir", autosaveDir);
    await writeAutosave();
    toast(autosaveState === "on" ? "Автосохранение включено 💾" : "Не удалось записать файл");
  } catch (e) { /* пользователь закрыл диалог */ }
}

async function initAutosave() {
  if (!window.showDirectoryPicker) { autosaveState = "unsupported"; return; }
  const dir = await idbGet("dir");
  if (!dir) return;
  autosaveDir = dir;
  try {
    const perm = await dir.queryPermission({ mode: "readwrite" });
    autosaveState = perm === "granted" ? "on" : "paused";
  } catch (e) { autosaveState = "paused"; }
}

async function resumeAutosave() {
  if (!autosaveDir) return;
  try {
    const perm = await autosaveDir.requestPermission({ mode: "readwrite" });
    if (perm === "granted") { await writeAutosave(); toast("Автосохранение возобновлено 💾"); }
  } catch (e) {}
  route();
}

/* ---------------- учёт посещений ---------------- */

function todayKey(d) {
  const dt = d || new Date();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return dt.getFullYear() + "-" + m + "-" + day;
}

function logVisit() {
  const key = todayKey();
  visits[key] = (visits[key] || 0) + 1;
  saveVisits();
}

function calcStreak() {
  let streak = 0;
  const d = new Date();
  if (!visits[todayKey(d)]) d.setDate(d.getDate() - 1); // сегодня ещё не заходил — считаем от вчера
  while (visits[todayKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ---------------- сборка контента (встроенный + правки) ---------------- */

function keyOf(c, m, l) {
  return [c, m, l].filter(Boolean).join("::");
}

function isDeleted(key) { return user.deleted.includes(key); }

function effectiveContent() {
  const result = [];
  for (const src of (window.LT_CONTENT || [])) {
    if (isDeleted(src.id)) continue;
    const course = { id: src.id, title: src.title, color: src.color, description: src.description, builtin: true, modules: [] };
    const srcModules = (src.modules || []).concat(user.addModules[src.id] || []);
    for (const m of srcModules) {
      const mKey = keyOf(src.id, m.id);
      if (isDeleted(mKey)) continue;
      const mod = { id: m.id, title: m.title, builtin: !((user.addModules[src.id] || []).includes(m)), lessons: [] };
      const srcLessons = (m.lessons || []).concat(user.addLessons[mKey] || []);
      for (const l of srcLessons) {
        const lKey = keyOf(src.id, m.id, l.id);
        if (isDeleted(lKey)) continue;
        const ov = user.overrides[lKey] || {};
        mod.lessons.push({
          id: l.id,
          title: ov.title !== undefined ? ov.title : l.title,
          theory: ov.theory !== undefined ? ov.theory : (l.theory || ""),
          homework: ov.homework !== undefined ? ov.homework : (l.homework || ""),
          cards: ov.cards !== undefined ? ov.cards : (l.cards || []),
          practice: l.practice || []
        });
      }
      course.modules.push(mod);
    }
    result.push(course);
  }
  for (const c of user.courses) {
    if (isDeleted(c.id)) continue;
    result.push(Object.assign({ builtin: false }, c));
  }
  return result;
}

function findCourse(courses, cid) { return courses.find(c => c.id === cid); }

function flatLessons(course) {
  const out = [];
  for (const m of course.modules) for (const l of m.lessons) out.push({ mod: m, lesson: l });
  return out;
}

function courseProgress(course) {
  const all = flatLessons(course);
  if (!all.length) return { done: 0, total: 0, pct: 0 };
  let done = 0;
  for (const { mod, lesson } of all) {
    const p = progress[keyOf(course.id, mod.id, lesson.id)];
    if (p && p.status === "done") done++;
  }
  return { done, total: all.length, pct: Math.round(done / all.length * 100) };
}

/* ---------------- мини-markdown ---------------- */

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function unesc(s) {
  // обратная операция к esc() — нужна, чтобы достать исходный JS/JSON из
  // экранированного текста markdown (например, код внутри блока ```jsxgraph)
  return s.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

function inlineMd(s) {
  return s
    .replace(/`([^`]+)`/g, (m, code) => "<code>" + code + "</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    // картинка: ![подпись](путь) — путь может быть локальным (images/...) или http(s)-ссылкой.
    // Обязательно ДО обычных ссылок — иначе [подпись](путь) внутри распознается как ссылка.
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (m, text, url) => {
      // ссылки на проверенные банки задач (Решу ЕГЭ, ФИПИ) оформляем как "плашку задачи" —
      // отдельным цветом/иконкой, чтобы сразу было видно: это КОНКРЕТНАЯ задача с реальным ответом,
      // а не общая ссылка на статью или документацию.
      const isTaskLink = /(^|\.)sdamgia\.ru|(^|\.)fipi\.ru/.test(url.replace(/^https?:\/\//, ""));
      const cls = isTaskLink ? ' class="task-link"' : "";
      return '<a href="' + url + '"' + cls + ' target="_blank" rel="noopener">' + (isTaskLink ? "📝 " : "") + text + '</a>';
    })
    .replace(/(^|[\s(])((https?:\/\/)[^\s)<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
}

function renderMd(text, graphSpecs) {
  // graphSpecs — необязательный массив; если передан, в него складываются
  // описания блоков ```jsxgraph для последующей отрисовки после вставки в DOM
  // (сам renderMd возвращает только строку HTML и не может исполнять JS).
  const lines = esc(text.replace(/\r\n/g, "\n")).split("\n");
  const out = [];
  let i = 0;
  let listType = null; // "ul" | "ol"

  function closeList() {
    if (listType) { out.push("</" + listType + ">"); listType = null; }
  }

  while (i < lines.length) {
    const line = lines[i];

    // блок кода ``` (или ```jsxgraph — интерактивный график/чертёж)
    let fenceMatch;
    if ((fenceMatch = line.match(/^```(\w+)?(.*)$/))) {
      closeList();
      const lang = (fenceMatch[1] || "").toLowerCase();
      const restOfLine = (fenceMatch[2] || "").trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // пропускаем закрывающие ```

      if (lang === "jsxgraph") {
        let options = {};
        if (restOfLine) {
          try { options = JSON.parse(unesc(restOfLine)); } catch (e) { /* некорректный JSON — используем настройки по умолчанию */ }
        }
        const id = "jxg-" + Math.random().toString(36).slice(2, 10);
        if (graphSpecs) graphSpecs.push({ id, options, code: unesc(buf.join("\n")) });
        out.push('<div id="' + id + '" class="jxg-board"></div>');
        continue;
      }

      // сопоставляем частые обозначения с классами языков, которые понимает Prism
      const langClass = { go: "go", python: "python", py: "python", bash: "bash", sh: "bash" }[lang] || "";
      const codeClass = langClass ? ' class="language-' + langClass + '"' : "";
      out.push("<pre><code" + codeClass + ">" + buf.join("\n") + "</code></pre>");
      continue;
    }

    // таблица
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      closeList();
      const headCells = line.split("|").slice(1, -1).map(c => inlineMd(c.trim()));
      out.push("<table><thead><tr>" + headCells.map(c => "<th>" + c + "</th>").join("") + "</tr></thead><tbody>");
      i += 2;
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i].split("|").slice(1, -1).map(c => inlineMd(c.trim()));
        out.push("<tr>" + cells.map(c => "<td>" + c + "</td>").join("") + "</tr>");
        i++;
      }
      out.push("</tbody></table>");
      continue;
    }

    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)/))) {
      closeList();
      const h = m[1].length;
      out.push("<h" + h + ">" + inlineMd(m[2]) + "</h" + h + ">");
    } else if (/^---+\s*$/.test(line)) {
      closeList();
      out.push("<hr>");
    } else if ((m = line.match(/^&gt;\s?(.*)/))) {
      closeList();
      out.push("<blockquote>" + inlineMd(m[1]) + "</blockquote>");
    } else if ((m = line.match(/^[-*]\s+(.*)/))) {
      if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; }
      out.push("<li>" + inlineMd(m[1]) + "</li>");
    } else if ((m = line.match(/^\d+[.)]\s+(.*)/))) {
      if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; }
      out.push("<li>" + inlineMd(m[1]) + "</li>");
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      out.push("<p>" + inlineMd(line) + "</p>");
    }
    i++;
  }
  closeList();
  return out.join("\n");
}

/* ---------------- утилиты UI ---------------- */

const app = document.getElementById("app");

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), 2200);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => copyFallback(text));
  }
  return Promise.resolve(copyFallback(text));
}

function copyFallback(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  return ok;
}

function slugify(s) {
  const map = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
  const base = s.toLowerCase().split("").map(ch => map[ch] !== undefined ? map[ch] : ch).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
  return (base || "item") + "-" + Date.now().toString(36);
}

/* ---------------- интерактивные графики (JSXGraph) ---------------- */

function mountGraphs(specs) {
  // ПРИНИМАЕТ: массив {id, options, code}, собранный renderMd() из блоков ```jsxgraph.
  // ВЫЗЫВАТЬ ТОЛЬКО ПОСЛЕ того, как соответствующий HTML уже вставлен в DOM —
  // JSXGraph должен найти div с этим id на странице.
  if (!specs || !specs.length || !window.JXG) return;
  for (const spec of specs) {
    const el = document.getElementById(spec.id);
    if (!el) continue;
    try {
      const board = JXG.JSXGraph.initBoard(spec.id, Object.assign({
        boundingbox: [-5, 5, 5, -5],
        axis: true,
        showCopyright: false,
        showNavigation: true,
        keepAspectRatio: true
      }, spec.options));
      // spec.code — JS-код автора урока (доверенный, из content/*.js, не пользовательский ввод).
      // ПРИНИМАЕТ: переменные board (доска JSXGraph) и JXG (сама библиотека) в области видимости.
      const runner = new Function("board", "JXG", spec.code);
      runner(board, window.JXG);
    } catch (e) {
      el.innerHTML = '<p class="hint">Не удалось построить график: ' + esc(String(e)) + '</p>';
    }
  }
}

/* ---------------- карточки: RemNote / Anki ---------------- */

function courseCards(course) {
  const out = [];
  for (const { lesson } of flatLessons(course)) {
    for (const c of (lesson.cards || [])) out.push(c);
  }
  return out;
}

function cardsToRemnote(cards) {
  // RemNote: строка вида "вопрос >> ответ" при вставке становится карточкой
  return cards.map(c => c.q + " >> " + c.a).join("\n");
}

function cardsToAnki(cards) {
  // Anki: импорт TSV (вопрос<TAB>ответ)
  return cards.map(c => c.q + "\t" + c.a).join("\n");
}

function copyCards(cards, format) {
  const text = format === "anki" ? cardsToAnki(cards) : cardsToRemnote(cards);
  copyText(text).then(ok => toast(ok
    ? "Скопировано " + cards.length + " карточек — вставь в " + (format === "anki" ? "Anki (импорт файла .txt)" : "RemNote")
    : "Не удалось скопировать"));
}

function statusIcon(p) {
  if (p && p.status === "done") return "✅";
  if (p && p.hw === "sent") return "🕓";
  return "⚪";
}

/* ---------------- роутер ---------------- */

function route() {
  const hash = location.hash || "#/";
  const parts = hash.slice(2).split("/").map(decodeURIComponent).filter(Boolean);
  document.querySelectorAll(".topnav a").forEach(a => a.classList.remove("active"));
  app.classList.toggle("app-wide", parts[0] === "practice");
  updateReviewBadge();

  if (parts.length === 0) {
    markNav("home"); renderHome();
  } else if (parts[0] === "review") {
    markNav("review"); renderReview();
  } else if (parts[0] === "inbox") {
    markNav("inbox"); renderInbox();
  } else if (parts[0] === "stats") {
    markNav("stats"); renderStats();
  } else if (parts[0] === "settings") {
    markNav("settings"); renderSettings();
  } else if (parts[0] === "course" && parts[1]) {
    markNav("home"); renderCourse(parts[1]);
  } else if (parts[0] === "lesson" && parts.length >= 4) {
    markNav("home"); renderLesson(parts[1], parts[2], parts[3]);
  } else if (parts[0] === "practice" && parts.length >= 4) {
    markNav("home"); renderPractice(parts[1], parts[2], parts[3], parts[4]);
  } else {
    renderHome();
  }
  window.scrollTo(0, 0);
}

function markNav(name) {
  const el = document.querySelector('.topnav a[data-nav="' + name + '"]');
  if (el) el.classList.add("active");
}

function updateReviewBadge() {
  const el = document.querySelector('.topnav a[data-nav="review"]');
  if (!el) return;
  const n = countDueReviews();
  el.textContent = "🔁 Повторение" + (n > 0 ? " (" + n + ")" : "");
}

/* ---------------- страница: курсы ---------------- */

function renderHome() {
  const courses = effectiveContent();
  const streak = calcStreak();
  let html = '<div class="page-head"><h1>Мои направления</h1>' +
    '<span class="hint" style="color:var(--text-dim)">🔥 стрик: ' + streak + ' дн.</span>' +
    '<button class="btn" id="addCourseBtn">＋ Новый курс</button></div>';

  html += '<div class="grid">';
  for (const c of courses) {
    const pr = courseProgress(c);
    html += '<a class="card" href="#/course/' + encodeURIComponent(c.id) + '" style="color:inherit;text-decoration:none">' +
      '<span class="tag" style="background:' + c.color + '22;color:' + c.color + '">' + esc(c.title) + '</span>' +
      '<h3>' + esc(c.title) + '</h3>' +
      '<div class="desc">' + esc(c.description || "") + '</div>' +
      '<div class="progress-row"><div class="progress"><div style="width:' + pr.pct + '%"></div></div>' +
      '<span>' + pr.done + '/' + pr.total + ' · ' + pr.pct + '%</span></div>' +
      '</a>';
  }
  html += '</div>';
  app.innerHTML = html;

  document.getElementById("addCourseBtn").onclick = () => openCourseEditor(null);
}

/* ---------------- страница: курс ---------------- */

function renderCourse(cid) {
  const courses = effectiveContent();
  const course = findCourse(courses, cid);
  if (!course) { app.innerHTML = '<p class="empty">Курс не найден. <a href="#/">На главную</a></p>'; return; }

  const pr = courseProgress(course);
  let html = '<div class="crumbs"><a href="#/">Курсы</a> / ' + esc(course.title) + '</div>' +
    '<div class="page-head"><h1>' + esc(course.title) + '</h1>' +
    '<button class="btn btn-sm" id="addModuleBtn">＋ Модуль</button>' +
    '<button class="btn btn-sm" id="courseCardsBtn" title="Скопировать все карточки курса для RemNote">🃏 Карточки</button>' +
    '<button class="btn btn-sm btn-danger" id="delCourseBtn">Удалить курс</button></div>' +
    '<div class="progress-row" style="margin-bottom:20px"><div class="progress"><div style="width:' + pr.pct + '%"></div></div>' +
    '<span>' + pr.done + ' из ' + pr.total + ' уроков · ' + pr.pct + '%</span></div>';

  if (!course.modules.length) html += '<p class="empty">Пока нет модулей — добавь первый.</p>';

  for (const m of course.modules) {
    html += '<div class="module open" data-mid="' + esc(m.id) + '">' +
      '<div class="module-head"><span class="chev">▶</span><h3>' + esc(m.title) + '</h3>' +
      '<button class="btn btn-sm" data-add-lesson="' + esc(m.id) + '">＋ Урок</button>' +
      '<button class="btn btn-sm btn-danger" data-del-module="' + esc(m.id) + '">✕</button></div>' +
      '<div class="module-lessons">';
    if (!m.lessons.length) html += '<div class="lesson-row" style="color:var(--text-dim)">Пусто</div>';
    for (const l of m.lessons) {
      const p = progress[keyOf(course.id, m.id, l.id)];
      const hw = p && p.hw;
      html += '<div class="lesson-row">' +
        '<span class="status">' + statusIcon(p) + '</span>' +
        '<a href="#/lesson/' + [course.id, m.id, l.id].map(encodeURIComponent).join("/") + '">' + esc(l.title) + '</a>' +
        (l.homework ? '<span class="hw-badge">' + (hw === "checked" ? "ДЗ ✅" : hw === "sent" ? "ДЗ 🕓" : "ДЗ") + '</span>' : '') +
        '</div>';
    }
    html += '</div></div>';
  }
  app.innerHTML = html;

  document.querySelectorAll(".module-head").forEach(head => {
    head.addEventListener("click", e => {
      if (e.target.closest("button")) return;
      head.parentElement.classList.toggle("open");
    });
  });
  document.getElementById("addModuleBtn").onclick = () => openModuleEditor(course.id, null);
  document.getElementById("courseCardsBtn").onclick = () => {
    const cards = courseCards(course);
    if (!cards.length) { toast("В этом курсе пока нет карточек"); return; }
    copyCards(cards, "remnote");
  };
  document.getElementById("delCourseBtn").onclick = () => {
    if (!confirm('Удалить курс «' + course.title + '» со всеми уроками?')) return;
    deleteEntity(course.id);
    location.hash = "#/";
  };
  document.querySelectorAll("[data-add-lesson]").forEach(b => {
    b.onclick = () => openLessonEditor(course.id, b.dataset.addLesson, null);
  });
  document.querySelectorAll("[data-del-module]").forEach(b => {
    b.onclick = () => {
      if (!confirm("Удалить модуль со всеми уроками?")) return;
      deleteEntity(keyOf(course.id, b.dataset.delModule));
      renderCourse(course.id);
    };
  });
}

/* ---------------- страница: урок ---------------- */

function renderLesson(cid, mid, lid) {
  const courses = effectiveContent();
  const course = findCourse(courses, cid);
  const mod = course && course.modules.find(m => m.id === mid);
  const lesson = mod && mod.lessons.find(l => l.id === lid);
  if (!lesson) { app.innerHTML = '<p class="empty">Урок не найден. <a href="#/">На главную</a></p>'; return; }

  const key = keyOf(cid, mid, lid);
  const p = progress[key] || {};
  const all = flatLessons(course);
  const idx = all.findIndex(x => x.mod.id === mid && x.lesson.id === lid);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  let html = '<div class="crumbs"><a href="#/">Курсы</a> / <a href="#/course/' + encodeURIComponent(cid) + '">' +
    esc(course.title) + '</a> / ' + esc(lesson.title) + '</div>' +
    '<div class="page-head"><h1>' + esc(lesson.title) + '</h1>' +
    '<button class="btn btn-sm" id="editLessonBtn">✏️ Редактировать</button>' +
    '<button class="btn btn-sm btn-danger" id="delLessonBtn">Удалить</button></div>';

  html += '<div class="lesson-actions">' +
    '<button class="btn ' + (p.status === "done" ? "btn-accent" : "") + '" id="doneBtn">' +
    (p.status === "done" ? "✅ Пройдено" : "Отметить пройденным") + '</button>';
  if (lesson.homework) {
    html += '<button class="btn" id="hwBtn">' +
      (p.hw === "checked" ? "ДЗ проверено ✅" : p.hw === "sent" ? "ДЗ отправлено 🕓 (нажми, когда проверим)" : "Отметить: ДЗ отправлено") +
      '</button>' +
      '<button class="btn" id="hwAskBtn">📤 Сдать ДЗ Claude (скопировать)</button>';
  }
  html += '<button class="btn" id="lessonAskBtn">🤖 Спросить по уроку</button>';
  if (lesson.practice && lesson.practice.length) {
    html += '<a class="btn btn-accent" href="#/practice/' + [cid, mid, lid].map(encodeURIComponent).join("/") + '">🧑‍💻 Практика (' + lesson.practice.length + ')</a>';
  }
  html += '</div>';

  const graphSpecs = [];
  html += '<div class="lesson-content">' + renderMd(lesson.theory || "*Пока пусто — нажми «Редактировать».*", graphSpecs) + '</div>';
  if (lesson.homework) {
    html += '<div class="hw-block"><h2>📝 Домашнее задание</h2>' + renderMd(lesson.homework, graphSpecs) + '</div>';
  }
  if (lesson.cards && lesson.cards.length) {
    html += '<div class="settings-block"><h2>🃏 Карточки для повторения (' + lesson.cards.length + ')</h2>' +
      '<p>Скопируй и вставь в RemNote — каждая строка «вопрос &gt;&gt; ответ» сама станет флеш-карточкой.</p>' +
      '<button class="btn" id="cardsRemBtn">📋 Для RemNote</button> ' +
      '<button class="btn" id="cardsAnkiBtn">📋 Для Anki (TSV)</button></div>';
  }

  html += '<div class="lesson-nav">' +
    (prev ? '<a class="btn" href="#/lesson/' + [cid, prev.mod.id, prev.lesson.id].map(encodeURIComponent).join("/") + '">← ' + esc(prev.lesson.title) + '</a>' : '<span></span>') +
    (next ? '<a class="btn" href="#/lesson/' + [cid, next.mod.id, next.lesson.id].map(encodeURIComponent).join("/") + '">' + esc(next.lesson.title) + ' →</a>' : '<span></span>') +
    '</div>';

  app.innerHTML = html;
  if (window.Prism) Prism.highlightAllUnder(app);
  mountGraphs(graphSpecs);

  document.getElementById("doneBtn").onclick = () => {
    const cur = progress[key] || {};
    if (cur.status === "done") { delete cur.status; delete cur.doneAt; }
    else { cur.status = "done"; cur.doneAt = Date.now(); }
    progress[key] = cur; saveProgress();
    renderLesson(cid, mid, lid);
  };
  const hwBtn = document.getElementById("hwBtn");
  if (hwBtn) hwBtn.onclick = () => {
    const cur = progress[key] || {};
    cur.hw = cur.hw === "sent" ? "checked" : cur.hw === "checked" ? "" : "sent";
    progress[key] = cur; saveProgress();
    renderLesson(cid, mid, lid);
  };
  const hwAskBtn = document.getElementById("hwAskBtn");
  if (hwAskBtn) hwAskBtn.onclick = () => {
    openAskModal(
      'Курс «' + course.title + '», урок «' + lesson.title + '».\nДомашнее задание:\n' + lesson.homework.trim() +
      '\n\nМоё решение:\n[ВСТАВЬ СЮДА СВОЙ КОД/ОТВЕТЫ]',
      'Проверь моё домашнее задание: укажи ошибки, что можно сделать лучше, и задай 1–2 вопроса на понимание.'
    );
  };
  document.getElementById("lessonAskBtn").onclick = () => {
    openAskModal('Курс «' + course.title + '», урок «' + lesson.title + '».\nФрагмент, о котором спрашиваю:\n[ВСТАВЬ СЮДА КУСОК УРОКА ИЛИ СВОЙ КОД]', '');
  };
  const cardsRemBtn = document.getElementById("cardsRemBtn");
  if (cardsRemBtn) cardsRemBtn.onclick = () => copyCards(lesson.cards, "remnote");
  const cardsAnkiBtn = document.getElementById("cardsAnkiBtn");
  if (cardsAnkiBtn) cardsAnkiBtn.onclick = () => copyCards(lesson.cards, "anki");
  document.getElementById("editLessonBtn").onclick = () => openLessonEditor(cid, mid, lesson);
  document.getElementById("delLessonBtn").onclick = () => {
    if (!confirm('Удалить урок «' + lesson.title + '»?')) return;
    deleteEntity(key);
    location.hash = "#/course/" + encodeURIComponent(cid);
  };
}

/* ---------------- практика: редактор кода + Pyodide ----------------
 * Pyodide — CPython, скомпилированный в WebAssembly. Выполняется ПРЯМО
 * в браузере, без серверов. Работает ТОЛЬКО когда сайт открыт по http(s)
 * (python -m http.server) — Pyodide грузит .wasm через fetch(), а fetch
 * не работает при открытии index.html напрямую (file://). */

let pyodidePromise = null;
function ensurePyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({ indexURL: "js/vendor/pyodide/" });
  }
  return pyodidePromise;
}

async function runPracticeTests(problem, code) {
  // ПРИНИМАЕТ: описание задачи (problem.tests, опционально problem.files) и код студента (строка).
  // ВОЗВРАЩАЕТ: массив результатов — по одному объекту {pass, actual, expected, errorText, input} на тест.
  const pyodide = await ensurePyodide();
  if (problem.files) {
    for (const f of problem.files) {
      const resp = await fetch(f.path);
      const buf = await resp.arrayBuffer();
      pyodide.FS.writeFile(f.name, new Uint8Array(buf));
    }
  }
  const results = [];
  for (const test of problem.tests) {
    pyodide.globals.set("__student_code__", code);
    pyodide.globals.set("__test_input__", test.input || "");
    let actual = "", errorText = "";
    try {
      pyodide.runPython(
        "import sys, io, traceback\n" +
        "sys.stdin = io.StringIO(__test_input__)\n" +
        "_buf = io.StringIO()\n" +
        "_old = sys.stdout\n" +
        "sys.stdout = _buf\n" +
        "try:\n" +
        "    exec(__student_code__, {})\n" +
        "except Exception:\n" +
        "    _buf.write('\\n[ОШИБКА]\\n' + traceback.format_exc())\n" +
        "finally:\n" +
        "    sys.stdout = _old\n" +
        "__test_output__ = _buf.getvalue()\n"
      );
      actual = pyodide.globals.get("__test_output__");
    } catch (e) {
      errorText = String(e);
    }
    const pass = !errorText && !/\[ОШИБКА\]/.test(actual) && actual.trim() === (test.expected || "").trim();
    results.push({ pass, actual, expected: test.expected || "", errorText, input: test.input || "" });
  }
  return results;
}

let cmEditor = null;          // единственный экземпляр CodeMirror — переиспользуется между вкладками
let practiceCtx = null;       // { cid, mid, lid, lesson, activeIdx }

function practiceCodeKey(cid, mid, lid, practiceId) {
  return [cid, mid, lid, practiceId].join("::");
}

/* ---------------- повторение практики (интервальные повторения) ----------------
 * Классическая схема интервалов, как в лёгких SRS-приложениях: 1 → 3 → 7 → 14 → 30 дней.
 * Каждое успешное прохождение ВСЕХ тестов сдвигает следующее повторение дальше. */

const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

function recordPracticeSuccess(key) {
  // ПРИНИМАЕТ: ключ вида "cid::mid::lid::practiceId". НИЧЕГО не возвращает —
  // обновляет practiceReview[key] и планирует следующее повторение.
  const rec = practiceReview[key] || { successCount: 0 };
  rec.successCount += 1;
  rec.lastSuccessAt = Date.now();
  const days = REVIEW_INTERVALS_DAYS[Math.min(rec.successCount - 1, REVIEW_INTERVALS_DAYS.length - 1)];
  rec.nextDueAt = Date.now() + days * DAY_MS;
  practiceReview[key] = rec;
  savePracticeReview();
}

function formatDue(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function countDueReviews() {
  const now = Date.now();
  return Object.values(practiceReview).filter(r => r.nextDueAt <= now).length;
}

function renderPractice(cid, mid, lid, practiceIdParam) {
  const courses = effectiveContent();
  const course = findCourse(courses, cid);
  const mod = course && course.modules.find(m => m.id === mid);
  const lesson = mod && mod.lessons.find(l => l.id === lid);
  if (!lesson || !lesson.practice || !lesson.practice.length) {
    app.innerHTML = '<p class="empty">Практика для этого урока не найдена. <a href="#/lesson/' +
      [cid, mid, lid].map(encodeURIComponent).join("/") + '">Вернуться к уроку</a></p>';
    return;
  }
  let activeIdx = lesson.practice.findIndex(p => p.id === practiceIdParam);
  if (activeIdx < 0) activeIdx = 0;
  practiceCtx = { cid, mid, lid, lesson, activeIdx, solutionMode: false };

  const lessonUrl = "#/lesson/" + [cid, mid, lid].map(encodeURIComponent).join("/");

  let html = '<div class="crumbs"><a href="#/">Курсы</a> / <a href="#/course/' + encodeURIComponent(cid) + '">' +
    esc(course.title) + '</a> / <a href="' + lessonUrl + '">' +
    esc(lesson.title) + '</a> / Практика</div>' +
    '<div class="page-head"><h1>🧑‍💻 Практика: ' + esc(lesson.title) + '</h1>' +
    '<a class="btn" href="' + lessonUrl + '">← К теории</a></div>' +
    '<div class="practice-tabs" id="practiceTabs"></div>' +
    '<div id="practiceBody"></div>';

  app.innerHTML = html;
  renderTabs();
  renderPracticeProblem();
}

function renderTabs() {
  const { lesson, activeIdx, solutionMode } = practiceCtx;
  const tabsHtml = lesson.practice.map((p, i) =>
    '<button class="btn btn-sm ' + (i === activeIdx && !solutionMode ? "btn-accent" : "") + '" data-practice-tab="' + i + '">' + esc(p.title) + '</button>'
  ).join(" ");
  const problem = lesson.practice[activeIdx];
  const solutionTab = problem.solution
    ? ' <button class="btn btn-sm ' + (solutionMode ? "btn-accent" : "") + '" id="solutionTabBtn">💡 Решение</button>'
    : "";
  document.getElementById("practiceTabs").innerHTML = tabsHtml + solutionTab;

  document.querySelectorAll("[data-practice-tab]").forEach(b => {
    b.onclick = () => {
      const idx = +b.dataset.practiceTab;
      if (idx === practiceCtx.activeIdx) {
        // та же задача — просто выходим из режима "Решение" (хэш в URL не меняется,
        // поэтому переключаемся локально, не дожидаясь события hashchange)
        if (practiceCtx.solutionMode) {
          practiceCtx.solutionMode = false;
          renderTabs();
          renderPracticeProblem();
        }
        return;
      }
      saveCurrentEditorCode();
      const { cid, mid, lid, lesson } = practiceCtx;
      location.hash = "#/practice/" + [cid, mid, lid, lesson.practice[idx].id].map(encodeURIComponent).join("/");
    };
  });
  const solutionTabBtn = document.getElementById("solutionTabBtn");
  if (solutionTabBtn) solutionTabBtn.onclick = () => {
    if (practiceCtx.solutionMode) return;
    practiceCtx.solutionMode = true;
    renderTabs();
    renderPracticeProblem();
  };
}

function saveCurrentEditorCode() {
  if (!cmEditor || !practiceCtx || practiceCtx.solutionMode) return;
  // в режиме просмотра решения ничего не сохраняем — иначе затрём код студента эталонным
  const { cid, mid, lid, lesson, activeIdx } = practiceCtx;
  const problem = lesson.practice[activeIdx];
  const key = practiceCodeKey(cid, mid, lid, problem.id);
  practiceCode[key] = cmEditor.getValue();
  savePracticeCode();
}

function renderPracticeProblem() {
  const { cid, mid, lid, lesson, activeIdx, solutionMode } = practiceCtx;
  const problem = lesson.practice[activeIdx];
  const key = practiceCodeKey(cid, mid, lid, problem.id);
  const savedCode = practiceCode[key];

  const graphSpecs = [];
  const body = document.getElementById("practiceBody");
  body.innerHTML =
    '<div class="practice-layout">' +
      '<div class="practice-statement">' + renderMd(problem.statement, graphSpecs) +
        '<div class="practice-tests-list"><h3>Тесты (' + problem.tests.length + ')</h3>' +
        problem.tests.map((t, i) => (
          '<div class="test-case-preview"><b>Тест ' + (i + 1) + '</b><br>' +
          '<span class="hint">вход:</span> <code>' + esc(JSON.stringify(t.input || "")) + '</code><br>' +
          '<span class="hint">ожидается:</span> <code>' + esc(t.expected) + '</code></div>'
        )).join("") +
        '</div>' +
      '</div>' +
      '<div class="practice-editor-col">' +
        (solutionMode
          ? '<p class="hint">💡 Ты смотришь эталонное решение — можно запускать и менять, но это НЕ твой сохранённый код. Нажми вкладку «' + esc(problem.title) + '» ещё раз, чтобы вернуться к своему коду.</p>'
          : "") +
        '<div id="cmHost" class="cm-host"></div>' +
        '<div class="practice-actions">' +
          '<button class="btn btn-accent" id="runTestsBtn">▶ Запустить на всех тестах</button>' +
          (solutionMode ? "" : '<button class="btn" id="resetCodeBtn">↺ Сбросить к заготовке</button>') +
          '<span id="runStatus" class="hint"></span>' +
        '</div>' +
        '<div id="testResults"></div>' +
      '</div>' +
    '</div>';
  mountGraphs(graphSpecs);

  cmEditor = CodeMirror(document.getElementById("cmHost"), {
    value: solutionMode ? problem.solution : (savedCode !== undefined ? savedCode : problem.starterCode),
    mode: "python",
    theme: "material-darker",
    lineNumbers: true,
    matchBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    viewportMargin: Infinity
  });
  let saveTimer = null;
  cmEditor.on("change", () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrentEditorCode, 800);
  });

  const resetBtn = document.getElementById("resetCodeBtn");
  if (resetBtn) resetBtn.onclick = () => {
    if (!confirm("Стереть текущий код и вернуть заготовку?")) return;
    cmEditor.setValue(problem.starterCode);
    saveCurrentEditorCode();
  };

  document.getElementById("runTestsBtn").onclick = async () => {
    const status = document.getElementById("runStatus");
    const resultsBox = document.getElementById("testResults");
    status.textContent = "⏳ Запускаю Python в браузере (первый раз — до нескольких секунд)…";
    resultsBox.innerHTML = "";
    saveCurrentEditorCode();
    try {
      const results = await runPracticeTests(problem, cmEditor.getValue());
      const passed = results.filter(r => r.pass).length;
      if (passed === results.length && !solutionMode) {
        // засчитываем только реальную самостоятельную попытку — не прогон эталонного решения
        const reviewKey = practiceCodeKey(cid, mid, lid, problem.id);
        recordPracticeSuccess(reviewKey);
        const rec = practiceReview[reviewKey];
        status.textContent = "✅ Все тесты пройдены (" + passed + "/" + results.length + ") — следующее повторение: " + formatDue(rec.nextDueAt);
      } else {
        status.textContent = passed === results.length
          ? "✅ Все тесты пройдены (" + passed + "/" + results.length + ")"
          : "❌ Пройдено " + passed + " из " + results.length;
      }
      resultsBox.innerHTML = results.map((r, i) => (
        '<div class="test-result ' + (r.pass ? "test-pass" : "test-fail") + '">' +
        '<b>Тест ' + (i + 1) + (r.pass ? " ✅" : " ❌") + '</b>' +
        (r.pass ? "" :
          '<div><span class="hint">вход:</span> <code>' + esc(JSON.stringify(r.input)) + '</code></div>' +
          '<div><span class="hint">ожидалось:</span> <code>' + esc(r.expected) + '</code></div>' +
          '<div><span class="hint">получено:</span> <code>' + esc(r.actual || r.errorText) + '</code></div>'
        ) +
        '</div>'
      )).join("");
    } catch (e) {
      status.textContent = "⚠️ Не удалось запустить Python в браузере.";
      resultsBox.innerHTML = '<div class="test-result test-fail">' + esc(String(e)) +
        '<br><br>Скорее всего платформа открыта напрямую как файл. Запусти <code>python -m http.server 8000</code> в папке проекта и открой <code>http://localhost:8000</code> — Pyodide работает только по http(s).</div>';
    }
  };
}

/* ---------------- карточки: RemNote / Anki (видео-помощники) ---------------- */

function inboxIcon(item) {
  if (isVideo(item)) return "🎬";
  if (item.url) return "🔗";
  return "📝";
}

function isVideo(item) {
  return !!(item.url && /youtu\.?be|rutube|vk\.com\/video/i.test(item.url));
}

function ytId(url) {
  // ПРИНИМАЕТ ссылку на ютуб в любом виде, ВОЗВРАЩАЕТ id ролика или null
  const m = (url || "").match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Название ролика подтягиваем с noembed.com (обёртка над oEmbed с CORS).
// Работает только онлайн; результат запоминается, так что оффлайн потом тоже показывается.
async function fetchVideoMeta(item) {
  if (!item.url || (item.meta && item.meta.title)) return false;
  try {
    const resp = await fetch("https://noembed.com/embed?url=" + encodeURIComponent(item.url));
    const data = await resp.json();
    if (data && data.title) {
      item.meta = { title: data.title, thumb: data.thumbnail_url || "" };
      saveInbox();
      return true;
    }
  } catch (e) { /* оффлайн или сервис недоступен — покажем то, что ввёл пользователь */ }
  return false;
}

let inboxTab = "all"; // all | video | other

/* ---------------- страница: планирую узнать ---------------- */

function renderInbox() {
  let items = inbox.slice();
  if (inboxTab === "video") items = items.filter(isVideo);
  if (inboxTab === "other") items = items.filter(i => !isVideo(i));
  const fresh = items.filter(i => i.status !== "done").sort((a, b) => b.createdAt - a.createdAt);
  const done = items.filter(i => i.status === "done").sort((a, b) => b.createdAt - a.createdAt);

  const tab = (id, label) => '<button class="btn btn-sm ' + (inboxTab === id ? "btn-accent" : "") + '" data-inb-tab="' + id + '">' + label + '</button>';

  let html = '<div class="page-head"><h1>Планирую узнать</h1>' +
    tab("all", "Все") + tab("video", "🎬 Видео") + tab("other", "📄 Остальное") + '</div>' +
    '<div class="settings-block"><h2>➕ Закинуть идею</h2>' +
    fld("inbTitle", "Что хочу изучить (для ютуб-ссылок название подтянется само)", "", { ph: "Например: как работает DNS" }) +
    fld("inbUrl", "Ссылка (видео, статья, NotebookLM — необязательно)", "", { ph: "https://..." }) +
    fld("inbDur", "Длительность ролика (необязательно)", "", { ph: "12:30" }) +
    fld("inbNote", "Заметка (необязательно)", "", { textarea: true, rows: 3, ph: "Почему заинтересовало, что именно хочу понять" }) +
    '<button class="btn btn-accent" id="inbAddBtn">Добавить</button></div>';

  const freshVideos = fresh.filter(isVideo);
  const freshOther = fresh.filter(i => !isVideo(i));

  if (inboxTab !== "other" && freshVideos.length) {
    html += '<div class="settings-block"><h2>🎬 Видео (' + freshVideos.length + ')</h2><div class="video-grid">';
    for (const it of freshVideos) html += videoCard(it);
    html += '</div></div>';
  }
  if (inboxTab !== "video") {
    html += itemsBlock("В очереди (" + freshOther.length + ")", freshOther, false);
  }
  if (done.length) html += itemsBlock("Изучено (" + done.length + ")", done, true);
  if (inboxTab === "video" && !freshVideos.length && !done.length) {
    html += '<p class="empty">Видео пока нет — кидай ссылку на ютуб в форму выше.</p>';
  }
  app.innerHTML = html;

  function videoCard(it) {
    const id = ytId(it.url);
    const thumb = (it.meta && it.meta.thumb) || (id ? "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg" : "");
    const title = (it.meta && it.meta.title) || it.title;
    return '<div class="video-card">' +
      '<a class="thumb" href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
      (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy" onerror="this.remove()">' : '<span class="thumb-fallback">🎬</span>') +
      (it.duration ? '<span class="dur">' + esc(it.duration) + '</span>' : '') +
      '</a>' +
      '<div class="video-title">' + esc(title) + '</div>' +
      (it.note ? '<div class="video-note">' + esc(it.note) + '</div>' : '') +
      '<div class="video-actions">' +
      '<button class="btn btn-sm" data-inb-ask="' + it.id + '" title="Запрос Claude: сделай из этого урок">🤖</button>' +
      '<button class="btn btn-sm" data-inb-done="' + it.id + '" title="Посмотрел">✓</button>' +
      '<button class="btn btn-sm btn-danger" data-inb-del="' + it.id + '">✕</button>' +
      '</div></div>';
  }

  function itemsBlock(title, items, isDone) {
    let h = '<div class="settings-block"' + (isDone ? ' style="opacity:.65"' : '') + '><h2>' + title + '</h2>';
    if (!items.length) h += '<p>Пусто. Увидел интересное видео или тему — кидай сюда, чтобы не потерять.</p>';
    for (const it of items) {
      const title2 = (it.meta && it.meta.title) || it.title;
      h += '<div class="lesson-row" data-id="' + it.id + '">' +
        '<span class="status">' + inboxIcon(it) + '</span>' +
        '<span style="flex:1">' + (isDone ? '<s>' : '') + esc(title2) + (isDone ? '</s>' : '') +
        (it.url ? ' — <a href="' + esc(it.url) + '" target="_blank" rel="noopener">открыть</a>' : '') +
        (it.duration ? ' <span class="hw-badge">' + esc(it.duration) + '</span>' : '') +
        (it.note ? '<br><span style="color:var(--text-dim);font-size:.84rem">' + esc(it.note) + '</span>' : '') +
        '</span>' +
        '<button class="btn btn-sm" data-inb-ask="' + it.id + '" title="Собрать запрос Claude: сделай из этого урок">🤖</button>' +
        '<button class="btn btn-sm" data-inb-done="' + it.id + '">' + (isDone ? "↩" : "✓") + '</button>' +
        '<button class="btn btn-sm btn-danger" data-inb-del="' + it.id + '">✕</button>' +
        '</div>';
    }
    return h + '</div>';
  }

  document.querySelectorAll("[data-inb-tab]").forEach(b => b.onclick = () => {
    inboxTab = b.dataset.inbTab;
    renderInbox();
  });

  document.getElementById("inbAddBtn").onclick = async () => {
    const title = document.getElementById("inbTitle").value.trim();
    const url = document.getElementById("inbUrl").value.trim();
    if (!title && !url) { toast("Напиши тему или вставь ссылку"); return; }
    const item = {
      id: slugify(title || url),
      title: title || url,
      url,
      duration: document.getElementById("inbDur").value.trim(),
      note: document.getElementById("inbNote").value.trim(),
      status: "new",
      createdAt: Date.now()
    };
    inbox.push(item);
    saveInbox();
    renderInbox();
    if (await fetchVideoMeta(item)) renderInbox(); // название подтянулось — перерисуем
  };

  // дотягиваем названия для видео, добавленных оффлайном
  (async () => {
    let changed = false;
    for (const it of inbox) if (isVideo(it)) changed = (await fetchVideoMeta(it)) || changed;
    if (changed && (location.hash || "#/").startsWith("#/inbox")) renderInbox();
  })();

  document.querySelectorAll("[data-inb-done]").forEach(b => b.onclick = () => {
    const it = inbox.find(i => i.id === b.dataset.inbDone);
    if (it) { it.status = it.status === "done" ? "new" : "done"; saveInbox(); renderInbox(); }
  });
  document.querySelectorAll("[data-inb-del]").forEach(b => b.onclick = () => {
    inbox = inbox.filter(i => i.id !== b.dataset.inbDel);
    saveInbox(); renderInbox();
  });
  document.querySelectorAll("[data-inb-ask]").forEach(b => b.onclick = () => {
    const it = inbox.find(i => i.id === b.dataset.inbAsk);
    if (!it) return;
    openAskModal(
      "Хочу разобраться в теме: " + it.title +
      (it.url ? "\nИсточник: " + it.url : "") +
      (it.note ? "\nМоя заметка: " + it.note : ""),
      "Сделай из этого урок для моего Learning Tool (в файл content/*.js подходящего курса): объясни тему с нуля, добавь примеры и домашку. Если тема тянет на несколько уроков — предложи разбивку."
    );
  });
}

/* ---------------- страница: повторение практики ---------------- */

function renderReview() {
  const courses = effectiveContent();
  const now = Date.now();
  const due = [], upcoming = [], neverTried = [];

  for (const c of courses) {
    for (const { mod, lesson } of flatLessons(c)) {
      if (!lesson.practice || !lesson.practice.length) continue;
      for (const p of lesson.practice) {
        const key = practiceCodeKey(c.id, mod.id, lesson.id, p.id);
        const rec = practiceReview[key];
        const item = { course: c, mod, lesson, problem: p, rec, key };
        if (!rec) neverTried.push(item);
        else if (rec.nextDueAt <= now) due.push(item);
        else upcoming.push(item);
      }
    }
  }
  due.sort((a, b) => a.rec.nextDueAt - b.rec.nextDueAt);
  upcoming.sort((a, b) => a.rec.nextDueAt - b.rec.nextDueAt);

  const practiceUrl = it => "#/practice/" + [it.course.id, it.mod.id, it.lesson.id, it.problem.id].map(encodeURIComponent).join("/");

  let html = '<div class="page-head"><h1>🔁 Повторение</h1></div>' +
    '<div class="settings-block"><h2>Как это работает</h2>' +
    '<p>Каждый раз, когда ты успешно проходишь все тесты в «Практике», следующее повторение планируется автоматически: 1 день → 3 дня → 7 дней → 14 дней → 30 дней после каждого успеха (чем увереннее решаешь — тем реже повторяем, как в интервальных повторениях). Здесь — что пора повторить сегодня.</p>' +
    '<p>Хочешь больше задач того же типа, чем есть на платформе — открой официальный банк заданий: ' +
    '<a href="https://inf-ege.sdamgia.ru/prob_catalog" target="_blank" rel="noopener">каталог заданий на Решу ЕГЭ</a>.</p>' +
    '</div>';

  html += '<div class="settings-block"><h2>Пора повторить (' + due.length + ')</h2>';
  if (!due.length) {
    html += '<p>Ничего не просрочено — всё повторено вовремя. 🎉</p>';
  }
  for (const it of due) {
    html += '<div class="lesson-row">' +
      '<span class="status">🔁</span>' +
      '<span style="flex:1"><a href="' + practiceUrl(it) + '">' + esc(it.lesson.title) + ' — ' + esc(it.problem.title) + '</a>' +
      '<br><span class="hint">' + esc(it.course.title) + ' · пройдено успешно ' + it.rec.successCount + ' раз(а), ждало с ' + formatDue(it.rec.nextDueAt) + '</span></span>' +
      '<a class="btn btn-sm btn-accent" href="' + practiceUrl(it) + '">Повторить</a>' +
      '</div>';
  }
  html += '</div>';

  if (upcoming.length) {
    html += '<div class="settings-block" style="opacity:.75"><h2>Скоро (' + upcoming.length + ')</h2>';
    for (const it of upcoming) {
      html += '<div class="lesson-row">' +
        '<span class="status">⏳</span>' +
        '<span style="flex:1"><a href="' + practiceUrl(it) + '">' + esc(it.lesson.title) + ' — ' + esc(it.problem.title) + '</a>' +
        '<br><span class="hint">' + esc(it.course.title) + ' · следующее повторение: ' + formatDue(it.rec.nextDueAt) + '</span></span>' +
        '</div>';
    }
    html += '</div>';
  }

  if (neverTried.length) {
    html += '<div class="settings-block" style="opacity:.6"><h2>Ещё не пройдено (' + neverTried.length + ')</h2>';
    for (const it of neverTried) {
      html += '<div class="lesson-row">' +
        '<span class="status">⚪</span>' +
        '<span style="flex:1"><a href="' + practiceUrl(it) + '">' + esc(it.lesson.title) + ' — ' + esc(it.problem.title) + '</a>' +
        '<br><span class="hint">' + esc(it.course.title) + '</span></span>' +
        '</div>';
    }
    html += '</div>';
  }

  app.innerHTML = html;
}

/* ---------------- страница: статистика ---------------- */

function renderStats() {
  const courses = effectiveContent();
  let doneTotal = 0, lessonsTotal = 0, hwChecked = 0, hwSent = 0;
  for (const c of courses) {
    for (const { mod, lesson } of flatLessons(c)) {
      lessonsTotal++;
      const p = progress[keyOf(c.id, mod.id, lesson.id)];
      if (p && p.status === "done") doneTotal++;
      if (p && p.hw === "checked") hwChecked++;
      if (p && p.hw === "sent") hwSent++;
    }
  }
  const daysVisited = Object.keys(visits).length;
  const totalVisits = Object.values(visits).reduce((a, b) => a + b, 0);

  let html = '<div class="page-head"><h1>Статистика</h1></div>' +
    '<div class="stats-grid">' +
    tile(calcStreak() + " 🔥", "стрик (дней подряд)") +
    tile(daysVisited, "дней занимался") +
    tile(totalVisits, "всего заходов") +
    tile(doneTotal + " / " + lessonsTotal, "уроков пройдено") +
    tile(hwChecked, "ДЗ проверено") +
    tile(hwSent, "ДЗ ждёт проверки") +
    '</div>';

  // тепловая карта последних 12 недель
  html += '<div class="heatmap-wrap"><h2 style="font-size:1.05rem;margin-bottom:4px">Активность за 12 недель</h2><div class="heatmap">';
  const d = new Date();
  d.setDate(d.getDate() - 83);
  for (let i = 0; i < 84; i++) {
    const k = todayKey(d);
    const v = visits[k] || 0;
    const cls = v === 0 ? "" : v === 1 ? "v1" : v <= 3 ? "v2" : "v3";
    html += '<div class="day ' + cls + '" title="' + k + ": " + v + '"></div>';
    d.setDate(d.getDate() + 1);
  }
  html += '</div></div>';

  html += '<div class="heatmap-wrap"><h2 style="font-size:1.05rem;margin-bottom:8px">Прохождение по направлениям</h2>';
  for (const c of courses) {
    const pr = courseProgress(c);
    html += '<div class="course-stat-row"><span class="name">' + esc(c.title) + '</span>' +
      '<div class="progress"><div style="width:' + pr.pct + '%;background:' + c.color + '"></div></div>' +
      '<span class="pct">' + pr.done + '/' + pr.total + ' · ' + pr.pct + '%</span></div>';
  }
  html += '</div>';

  app.innerHTML = html;

  function tile(num, lbl) {
    return '<div class="stat-tile"><div class="num">' + num + '</div><div class="lbl">' + lbl + '</div></div>';
  }
}

/* ---------------- страница: настройки ---------------- */

function renderSettings() {
  const asText = {
    on: "✅ Включено — файл learning-tool-autosave.json обновляется при каждом изменении.",
    paused: "⏸ Приостановлено — браузер просит заново подтвердить доступ к папке.",
    off: "Выключено. Всё и так автоматически сохраняется в браузере (localStorage) — это дополнительная копия в файл на диске на случай очистки браузера.",
    unsupported: "Твой браузер не поддерживает запись в файлы (нужен Chrome/Edge/Яндекс). Пользуйся экспортом ниже."
  }[autosaveState];

  app.innerHTML = '<div class="page-head"><h1>Настройки и данные</h1></div>' +

    '<div class="settings-block"><h2>💾 Автосохранение на диск</h2>' +
    '<p>' + asText + '</p>' +
    (autosaveState === "paused"
      ? '<button class="btn btn-accent" id="autosaveResumeBtn">Возобновить</button> '
      : '') +
    (autosaveState === "unsupported"
      ? ''
      : '<button class="btn" id="autosaveBtn">' + (autosaveState === "on" ? "Сменить папку" : "📁 Выбрать папку и включить") + '</button>') +
    '</div>' +

    '<div class="settings-block"><h2>💾 Резервная копия</h2>' +
    '<p>Прогресс и твои правки живут в localStorage браузера. Экспортируй их время от времени — файл можно перенести на другой компьютер или прислать Claude, чтобы синхронизировать контент в репозиторий.</p>' +
    '<button class="btn" id="exportBtn">⬇ Экспорт (JSON)</button> ' +
    '<label class="btn" style="display:inline-block">⬆ Импорт<input type="file" id="importFile" accept=".json" style="display:none"></label></div>' +

    '<div class="settings-block"><h2>♻️ Восстановление</h2>' +
    '<p>Если удалил встроенный урок или курс и передумал — можно вернуть весь встроенный контент (твои собственные курсы и прогресс не тронутся).</p>' +
    '<button class="btn" id="restoreBtn">Восстановить встроенный контент</button></div>' +

    '<div class="settings-block"><h2>🗑 Сброс</h2>' +
    '<p>Полное обнуление прогресса и статистики (контент останется).</p>' +
    '<button class="btn btn-danger" id="resetBtn">Сбросить прогресс и статистику</button></div>' +

    '<div class="settings-block"><h2>📥 Как добавляется материал</h2>' +
    '<p>Основной материал лежит в файлах <code>content/*.js</code> в репозитории. Схема описана в <code>content/manifest.js</code>. ' +
    'Рабочий цикл: просишь Claude добавить урок → он коммитит в репозиторий → ты делаешь <code>git pull</code> → обновляешь страницу. ' +
    'Свои заметки и правки можно делать прямо здесь через «Редактировать» — они хранятся локально и попадают в экспорт.</p></div>';

  const autosaveBtn = document.getElementById("autosaveBtn");
  if (autosaveBtn) autosaveBtn.onclick = () => enableAutosave().then(route);
  const autosaveResumeBtn = document.getElementById("autosaveResumeBtn");
  if (autosaveResumeBtn) autosaveResumeBtn.onclick = resumeAutosave;

  document.getElementById("exportBtn").onclick = () => {
    const data = backupData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "learning-tool-backup-" + todayKey() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  document.getElementById("importFile").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.progress) { progress = data.progress; saveProgress(); }
        if (data.visits) { visits = data.visits; saveVisits(); }
        if (data.user) { user = data.user; saveUser(); }
        if (data.inbox) { inbox = data.inbox; saveInbox(); }
        if (data.practiceCode) { practiceCode = data.practiceCode; savePracticeCode(); }
        if (data.practiceReview) { practiceReview = data.practiceReview; savePracticeReview(); }
        toast("Импортировано ✅");
        route();
      } catch (err) {
        toast("Не получилось прочитать файл");
      }
    };
    reader.readAsText(file);
  };
  document.getElementById("restoreBtn").onclick = () => {
    user.deleted = user.deleted.filter(k => {
      // оставляем только удаления, относящиеся к пользовательским курсам
      const cid = k.split("::")[0];
      return user.courses.some(c => c.id === cid);
    });
    user.overrides = {};
    saveUser();
    toast("Встроенный контент восстановлен");
  };
  document.getElementById("resetBtn").onclick = () => {
    if (!confirm("Точно сбросить весь прогресс и статистику?")) return;
    progress = {}; visits = {};
    saveProgress(); saveVisits();
    toast("Прогресс сброшен");
  };
}

/* ---------------- удаление ---------------- */

function deleteEntity(key) {
  const cid = key.split("::")[0];
  const userCourse = user.courses.find(c => c.id === cid);
  if (userCourse) {
    // сущность из пользовательского курса — удаляем прямо из структуры
    const [, mid, lid] = key.split("::");
    if (!mid) {
      user.courses = user.courses.filter(c => c.id !== cid);
    } else if (!lid) {
      userCourse.modules = userCourse.modules.filter(m => m.id !== mid);
    } else {
      const m = userCourse.modules.find(m => m.id === mid);
      if (m) m.lessons = m.lessons.filter(l => l.id !== lid);
    }
  } else {
    // встроенное — проверяем, не добавлено ли оно пользователем поверх встроенного курса
    const [, mid, lid] = key.split("::");
    const addedModules = user.addModules[cid] || [];
    const addedLessons = user.addLessons[keyOf(cid, mid)] || [];
    if (lid && addedLessons.some(l => l.id === lid)) {
      user.addLessons[keyOf(cid, mid)] = addedLessons.filter(l => l.id !== lid);
    } else if (mid && !lid && addedModules.some(m => m.id === mid)) {
      user.addModules[cid] = addedModules.filter(m => m.id !== mid);
      delete user.addLessons[keyOf(cid, mid)];
    } else if (!user.deleted.includes(key)) {
      user.deleted.push(key); // встроенный контент — ставим "надгробие"
    }
  }
  saveUser();
}

/* ---------------- модалка: Спросить Claude ---------------- */

const askModal = document.getElementById("askModal");

function openAskModal(context, question) {
  document.getElementById("askContext").value = context || "";
  document.getElementById("askQuestion").value = question || "";
  document.getElementById("askHint").textContent = "";
  askModal.classList.remove("hidden");
  document.getElementById("askQuestion").focus();
}

document.getElementById("askClaudeBtn").onclick = () => {
  // если открыт урок — контекст подставит кнопка на странице урока; тут общий случай
  openAskModal("", "");
};

document.getElementById("askCopyBtn").onclick = () => {
  const ctx = document.getElementById("askContext").value.trim();
  const q = document.getElementById("askQuestion").value.trim();
  const fmt = document.getElementById("askFormat").checked;
  if (!q && !ctx) { toast("Напиши хотя бы вопрос 🙂"); return; }
  let text = "";
  if (ctx) text += "КОНТЕКСТ:\n" + ctx + "\n\n";
  text += "ВОПРОС:\n" + (q || "(см. контекст)");
  if (fmt) text += "\n\nФормат ответа: объясняй конструкции подробно — что функция принимает на вход, что возвращает, что выведет; в примерах кода комментируй каждую новую конструкцию; если в синтаксисе есть место для типа или имени — покажи, что туда можно подставить.";
  copyText(text).then(ok => {
    document.getElementById("askHint").textContent = ok ? "Скопировано! Вставь в чат с Claude." : "Не удалось скопировать — выдели и скопируй вручную.";
    if (ok) toast("Скопировано 📋");
  });
};

/* ---------------- модалка: редакторы ---------------- */

const editModal = document.getElementById("editModal");
const editBody = document.getElementById("editBody");
const editTitleEl = document.getElementById("editTitle");
let editSaveHandler = null;

document.getElementById("editSaveBtn").onclick = () => { if (editSaveHandler) editSaveHandler(); };

document.querySelectorAll("[data-close-modal]").forEach(b => {
  b.onclick = () => b.closest(".modal-backdrop").classList.add("hidden");
});
document.querySelectorAll(".modal-backdrop").forEach(bd => {
  bd.addEventListener("click", e => { if (e.target === bd) bd.classList.add("hidden"); });
});

function fld(id, label, value, opts) {
  opts = opts || {};
  if (opts.textarea) {
    return '<label class="field"><span>' + label + '</span><textarea id="' + id + '" rows="' + (opts.rows || 10) +
      '" class="' + (opts.code ? "code" : "") + '" placeholder="' + (opts.ph || "") + '">' + esc(value || "") + '</textarea></label>';
  }
  return '<label class="field"><span>' + label + '</span><input type="text" id="' + id + '" value="' + esc(value || "") +
    '" placeholder="' + (opts.ph || "") + '"></label>';
}

function openCourseEditor(course) {
  editTitleEl.textContent = course ? "Редактировать курс" : "Новый курс";
  editBody.innerHTML =
    fld("efTitle", "Название", course && course.title, { ph: "Например: Физика" }) +
    fld("efDesc", "Описание", course && course.description, { ph: "Пара слов о курсе" }) +
    fld("efColor", "Цвет (hex)", (course && course.color) || "#7c6cf0");
  editModal.classList.remove("hidden");
  editSaveHandler = () => {
    const title = document.getElementById("efTitle").value.trim();
    if (!title) { toast("Нужно название"); return; }
    if (course) {
      course.title = title;
      course.description = document.getElementById("efDesc").value.trim();
      course.color = document.getElementById("efColor").value.trim() || "#7c6cf0";
    } else {
      user.courses.push({
        id: slugify(title),
        title,
        description: document.getElementById("efDesc").value.trim(),
        color: document.getElementById("efColor").value.trim() || "#7c6cf0",
        modules: []
      });
    }
    saveUser();
    editModal.classList.add("hidden");
    route();
  };
}

function openModuleEditor(cid, mod) {
  editTitleEl.textContent = mod ? "Редактировать модуль" : "Новый модуль";
  editBody.innerHTML = fld("efTitle", "Название модуля", mod && mod.title, { ph: "Например: Модуль 3. Структуры" });
  editModal.classList.remove("hidden");
  editSaveHandler = () => {
    const title = document.getElementById("efTitle").value.trim();
    if (!title) { toast("Нужно название"); return; }
    const userCourse = user.courses.find(c => c.id === cid);
    if (userCourse) {
      userCourse.modules.push({ id: slugify(title), title, lessons: [] });
    } else {
      if (!user.addModules[cid]) user.addModules[cid] = [];
      user.addModules[cid].push({ id: slugify(title), title, lessons: [] });
    }
    saveUser();
    editModal.classList.add("hidden");
    route();
  };
}

function openLessonEditor(cid, mid, lesson) {
  editTitleEl.textContent = lesson ? "Редактировать урок" : "Новый урок";
  editBody.innerHTML =
    fld("efTitle", "Название урока", lesson && lesson.title) +
    fld("efTheory", "Материал (markdown: ## заголовки, ```код```, **жирный**, списки, таблицы)", lesson && lesson.theory, { textarea: true, rows: 16, code: true }) +
    fld("efHw", "Домашнее задание (необязательно)", lesson && lesson.homework, { textarea: true, rows: 5, code: true }) +
    fld("efCards", "Карточки для RemNote/Anki: по одной на строку, «вопрос >> ответ»", lesson && lesson.cards ? lesson.cards.map(c => c.q + " >> " + c.a).join("\n") : "", { textarea: true, rows: 5, code: true, ph: "Что возвращает input() в Python? >> Всегда строку (str)" });
  editModal.classList.remove("hidden");
  editSaveHandler = () => {
    const title = document.getElementById("efTitle").value.trim();
    if (!title) { toast("Нужно название"); return; }
    const theory = document.getElementById("efTheory").value;
    const homework = document.getElementById("efHw").value;
    const cards = document.getElementById("efCards").value.split("\n")
      .map(line => {
        const sep = line.indexOf(">>");
        if (sep === -1) return null;
        return { q: line.slice(0, sep).trim(), a: line.slice(sep + 2).trim() };
      })
      .filter(c => c && c.q && c.a);
    const userCourse = user.courses.find(c => c.id === cid);

    if (lesson) {
      if (userCourse) {
        const m = userCourse.modules.find(m => m.id === mid);
        const l = m && m.lessons.find(l => l.id === lesson.id);
        if (l) { l.title = title; l.theory = theory; l.homework = homework; l.cards = cards; }
      } else {
        const added = (user.addLessons[keyOf(cid, mid)] || []).find(l => l.id === lesson.id);
        if (added) {
          added.title = title; added.theory = theory; added.homework = homework; added.cards = cards;
        } else {
          user.overrides[keyOf(cid, mid, lesson.id)] = { title, theory, homework, cards };
        }
      }
    } else {
      const newLesson = { id: slugify(title), title, theory, homework, cards };
      if (userCourse) {
        const m = userCourse.modules.find(m => m.id === mid);
        if (m) m.lessons.push(newLesson);
      } else {
        const k = keyOf(cid, mid);
        if (!user.addLessons[k]) user.addLessons[k] = [];
        user.addLessons[k].push(newLesson);
      }
    }
    saveUser();
    editModal.classList.add("hidden");
    route();
  };
}

/* ---------------- запуск ---------------- */

logVisit();
window.addEventListener("hashchange", route);
initAutosave().then(() => {
  if ((location.hash || "").startsWith("#/settings")) route();
});
route();

// сервис-воркер для оффлайна (работает только по http/https, не с file://)
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
