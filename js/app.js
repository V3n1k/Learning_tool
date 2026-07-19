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
// «Песочница» — свободный холст GeoGebra для черновиков; хранится как base64-снимок
// построения (формат самой GeoGebra, отдаёт/принимает через getBase64()/setBase64()).
let sandboxGgb = LS.get("lt_sandbox_ggb", "");

function saveProgress() { LS.set("lt_progress", progress); scheduleAutosave(); }
function saveVisits() { LS.set("lt_visits", visits); scheduleAutosave(); }
function saveUser() { LS.set("lt_user", user); scheduleAutosave(); }
function saveInbox() { LS.set("lt_inbox", inbox); scheduleAutosave(); }
function savePracticeReview() { LS.set("lt_practice_review", practiceReview); scheduleAutosave(); }
function savePracticeCode() { LS.set("lt_practice_code", practiceCode); scheduleAutosave(); }
function saveSandboxGgb() { LS.set("lt_sandbox_ggb", sandboxGgb); scheduleAutosave(); }

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
  return { exportedAt: new Date().toISOString(), progress, visits, user, inbox, practiceCode, practiceReview, sandboxGgb };
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
    const course = { id: src.id, title: src.title, color: src.color, description: src.description, builtin: true, modules: [], theory: src.theory || [] };
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
          practice: l.practice || [],
          theoryRefs: l.theoryRefs || []
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

/* ---------------- «сухая теория»: страница на модуль + сводная шпаргалка ----------------
 * course.theory — массив { id (= id модуля, к которому привязана страница), title, items: [{id, title, body}] }.
 * Урок ссылается на конкретные пункты через lesson.theoryRefs: ["moduleTheoryId:itemId", ...] —
 * это и подсвечивается в правой панели урока (см. theoryRailHtml). */

function findTheoryPage(course, pageId) {
  return (course.theory || []).find(p => p.id === pageId);
}

function findTheoryItem(course, ref) {
  // ПРИНИМАЕТ: строку вида "moduleId:itemId". ВОЗВРАЩАЕТ: {page, item} или null, если не найдено.
  const sep = ref.indexOf(":");
  if (sep < 0) return null;
  const pageId = ref.slice(0, sep), itemId = ref.slice(sep + 1);
  const page = findTheoryPage(course, pageId);
  if (!page) return null;
  const item = (page.items || []).find(i => i.id === itemId);
  return item ? { page, item } : null;
}

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
  // экранированного текста markdown (например, код внутри блока ```geogebra)
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
  // описания блоков ```geogebra для последующей отрисовки после вставки в DOM
  // (сам renderMd возвращает только строку HTML и не может исполнять JS).
  // Сам график в текст НЕ вставляется — вместо него ставится кликабельная
  // плашка-ссылка, а сама доска монтируется в боковую панель (см. renderGraphRail).
  const lines = esc(text.replace(/\r\n/g, "\n")).split("\n");
  const out = [];
  let i = 0;
  let listType = null; // "ul" | "ol"

  function closeList() {
    if (listType) { out.push("</" + listType + ">"); listType = null; }
  }

  while (i < lines.length) {
    const line = lines[i];

    // блок кода ``` (или ```geogebra — интерактивный график/чертёж, GeoGebra)
    let fenceMatch;
    if ((fenceMatch = line.match(/^```(\w+)?(.*)$/))) {
      closeList();
      const lang = (fenceMatch[1] || "").toLowerCase();
      const restOfLine = (fenceMatch[2] || "").trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // пропускаем закрывающие ```

      if (lang === "geogebra") {
        let options = {};
        if (restOfLine) {
          try { options = JSON.parse(unesc(restOfLine)); } catch (e) { /* некорректный JSON — используем настройки по умолчанию */ }
        }
        // каждая непустая строка (кроме начинающихся с #) — отдельная GeoGebra-команда (evalCommand)
        const commands = unesc(buf.join("\n")).split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
        const id = "ggb-" + Math.random().toString(36).slice(2, 10);
        const n = graphSpecs ? graphSpecs.length + 1 : 0;
        if (graphSpecs) graphSpecs.push({ id, options, commands, n });
        // options.title (необязательный) — короткое человеческое название графика
        // ("Куб", "Угол между касательной и хордой" и т.п.) вместо голого "График N"
        const chipText = options.title ? esc(options.title) : "Открыть график " + n;
        out.push('<p><a class="graph-ref" data-graph-ref="' + id + '">📐 ' + chipText + ' →</a></p>');
        continue;
      }

      if (lang === "graph") {
        // свой лёгкий SVG-рендерер графов (вершины/рёбра) — offline, без GeoGebra;
        // синтаксис строк: "V id [подпись]" и "E from to [вес]"
        let options = {};
        if (restOfLine) {
          try { options = JSON.parse(unesc(restOfLine)); } catch (e) { /* по умолчанию */ }
        }
        const spec = parseGraphBody(unesc(buf.join("\n")));
        spec.directed = !!options.directed;
        out.push(graphSvg(spec, options));
        continue;
      }

      if (lang === "truthtable") {
        // интерактивная таблица истинности: тело — булево выражение (¬ ∧ ∨ → ↔),
        // переменные определяются автоматически (заглавные латинские буквы)
        let options = {};
        if (restOfLine) {
          try { options = JSON.parse(unesc(restOfLine)); } catch (e) { /* по умолчанию */ }
        }
        const expr = unesc(buf.join("\n")).trim();
        out.push(truthTableHtml(expr, options));
        continue;
      }

      if (lang === "adjmatrix") {
        // интерактивная таблица смежности, опционально с картинкой графа сверху
        // (тот же синтаксис "V"/"E", что и у ```graph)
        let options = {};
        if (restOfLine) {
          try { options = JSON.parse(unesc(restOfLine)); } catch (e) { /* по умолчанию */ }
        }
        const spec = parseGraphBody(unesc(buf.join("\n")));
        spec.directed = !!options.directed;
        out.push(adjMatrixHtml(spec, options));
        continue;
      }

      if (lang === "table") {
        // общая интерактивная таблица с произвольными подписями строк/столбцов
        // (экспортируется конструктором таблиц в Песочнице); тело — строки через
        // запятую, "-"/"—" — заблокированная ячейка
        let options = {};
        if (restOfLine) {
          try { options = JSON.parse(unesc(restOfLine)); } catch (e) { /* по умолчанию */ }
        }
        out.push(tableHtml(options, unesc(buf.join("\n"))));
        continue;
      }

      if (lang === "flashcards") {
        // флеш-карточки-перевёртыши (курс английского): строки "en | ipa | ru | пример"
        out.push(flashcardsHtml(unesc(buf.join("\n"))));
        continue;
      }

      if (lang === "grammar") {
        // грамматическая карточка: options {title, formula}; тело — описание + примеры (строки "* ...")
        let options = {};
        if (restOfLine) {
          try { options = JSON.parse(unesc(restOfLine)); } catch (e) { /* по умолчанию */ }
        }
        out.push(grammarHtml(options, unesc(buf.join("\n"))));
        continue;
      }

      if (lang === "quiz") {
        // вопрос с выбором ответа: тело — вопрос, затем варианты ("+ верный" / "- неверный")
        out.push(quizHtml(unesc(buf.join("\n"))));
        continue;
      }

      if (lang === "blank") {
        // вставь пропущенное слово: тело — предложение с ___, затем строки "= ответ | вариант"
        out.push(blankHtml(unesc(buf.join("\n"))));
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

/* ---------------- свои модальные диалоги (замена confirm()/prompt() браузера) ----------------
 * Нативные confirm()/prompt() браузер может заблокировать (после нескольких подряд
 * показывает чекбокс "не показывать больше диалоги на этой странице" — пользователь
 * может случайно его отметить, и дальше функция молча возвращает false/null без
 * всякой видимой причины, кнопки как будто перестают работать). Свои диалоги этой
 * проблемы не имеют и визуально вписаны в тему приложения. */

function showModal(bodyHtml, wireFn) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = '<div class="modal-box">' + bodyHtml + "</div>";
    document.body.appendChild(overlay);
    const close = (result) => {
      overlay.remove();
      document.removeEventListener("keydown", onEsc);
      resolve(result);
    };
    const onEsc = (e) => { if (e.key === "Escape") close(null); };
    document.addEventListener("keydown", onEsc);
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(null); });
    wireFn(overlay, close);
  });
}

function askConfirm(message, okLabel) {
  return showModal(
    '<p class="modal-msg">' + esc(message) + '</p>' +
    '<div class="modal-actions"><button class="btn" data-cancel>Отмена</button>' +
    '<button class="btn btn-accent" data-ok>' + esc(okLabel || "Да") + "</button></div>",
    (overlay, close) => {
      overlay.querySelector("[data-cancel]").onclick = () => close(false);
      const okBtn = overlay.querySelector("[data-ok]");
      okBtn.onclick = () => close(true);
      okBtn.focus();
    }
  ).then(r => r === true);
}

function askPrompt(message, defaultValue) {
  return showModal(
    '<p class="modal-msg">' + esc(message) + '</p>' +
    '<input type="text" class="modal-input" data-input value="' + esc(defaultValue || "") + '">' +
    '<div class="modal-actions"><button class="btn" data-cancel>Отмена</button><button class="btn btn-accent" data-ok>OK</button></div>',
    (overlay, close) => {
      const input = overlay.querySelector("[data-input]");
      overlay.querySelector("[data-cancel]").onclick = () => close(null);
      overlay.querySelector("[data-ok]").onclick = () => close(input.value);
      input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); close(input.value); } };
      input.focus();
      input.select();
    }
  );
}

