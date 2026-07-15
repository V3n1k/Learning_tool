/*
 * Сюда регистрируются все курсы.
 * Каждый файл content/<курс>.js вызывает LT_REGISTER({...}) со структурой:
 *
 * {
 *   id: "golang",                  // уникальный id курса (латиницей, без пробелов)
 *   title: "Golang",               // название
 *   color: "#00ADD8",              // цвет карточки
 *   description: "...",            // короткое описание
 *   modules: [                     // модули (разделы) курса
 *     {
 *       id: "basics",              // уникален внутри курса
 *       title: "Основы",
 *       lessons: [
 *         {
 *           id: "go-01",           // уникален внутри курса
 *           title: "Название урока",
 *           theory: `текст в markdown`,   // сам материал
 *           homework: `текст ДЗ`,         // необязательно
 *           cards: [                      // необязательно: карточки для RemNote/Anki
 *             { q: "вопрос", a: "ответ" }
 *           ],
 *           practice: [                   // необязательно: задачи для практики (редактор + Pyodide)
 *             {
 *               id: "p1",                 // уникален внутри урока — короткая подпись на вкладке
 *               title: "Название вкладки",
 *               statement: `markdown условия задачи`,
 *               starterCode: `# твой код тут\n`,
 *               tests: [                  // каждый тест — что подать на стандартный ввод и что ждать на выводе
 *                 { input: "5\n3\n", expected: "8" }
 *               ],
 *               solution: `python-код эталонного решения`, // показывается по кнопке "Показать решение"
 *               files: [                  // необязательно: файлы, которые нужно подложить перед запуском
 *                 { name: "task.txt", path: "files/ege-informatika/task17_sequence.txt" }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Чтобы добавить материал — просто дописываем уроки в нужный файл
 * (или Claude коммитит их в репозиторий, а ты делаешь git pull).
 *
 * ИНТЕРАКТИВНЫЕ ГРАФИКИ/ЧЕРТЕЖИ (JSXGraph, как GeoGebra) — прямо в тексте theory/homework/
 * practice[].statement можно вставить блок с уникальным языком "jsxgraph":
 *
 *   ```jsxgraph {"boundingbox":[-6,6,6,-6],"axis":true}
 *   board.create('functiongraph', [x => x*x]);
 *   board.create('point', [1, 1], {name:'A'});
 *   ```
 *
 * Первая строка после ```jsxgraph — необязательный JSON с настройками доски
 * (boundingbox: [xMin,yMax,xMax,yMin], axis: показывать ли оси и т.д.).
 * Дальше — обычный JS-код, который выполняется с переменными `board` (доска
 * JSXGraph) и `JXG` (сама библиотека) в области видимости. Полный список
 * примитивов — в документации JSXGraph (point, line, segment, circle,
 * functiongraph, polygon, angle, slider и т.д.).
 */
window.LT_CONTENT = [];
window.LT_REGISTER = function (course) { window.LT_CONTENT.push(course); };
