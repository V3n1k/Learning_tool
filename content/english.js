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
          id: "eng-02",
          title: "Present Simple",
          theory: `
## Когда используем

\`\`\`grammar {"title":"Present Simple","formula":"V1  (+ -s / -es для he / she / it)"}
Регулярные, повторяющиеся действия и факты: привычки, распорядок, расписания, общие истины.
* I **work** from home. — вообще, по жизни
* The sun **rises** in the east. — факт
* The train **leaves** at 7. — расписание
\`\`\`

## Формула

- утверждение: \`I / you / we / they\` + **V1**; \`he / she / it\` + **V1 + -s/-es**;
- отрицание: \`don't / doesn't\` + **V1** (сам глагол уже без -s!);
- вопрос: \`Do / Does\` + подлежащее + **V1**.

Окончание для he/she/it: обычно **-s**; после \`-o, -ch, -sh, -ss, -x\` → **-es** (\`go → goes\`, \`watch → watches\`); \`согласная + y\` → **-ies** (\`study → studies\`).

## Слова-маркеры

\`always, usually, often, sometimes, rarely, never, every day, on Mondays\`.

> **Главная ошибка русскоговорящих.** (1) Забыть **-s** у he/she/it: не «He work», а «He **works**». (2) Использовать Present Simple для того, что происходит ПРЯМО СЕЙЧАС, — для этого есть Present Continuous: «Look, he **is working**» (сейчас), но «He **works** hard» (вообще).

## Форма he/she/it — потренируйся

Впиши форму глагола для he/she/it и нажми «Проверить»:

\`\`\`table {"cols":["he / she / it"],"rows":["go","watch","study","fly","do","have"]}
goes
watches
studies
flies
does
has
\`\`\`

## Проверь себя

\`\`\`quiz {}
He ___ coffee every morning.
- drink
+ drinks
- is drinking
- drinked
\`\`\`

\`\`\`blank {}
My sister ___ (study) medicine, and she ___ (not / like) exams.
= studies
= doesn't like | does not like
\`\`\`

## Слова урока

\`\`\`flashcards {}
usually | /ˈjuːʒuəli/ | обычно | I usually get up at seven.
commute | /kəˈmjuːt/ | ездить на работу | I commute by train every day.
routine | /ruːˈtiːn/ | распорядок, рутина | Morning routine keeps me focused.
rarely | /ˈreərli/ | редко | She rarely eats fast food.
schedule | /ˈskedʒuːl/ | расписание, график | The schedule changes on Fridays.
\`\`\`
`,
          homework: `
1. Напиши свой распорядок дня — 6–8 предложений в Present Simple (с маркерами usually/often/every day).
2. Поставь глаголы в форму he/she/it: (to fix) he ___, (to pass) she ___, (to carry) it ___, (to teach) he ___.
3. Переведи: «Он не пьёт кофе», «Ты работаешь по субботам?», «Она всегда опаздывает».
`,
          cards: [
            { q: "Когда используется Present Simple?", a: "Регулярные/повторяющиеся действия, привычки, факты, расписания — не «прямо сейчас»" },
            { q: "Окончание глагола для he/she/it в Present Simple?", a: "-s (обычно); -es после o/ch/sh/ss/x; -ies если согласная+y (study → studies)" },
            { q: "Как строятся отрицание и вопрос в Present Simple?", a: "don't/doesn't + V1; Do/Does + подлежащее + V1 — сам глагол без -s" },
            { q: "Главная ошибка русскоговорящих в Present Simple?", a: "Забыть -s у he/she/it и путать с «сейчас» (это Present Continuous)" }
          ]
        },
        {
          id: "eng-03",
          title: "Present Continuous",
          theory: `
## Когда используем

\`\`\`grammar {"title":"Present Continuous","formula":"am / is / are + V-ing"}
Действие происходит ПРЯМО СЕЙЧАС или временно, «в эти дни». Также — заранее договорённые планы на будущее.
* I **am writing** code right now. — в этот момент
* She **is studying** a lot these days. — временно, в этот период
* We **are meeting** them tomorrow. — договорённый план
\`\`\`

## Формула

\`am\` (I) / \`is\` (he/she/it) / \`are\` (you/we/they) + **V-ing**.
- отрицание: \`'m not / isn't / aren't\` + V-ing;
- вопрос: \`Am/Is/Are\` + подлежащее + V-ing.

Написание **-ing**: \`write → writing\` (убираем немую e), \`run → running\` (удваиваем согласную), \`lie → lying\` (ie → y).

## Слова-маркеры

\`now, right now, at the moment, currently, today, these days, Listen!, Look!\`.

> **Главная ошибка русскоговорящих.** Ставить в Continuous **глаголы состояния** (stative), которые в принципе НЕ бывают длительными: \`know, understand, like, love, want, need, believe, remember, mean\`. Правильно: «I **know** the answer» (не «am knowing»), «I **want** tea now» (не «am wanting»).

## Проверь себя

\`\`\`quiz {}
Look! It ___ outside.
- rains
+ is raining
- rain
- raining
\`\`\`

\`\`\`quiz {}
I ___ this song — it's my favourite. (глагол состояния!)
+ love
- am loving
- loves
- is loving
\`\`\`

\`\`\`blank {}
Be quiet, please — the baby ___ (sleep) right now.
= is sleeping | 's sleeping
\`\`\`

## Слова урока

\`\`\`flashcards {}
currently | /ˈkʌrəntli/ | в данный момент | I'm currently learning Go.
at the moment | /ət ðə ˈmoʊmənt/ | сейчас, в данный момент | She's busy at the moment.
temporary | /ˈtempərəri/ | временный | It's a temporary solution.
stative verb | /ˈsteɪtɪv vɜːrb/ | глагол состояния | Stative verbs avoid the -ing form.
progress | /ˈprɑːɡres/ | прогресс, продвижение | We're making good progress.
\`\`\`
`,
          homework: `
1. Опиши, что происходит вокруг тебя прямо сейчас — 5 предложений в Present Continuous.
2. Выбери правильное время (Simple или Continuous): «I ___ (drink) coffee every day», «Right now I ___ (drink) tea».
3. Найди ошибку: «I am knowing this rule», «She is wanting to sleep» — исправь.
`,
          cards: [
            { q: "Формула и смысл Present Continuous?", a: "am/is/are + V-ing — действие сейчас / временно / договорённый план на будущее" },
            { q: "Правила написания -ing?", a: "write→writing (убрать e), run→running (удвоить согласную), lie→lying (ie→y)" },
            { q: "Какие глаголы НЕ ставят в Continuous?", a: "Глаголы состояния (stative): know, understand, like, love, want, need, believe, remember" },
            { q: "Present Simple vs Continuous — в чём разница?", a: "Simple — вообще/регулярно; Continuous — прямо сейчас/временно" }
          ]
        },
        {
          id: "eng-04",
          title: "Past Simple",
          theory: `
## Когда используем

\`\`\`grammar {"title":"Past Simple","formula":"V2  (правильные: +ed)"}
Завершённое действие в КОНКРЕТНЫЙ момент прошлого — есть указание «когда» (или оно понятно из контекста).
* I **wrote** the code yesterday. — конкретно вчера
* She **visited** Rome in 2019. — в конкретном году
* We **were** at home last night. — состояние в прошлом
\`\`\`

## Формула

- правильные глаголы: **V1 + -ed** (\`work → worked\`, \`stop → stopped\`, \`study → studied\`);
- неправильные — своя форма V2 (\`go → went\`, \`buy → bought\`);
- отрицание: \`did not (didn't)\` + **V1** (базовая форма!);
- вопрос: \`Did\` + подлежащее + **V1**.

Глагол **to be** особый: \`was\` (I/he/she/it) / \`were\` (you/we/they), отрицание \`wasn't/weren't\`, вопрос \`Was/Were …?\` — без \`did\`.

## Слова-маркеры

\`yesterday, ago, last week/year, in 2010, then, when\`.

> **Главная ошибка русскоговорящих.** (1) Ставить V2 после **did**: не «Did you **went**?», а «Did you **go**?» — did уже показывает прошлое, глагол в базовой форме. (2) Брать Present Perfect вместо Past Simple, когда есть точное время: «I **saw** it yesterday», а не «have seen».

## Форма прошедшего времени — потренируйся

Впиши форму Past Simple (V2):

\`\`\`table {"cols":["V2 (Past)"],"rows":["play","stop","study","go","buy","think"]}
played
stopped
studied
went
bought
thought
\`\`\`

## Проверь себя

\`\`\`quiz {}
___ you see the film last night?
+ Did
- Do
- Have
- Was
\`\`\`

\`\`\`blank {}
We ___ (go) to the beach yesterday, but she ___ (not / come) with us.
= went
= didn't come | did not come
\`\`\`

## Слова урока

\`\`\`flashcards {}
ago | /əˈɡoʊ/ | тому назад | I finished it two hours ago.
recently | /ˈriːsntli/ | недавно | We recently moved here.
former | /ˈfɔːrmər/ | бывший, прежний | My former job was stressful.
once | /wʌns/ | однажды, один раз | I met him once, years ago.
decade | /ˈdekeɪd/ | десятилетие | A lot changed in the last decade.
\`\`\`
`,
          homework: `
1. Расскажи, что ты делал вчера — 6–8 предложений в Past Simple (правильные и неправильные глаголы).
2. Задай 3 вопроса про прошлое с Did (и следи за базовой формой глагола).
3. Выбери время (Past Simple или Present Perfect): «I ___ (see) this film yesterday», «I ___ (already / see) this film».
`,
          cards: [
            { q: "Когда используется Past Simple?", a: "Завершённое действие в конкретный момент прошлого (yesterday, ago, last week, in 2010)" },
            { q: "Как образуется Past Simple у правильных глаголов?", a: "V1 + -ed (work→worked, stop→stopped, study→studied)" },
            { q: "Отрицание и вопрос в Past Simple?", a: "didn't + V1; Did + подлежащее + V1 — глагол в базовой форме (у to be — was/were, без did)" },
            { q: "Главная ошибка русскоговорящих в Past Simple?", a: "Ставить V2 после did («Did you went») и брать Present Perfect при точном времени" }
          ]
        },
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
        },
        {
          id: "eng-05",
          title: "Future: will и be going to",
          theory: `
## Два способа говорить о будущем

\`\`\`grammar {"title":"will + V1","formula":"will + V1"}
Решение, принятое ПРЯМО СЕЙЧАС, обещания, предсказания «по ощущению».
* The phone's ringing — I **will get** it. — решил в момент речи
* I **will help** you, I promise. — обещание
* I think it **will rain** tomorrow. — предположение
\`\`\`

\`\`\`grammar {"title":"be going to + V1","formula":"am / is / are going to + V1"}
Заранее обдуманный план/намерение и предсказание по видимым признакам.
* I **am going to start** a course next week. — уже решил заранее
* Look at those clouds — it **is going to rain**. — есть очевидные признаки
\`\`\`

## Коротко: как выбрать

- решение **в момент речи**, обещание → **will**;
- **план/намерение**, продуманное заранее → **be going to**;
- предсказание: «просто думаю» → **will**; «вижу признаки» → **be going to**;
- договорённость с конкретным временем/местом → часто Present Continuous: «I **am meeting** him at 5».

> **Главная ошибка русскоговорящих.** Ставить **will** на всё будущее подряд. Для заранее готового плана естественнее **be going to** или Present Continuous: не «I will meet him tomorrow (мы договорились)», а «I **am going to** meet / I **am meeting** him tomorrow». \`will\` — скорее спонтанное решение и предсказание.

## Проверь себя

\`\`\`quiz {}
— The phone is ringing! — OK, I ___ answer it.
+ will
- am going to
- answer
- going to
\`\`\`

\`\`\`quiz {}
Look at those dark clouds — it ___ rain.
+ is going to
- will
- rains
- going to
\`\`\`

\`\`\`blank {}
I've already decided: I ___ (start) a new course next month.
= am going to start | 'm going to start | going to start
\`\`\`

## Слова урока

\`\`\`flashcards {}
intend | /ɪnˈtend/ | намереваться | I intend to finish it today.
likely | /ˈlaɪkli/ | вероятный, вероятно | It's likely to rain later.
arrange | /əˈreɪndʒ/ | договориться, устроить | We arranged to meet on Friday.
predict | /prɪˈdɪkt/ | предсказывать | No one can predict the future.
probably | /ˈprɑːbəbli/ | вероятно, наверное | I'll probably be late.
\`\`\`
`,
          homework: `
1. Напиши 3 своих плана на следующую неделю (be going to) и 2 предсказания (will).
2. Выбери will или be going to: «I think our team ___ win», «I ___ (уже решил) travel this summer».
3. Придумай диалог, где кто-то принимает решение в момент речи (will) — 3–4 реплики.
`,
          cards: [
            { q: "Когда will, а когда be going to?", a: "will — спонтанное решение, обещание, предсказание «по ощущению»; be going to — заранее готовый план и предсказание по видимым признакам" },
            { q: "Как выразить договорённость на конкретное время в будущем?", a: "Часто Present Continuous: «I'm meeting him at 5» (или be going to)" },
            { q: "Формула be going to?", a: "am/is/are going to + V1" },
            { q: "Главная ошибка русскоговорящих про будущее?", a: "Ставить will на всё; для заранее продуманного плана нужны be going to / Present Continuous" }
          ]
        }
      ]
    }
  ]
});