function slugify(s) {
  const map = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
  const base = s.toLowerCase().split("").map(ch => map[ch] !== undefined ? map[ch] : ch).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
  return (base || "item") + "-" + Date.now().toString(36);
}

/* ---------------- интерактивные графики (GeoGebra) ---------------- */
// Требует интернет (грузится с geogebra.org) — сознательный отказ от офлайн-режима
// именно для этой фичи, т.к. никакой самодельный или урезанный офлайн-движок
// не даёт настоящей интерактивности (перетаскивание, слайдеры, свои построения).

function graphRailHtml(specs) {
  // ПРИНИМАЕТ: массив {id, options, commands, n}, собранный renderMd() из блоков ```geogebra.
  // ВОЗВРАЩАЕТ: HTML боковой панели (пусто, если графиков в уроке нет).
  // Карточки свёрнуты по умолчанию (как модули в списке тем курса) — иначе при
  // нескольких графиках рельса становится намного длиннее текста урока и уезжает
  // из синхронизации со скроллом; свёрнутый вид также экономит место под сам
  // апплет, когда его всё-таки раскрывают.
  if (!specs || !specs.length) return "";
  return '<div class="lesson-graphs-rail">' + specs.map(spec => {
    const label = "График " + spec.n + (spec.options.title ? " — " + esc(spec.options.title) : "");
    return '<div class="ggb-card" id="card-' + spec.id + '">' +
      '<div class="ggb-card-head" data-graph-toggle="' + spec.id + '">' +
        '<span class="chev">▶</span><span class="ggb-card-label">📐 ' + label + '</span>' +
      '</div>' +
      '<div class="ggb-card-body"><div id="' + spec.id + '" class="ggb-board"></div></div>' +
    '</div>';
  }).join("") + '</div>';
}

const geogebraRegistry = new Map(); // id спека -> {id, options, commands, n}, для ленивой отрисовки апплета
const geogebraApi = new Map(); // id спека -> live GGBApplet API, для Ctrl+Z (см. wireGraphUndo)
let hoveredGraphId = null;

function mountGeogebra(specs) {
  // ВЫЗЫВАТЬ ТОЛЬКО ПОСЛЕ того, как соответствующий HTML (из graphRailHtml) уже вставлен в DOM.
  // Сам GGBApplet не создаётся здесь — только регистрируется и будет инициализирован
  // при первом раскрытии карточки (mountGeogebraOne), чтобы не грузить сразу N апплетов.
  if (!specs || !specs.length) return;
  for (const spec of specs) geogebraRegistry.set(spec.id, spec);
  wireGraphToggles();
  wireGraphUndo();
}

function mountGeogebraOne(spec) {
  const el = document.getElementById(spec.id);
  if (!el || el.dataset.mounted) return;
  el.dataset.mounted = "1";
  if (!window.GGBApplet) {
    el.innerHTML = '<p class="hint">GeoGebra не загрузилась — нужен интернет (график грузится с geogebra.org).</p>';
    return;
  }
  const params = Object.assign({
    appName: "geometry",
    // минимум ~420 — при более узком контейнере GeoGebra ("geometry") молча
    // прячет слайдеры (компактный режим), см. комментарий в style.css у .ggb-board
    width: Math.max(el.clientWidth || 0, 420),
    height: 460,
    showToolBar: false,
    showAlgebraInput: false,
    showMenuBar: false,
    showResetIcon: true,
    enableRightClick: false,
    language: "ru",
    appletOnLoad: function (api) {
      geogebraApi.set(spec.id, api); // используется в wireGraphUndo() для Ctrl+Z наведённого графика
      // api.undo() молча ничего не делает, пока в конструкции не был "активирован"
      // менеджер истории — эмпирически (см. scratchpad/check_undo*.js) он включается
      // побочным эффектом от registerStoreUndoListener(), и включить его нужно ДО
      // того, как пользователь начнёт тащить точку, иначе именно это перетаскивание
      // не попадёт в историю и Ctrl+Z будет работать "не с первого раза".
      try { api.registerStoreUndoListener(function () {}); } catch (e) { /* игнорируем */ }
      // И "3d", и "geometry" по умолчанию показывают ещё и панель Алгебры (список
      // созданных объектов) поверх/под самим видом — в узкой карточке рельсы это
      // разваливает layout: большая пустая область + обрезанные строки переменных
      // вместо самого рисунка. Коды перспективы "только вид, без Алгебры" подобраны
      // эмпирически (см. scratchpad/ggb_persp_test.html, ggb_2d_persp_test.html) —
      // "T" для 3D, "G" для 2D; в официальной API-доке они не задокументированы.
      if (spec.options.appName === "3d") {
        try { api.setPerspective("T"); } catch (e) { /* игнорируем */ }
      } else {
        try { api.setPerspective("G"); } catch (e) { /* игнорируем */ }
        // координатные оси у app "geometry" по умолчанию выключены (это инструмент
        // для чистых геометрических построений) — включаем только там, где график
        // явно про координаты/тригонометрию (options.showAxes: true в content/*.js)
        if (spec.options.showAxes) {
          try { api.setAxesVisible(true, true); } catch (e) { /* игнорируем */ }
        }
      }
      // spec.commands — GeoGebra-команды автора урока (доверенные, из content/*.js).
      for (const cmd of spec.commands) {
        try { api.evalCommand(cmd); } catch (e) { /* пропускаем некорректную отдельную команду, не рушим весь график */ }
      }
      // "SetCoordSystem" как строковая команда не входит в словарь app "geometry" —
      // границы видимой области задаются отдельно, через options.coordSystem: [xMin,xMax,yMin,yMax]
      if (Array.isArray(spec.options.coordSystem) && spec.options.coordSystem.length === 4) {
        try { api.setCoordSystem(...spec.options.coordSystem); } catch (e) { /* игнорируем */ }
      }
    }
  }, spec.options);
  try {
    new GGBApplet(params, true).inject(spec.id);
  } catch (e) {
    el.innerHTML = '<p class="hint">Не удалось построить график: ' + esc(String(e)) + '</p>';
  }
}

function openGraphCard(id) {
  const card = document.getElementById("card-" + id);
  if (!card) return null;
  if (!card.classList.contains("open")) {
    card.classList.add("open");
    const spec = geogebraRegistry.get(id);
    if (spec) mountGeogebraOne(spec);
  }
  return card;
}

function wireGraphToggles() {
  document.querySelectorAll("[data-graph-toggle]").forEach(head => {
    if (head._wired) return;
    head._wired = true;
    head.onclick = () => {
      const id = head.dataset.graphToggle;
      const card = document.getElementById("card-" + id);
      if (!card) return;
      if (card.classList.contains("open")) card.classList.remove("open");
      else openGraphCard(id);
    };
  });
}

function wireGraphUndo() {
  // Ctrl+Z (Cmd+Z на Mac) отменяет последнее действие (перетаскивание точки и т.п.)
  // в графике, над которым сейчас курсор — GGBApplet.undo() работает независимо от
  // видимости тулбара, просто нет штатной кнопки/сочетания клавиш без него.
  document.querySelectorAll(".ggb-board").forEach(el => {
    if (el._hoverWired) return;
    el._hoverWired = true;
    el.addEventListener("mouseenter", () => { hoveredGraphId = el.id; });
    el.addEventListener("mouseleave", () => { if (hoveredGraphId === el.id) hoveredGraphId = null; });
  });
}

if (!window._ggbUndoWired) {
  window._ggbUndoWired = true;
  // capture-фаза (третий аргумент true) — GeoGebra сама вешает обработчик Ctrl+Z на
  // свои внутренние элементы и останавливает всплытие; ловим событие раньше неё,
  // на пути "вниз" от document к цели, иначе наш обработчик на document просто не
  // получит событие.
  document.addEventListener("keydown", (e) => {
    if (!hoveredGraphId) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      const api = geogebraApi.get(hoveredGraphId);
      if (api) { e.preventDefault(); try { api.undo(); } catch (err) { /* игнорируем */ } }
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
      const api = geogebraApi.get(hoveredGraphId);
      if (api) { e.preventDefault(); try { api.redo(); } catch (err) { /* игнорируем */ } }
    }
  }, true);
}

function wireGraphRefs(container) {
  // клик по плашке "Открыть график N →" в тексте — раскрывает (если свёрнута) и
  // прокручивает/подсвечивает соответствующую карточку в боковой панели (без
  // изменения location.hash, чтобы не сбить роутер).
  container.querySelectorAll("[data-graph-ref]").forEach(a => {
    a.onclick = (e) => {
      e.preventDefault();
      const card = openGraphCard(a.dataset.graphRef);
      if (!card) return;
      // ждём кадр — карточка только что раскрылась и получила реальную высоту;
      // scrollIntoView до этого целится в её старую (свёрнутую) позицию
      requestAnimationFrame(() => {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("ggb-card-flash");
        setTimeout(() => card.classList.remove("ggb-card-flash"), 1200);
      });
    };
  });
}

/* ---------------- графы и интерактивные таблицы (свой SVG, без интернета) ---------------- */

function parseGraphBody(text) {
  // разбирает строки вида "V id [подпись]" и "E from to [вес]" в {vertices, edges}
  const vertices = [];
  const edges = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === "V") {
      const id = parts[1];
      if (!id) continue;
      vertices.push({ id, label: parts.slice(2).join(" ") || id });
    } else if (parts[0] === "E") {
      const from = parts[1], to = parts[2];
      if (!from || !to) continue;
      edges.push({ from, to, weight: parts[3] !== undefined ? parts[3] : null });
    }
  }
  return { vertices, edges };
}

