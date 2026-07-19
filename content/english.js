LT_REGISTER({
  id: "english",
  title: "English",
  color: "#5c9de0",
  description: "Подтягиваем английский: грамматика по уровням, словарный запас, чтение технических текстов (пригодится и для Go, и для CS).",
  modules: [
    {
      id: "intro",
      title: "Модуль 0. Точка старта",
      lessons: [
        {
          id: "eng-00",
          title: "Определяем уровень и план",
          theory: `
## Зачем именно тебе

Два практических применения:

1. **Документация и IT.** Вся документация Go, Stack Overflow, хорошие книги по CS — на английском. Цель: свободно читать технический текст.
2. **Общий уровень** — грамматика + словарный запас + понимание на слух.

## План

1. Определяем уровень (домашка ниже).
2. Грамматику идём блоками: времена → модальные → условные → пассив → косвенная речь. На каждый блок: короткая теория + практика.
3. Словарь: система интервальных повторений (Anki — бесплатно, работает оффлайн). Две колоды: общая лексика + IT-лексика.
4. Чтение: раз в неделю разбираем кусок реальной документации Go на английском — двух зайцев одним выстрелом.

## Правило

Все объяснения по грамматике будут в формате «формула + когда используется + типичная ошибка русскоговорящих»:

> **Present Perfect**: have/has + V3 — действие завершилось, но результат важен сейчас.
> "I **have written** the code" — код написан и вот он.
> Типичная ошибка: говорить "I have written it yesterday" — с указанием времени (yesterday, in 2020) Present Perfect НЕЛЬЗЯ, только Past Simple: "I wrote it yesterday".
`,
          homework: `
1. Пройди бесплатный тест уровня (например, EF SET, 15-минутная версия) и пришли результат.
2. Напиши 5–7 предложений о себе на английском, не пользуясь переводчиком. Ошибки — это нормально, мне нужно увидеть реальный уровень.
`
        }
      ]
    },
    {
      id: "tenses",
      title: "Модуль 1. Времена",
      lessons: [
        {
          id: "eng-01",
          title: "Present Perfect",
          theory: `
## Когда используем

\`\`\`grammar {"title":"Present Perfect","formula":"have / has + V3"}
Действие произошло в прошлом, но важен его РЕЗУЛЬТАТ сейчас — не важно, *когда именно* оно случилось.
* I **have finished** my homework. — домашка сделана, вот результат
* She **has never been** to London. — за всю жизнь до сих пор ни разу
\`\`\`

## Формула

- **have** + V3 — для \`I / you / we / they\`;
- **has** + V3 — для \`he / she / it\`;
- V3 — третья форма глагола (у правильных = +ed: \`work → worked\`; у неправильных своя: \`write → written\`).

Отрицание — \`haven't / hasn't + V3\`, вопрос — \`Have/Has + подлежащее + V3\`.

> **Главная ошибка русскоговорящих.** Present Perfect несовместим с точным моментом в прошлом. Со словами \`yesterday\`, \`in 2020\`, \`two days ago\` — только Past Simple: «I **wrote** it yesterday», а не «have written». Present Perfect отвечает на «что уже сделано к настоящему», а не «когда».

## Слова-маркеры

Часто рядом стоят: \`ever\`, \`never\`, \`already\`, \`yet\`, \`just\`, \`recently\`, а также \`for\` (в течение) и \`since\` (с какого-то момента).

## Неправильные глаголы — потренируйся

Впиши вторую (V2) и третью (V3) формы каждого глагола и нажми «Проверить»:

\`\`\`table {"cols":["V2 (Past)","V3 (Participle)"],"rows":["go","write","see","take","break"]}
went, gone
wrote, written
saw, seen
took, taken
broke, broken
\`\`\`

## Проверь себя

\`\`\`quiz {}
She ___ to Paris three times.
- have been
+ has been
- was
- is
\`\`\`

\`\`\`blank {}
She ___ (live) in London for five years.
= has lived | 's lived
\`\`\`

## Слова урока

Нажми на карточку, чтобы перевернуть:

\`\`\`flashcards {}
achieve | /əˈtʃiːv/ | достигать | She worked hard to achieve her goals.
crucial | /ˈkruːʃəl/ | решающий, важный | Practice is crucial for fluency.
overwhelmed | /ˌoʊvərˈwɛlmd/ | подавленный | I felt overwhelmed by new words.
already | /ɔːlˈredi/ | уже | I have already seen this film.
yet | /jet/ | ещё (в вопросах и отрицаниях) | Have you finished yet?
\`\`\`
`,
          homework: `
1. Напиши 5 предложений о своём опыте с \`ever/never\` (What have you never done? Where have you been?).
2. Переведи на английский, выбрав Present Perfect или Past Simple: «Я уже прочитал эту книгу», «Я прочитал её в прошлом году», «Ты когда-нибудь был в Лондоне?».
3. Выучи 5 карточек урока — при повторении сверься с колодой Anki.
`,
          cards: [
            { q: "Формула Present Perfect?", a: "have/has + V3 (третья форма глагола)" },
            { q: "Почему нельзя «I have written it yesterday»?", a: "Present Perfect несовместим с точным моментом прошлого (yesterday, in 2020, ago) — там только Past Simple" },
            { q: "have или has для he/she/it?", a: "has + V3 (have — для I/you/we/they)" },
            { q: "Слова-маркеры Present Perfect?", a: "ever, never, already, yet, just, recently, for, since" },
            { q: "V3 (Participle): go, write, see, take, break?", a: "gone, written, seen, taken, broken" }
          ]
        }
      ]
    }
  ]
});