function graphSvg(spec, options) {
  // круговая раскладка вершин — не требует ручных координат от автора урока и
  // всегда даёт читаемую картинку независимо от числа вершин
  const { vertices, edges } = spec;
  if (!vertices.length) return "";
  const size = options.size || 320;
  const cx = size / 2, cy = size / 2, r = size / 2 - 36, vr = 19;
  const pos = {};
  vertices.forEach((v, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / vertices.length;
    pos[v.id] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const markerId = "arrow-" + Math.random().toString(36).slice(2, 8);
  let svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" class="graph-svg" xmlns="http://www.w3.org/2000/svg">';
  if (spec.directed) {
    svg += '<defs><marker id="' + markerId + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0,0L10,5L0,10z" fill="#7aa2f7"/></marker></defs>';
  }
  for (const e of edges) {
    const a = pos[e.from], b = pos[e.to];
    if (!a || !b) continue;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const x1 = a.x + ux * vr, y1 = a.y + uy * vr, x2 = b.x - ux * vr, y2 = b.y - uy * vr;
    svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#7aa2f7" stroke-width="2.5"' +
      (spec.directed ? ' marker-end="url(#' + markerId + ')"' : "") + "/>";
    if (e.weight !== null) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      svg += '<rect x="' + (mx - 12) + '" y="' + (my - 10) + '" width="24" height="16" rx="4" fill="#1a1d27"/>' +
        '<text x="' + mx + '" y="' + (my + 3) + '" text-anchor="middle" font-size="12" fill="#e0b04c">' + esc(String(e.weight)) + "</text>";
    }
  }
  for (const v of vertices) {
    const p = pos[v.id];
    svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + vr + '" fill="#232735" stroke="#7aa2f7" stroke-width="2"/>' +
      '<text x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle" font-size="14" font-weight="600" fill="#e8eaf0">' + esc(v.label) + "</text>";
  }
  svg += "</svg>";
  return '<div class="graph-wrap">' + svg + "</div>";
}

// ---- булевы выражения: токенизатор + рекурсивный спуск (¬ высший приоритет, дальше ∧, ∨, →, ↔) ----

function tokenizeBool(s) {
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if ("¬∧∨→↔()".includes(c)) { tokens.push(c); i++; continue; }
    if (/[A-Z]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[A-Z0-9]/.test(s[j])) j++;
      tokens.push(s.slice(i, j));
      i = j;
      continue;
    }
    i++; // пропускаем нераспознанный символ (пунктуацию и т.п.)
  }
  return tokens;
}

function boolVarsOf(expr) {
  return Array.from(new Set(tokenizeBool(expr).filter(t => /^[A-Z][A-Z0-9]*$/.test(t)))).sort();
}

function makeBoolEvaluator(expr) {
  const tokens = tokenizeBool(expr);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  function equiv(vals) {
    let v = impl(vals);
    while (peek() === "↔") { next(); const r = impl(vals); v = v === r ? 1 : 0; }
    return v;
  }
  function impl(vals) {
    let v = or(vals);
    while (peek() === "→") { next(); const r = or(vals); v = (v === 1 && r === 0) ? 0 : 1; }
    return v;
  }
  function or(vals) {
    let v = and(vals);
    while (peek() === "∨") { next(); const r = and(vals); v = (v || r) ? 1 : 0; }
    return v;
  }
  function and(vals) {
    let v = not(vals);
    while (peek() === "∧") { next(); const r = not(vals); v = (v && r) ? 1 : 0; }
    return v;
  }
  function not(vals) {
    if (peek() === "¬") { next(); return not(vals) ? 0 : 1; }
    return primary(vals);
  }
  function primary(vals) {
    if (peek() === "(") { next(); const v = equiv(vals); if (peek() === ")") next(); return v; }
    const t = next();
    return vals[t] ? 1 : 0;
  }
  return function (vals) { pos = 0; return equiv(vals); };
}

// answer key живых таблиц (id -> корректные значения) — заполняется в renderMd,
// используется при проверке/показе ответа после вставки HTML в DOM
const interactiveAnswers = new Map();
// снимок значений сразу ПЕРЕД "Показать ответ" — нужен, чтобы кнопка
// "Вернуть свои ответы" могла отменить показ и восстановить то, что вписал ученик
const revealedPrevValues = new Map();

function itableCellInput(extraAttrs) {
  return '<span class="icell"><input class="itable-cell" ' + extraAttrs + ' autocomplete="off"><small class="iwas"></small></span>';
}

function autoSizeItableCell(inp) {
  // моноширинный шрифт — ширину удобно считать в ch по длине содержимого (+запас на padding)
  inp.style.width = Math.min(22, Math.max(3.5, inp.value.length + 2)) + "ch";
}

function truthTableHtml(expr, options) {
  const vars = (options.vars && options.vars.length) ? options.vars : boolVarsOf(expr);
  if (!vars.length) return '<p class="hint">Не удалось определить переменные выражения.</p>';
  const n = vars.length;
  const evalFn = makeBoolEvaluator(expr);
  const rows = [];
  for (let i = 0; i < (1 << n); i++) {
    const vals = {};
    vars.forEach((v, idx) => { vals[v] = (i >> (n - 1 - idx)) & 1; });
    rows.push(vals);
  }
  const answers = rows.map(vals => evalFn(vals));
  const id = "itbl-" + Math.random().toString(36).slice(2, 10);
  interactiveAnswers.set(id, { type: "truthtable", answers });
  let html = '<div class="itable-wrap" data-itable="' + id + '">' +
    '<div class="itable-expr">F = ' + esc(expr) + "</div>" +
    '<table class="itable"><thead><tr>' + vars.map(v => "<th>" + esc(v) + "</th>").join("") + "<th>F</th></tr></thead><tbody>";
  rows.forEach((vals, i) => {
    html += "<tr>" + vars.map(v => "<td>" + vals[v] + "</td>").join("") +
      "<td>" + itableCellInput('data-row="' + i + '" maxlength="1" inputmode="numeric"') + "</td></tr>";
  });
  html += "</tbody></table>" + itableControls(id) + "</div>";
  return html;
}

function adjMatrixHtml(spec, options) {
  const { vertices, edges } = spec;
  if (!vertices.length) return '<p class="hint">Пустой граф.</p>';
  const weighted = edges.some(e => e.weight !== null);
  const idx = {};
  vertices.forEach((v, i) => { idx[v.id] = i; });
  const n = vertices.length;
  const answer = Array.from({ length: n }, () => Array(n).fill(0));
  for (const e of edges) {
    const i = idx[e.from], j = idx[e.to];
    if (i === undefined || j === undefined) continue;
    const val = weighted ? Number(e.weight) : 1;
    answer[i][j] = val;
    if (!spec.directed) answer[j][i] = val;
  }
  const id = "itbl-" + Math.random().toString(36).slice(2, 10);
  interactiveAnswers.set(id, { type: "adjmatrix", answer, n });
  let html = '<div class="itable-wrap" data-itable="' + id + '">';
  if (options.showGraph !== false) html += graphSvg(spec, options);
  html += '<table class="itable adjmatrix"><thead><tr><th></th>' +
    vertices.map(v => "<th>" + esc(v.label) + "</th>").join("") + "</tr></thead><tbody>";
  vertices.forEach((v, i) => {
    html += "<tr><th>" + esc(v.label) + "</th>" + vertices.map((v2, j) =>
      i === j ? '<td class="itable-diag">—</td>' :
        "<td>" + itableCellInput('data-row="' + i + '" data-col="' + j + '" maxlength="3" inputmode="numeric"') + "</td>"
    ).join("") + "</tr>";
  });
  html += "</tbody></table>" + itableControls(id) + "</div>";
  return html;
}

function parseTableBody(text) {
  // строки через запятую; "-" или "—" — заблокированная ячейка (не редактируется,
  // показывается как "—", например диагональ таблицы расстояний)
  return text.split("\n").map(l => l.trim()).filter(Boolean).map(line =>
    line.split(",").map(c => c.trim()).map(c => (c === "-" || c === "—") ? { blocked: true, value: "" } : { blocked: false, value: c })
  );
}

function tableHtml(options, bodyText) {
  // общая интерактивная таблица с произвольными подписями строк/столбцов —
  // формат, который экспортирует конструктор таблиц в Песочнице
  const cols = options.cols || [];
  const rows = options.rows || [];
  const answer = parseTableBody(bodyText);
  if (!cols.length || !rows.length || !answer.length) return '<p class="hint">Пустая таблица.</p>';
  const id = "itbl-" + Math.random().toString(36).slice(2, 10);
  interactiveAnswers.set(id, { type: "table", answer });
  let html = '<div class="itable-wrap" data-itable="' + id + '"><table class="itable"><thead><tr><th></th>' +
    cols.map(c => "<th>" + esc(c) + "</th>").join("") + "</tr></thead><tbody>";
  rows.forEach((rLabel, i) => {
    html += "<tr><th>" + esc(rLabel) + "</th>" + cols.map((c, j) => {
      const cell = (answer[i] && answer[i][j]) || { blocked: true, value: "" };
      return cell.blocked ? '<td class="itable-diag">—</td>' :
        "<td>" + itableCellInput('data-row="' + i + '" data-col="' + j + '" maxlength="24"') + "</td>";
    }).join("") + "</tr>";
  });
  html += "</tbody></table>" + itableControls(id) + "</div>";
  return html;
}

function itableControls(id) {
  return '<div class="itable-controls">' +
    '<button class="btn btn-sm" data-check-table="' + id + '">Проверить</button>' +
    '<button class="btn btn-sm" data-reveal-table="' + id + '">Показать ответ</button>' +
    '<button class="btn btn-sm" data-reset-table="' + id + '">Сбросить</button>' +
    '<button class="btn btn-sm itable-undo-btn" data-undo-table="' + id + '" hidden>Вернуть свои ответы</button>' +
    '<span class="itable-status" data-status="' + id + '"></span></div>';
}

function cellExpectedStr(ans, row, col) {
  if (ans.type === "truthtable") return String(ans.answers[row]);
  if (ans.type === "adjmatrix") { const v = ans.answer[row][col]; return v === 0 ? "" : String(v); }
  return ans.answer[row][col] ? ans.answer[row][col].value : "";
}

function cellIsCorrect(ans, row, col, got) {
  if (ans.type === "adjmatrix") {
    const expected = ans.answer[row][col];
    const gotNum = got === "" ? 0 : Number(got);
    return !isNaN(gotNum) && gotNum === expected;
  }
  return got === cellExpectedStr(ans, row, col);
}

function itableSetStatus(id, text) {
  const status = document.querySelector('[data-status="' + id + '"]');
  if (status) status.textContent = text;
}

function checkInteractiveTable(id) {
  const ans = interactiveAnswers.get(id);
  const wrap = document.querySelector('[data-itable="' + id + '"]');
  if (!ans || !wrap) return;
  let correct = 0, total = 0;
  wrap.querySelectorAll("input.itable-cell").forEach(inp => {
    total++;
    const ok = cellIsCorrect(ans, Number(inp.dataset.row), Number(inp.dataset.col) || 0, inp.value.trim());
    if (ok) correct++;
    inp.classList.toggle("itable-ok", ok);
    inp.classList.toggle("itable-bad", !ok);
  });
  itableSetStatus(id, correct + " из " + total + " верно" + (correct === total ? " 🎉" : ""));
}

function revealInteractiveTable(id) {
  const ans = interactiveAnswers.get(id);
  const wrap = document.querySelector('[data-itable="' + id + '"]');
  if (!ans || !wrap) return;
  const inputs = Array.from(wrap.querySelectorAll("input.itable-cell"));
  // запоминаем то, что было вписано, ДО перезаписи — для "Вернуть свои ответы"
  revealedPrevValues.set(id, inputs.map(inp => inp.value));
  inputs.forEach(inp => {
    const row = Number(inp.dataset.row), col = Number(inp.dataset.col) || 0;
    const prevVal = inp.value.trim();
    const expected = cellExpectedStr(ans, row, col);
    inp.value = expected;
    autoSizeItableCell(inp);
    inp.classList.remove("itable-bad");
    inp.classList.add("itable-ok");
    const was = inp.parentElement.querySelector(".iwas");
    if (prevVal && prevVal !== expected) {
      inp.classList.add("itable-diff");
      if (was) { was.textContent = "было: " + prevVal; was.classList.add("show"); }
    } else {
      inp.classList.remove("itable-diff");
      if (was) { was.textContent = ""; was.classList.remove("show"); }
    }
  });
  itableSetStatus(id, "Показан правильный ответ");
  const undoBtn = wrap.querySelector(".itable-undo-btn");
  if (undoBtn) undoBtn.hidden = false;
}

function restoreInteractiveTable(id) {
  const wrap = document.querySelector('[data-itable="' + id + '"]');
  const prev = revealedPrevValues.get(id);
  if (!wrap || !prev) return;
  const inputs = Array.from(wrap.querySelectorAll("input.itable-cell"));
  inputs.forEach((inp, i) => {
    inp.value = prev[i] || "";
    autoSizeItableCell(inp);
    inp.classList.remove("itable-ok", "itable-bad", "itable-diff");
    const was = inp.parentElement.querySelector(".iwas");
    if (was) { was.textContent = ""; was.classList.remove("show"); }
  });
  revealedPrevValues.delete(id);
  itableSetStatus(id, "");
  const undoBtn = wrap.querySelector(".itable-undo-btn");
  if (undoBtn) undoBtn.hidden = true;
}

function resetInteractiveTable(id) {
  const wrap = document.querySelector('[data-itable="' + id + '"]');
  if (!wrap) return;
  wrap.querySelectorAll("input.itable-cell").forEach(inp => {
    inp.value = "";
    autoSizeItableCell(inp);
    inp.classList.remove("itable-ok", "itable-bad", "itable-diff");
    const was = inp.parentElement.querySelector(".iwas");
    if (was) { was.textContent = ""; was.classList.remove("show"); }
  });
  revealedPrevValues.delete(id);
  itableSetStatus(id, "");
  const undoBtn = wrap.querySelector(".itable-undo-btn");
  if (undoBtn) undoBtn.hidden = true;
}

function wireInteractiveTables(container) {
  container.querySelectorAll("[data-check-table]").forEach(btn => {
    if (btn._wired) return;
    btn._wired = true;
    btn.onclick = () => checkInteractiveTable(btn.dataset.checkTable);
  });
  container.querySelectorAll("[data-reveal-table]").forEach(btn => {
    if (btn._wired) return;
    btn._wired = true;
    btn.onclick = () => revealInteractiveTable(btn.dataset.revealTable);
  });
  container.querySelectorAll("[data-reset-table]").forEach(btn => {
    if (btn._wired) return;
    btn._wired = true;
    btn.onclick = () => resetInteractiveTable(btn.dataset.resetTable);
  });
  container.querySelectorAll("[data-undo-table]").forEach(btn => {
    if (btn._wired) return;
    btn._wired = true;
    btn.onclick = () => restoreInteractiveTable(btn.dataset.undoTable);
  });
  // ячейки таблиц расширяются по мере ввода
  container.querySelectorAll("input.itable-cell").forEach(inp => {
    if (inp._sizeWired) return;
    inp._sizeWired = true;
    autoSizeItableCell(inp);
    inp.addEventListener("input", () => autoSizeItableCell(inp));
  });
  // виджеты курса английского
  container.querySelectorAll("[data-flip-card]").forEach(el => {
    if (el._wired) return;
    el._wired = true;
    el.onclick = () => el.classList.toggle("flipped");
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.classList.toggle("flipped"); }
    });
  });
  container.querySelectorAll("[data-quiz-opt]").forEach(btn => {
    if (btn._wired) return;
    btn._wired = true;
    btn.onclick = () => selectQuizOption(btn.dataset.quizOpt, Number(btn.dataset.idx));
  });
  container.querySelectorAll("[data-blank-check]").forEach(btn => {
    if (btn._wired) return;
    btn._wired = true;
    btn.onclick = () => checkBlank(btn.dataset.blankCheck);
  });
  container.querySelectorAll("[data-blank-input]").forEach(inp => {
    if (inp._wired) return;
    inp._wired = true;
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); checkBlank(inp.dataset.blankInput); } });
  });
}

/* ---------------- виджеты курса английского ---------------- */

function flashcardsHtml(bodyText) {
  const cards = bodyText.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const p = l.split("|").map(s => s.trim());
    return { en: p[0] || "", ipa: p[1] || "", ru: p[2] || "", example: p[3] || "" };
  }).filter(c => c.en);
  if (!cards.length) return '<p class="hint">Нет карточек.</p>';
  let html = '<div class="eng-flashcards">';
  cards.forEach(c => {
    html += '<div class="eng-flip" data-flip-card="1" tabindex="0"><div class="eng-flip-inner">' +
      '<div class="eng-flip-face eng-flip-front">' +
        '<div class="eng-flip-lang">EN</div>' +
        '<div class="eng-flip-word">' + esc(c.en) + '</div>' +
        (c.ipa ? '<div class="eng-flip-ipa">' + esc(c.ipa) + '</div>' : '') +
        '<div class="eng-flip-hint">нажми, чтобы перевернуть</div>' +
      '</div>' +
      '<div class="eng-flip-face eng-flip-back">' +
        '<div class="eng-flip-lang eng-flip-lang-ru">RU</div>' +
        '<div class="eng-flip-ru">' + esc(c.ru) + '</div>' +
        (c.example ? '<div class="eng-flip-ex">' + inlineMd(c.example) + '</div>' : '') +
      '</div>' +
    '</div></div>';
  });
  return html + '</div>';
}

function grammarHtml(options, bodyText) {
  const title = options.title || "";
  const formula = options.formula || "";
  const lines = bodyText.split("\n").map(l => l.replace(/\s+$/, "")).filter(l => l.trim() !== "");
  const desc = [], examples = [];
  for (const l of lines) {
    const m = l.match(/^\s*\*\s+(.*)$/);
    if (m) examples.push(m[1]); else desc.push(l.trim());
  }
  let html = '<div class="eng-grammar">';
  if (title) html += '<div class="eng-grammar-title">' + esc(title) + '</div>';
  if (formula) html += '<div class="eng-grammar-formula">' + esc(formula) + '</div>';
  if (desc.length) html += '<p class="eng-grammar-desc">' + inlineMd(desc.join(" ")) + '</p>';
  examples.forEach(e => { html += '<div class="eng-grammar-ex">' + inlineMd(e) + '</div>'; });
  return html + '</div>';
}

function quizHtml(bodyText) {
  const lines = bodyText.split("\n").map(l => l.replace(/\s+$/, "")).filter(l => l.trim() !== "");
  const question = [], opts = [];
  for (const l of lines) {
    const m = l.match(/^\s*([+\-])\s+(.*)$/);
    if (m) opts.push({ text: m[2], correct: m[1] === "+" }); else question.push(l.trim());
  }
  if (!opts.length) return '<p class="hint">Пустой вопрос.</p>';
  const id = "quiz-" + Math.random().toString(36).slice(2, 10);
  const correctIndex = opts.findIndex(o => o.correct);
  interactiveAnswers.set(id, { type: "quiz", correctIndex, options: opts.map(o => o.text) });
  let html = '<div class="eng-quiz" data-quiz="' + id + '"><div class="eng-quiz-q">' + inlineMd(question.join(" ")) + '</div><div class="eng-quiz-opts">';
  opts.forEach((o, i) => {
    html += '<button class="eng-quiz-opt" data-quiz-opt="' + id + '" data-idx="' + i + '">' + inlineMd(o.text) + '</button>';
  });
  return html + '</div><div class="eng-quiz-result" data-quiz-result="' + id + '"></div></div>';
}

function selectQuizOption(id, idx) {
  const ans = interactiveAnswers.get(id);
  const wrap = document.querySelector('[data-quiz="' + id + '"]');
  if (!ans || !wrap) return;
  wrap.querySelectorAll(".eng-quiz-opt").forEach((o, i) => {
    o.classList.remove("eng-opt-correct", "eng-opt-wrong");
    if (i === ans.correctIndex) o.classList.add("eng-opt-correct");
    else if (i === idx) o.classList.add("eng-opt-wrong");
  });
  const correct = idx === ans.correctIndex;
  const res = wrap.querySelector('[data-quiz-result="' + id + '"]');
  if (res) {
    res.textContent = correct ? "✓ Верно!" : "✗ Правильный ответ: " + ans.options[ans.correctIndex];
    res.className = "eng-quiz-result " + (correct ? "eng-res-ok" : "eng-res-bad");
  }
}

function blankHtml(bodyText) {
  const lines = bodyText.split("\n").map(l => l.replace(/\s+$/, "")).filter(l => l.trim() !== "");
  const answers = [], sentenceParts = [];
  for (const l of lines) {
    const m = l.match(/^\s*=\s*(.*)$/);
    if (m) answers.push(m[1].split("|").map(s => s.trim().toLowerCase()).filter(Boolean));
    else sentenceParts.push(l.trim());
  }
  const sentence = sentenceParts.join(" ");
  const blanks = (sentence.match(/___+/g) || []).length;
  if (!blanks || !answers.length) return '<p class="hint">Пустое упражнение.</p>';
  const id = "blank-" + Math.random().toString(36).slice(2, 10);
  interactiveAnswers.set(id, { type: "blank", answers });
  const segs = sentence.split(/(___+)/);
  let bi = 0, sentenceHtml = "";
  for (const seg of segs) {
    if (/^___+$/.test(seg)) sentenceHtml += '<input class="eng-blank-input" data-blank-input="' + id + '" data-idx="' + (bi++) + '" placeholder="…">';
    else sentenceHtml += inlineMd(seg);
  }
  return '<div class="eng-blank" data-blank="' + id + '"><div class="eng-blank-sentence">' + sentenceHtml + '</div>' +
    '<div class="eng-blank-controls"><button class="btn btn-sm btn-accent" data-blank-check="' + id + '">Проверить</button>' +
    '<span class="eng-blank-result" data-blank-result="' + id + '"></span></div></div>';
}

function checkBlank(id) {
  const ans = interactiveAnswers.get(id);
  const wrap = document.querySelector('[data-blank="' + id + '"]');
  if (!ans || !wrap) return;
  let ok = 0, tot = 0;
  wrap.querySelectorAll(".eng-blank-input").forEach(inp => {
    const idx = Number(inp.dataset.idx);
    const accepted = ans.answers[idx] || [];
    tot++;
    const good = accepted.includes(inp.value.trim().toLowerCase());
    if (good) ok++;
    inp.classList.toggle("eng-blank-ok", good);
    inp.classList.toggle("eng-blank-bad", !good);
  });
  const res = wrap.querySelector('[data-blank-result="' + id + '"]');
  if (res) {
    const all = ok === tot;
    res.textContent = all ? "✓ Верно!" : ok + " из " + tot + " · ответ: " + ans.answers.map(a => a[0]).join(", ");
    res.className = "eng-blank-result " + (all ? "eng-res-ok" : "eng-res-bad");
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
  app.classList.toggle("app-wide", parts[0] === "practice" || parts[0] === "sandbox");
  updateReviewBadge();

  if (parts.length === 0) {
    markNav("home"); renderHome();
  } else if (parts[0] === "review") {
    markNav("review"); renderReview();
  } else if (parts[0] === "sandbox") {
    markNav("sandbox"); renderSandbox();
  } else if (parts[0] === "inbox") {
    markNav("inbox"); renderInbox();
  } else if (parts[0] === "stats") {
    markNav("stats"); renderStats();
  } else if (parts[0] === "settings") {
    markNav("settings"); renderSettings();
  } else if (parts[0] === "course" && parts[1]) {
    markNav("home"); renderCourse(parts[1]);
  } else if (parts[0] === "theory-all" && parts[1]) {
    markNav("home"); renderTheoryAll(parts[1]);
  } else if (parts[0] === "theory" && parts[1] && parts[2]) {
    markNav("home"); renderTheoryPage(parts[1], parts[2], parts[3]);
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

  if (course.theory && course.theory.length) {
    // счётчик считается на лету от course.theory/course.modules — при добавлении
    // новых тем теории отдельно ничего руками обновлять не нужно
    const topicsCovered = course.modules.filter(m => findTheoryPage(course, m.id)).length;
    html += '<a class="btn btn-accent" style="margin-bottom:20px;display:inline-block" href="#/theory-all/' + encodeURIComponent(course.id) + '">📚 Полная шпаргалка по курсу (теория: ' + topicsCovered + ' из ' + course.modules.length + ' тем)</a>';
  }

  if (!course.modules.length) html += '<p class="empty">Пока нет модулей — добавь первый.</p>';

  for (const m of course.modules) {
    const theoryPage = findTheoryPage(course, m.id);
    html += '<div class="module open" data-mid="' + esc(m.id) + '">' +
      '<div class="module-head"><span class="chev">▶</span><h3>' + esc(m.title) + '</h3>' +
      (theoryPage ? '<a class="btn btn-sm" href="#/theory/' + encodeURIComponent(course.id) + '/' + encodeURIComponent(m.id) + '" title="Сухая теория по модулю: определения, теоремы, формулы">📖 Теория</a>' : '') +
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
      if (e.target.closest("button") || e.target.closest("a")) return;
      head.parentElement.classList.toggle("open");
    });
  });
  document.getElementById("addModuleBtn").onclick = () => openModuleEditor(course.id, null);
  document.getElementById("courseCardsBtn").onclick = () => {
    const cards = courseCards(course);
    if (!cards.length) { toast("В этом курсе пока нет карточек"); return; }
    copyCards(cards, "remnote");
  };
  document.getElementById("delCourseBtn").onclick = async () => {
    if (!await askConfirm('Удалить курс «' + course.title + '» со всеми уроками?', "Удалить")) return;
    deleteEntity(course.id);
    location.hash = "#/";
  };
  document.querySelectorAll("[data-add-lesson]").forEach(b => {
    b.onclick = () => openLessonEditor(course.id, b.dataset.addLesson, null);
  });
  document.querySelectorAll("[data-del-module]").forEach(b => {
    b.onclick = async () => {
      if (!await askConfirm("Удалить модуль со всеми уроками?", "Удалить")) return;
      deleteEntity(keyOf(course.id, b.dataset.delModule));
      renderCourse(course.id);
    };
  });
}

/* ---------------- страница: сухая теория (по модулю / вся сразу) ----------------
 * Это НЕ уроки ЕГЭ-курса — здесь определения/теоремы/формулы сами по себе,
 * без привязки к номеру задания или формату экзамена. Источник — учебники (см. papka
 * textbooks/ в корне проекта, не коммитится). Уроки ссылаются на конкретные пункты
 * через lesson.theoryRefs — см. theoryRailHtml(). */

function theoryPageHtml(page, graphSpecs) {
  // ПРИНИМАЕТ: одну страницу теории {id, title, items} и (необязательно) общий массив
  // graphSpecs для сбора ```geogebra-блоков. ВОЗВРАЩАЕТ: HTML со всеми пунктами страницы.
  let html = '<h2 id="theory-page-' + esc(page.id) + '">' + esc(page.title) + '</h2>';
  for (const item of (page.items || [])) {
    html += '<div class="theory-item" id="theory-item-' + esc(page.id) + '-' + esc(item.id) + '">' +
      '<h3>' + esc(item.title) + '</h3>' +
      renderMd(item.body || "", graphSpecs) +
      '</div>';
  }
  return html;
}

function theoryRailHtml(course, refs, graphSpecs) {
  // ПРИНИМАЕТ: курс, массив строк "moduleTheoryId:itemId" (lesson.theoryRefs) и ОБЩИЙ
  // с уроком массив graphSpecs (чтобы графики теории и урока монтировались одним вызовом).
  // ВОЗВРАЩАЕТ: HTML карточек — компактный текст теоремы/формулы + ссылка на полную страницу теории.
  const resolved = (refs || []).map(r => findTheoryItem(course, r)).filter(Boolean);
  if (!resolved.length) return "";
  return '<div class="theory-rail">' +
    '<div class="theory-rail-label">📖 Теоремы и формулы урока</div>' +
    resolved.map(({ page, item }) =>
      '<div class="theory-card">' +
        '<div class="theory-card-title">' + esc(item.title) + '</div>' +
        renderMd(item.body || "", graphSpecs) +
        '<a class="theory-card-link" href="#/theory/' + encodeURIComponent(course.id) + '/' + encodeURIComponent(page.id) + '/' + encodeURIComponent(item.id) + '">вся тема «' + esc(page.title) + '» →</a>' +
      '</div>'
    ).join("") +
    '</div>';
}

function renderTheoryPage(cid, pageId, focusItemId) {
  const courses = effectiveContent();
  const course = findCourse(courses, cid);
  const page = course && findTheoryPage(course, pageId);
  if (!course || !page) { app.innerHTML = '<p class="empty">Страница теории не найдена. <a href="#/course/' + encodeURIComponent(cid) + '">Назад к курсу</a></p>'; return; }

  const graphSpecs = [];
  const bodyHtml = '<div class="lesson-content theory-content">' + theoryPageHtml(page, graphSpecs) + '</div>';
  const html = '<div class="crumbs"><a href="#/">Курсы</a> / <a href="#/course/' + encodeURIComponent(cid) + '">' + esc(course.title) + '</a> / Теория</div>' +
    '<div class="page-head"><h1>📖 ' + esc(page.title) + '</h1>' +
    '<a class="btn btn-sm" href="#/theory-all/' + encodeURIComponent(cid) + '">Вся шпаргалка курса →</a></div>' +
    '<p class="hint" style="margin-bottom:20px">Сухая теория: определения, теоремы, формулы — без привязки к формату экзамена. Примеры и разбор заданий — в уроках модуля.</p>' +
    (graphSpecs.length
      ? '<div class="lesson-split"><div class="lesson-main">' + bodyHtml + '</div><div class="lesson-rail-col">' + graphRailHtml(graphSpecs) + '</div></div>'
      : bodyHtml);
  app.classList.toggle("app-wide", graphSpecs.length > 0);
  app.innerHTML = html;
  if (window.Prism) Prism.highlightAllUnder(app);
  mountGeogebra(graphSpecs);
  wireGraphRefs(app);
  wireInteractiveTables(app);
  if (focusItemId) {
    const el = document.getElementById("theory-item-" + page.id + "-" + focusItemId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("theory-item-flash");
      setTimeout(() => el.classList.remove("theory-item-flash"), 1600);
    }
  }
}

function renderTheoryAll(cid) {
  const courses = effectiveContent();
  const course = findCourse(courses, cid);
  if (!course || !course.theory || !course.theory.length) { app.innerHTML = '<p class="empty">Для этого курса шпаргалка пока не готова. <a href="#/course/' + encodeURIComponent(cid) + '">Назад к курсу</a></p>'; return; }

  const graphSpecs = [];
  const bodyHtml = '<div class="lesson-content theory-content">' +
    course.theory.map(p => theoryPageHtml(p, graphSpecs)).join('<hr>') +
    '</div>';
  const totalItems = course.theory.reduce((s, p) => s + (p.items || []).length, 0);
  let html = '<div class="crumbs"><a href="#/">Курсы</a> / <a href="#/course/' + encodeURIComponent(cid) + '">' + esc(course.title) + '</a> / Шпаргалка</div>' +
    '<div class="page-head"><h1>📚 Полная шпаргалка: ' + esc(course.title) + '</h1>' +
    '<span class="hint" style="color:var(--text-dim)">' + course.theory.length + ' тем · ' + totalItems + ' пунктов теории</span></div>' +
    '<div class="theory-toc"><b>Содержание:</b> ' +
    course.theory.map(p => '<a class="theory-toc-link" data-scroll-to="theory-page-' + esc(p.id) + '">' + esc(p.title) + '</a>').join(' · ') +
    '</div>' +
    (graphSpecs.length
      ? '<div class="lesson-split"><div class="lesson-main">' + bodyHtml + '</div><div class="lesson-rail-col">' + graphRailHtml(graphSpecs) + '</div></div>'
      : bodyHtml);
  app.classList.toggle("app-wide", graphSpecs.length > 0);
  app.innerHTML = html;
  if (window.Prism) Prism.highlightAllUnder(app);
  mountGeogebra(graphSpecs);
  wireGraphRefs(app);
  wireInteractiveTables(app);
  app.querySelectorAll("[data-scroll-to]").forEach(a => {
    a.onclick = e => {
      e.preventDefault();
      const el = document.getElementById(a.dataset.scrollTo);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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
  let mainHtml = '<div class="lesson-content">' + renderMd(lesson.theory || "*Пока пусто — нажми «Редактировать».*", graphSpecs) + '</div>';
  if (lesson.homework) {
    mainHtml += '<div class="hw-block"><h2>📝 Домашнее задание</h2>' + renderMd(lesson.homework, graphSpecs) + '</div>';
  }
  if (lesson.cards && lesson.cards.length) {
    mainHtml += '<div class="settings-block"><h2>🃏 Карточки для повторения (' + lesson.cards.length + ')</h2>' +
      '<p>Скопируй и вставь в RemNote — каждая строка «вопрос &gt;&gt; ответ» сама станет флеш-карточкой.</p>' +
      '<button class="btn" id="cardsRemBtn">📋 Для RemNote</button> ' +
      '<button class="btn" id="cardsAnkiBtn">📋 Для Anki (TSV)</button></div>';
  }

  const theoryRail = theoryRailHtml(course, lesson.theoryRefs, graphSpecs);
  if (graphSpecs.length || theoryRail) {
    html += '<div class="lesson-split"><div class="lesson-main">' + mainHtml + '</div>' +
      '<div class="lesson-rail-col">' + theoryRail + graphRailHtml(graphSpecs) + '</div></div>';
  } else {
    html += mainHtml;
  }

  html += '<div class="lesson-nav">' +
    (prev ? '<a class="btn" href="#/lesson/' + [cid, prev.mod.id, prev.lesson.id].map(encodeURIComponent).join("/") + '">← ' + esc(prev.lesson.title) + '</a>' : '<span></span>') +
    (next ? '<a class="btn" href="#/lesson/' + [cid, next.mod.id, next.lesson.id].map(encodeURIComponent).join("/") + '">' + esc(next.lesson.title) + ' →</a>' : '<span></span>') +
    '</div>';

  app.classList.toggle("app-wide", graphSpecs.length > 0 || !!theoryRail);
  app.innerHTML = html;
  if (window.Prism) Prism.highlightAllUnder(app);
  mountGeogebra(graphSpecs);
  wireGraphRefs(app);
  wireInteractiveTables(app);

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
  document.getElementById("delLessonBtn").onclick = async () => {
    if (!await askConfirm('Удалить урок «' + lesson.title + '»?', "Удалить")) return;
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
        graphRailHtml(graphSpecs) +
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
  mountGeogebra(graphSpecs);
  wireGraphRefs(body);
  wireInteractiveTables(body);

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
  if (resetBtn) resetBtn.onclick = async () => {
    if (!await askConfirm("Стереть текущий код и вернуть заготовку?", "Стереть")) return;
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

/* ---------------- страница: песочница (свободная GeoGebra) ---------------- */

let sandboxTab = "geogebra";

function renderSandbox() {
  const tabs = [
    ["geogebra", "GeoGebra"],
    ["graph", "🔗 Конструктор графов"],
    ["table", "🔲 Конструктор таблиц"]
  ];
  app.innerHTML =
    '<div class="page-head"><h1>📐 Песочница</h1></div>' +
    '<div class="sandbox-tabs">' + tabs.map(([id, label]) =>
      '<button class="btn btn-sm sandbox-tab' + (sandboxTab === id ? " active" : "") + '" data-sbtab="' + id + '">' + label + "</button>"
    ).join("") + '</div>' +
    '<div id="sandboxBody"></div>';
  document.querySelectorAll("[data-sbtab]").forEach(btn => {
    btn.onclick = () => { sandboxTab = btn.dataset.sbtab; renderSandbox(); };
  });
  const body = document.getElementById("sandboxBody");
  if (sandboxTab === "graph") renderGraphBuilderTab(body);
  else if (sandboxTab === "table") renderTableBuilderTab(body);
  else renderGeogebraSandboxTab(body);
}

function renderGeogebraSandboxTab(container) {
  container.innerHTML =
    '<div style="margin-bottom:10px"><button class="btn" id="sandboxClearBtn">🗑 Очистить</button></div>' +
    '<p class="hint" style="margin-bottom:12px">Полноценная GeoGebra: строй что угодно — графики, чертежи, вычисления. Сохраняется автоматически в этом браузере.</p>' +
    '<div id="sandboxHost" style="width:100%;height:75vh;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border)"></div>';

  document.getElementById("sandboxClearBtn").onclick = async () => {
    if (!window.sandboxApi) return;
    if (!await askConfirm("Стереть всё построение в песочнице?", "Стереть")) return;
    sandboxApi.reset();
    sandboxGgb = ""; saveSandboxGgb();
  };

  if (!window.GGBApplet) {
    document.getElementById("sandboxHost").innerHTML = '<p class="hint" style="padding:20px">GeoGebra не загрузилась — нужен интернет (грузится с geogebra.org).</p>';
    return;
  }

  let saveTimer = null;
  const scheduleSandboxSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!window.sandboxApi) return;
      sandboxApi.getBase64(b64 => { sandboxGgb = b64; saveSandboxGgb(); });
    }, 1000);
  };

  const params = {
    appName: "classic",
    width: 1000,
    height: 700,
    showToolBar: true,
    showAlgebraInput: true,
    showMenuBar: false,
    showResetIcon: true,
    language: "ru",
    appletOnLoad: function (api) {
      window.sandboxApi = api;
      if (sandboxGgb) { try { api.setBase64(sandboxGgb); } catch (e) { /* повреждённый снимок — начинаем с чистого листа */ } }
      api.registerAddListener(scheduleSandboxSave);
      api.registerRemoveListener(scheduleSandboxSave);
      api.registerUpdateListener(scheduleSandboxSave);
      api.registerRenameListener(scheduleSandboxSave);
    }
  };
  new GGBApplet(params, true).inject("sandboxHost");
}

/* ---------------- конструктор графов (Песочница) ---------------- */

let graphBuilder = null;
let sandboxGraphExportMode = "graph";
let gbDrag = null;

function nextCyrillicLabel(n) {
  // без Й,Ё,Ъ,Ь,Ы,Э — визуально спорные/редкие как одиночные подписи вершин
  const letters = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЮЯ";
  return letters[n % letters.length] + (n >= letters.length ? Math.floor(n / letters.length) : "");
}

function newGraphBuilder() {
  return { vertices: [], edges: [], directed: false, nextIdx: 0, selected: null };
}

function renderGraphBuilderTab(container) {
  if (!graphBuilder) graphBuilder = newGraphBuilder();
  container.innerHTML =
    '<p class="hint" style="margin-bottom:10px">Клик по пустому месту — новая вершина. Клик по вершине, потом по другой — ребро между ними (спросит вес). ' +
    'Двойной клик по вершине — переименовать. Правая кнопка мыши — удалить вершину/ребро. Перетаскивай вершины мышью.</p>' +
    '<label class="gbuild-check"><input type="checkbox" id="gbDirected"' + (graphBuilder.directed ? " checked" : "") + '> Ориентированный граф</label>' +
    '<div id="gbSvgHost" class="gbuild-host"></div>' +
    '<div class="itable-controls">' +
    '<button class="btn btn-sm" id="gbClearBtn">Сбросить</button>' +
    '<div class="gbuild-exportmode">' +
    '<button class="btn btn-sm' + (sandboxGraphExportMode === "graph" ? " active" : "") + '" data-gbmode="graph">Как график</button>' +
    '<button class="btn btn-sm' + (sandboxGraphExportMode === "adjmatrix" ? " active" : "") + '" data-gbmode="adjmatrix">Как таблицу смежности</button>' +
    "</div></div>" +
    '<textarea id="gbExport" class="itable-export" readonly rows="8"></textarea>' +
    '<button class="btn btn-sm" id="gbCopyBtn">📋 Скопировать блок для урока</button>';

  document.getElementById("gbDirected").onchange = (e) => { graphBuilder.directed = e.target.checked; refreshGraphBuilder(); };
  document.getElementById("gbClearBtn").onclick = async () => {
    if (!await askConfirm("Стереть граф?", "Стереть")) return;
    graphBuilder = newGraphBuilder();
    refreshGraphBuilder();
  };
  container.querySelectorAll("[data-gbmode]").forEach(btn => {
    btn.onclick = () => { sandboxGraphExportMode = btn.dataset.gbmode; renderGraphBuilderTab(container); };
  });
  document.getElementById("gbCopyBtn").onclick = () => {
    copyText(document.getElementById("gbExport").value).then(ok => toast(ok ? "Скопировано!" : "Не удалось скопировать"));
  };
  refreshGraphBuilder();
}

function graphBuilderSvgMarkup() {
  const gb = graphBuilder;
  const w = 640, h = 420, vr = 20;
  let svg = '<svg id="gbSvg" viewBox="0 0 ' + w + " " + h + '" class="gbuild-svg" xmlns="http://www.w3.org/2000/svg">';
  if (gb.directed) {
    svg += '<defs><marker id="gbArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0,0L10,5L0,10z" fill="#7aa2f7"/></marker></defs>';
  }
  for (const e of gb.edges) {
    const a = gb.vertices.find(v => v.id === e.from), b = gb.vertices.find(v => v.id === e.to);
    if (!a || !b) continue;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const x1 = a.x + ux * vr, y1 = a.y + uy * vr, x2 = b.x - ux * vr, y2 = b.y - uy * vr;
    svg += '<line class="gbuild-edge" data-edge="' + e.id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (e.color || "#7aa2f7") + '" stroke-width="3"' + (gb.directed ? ' marker-end="url(#gbArrow)"' : "") + "/>";
    if (e.weight) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      svg += '<rect class="gbuild-edge" data-edge="' + e.id + '" x="' + (mx - 13) + '" y="' + (my - 10) + '" width="26" height="16" rx="4" fill="#1a1d27"/>' +
        '<text data-edge="' + e.id + '" x="' + mx + '" y="' + (my + 3) + '" text-anchor="middle" font-size="12" fill="#e0b04c" pointer-events="none">' + esc(e.weight) + "</text>";
    }
  }
  for (const v of gb.vertices) {
    const sel = gb.selected === v.id;
    svg += '<circle class="gbuild-vertex" data-vertex="' + v.id + '" cx="' + v.x + '" cy="' + v.y + '" r="' + vr +
      '" fill="' + (sel ? "#3a3f52" : "#232735") + '" stroke="' + (sel ? "#e0b04c" : "#7aa2f7") + '" stroke-width="' + (sel ? 3 : 2) + '"/>' +
      '<text class="gbuild-vertex" data-vertex="' + v.id + '" x="' + v.x + '" y="' + (v.y + 5) +
      '" text-anchor="middle" font-size="14" font-weight="600" fill="#e8eaf0">' + esc(v.label) + "</text>";
  }
  svg += "</svg>";
  return svg;
}

function updateGraphBuilderVertexDom(svgEl, v) {
  // во время драга двигаем только затронутые DOM-узлы напрямую, без полного
  // перестроения SVG — сохраняет обработчики событий, навешанные на svgEl
  const vr = 20;
  svgEl.querySelectorAll('[data-vertex="' + v.id + '"]').forEach(el => {
    if (el.tagName === "circle") { el.setAttribute("cx", v.x); el.setAttribute("cy", v.y); }
    else if (el.tagName === "text") { el.setAttribute("x", v.x); el.setAttribute("y", v.y + 5); }
  });
  graphBuilder.edges.forEach(e => {
    if (e.from !== v.id && e.to !== v.id) return;
    const a = graphBuilder.vertices.find(x => x.id === e.from), b = graphBuilder.vertices.find(x => x.id === e.to);
    if (!a || !b) return;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const x1 = a.x + ux * vr, y1 = a.y + uy * vr, x2 = b.x - ux * vr, y2 = b.y - uy * vr;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    svgEl.querySelectorAll('[data-edge="' + e.id + '"]').forEach(el => {
      if (el.tagName === "line") { el.setAttribute("x1", x1); el.setAttribute("y1", y1); el.setAttribute("x2", x2); el.setAttribute("y2", y2); }
      else if (el.tagName === "rect") { el.setAttribute("x", mx - 13); el.setAttribute("y", my - 10); }
      else if (el.tagName === "text") { el.setAttribute("x", mx); el.setAttribute("y", my + 3); }
    });
  });
}

function svgPoint(svgEl, evt) {
  const rect = svgEl.getBoundingClientRect();
  const vb = svgEl.viewBox.baseVal;
  return { x: (evt.clientX - rect.left) / rect.width * vb.width, y: (evt.clientY - rect.top) / rect.height * vb.height };
}

function refreshGraphBuilder() {
  const host = document.getElementById("gbSvgHost");
  if (!host) return;
  host.innerHTML = graphBuilderSvgMarkup();
  wireGraphBuilderCanvas(document.getElementById("gbSvg"));
  updateGraphBuilderExport();
}

function graphBuilderExportText() {
  const gb = graphBuilder;
  const tag = sandboxGraphExportMode === "adjmatrix" ? "adjmatrix" : "graph";
  const opts = gb.directed ? '{"directed":true}' : "{}";
  const lines = ["```" + tag + " " + opts];
  gb.vertices.forEach(v => lines.push("V " + v.id + " " + v.label));
  gb.edges.forEach(e => lines.push("E " + e.from + " " + e.to + (e.weight ? " " + e.weight : "")));
  lines.push("```");
  return lines.join("\n");
}

function updateGraphBuilderExport() {
  const ta = document.getElementById("gbExport");
  if (ta) ta.value = graphBuilderExportText();
}

function wireGraphBuilderCanvas(svgEl) {
  if (!svgEl) return;
  svgEl.addEventListener("pointerdown", (e) => {
    const vid = e.target.dataset.vertex;
    const pt = svgPoint(svgEl, e);
    gbDrag = vid ? { vertexId: vid, moved: false, startX: pt.x, startY: pt.y } : null;
  });
  svgEl.addEventListener("pointermove", (e) => {
    if (!gbDrag) return;
    const pt = svgPoint(svgEl, e);
    if (Math.hypot(pt.x - gbDrag.startX, pt.y - gbDrag.startY) > 4) gbDrag.moved = true;
    if (gbDrag.moved) {
      const v = graphBuilder.vertices.find(x => x.id === gbDrag.vertexId);
      // точечно двигаем DOM-узлы (а не svgEl.outerHTML = ...) — полная замена узла
      // на середине драга сносит уже навешанные на него обработчики событий
      if (v) { v.x = pt.x; v.y = pt.y; updateGraphBuilderVertexDom(svgEl, v); }
    }
  });
  svgEl.addEventListener("pointerup", (e) => {
    const pt = svgPoint(svgEl, e);
    if (gbDrag) {
      if (!gbDrag.moved) onGraphBuilderVertexClick(gbDrag.vertexId);
      else refreshGraphBuilder();
    } else {
      const eid = e.target.dataset.edge;
      if (eid) onGraphBuilderEdgeClick(eid);
      else if (e.target === svgEl) onGraphBuilderCanvasClick(pt);
    }
    gbDrag = null;
  });
  svgEl.addEventListener("dblclick", (e) => {
    if (e.target.dataset.vertex) onGraphBuilderVertexRename(e.target.dataset.vertex);
  });
  svgEl.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (e.target.dataset.vertex) onGraphBuilderVertexDelete(e.target.dataset.vertex);
    else if (e.target.dataset.edge) onGraphBuilderEdgeDelete(e.target.dataset.edge);
  });
}

function onGraphBuilderCanvasClick(pt) {
  const gb = graphBuilder;
  gb.vertices.push({ id: "v" + gb.nextIdx, label: nextCyrillicLabel(gb.nextIdx), x: pt.x, y: pt.y });
  gb.nextIdx++;
  gb.selected = null;
  refreshGraphBuilder();
}

async function onGraphBuilderVertexClick(vid) {
  const gb = graphBuilder;
  if (gb.selected === null) {
    gb.selected = vid;
    refreshGraphBuilder();
  } else if (gb.selected === vid) {
    gb.selected = null;
    refreshGraphBuilder();
  } else {
    const from = gb.selected;
    gb.selected = null; // снимаем подсветку сразу, не дожидаясь ответа на вопрос о весе
    refreshGraphBuilder();
    const exists = gb.edges.some(e => (e.from === from && e.to === vid) || (!gb.directed && e.from === vid && e.to === from));
    if (!exists) {
      const w = await askPrompt("Вес ребра (необязательно, оставь пустым):", "");
      if (w !== null) {
        gb.edges.push({ id: "e" + Math.random().toString(36).slice(2, 8), from, to: vid, weight: w.trim(), color: null });
        refreshGraphBuilder();
      }
    }
  }
}

async function onGraphBuilderVertexRename(vid) {
  const v = graphBuilder.vertices.find(x => x.id === vid);
  if (!v) return;
  const name = await askPrompt("Название вершины:", v.label);
  if (name !== null && name.trim()) { v.label = name.trim(); refreshGraphBuilder(); }
}

async function onGraphBuilderVertexDelete(vid) {
  if (!await askConfirm("Удалить вершину и все её рёбра?", "Удалить")) return;
  const gb = graphBuilder;
  gb.vertices = gb.vertices.filter(v => v.id !== vid);
  gb.edges = gb.edges.filter(e => e.from !== vid && e.to !== vid);
  if (gb.selected === vid) gb.selected = null;
  refreshGraphBuilder();
}

async function onGraphBuilderEdgeClick(eid) {
  const e = graphBuilder.edges.find(x => x.id === eid);
  if (!e) return;
  const w = await askPrompt("Вес ребра (оставь пустым, если без веса):", e.weight || "");
  if (w !== null) { e.weight = w.trim(); refreshGraphBuilder(); }
}

async function onGraphBuilderEdgeDelete(eid) {
  if (!await askConfirm("Удалить ребро?", "Удалить")) return;
  graphBuilder.edges = graphBuilder.edges.filter(x => x.id !== eid);
  refreshGraphBuilder();
}

/* ---------------- конструктор таблиц (Песочница) ---------------- */

let tableBuilder = null;

function newTableBuilder() {
  return { cols: ["А", "Б"], rows: ["А", "Б"], cells: [["-", ""], ["", "-"]], sel: null };
}

function renderTableBuilderTab(container) {
  if (!tableBuilder) tableBuilder = newTableBuilder();
  container.innerHTML = '<p class="hint" style="margin-bottom:10px">Впиши "-" в клетку, чтобы заблокировать её (например, диагональ). ' +
    "Наведи на край таблицы — появится «+» (добавить столбец/строку). Выдели клетку и нажми Ctrl+→/↓, чтобы добавить столбец/строку с этой стороны, Ctrl+←/↑ — убрать последний.</p>" +
    '<div id="tbuildHost"></div>';
  refreshTableBuilder();
}

function tableBuilderHtml() {
  const tb = tableBuilder;
  let html = '<div class="tbuild-wrap"><table class="tbuild-table"><thead><tr><th class="tbuild-corner"></th>';
  tb.cols.forEach((c, j) => { html += '<th><input class="tbuild-head" data-axis="col" data-idx="' + j + '" value="' + esc(c) + '"></th>'; });
  html += '<th class="tbuild-addcol" data-add="col" title="Добавить столбец">+</th></tr></thead><tbody>';
  tb.rows.forEach((r, i) => {
    html += '<tr><th><input class="tbuild-head" data-axis="row" data-idx="' + i + '" value="' + esc(r) + '"></th>';
    tb.cols.forEach((c, j) => {
      const v = tb.cells[i][j];
      const blocked = v === "-" || v === "—";
      html += '<td><input class="tbuild-cell' + (blocked ? " tbuild-blocked" : "") + '" data-r="' + i + '" data-c="' + j + '" value="' + esc(v) + '" maxlength="8"></td>';
    });
    html += "</tr>";
  });
  html += '<tr><td></td><td class="tbuild-addrow" data-add="row" colspan="' + tb.cols.length + '" title="Добавить строку">+</td></tr>';
  html += "</tbody></table>";
  html += '<div class="itable-controls"><button class="btn btn-sm" id="tbClearBtn">Сбросить</button></div>';
  html += '<textarea id="tbExport" class="itable-export" readonly rows="' + (tb.rows.length + 3) + '"></textarea>' +
    '<button class="btn btn-sm" id="tbCopyBtn">📋 Скопировать блок для урока</button>';
  html += "</div>";
  return html;
}

function refreshTableBuilder() {
  const host = document.getElementById("tbuildHost");
  if (!host) return;
  host.innerHTML = tableBuilderHtml();
  wireTableBuilder(host);
  if (tableBuilder.sel) {
    const el = host.querySelector('.tbuild-cell[data-r="' + tableBuilder.sel.r + '"][data-c="' + tableBuilder.sel.c + '"]');
    if (el) el.focus();
  }
}

function tableBuilderExportText() {
  const tb = tableBuilder;
  const opts = JSON.stringify({ cols: tb.cols, rows: tb.rows });
  const body = tb.cells.map(row => row.join(",")).join("\n");
  return "```table " + opts + "\n" + body + "\n```";
}

function updateTableBuilderExport() {
  const ta = document.getElementById("tbExport");
  if (ta) ta.value = tableBuilderExportText();
}

function tableBuilderAddCol() { const tb = tableBuilder; tb.cols.push(nextCyrillicLabel(tb.cols.length)); tb.cells.forEach(row => row.push("")); refreshTableBuilder(); }
function tableBuilderAddRow() { const tb = tableBuilder; tb.rows.push(nextCyrillicLabel(tb.rows.length)); tb.cells.push(tb.cols.map(() => "")); refreshTableBuilder(); }
function tableBuilderRemoveCol() { const tb = tableBuilder; if (tb.cols.length <= 1) return; tb.cols.pop(); tb.cells.forEach(row => row.pop()); refreshTableBuilder(); }
function tableBuilderRemoveRow() { const tb = tableBuilder; if (tb.rows.length <= 1) return; tb.rows.pop(); tb.cells.pop(); refreshTableBuilder(); }

function wireTableBuilder(host) {
  const tb = tableBuilder;
  host.querySelectorAll(".tbuild-head").forEach(inp => {
    inp.oninput = () => { (inp.dataset.axis === "col" ? tb.cols : tb.rows)[Number(inp.dataset.idx)] = inp.value; updateTableBuilderExport(); };
  });
  host.querySelectorAll(".tbuild-cell").forEach(inp => {
    inp.oninput = () => {
      tb.cells[Number(inp.dataset.r)][Number(inp.dataset.c)] = inp.value;
      inp.classList.toggle("tbuild-blocked", inp.value === "-" || inp.value === "—");
      updateTableBuilderExport();
    };
    inp.onfocus = () => { tb.sel = { r: Number(inp.dataset.r), c: Number(inp.dataset.c) }; };
    inp.onkeydown = (e) => {
      if (!e.ctrlKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); tableBuilderAddCol(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); tableBuilderAddRow(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); tableBuilderRemoveCol(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); tableBuilderRemoveRow(); }
    };
  });
  const addCol = host.querySelector('[data-add="col"]');
  if (addCol) addCol.onclick = () => tableBuilderAddCol();
  const addRow = host.querySelector('[data-add="row"]');
  if (addRow) addRow.onclick = () => tableBuilderAddRow();
  const clearBtn = host.querySelector("#tbClearBtn");
  if (clearBtn) clearBtn.onclick = async () => { if (await askConfirm("Сбросить таблицу?", "Сбросить")) { tableBuilder = newTableBuilder(); refreshTableBuilder(); } };
  const copyBtn = host.querySelector("#tbCopyBtn");
  if (copyBtn) copyBtn.onclick = () => { copyText(document.getElementById("tbExport").value).then(ok => toast(ok ? "Скопировано!" : "Не удалось скопировать")); };
  updateTableBuilderExport();
}

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
        if (data.sandboxGgb) { sandboxGgb = data.sandboxGgb; saveSandboxGgb(); }
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
  document.getElementById("resetBtn").onclick = async () => {
    if (!await askConfirm("Точно сбросить весь прогресс и статистику?", "Сбросить")) return;
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
