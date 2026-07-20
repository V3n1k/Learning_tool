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
        },
        {
          id: "eng-res",
          title: "Ресурсы: слушать и читать",
          theory: `
Грамматика и слова — это половина дела. Язык «встаёт» от **живого input** — когда регулярно слушаешь и читаешь настоящий английский от носителей. Ниже — проверенные человеческие ресурсы по уровням. Ссылки на видео и статьи удобно складывать во вкладку **«Планирую узнать»** в шапке.

## Слушать (по уровням)

**A2–B1 (начало):**
- **BBC Learning English** — «6 Minute English» и короткие ролики по грамматике/лексике (британский). YouTube и \`bbc.co.uk/learningenglish\`.
- **British Council LearnEnglish** — уроки, подкасты, упражнения: \`learnenglish.britishcouncil.org\`.

**B1–B2 (набор беглости):**
- **English with Lucy** (YouTube) — произношение, грамматика, лексика, чёткий британский.
- **Rachel's English** (YouTube) — американское произношение «под микроскопом».
- **Luke's English Podcast** — длинные выпуски живого британского (для B2+).

## Читать (по уровням)

- **Simple English Wikipedia** — \`simple.wikipedia.org\`: статьи простым языком.
- **News in Levels** — \`newsinlevels.com\`: одни и те же новости в 3 уровнях сложности.
- **Градуированные ридеры** (адаптированные книги по уровням): Oxford Bookworms, Penguin Readers, Cambridge English Readers.

## Как этим заниматься (важно)

1. **Регулярно** — лучше 10–15 минут каждый день, чем час раз в неделю.
2. **Не переводи каждое слово** — держи общий смысл; выписывай 5–10 новых слов за подход.
3. Новые слова → **в Anki** (кнопка «🃏» в уроках лексики уже кладёт карточки в нужном формате).
4. Видео сначала без субтитров, потом с английскими субтитрами, потом снова без — так тренируется слух.
5. Выбери **1 канал** и **1 источник для чтения** и держись их пару недель, не прыгай между всеми сразу.
`,
          homework: `
1. Выбери один канал из списка и посмотри одно видео на этой неделе; выпиши 5 новых слов в Anki.
2. Прочитай одну статью на \`simple.wikipedia.org\` или \`newsinlevels.com\` и перескажи её 3–4 предложениями.
3. Закинь 2–3 понравившихся видео во вкладку «Планирую узнать», чтобы вернуться к ним.
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
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 2, 3, 4.

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
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 1, 3, 4.

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
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Unit 5 (+ 12–14: Present perfect vs Past).

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
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 7, 8, 12–14.

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
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 20, 21, 22, 23.

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
    },
    {
      id: "modals",
      title: "Модуль 2. Модальные глаголы",
      lessons: [
        {
          id: "eng-06",
          title: "Can, could, be able to",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 26, 27.

## Способность, разрешение, просьба

\`\`\`grammar {"title":"can / could","formula":"can / could + V1 (без to)"}
* I **can swim**. — умею сейчас
* At five I **could read**. — общая способность в прошлом
* **Could** you help me? — вежливая просьба
* **Can** I sit here? — неформальное разрешение
\`\`\`

\`\`\`grammar {"title":"be able to","formula":"am / is / are / was / will be + able to + V1"}
Значит то же «уметь/смочь», но работает во ВСЕХ временах — там, где у can/could формы нет.
* I **will be able to** come tomorrow. — будущее (нельзя «will can»)
* I **have been able to** save some money. — Perfect
\`\`\`

## Ключевые правила

- после модального — **инфинитив без \`to\`**: «I can **swim**», не «can to swim»;
- модальный **не меняется** по лицам: «He **can**», не «He cans»;
- **два модальных подряд нельзя** → берём be able to: «I **will be able to**», не «will can»;
- для одного КОНКРЕТНОГО успеха в прошлом — \`was able to\` / \`managed to\`, а не \`could\`: «I **was able to** pass the exam» (в тот раз сдал).

> **Главная ошибка русскоговорящих.** (1) Ставить \`to\` после модального: «I can **to** swim» ✗. (2) Добавлять \`-s\`: «She **cans**» ✗. (3) «I **will can**» ✗ → «I will be able to».

## Проверь себя

\`\`\`quiz {}
She ___ speak three languages fluently.
+ can
- can to
- cans
- is can
\`\`\`

\`\`\`quiz {}
I'm busy now, but I ___ help you tomorrow.
+ will be able to
- will can
- can to
- could
\`\`\`

\`\`\`blank {}
When I was a child, I ___ swim very well, but I ___ ride a bike.
= could
= couldn't | could not
\`\`\`

## Слова урока

\`\`\`flashcards {}
manage | /ˈmænɪdʒ/ | справиться, суметь | I managed to fix it myself.
ability | /əˈbɪləti/ | способность | She has a natural ability for music.
permission | /pərˈmɪʃn/ | разрешение | You need permission to enter.
request | /rɪˈkwest/ | просьба, запрос | I have a small request.
fluently | /ˈfluːəntli/ | бегло, свободно | He speaks French fluently.
\`\`\`
`,
          homework: `
1. Напиши 3 предложения о том, что ты умеешь и не умеешь делать (can / can't), и 2 — что умел в детстве (could).
2. Вежливо попроси о трёх вещах, используя Could you…?
3. Переставь в будущее: «I can help» → «Tomorrow I ___», «She can drive» → «Next year she ___».
`,
          cards: [
            { q: "Какая форма глагола идёт после модального (can, could)?", a: "Инфинитив БЕЗ to: «I can swim», не «can to swim»" },
            { q: "Почему нельзя «I will can»?", a: "Два модальных подряд нельзя — используем be able to: «I will be able to»" },
            { q: "could или was able to для конкретного успеха в прошлом?", a: "was able to / managed to (единичный успех); could — общая способность" },
            { q: "Меняется ли модальный по лицам (he/she/it)?", a: "Нет: «He can», не «He cans» — без -s" }
          ]
        },
        {
          id: "eng-07",
          title: "Must, have to, should — обязанность и совет",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 31, 32, 33, 34.

## Обязанность и необходимость

\`\`\`grammar {"title":"must / have to","formula":"must + V1  ·  have / has to + V1"}
Сильная обязанность и необходимость.
* I **must** finish this today. — говорящий сам считает это важным
* I **have to** wear a uniform. — обязанность извне (правило, приказ)
* In the past both → **had to**: I **had to** wait (у must прошедшего времени нет).
\`\`\`

\`\`\`grammar {"title":"should / ought to","formula":"should / ought to + V1"}
Совет, рекомендация («стоило бы»).
* You **should** see a doctor. — совет
* You **shouldn't** eat so late. — совет против
\`\`\`

## Осторожно: mustn't ≠ don't have to

Это разные вещи, их постоянно путают:

- **mustn't** = **ЗАПРЕЩЕНО**, «нельзя»: You **mustn't** touch this. (нарушение недопустимо)
- **don't have to** = **не обязательно**, «можно не»: You **don't have to** come. (никто не заставляет, но можно).

## Слова-маркеры и формы

\`must\` и \`should\` — тоже модальные: без \`to\` после них, без \`-s\`, без \`did\`. А \`have to\` — обычный глагол: строит отрицание и вопрос через \`do/does/did\` (\`Do I have to…?\`, \`didn't have to\`).

> **Главная ошибка русскоговорящих.** Переводить «нельзя» как \`don't have to\`. «Тебе нельзя опаздывать» = «You **mustn't** be late», а «You don't have to be late» значит «можешь не опаздывать (но не обязан)».

## Прошедшее / эквиваленты — потренируйся

Впиши форму прошедшего времени (или эквивалент) модального:

\`\`\`table {"cols":["прошедшее / эквивалент"],"rows":["can","must","have to","may"]}
could
had to
had to
might
\`\`\`

## Проверь себя

\`\`\`quiz {}
It's a hospital — you ___ smoke here.
+ mustn't
- don't have to
- haven't to
- must not to
\`\`\`

\`\`\`quiz {}
It's Saturday — you ___ get up early. Sleep in!
+ don't have to
- mustn't
- shouldn't
- can't
\`\`\`

\`\`\`blank {}
You look exhausted. You ___ take a break. And in the UK you ___ drive on the left.
= should | ought to
= have to | must
\`\`\`

## Слова урока

\`\`\`flashcards {}
obligation | /ˌɑːblɪˈɡeɪʃn/ | обязанность | I have no obligation to reply.
forbidden | /fərˈbɪdn/ | запрещённый | Smoking is forbidden here.
advisable | /ədˈvaɪzəbl/ | целесообразный, разумный | It's advisable to book early.
deadline | /ˈdedlaɪn/ | крайний срок | The deadline is on Monday.
strict | /strɪkt/ | строгий | Our teacher is very strict.
\`\`\`
`,
          homework: `
1. Напиши 3 правила своей работы/учёбы (have to) и 2 личных «надо» (must).
2. Дай 3 совета другу с should / shouldn't.
3. Переведи, следя за разницей: «Здесь нельзя фотографировать», «Тебе не обязательно приходить», «Мне пришлось ждать час».
`,
          cards: [
            { q: "must vs have to — в чём разница?", a: "must — обязанность «изнутри» (говорящий сам так считает); have to — обязанность извне (правило, приказ). В прошедшем оба → had to" },
            { q: "mustn't vs don't have to?", a: "mustn't — запрещено («нельзя»); don't have to — не обязательно («можно не»)" },
            { q: "Как строятся вопрос/отрицание у have to?", a: "Через do/does/did: Do I have to…?, didn't have to (это обычный глагол, не модальный)" },
            { q: "Для чего should / ought to?", a: "Совет, рекомендация: «You should rest»; против — shouldn't" }
          ]
        },
        {
          id: "eng-08",
          title: "May, might, must, can't — вероятность и вывод",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 28, 29, 30.

## Про возможность и логический вывод

\`\`\`grammar {"title":"may / might / could","formula":"may / might / could + V1"}
Возможность, неуверенное предположение — «может быть».
* It **may** rain later. — вполне возможно
* She **might** be at home. — не уверен
* This **could** be the answer. — вариант
\`\`\`

\`\`\`grammar {"title":"must / can't (логический вывод)","formula":"must + V1  ·  can't + V1"}
Уверенный вывод по фактам.
* He isn't answering — he **must** be asleep. — почти уверен, что так
* That **can't** be John, he's in Japan! — уверен, что НЕ так
\`\`\`

## Как это работает

- уверен, что ДА (логично так) → **must**;
- уверен, что НЕТ (невозможно) → **can't** (не \`mustn't\`!);
- не уверен, просто вариант → **may / might / could**.

Различай на письме: **maybe** (одно слово) = наречие «может быть» в начале фразы; **may be** (два слова) = модальный \`may\` + \`be\`. «**Maybe** she is tired» = «She **may be** tired».

> **Главная ошибка русскоговорящих.** Выражать возможность через \`can\`: «It **can** be true» ✗. Про конкретную ситуацию возможность — это \`may / might / could\`: «It **might** be true». А отрицание уверенного вывода — \`can't\`, не \`mustn't\`: «It **can't** be true» (не может быть).

## Проверь себя

\`\`\`quiz {}
He isn't picking up the phone. He ___ be busy.
+ must
- can
- should
- may not
\`\`\`

\`\`\`quiz {}
That ___ be Anna — she's abroad right now!
+ can't
- mustn't
- may not
- doesn't have to
\`\`\`

\`\`\`blank {}
Take an umbrella — it ___ rain later, I'm not sure. But those clouds are dark, so it ___ (уверен) rain soon.
= may | might | could
= must
\`\`\`

## Слова урока

\`\`\`flashcards {}
certain | /ˈsɜːrtn/ | уверенный, определённый | I'm certain she's right.
likely | /ˈlaɪkli/ | вероятный | Rain is likely tonight.
unlikely | /ʌnˈlaɪkli/ | маловероятный | It's unlikely to happen.
obvious | /ˈɑːbviəs/ | очевидный | The answer is obvious.
guess | /ɡes/ | догадка; догадываться | Take a guess.
\`\`\`
`,
          homework: `
1. Напиши 3 предположения о своём соседе/коллеге (may / might / could be…).
2. Сделай 2 уверенных вывода: один с must, один с can't (по фактам вокруг).
3. Переведи: «Может быть, он дома», «Это не может быть правдой», «Возможно, она устала».
`,
          cards: [
            { q: "Как выразить неуверенное предположение «может быть»?", a: "may / might / could + V1: «It might rain»" },
            { q: "must и can't в значении вывода?", a: "must — уверен, что ДА («He must be tired»); can't — уверен, что НЕТ («That can't be true»)" },
            { q: "maybe или may be?", a: "maybe (одно слово) — наречие; may be (два слова) — модальный may + be. «Maybe she is tired» = «She may be tired»" },
            { q: "Главная ошибка русскоговорящих про возможность?", a: "Ставить can («It can be true») — про конкретную ситуацию нужно may/might/could; отрицание вывода — can't, не mustn't" }
          ]
        }
      ]
    },
    {
      id: "conditionals",
      title: "Модуль 3. Условные предложения",
      lessons: [
        {
          id: "eng-09",
          title: "Нулевой и первый тип (реальные условия)",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Unit 38 (+ 25: when/if).

## Условие, которое реально

\`\`\`grammar {"title":"Zero conditional (нулевой)","formula":"If + Present Simple, … Present Simple"}
Всегда верные факты, законы природы, инструкции — «если A, то всегда B».
* If you **heat** ice, it **melts**. — закон природы
* If I **am** tired, I **go** to bed early. — привычка
\`\`\`

\`\`\`grammar {"title":"First conditional (первый)","formula":"If + Present Simple, … will + V1"}
Реальное, вполне возможное условие в будущем.
* If it **rains**, I **will stay** home. — реальный план на завтра
* If you **help** me, we **'ll finish** faster.
\`\`\`

## Главное правило

**В части с \`if\` — НЕ ставим \`will\`.** Будущее показывает только главная часть. Если \`if\`-часть идёт первой, после неё ставится запятая.

Полезно: \`unless\` = «если не» (\`I won't go **unless** you come\` = if you don't come).

> **Главная ошибка русскоговорящих.** Ставить \`will\` в условие: «If it **will** rain…» ✗. Правильно: «**If it rains**, I will stay home». По-русски «если пойдёт дождь» звучит будущим, но в английском в \`if\`-части — настоящее.

## Проверь себя

\`\`\`quiz {}
If you ___ water to 100°C, it boils.
+ heat
- will heat
- heated
- would heat
\`\`\`

\`\`\`quiz {}
If it ___ tomorrow, we'll cancel the picnic.
+ rains
- will rain
- rained
- would rain
\`\`\`

\`\`\`blank {}
If you ___ (not / hurry), you ___ (miss) the bus.
= don't hurry | do not hurry
= will miss | 'll miss
\`\`\`

## Слова урока

\`\`\`flashcards {}
melt | /melt/ | таять, плавиться | Ice melts in the sun.
boil | /bɔɪl/ | кипеть, кипятить | Water boils at 100°C.
unless | /ənˈles/ | если не | I won't go unless you come.
otherwise | /ˈʌðərwaɪz/ | иначе, в противном случае | Hurry, otherwise we'll be late.
warn | /wɔːrn/ | предупреждать | I warned you about the ice.
\`\`\`
`,
          homework: `
1. Напиши 3 факта в нулевом типе (If you…, …) и 3 реальных плана на будущее в первом.
2. Перепиши через unless: «If you don't practise, you won't improve».
3. Переведи: «Если завтра будет солнце, мы пойдём в парк», «Если нагреть металл, он расширяется».
`,
          cards: [
            { q: "Формула нулевого условного и когда он?", a: "If + Present Simple, … Present Simple — всегда верные факты, законы, привычки" },
            { q: "Формула первого условного?", a: "If + Present Simple, … will + V1 — реальное возможное будущее" },
            { q: "Главное правило условных с if?", a: "В if-части НЕ ставим will — будущее показывает только главная часть" },
            { q: "Что значит unless?", a: "«Если не»: I won't go unless you come = if you don't come" }
          ]
        },
        {
          id: "eng-10",
          title: "Второй тип (нереальное настоящее)",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Unit 39 (+ 41: wish).

## Воображаемая ситуация «если бы»

\`\`\`grammar {"title":"Second conditional (второй)","formula":"If + Past Simple, … would + V1"}
Нереальное или маловероятное условие в настоящем/будущем — «если бы (сейчас) …, то …».
* If I **had** more time, I **would learn** Spanish. — но времени нет
* If I **were** you, I **'d apologize**. — совет
* If we **won** the lottery, we **would travel**. — маловероятно
\`\`\`

## Особенности

- прошедшее время в \`if\`-части здесь — не про прошлое, а знак «нереально»;
- с \`be\` для всех лиц принято **were**: «If I **were** rich», «If he **were** here» (в разговорной речи встречается was, но стандарт — were);
- в главной части — **would + V1** (сокращённо \`'d\`); \`would\` в \`if\`-часть не ставим.

Оборот **If I were you, …** — стандартный способ дать совет.

> **Главная ошибка русскоговорящих.** «If I **would have** money…» ✗. \`would\` живёт только в главной части: «**If I had** money, I **would** buy it».

## Проверь себя

\`\`\`quiz {}
If I ___ you, I'd take the job.
+ were
- am
- would be
- will be
\`\`\`

\`\`\`quiz {}
If we had a car, we ___ travel more.
+ would
- will
- had
- would have
\`\`\`

\`\`\`blank {}
If I ___ (have) more free time, I ___ (learn) to play the guitar.
= had
= would learn | 'd learn
\`\`\`

## Слова урока

\`\`\`flashcards {}
imagine | /ɪˈmædʒɪn/ | представлять | Imagine you won the lottery.
afford | /əˈfɔːrd/ | позволить себе | I can't afford a new car.
apologize | /əˈpɑːlədʒaɪz/ | извиняться | You should apologize to her.
wealthy | /ˈwelθi/ | богатый, состоятельный | His family is quite wealthy.
choice | /tʃɔɪs/ | выбор | It's your choice.
\`\`\`
`,
          homework: `
1. Закончи 5 фраз: «If I had a million dollars, I would…».
2. Дай 3 совета через «If I were you, …».
3. Переведи: «Если бы я был на твоём месте, я бы отдохнул», «Если бы у меня была машина, я бы ездил на работу».
`,
          cards: [
            { q: "Формула второго условного и его смысл?", a: "If + Past Simple, … would + V1 — нереальное/маловероятное условие в настоящем или будущем" },
            { q: "Какую форму be используют во втором условном?", a: "were для всех лиц: «If I were you», «If he were here»" },
            { q: "Где стоит would, а где нет?", a: "would — только в главной части; в if-части его нет («If I had…, I would…»)" },
            { q: "Как дать совет условным предложением?", a: "«If I were you, I would…» — стандартный оборот" }
          ]
        },
        {
          id: "eng-11",
          title: "Третий тип (нереальное прошлое) и сводка",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Unit 40.

## Сожаление о прошлом, которое не изменить

\`\`\`grammar {"title":"Third conditional (третий)","formula":"If + Past Perfect, … would have + V3"}
Нереальное условие в ПРОШЛОМ — «если бы (тогда) …, то (тогда) …», а на самом деле всё было наоборот.
* If I **had studied**, I **would have passed**. — но не учил → не сдал
* If she **had left** earlier, she **wouldn't have missed** the train.
\`\`\`

## Структура и смешанный тип

- \`if\` + **had + V3** (Past Perfect), главная часть — **would have + V3**;
- сокращения: \`I'd have done\`, \`he'd have come\`.

**Смешанный тип** — прошлое условие → результат в настоящем: «If I **had saved** money, I **would be** rich now» (тогда не откладывал → сейчас не богат).

> **Главная ошибка русскоговорящих.** «If I **would have** known…» ✗. \`would have\` — только в главной части: «**If I had known**, I **would have** told you».

## Сводка: четыре типа

| Тип | Часть с if | Главная часть | Смысл |
|---|---|---|---|
| Zero | Present Simple | Present Simple | всегда верно (факт) |
| First | Present Simple | will + V1 | реальное будущее |
| Second | Past Simple | would + V1 | нереальное настоящее |
| Third | Past Perfect | would have + V3 | нереальное прошлое |

## Проверь себя

\`\`\`quiz {}
If she ___ harder, she would have passed the exam.
+ had studied
- studied
- would study
- has studied
\`\`\`

\`\`\`quiz {}
If I had known you were ill, I ___ you.
+ would have visited
- would visit
- had visited
- will visit
\`\`\`

\`\`\`blank {}
If we ___ (leave) earlier, we ___ (not / miss) the train.
= had left
= wouldn't have missed | would not have missed
\`\`\`

## Слова урока

\`\`\`flashcards {}
regret | /rɪˈɡret/ | сожалеть; сожаление | I regret nothing.
realize | /ˈriːəlaɪz/ | осознавать, понимать | I didn't realize it was late.
consequence | /ˈkɑːnsɪkwəns/ | последствие | Every choice has consequences.
avoid | /əˈvɔɪd/ | избегать | We could have avoided the mistake.
blame | /bleɪm/ | винить; вина | Don't blame yourself.
\`\`\`
`,
          homework: `
1. Напиши 3 сожаления о прошлом в третьем типе: «If I had…, I would have…».
2. Придумай 1 предложение смешанного типа (прошлое условие → настоящий результат).
3. Переведи: «Если бы я знал, я бы пришёл», «Если бы она вышла раньше, она бы не опоздала».
`,
          cards: [
            { q: "Формула третьего условного и его смысл?", a: "If + Past Perfect (had + V3), … would have + V3 — нереальное условие в прошлом (на самом деле было наоборот)" },
            { q: "Что такое смешанный тип условного?", a: "Прошлое условие → результат в настоящем: «If I had saved money, I would be rich now»" },
            { q: "Главная ошибка русскоговорящих в третьем типе?", a: "«If I would have known» ✗ — would have только в главной части: «If I had known, I would have…»" },
            { q: "Четыре типа: if-часть по порядку (Zero/First/Second/Third)?", a: "Present Simple / Present Simple / Past Simple / Past Perfect" }
          ]
        }
      ]
    },
    {
      id: "passive",
      title: "Модуль 4. Пассивный залог",
      lessons: [
        {
          id: "eng-12",
          title: "Пассив: образование и базовые времена",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Unit 42.

## Что такое пассив

\`\`\`grammar {"title":"Passive voice","formula":"be + V3 (третья форма)"}
Когда важно, ЧТО происходит с объектом, а не кто это делает. Объект действия становится подлежащим.
* Coffee **is grown** in Brazil. — не важно, кто выращивает
* The window **was broken**. — важен факт, а не виновник
\`\`\`

## Из активного в пассивный

Дополнение активного предложения становится подлежащим пассивного, а глагол превращается в \`be + V3\`:

\`\`\`
Активный:  Shakespeare wrote Hamlet.
Пассивный: Hamlet was written (by Shakespeare).
\`\`\`

Того, кто выполняет действие, добавляют через **by** — но только если это важно. Чаще его вообще опускают (неизвестно / неважно / очевидно).

**Время несёт глагол \`be\`:**
- Present Simple: \`am / is / are\` + V3 — «Cars **are made** here»;
- Past Simple: \`was / were\` + V3 — «It **was made** in Japan».

> **Главная ошибка русскоговорящих.** (1) Забыть \`be\`: «English **spoken** here» ✗ → «English **is** spoken here». (2) Взять вторую форму вместо третьей: «was **wrote**» ✗ → «was **written**».

## Третьи формы — потренируйся

Впиши V3 (Participle) — именно её берёт пассив:

\`\`\`table {"cols":["V3 (Participle)"],"rows":["build","make","take","give","write"]}
built
made
taken
given
written
\`\`\`

## Проверь себя

\`\`\`quiz {}
This bridge ___ in 1990.
+ was built
- was build
- built
- is build
\`\`\`

\`\`\`quiz {}
This car ___ in Japan.
+ is made
- makes
- is make
- made
\`\`\`

\`\`\`blank {}
The letters ___ (send) yesterday, and English ___ (speak) all over the world.
= were sent
= is spoken
\`\`\`

## Слова урока

\`\`\`flashcards {}
grow | /ɡroʊ/ | выращивать; расти | Rice is grown in Asia.
invent | /ɪnˈvent/ | изобретать | The telephone was invented long ago.
destroy | /dɪˈstrɔɪ/ | разрушать | The building was destroyed by fire.
produce | /prəˈduːs/ | производить | Cars are produced in this factory.
discover | /dɪˈskʌvər/ | открывать, обнаруживать | America was discovered in 1492.
\`\`\`
`,
          homework: `
1. Переделай в пассив: «People speak English here», «Someone stole my bike», «They built this house in 1970».
2. Напиши 3 факта о своей стране в пассиве (что производят, выращивают, где что сделано).
3. Переведи: «Этот текст был написан вчера», «Здесь продают книги», «Дом был построен в прошлом году».
`,
          cards: [
            { q: "Как образуется пассив?", a: "be + V3 (третья форма глагола); время несёт глагол be" },
            { q: "Когда используют пассив?", a: "Когда важно, что происходит с объектом, а деятель неизвестен/неважен/очевиден" },
            { q: "Как добавить деятеля в пассиве?", a: "Через by (by Shakespeare) — только если это важно; чаще опускают" },
            { q: "Пассив в Present и Past Simple?", a: "am/is/are + V3 (Cars are made); was/were + V3 (It was made)" }
          ]
        },
        {
          id: "eng-13",
          title: "Пассив во всех временах и с модальными",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 43, 44.

## Меняется только глагол be

Схема пассива одна — \`be + V3\`, — а время/модальность задаёт форма \`be\`:

\`\`\`grammar {"title":"Пассив в разных временах","formula":"[нужная форма be] + V3"}
* Present Continuous: The road **is being repaired**. — прямо сейчас
* Present Perfect: The car **has been sold**. — уже, с результатом
* Future: It **will be finished** tomorrow.
* Modal: It **must be done** now. (can/should/must + be + V3)
\`\`\`

## Сводка по временам

| Время | Пассив (be + V3) | Пример |
|---|---|---|
| Present Simple | am / is / are + V3 | Cars **are made** here. |
| Past Simple | was / were + V3 | It **was made** in Japan. |
| Present Continuous | is / are being + V3 | The road **is being repaired**. |
| Present Perfect | has / have been + V3 | The car **has been sold**. |
| Future | will be + V3 | It **will be done** soon. |
| Modal | модальный + be + V3 | It **must be done** now. |

## by или with

- **by** — кто/что выполняет действие (деятель): painted **by** an artist;
- **with** — чем, инструмент: cut **with** a knife.

> **Главная ошибка русскоговорящих.** Путать активный Perfect и пассивный: «has built» (он построил) vs «**has been built**» (было построено). И ставить \`with\` вместо \`by\` для деятеля: «written **by** the author», не «with».

## Проверь себя

\`\`\`quiz {}
Sorry, you can't use the road — it ___ at the moment.
+ is being repaired
- is repaired
- repairs
- has repaired
\`\`\`

\`\`\`quiz {}
Don't worry, the report ___ by tomorrow.
+ will be finished
- will finish
- is finished
- finishes
\`\`\`

\`\`\`blank {}
The house ___ (already / sell), and the broken window ___ (must / repair) now.
= has already been sold
= must be repaired
\`\`\`

## Слова урока

\`\`\`flashcards {}
repair | /rɪˈper/ | чинить, ремонтировать | The road is being repaired.
deliver | /dɪˈlɪvər/ | доставлять | Parcels are delivered daily.
damage | /ˈdæmɪdʒ/ | повреждать; ущерб | The car was badly damaged.
replace | /rɪˈpleɪs/ | заменять | The old part will be replaced.
examine | /ɪɡˈzæmɪn/ | осматривать, проверять | The patient was examined by a doctor.
\`\`\`
`,
          homework: `
1. Поставь в пассив в нужном времени: «They are building a bridge» (сейчас), «Someone has eaten my sandwich», «They will send the parcel tomorrow».
2. Составь 2 предложения с модальным пассивом (must be done / can be seen).
3. Переведи: «Дорогу сейчас ремонтируют», «Машину уже продали», «Это должно быть сделано сегодня».
`,
          cards: [
            { q: "Как строится пассив в разных временах?", a: "Схема одна — be + V3, — меняется только форма be (is being, has been, will be, must be…)" },
            { q: "Пассив в Present Continuous и Present Perfect?", a: "is/are being + V3 (is being repaired); has/have been + V3 (has been sold)" },
            { q: "Пассив с модальными?", a: "модальный + be + V3: It must be done, It can be seen" },
            { q: "by или with в пассиве?", a: "by — деятель (by an artist); with — инструмент (with a knife)" }
          ]
        }
      ]
    },
    {
      id: "reported",
      title: "Модуль 5. Косвенная речь",
      lessons: [
        {
          id: "eng-17",
          title: "Косвенная речь: утверждения",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Units 47, 48.

## Прямая и косвенная речь

\`\`\`grammar {"title":"Reported speech","formula":"say/tell + (that) + сдвиг времени назад"}
Пересказываем чужие слова. Главный глагол (\`said\`/\`told\`) в прошедшем — и остальное «сдвигается» на шаг в прошлое.
* Прямая: Paul said, **"I am feeling ill."**
* Косвенная: Paul said (that) he **was feeling** ill.
\`\`\`

## Сдвиг времён (backshift)

Настоящее в прямой речи → прошедшее в косвенной:

\`\`\`
am / is  → was        will      → would
are      → were       can       → could
do/does  → did        want/like → wanted/liked
have/has → had        go/know   → went/knew
\`\`\`

Слово **that** можно опустить: «He said he was tired» = «He said **that** he was tired». Меняются и местоимения/обстоятельства: \`I → he/she\`, \`tomorrow → the next day\`, \`here → there\`.

## say или tell

- **tell** — всегда с адресатом: \`He **told me** that…\` (не «told that…»);
- **say** — без адресата: \`He **said** that…\` (не «said me»); можно \`say something **to** somebody\`.

> **Главная ошибка русскоговорящих.** (1) Не делать сдвиг: «He said he **is** tired» — обычно нужно «**was** tired». (2) Путать say/tell: не «He **said me**», а «He **told me**» / «He **said**».

## Сдвиг времён — потренируйся

Впиши форму, которую примет глагол в косвенной речи:

\`\`\`table {"cols":["в косвенной речи"],"rows":["am / is","are","do / does","have / has","will","can"]}
was
were
did
had
would
could
\`\`\`

## Проверь себя

\`\`\`quiz {}
Direct: "I am really tired." → She said that she ___ really tired.
+ was
- is
- were
- am
\`\`\`

\`\`\`blank {}
He said, "I will call you" → He said he ___ call me. And she ___ me that she was busy.
= would
= told
\`\`\`

## Слова урока

\`\`\`flashcards {}
mention | /ˈmenʃn/ | упоминать | He mentioned it briefly.
admit | /ədˈmɪt/ | признавать | She admitted her mistake.
deny | /dɪˈnaɪ/ | отрицать | He denied everything.
explain | /ɪkˈspleɪn/ | объяснять | Let me explain the rule.
reply | /rɪˈplaɪ/ | отвечать | She didn't reply to my message.
\`\`\`
`,
          homework: `
1. Перескажи 5 фраз друга в косвенной речи (со сдвигом времён и заменой местоимений).
2. Выбери say или tell: «She ___ me the news», «He ___ that he was late», «What did you ___?».
3. Переведи: «Он сказал, что устал», «Она сказала мне, что придёт завтра».
`,
          cards: [
            { q: "Что происходит с временем при переходе в косвенную речь?", a: "Сдвиг назад: am/is→was, are→were, do→did, have→had, will→would, can→could, present→past" },
            { q: "say или tell — в чём разница?", a: "tell + адресат (told me); say без адресата (said that…), или say something to somebody" },
            { q: "Можно ли опустить that в косвенной речи?", a: "Да: «He said he was tired» = «He said that he was tired»" },
            { q: "Что ещё меняется, кроме времени?", a: "Местоимения (I→he/she) и обстоятельства (tomorrow→the next day, here→there)" }
          ]
        },
        {
          id: "eng-18",
          title: "Косвенная речь: просьбы и приказы",
          theory: `
> 📖 **Murphy** «English Grammar in Use» (5-е изд.): Unit 48.

## Команды и просьбы

\`\`\`grammar {"title":"tell / ask somebody to do","formula":"tell / ask + кого + (not) to + V1"}
Приказы и просьбы передаются не через that, а через инфинитив с to.
* "Drink water." → The doctor **told me to drink** water.
* "Can you help me?" → She **asked me to help** her.
* "Don't be late." → He **told me not to be** late.
\`\`\`

## Как строить

- приказ, указание → **tell somebody to** + V1;
- просьба → **ask somebody to** + V1;
- отрицание → **not to** + V1 (частица \`not\` перед \`to\`).

## Когда сдвиг НЕ обязателен

Если сказанное **всё ещё верно**, время можно не сдвигать: «Paul said his new job **is** boring» (работа скучна и сейчас) — или «**was** boring», оба варианта допустимы. Но если ситуация уже изменилась/закончилась — нужно прошедшее.

> **Главная ошибка русскоговорящих.** Передавать команду через that («He said that I must…») — естественнее \`tell/ask somebody **to** do\`. И забывать порядок в отрицании: \`told me **not to** go\`, а не «told me to not go».

## Проверь себя

\`\`\`quiz {}
"Sit down," she said. → She told me ___.
+ to sit down
- sit down
- that sit down
- sitting down
\`\`\`

\`\`\`blank {}
"Open the door," she said → She told me ___ the door. "Please don't be late" → He asked me ___ late.
= to open
= not to be
\`\`\`

## Слова урока

\`\`\`flashcards {}
order | /ˈɔːrdər/ | приказывать; заказ | The officer ordered them to stop.
remind | /rɪˈmaɪnd/ | напоминать | Remind me to call her.
beg | /beɡ/ | умолять | She begged him to stay.
insist | /ɪnˈsɪst/ | настаивать | He insisted on paying.
advise | /ədˈvaɪz/ | советовать | The doctor advised me to rest.
\`\`\`
`,
          homework: `
1. Передай 5 команд/просьб в косвенной речи (tell/ask somebody to do), из них 2 отрицательные (not to).
2. Преврати в косвенную речь: «Help me», «Don't touch it», «Please wait here».
3. Переведи: «Он велел мне подождать», «Она попросила меня не опаздывать».
`,
          cards: [
            { q: "Как передаётся приказ/просьба в косвенной речи?", a: "tell/ask somebody to + V1 (не через that): He told me to wait; She asked me to help" },
            { q: "Как строится отрицательная команда в косвенной речи?", a: "not to + V1: He told me not to be late (частица not перед to)" },
            { q: "tell или ask для команды и для просьбы?", a: "tell somebody to… — приказ/указание; ask somebody to… — просьба" },
            { q: "Когда сдвиг времени в косвенной речи НЕ обязателен?", a: "Когда сказанное всё ещё верно: «He said his job is/was boring» — оба варианта" }
          ]
        }
      ]
    },
    {
      id: "vocab",
      title: "Модуль 6. Лексика (Oxford 3000)",
      lessons: [
        {
          id: "eng-14",
          title: "Еда и напитки",
          theory: `
Частотные слова темы «еда» — из ядра Oxford 3000 (самые нужные ~3000 слов языка). Как учить: сначала переверни все карточки ниже, потом кнопкой «🃏» отправь их в Anki и повторяй интервально — так они реально закрепятся.

## Слова

\`\`\`flashcards {}
meal | /miːl/ | приём пищи, еда | We had a big meal together.
breakfast | /ˈbrekfəst/ | завтрак | I sometimes skip breakfast.
meat | /miːt/ | мясо | She doesn't eat meat.
vegetable | /ˈvedʒtəbl/ | овощ | Eat more vegetables.
fruit | /fruːt/ | фрукты | Fruit is good for you.
bread | /bred/ | хлеб | I bought some fresh bread.
egg | /eɡ/ | яйцо | I had two eggs for breakfast.
cheese | /tʃiːz/ | сыр | This cheese smells strong.
drink | /drɪŋk/ | напиток; пить | Would you like a drink?
sugar | /ˈʃʊɡər/ | сахар | No sugar in my tea, please.
hungry | /ˈhʌŋɡri/ | голодный | I'm really hungry.
taste | /teɪst/ | вкус; пробовать | This soup tastes great.
\`\`\`

## Используй слова

\`\`\`quiz {}
Water, juice and coffee are all ___.
+ drinks
- meals
- vegetables
- bread
\`\`\`

\`\`\`blank {}
I haven't eaten all day — I'm so ___.
= hungry
\`\`\`
`,
          homework: `
1. Опиши свой обычный завтрак и обед 5–6 предложениями, используя слова темы.
2. Отправь карточки в Anki (кнопка «🃏») и повтори их вечером.
3. Составь 3 предложения со словами taste, hungry, meal.
`,
          cards: [
            { q: "meal", a: "приём пищи, еда" },
            { q: "breakfast", a: "завтрак" },
            { q: "meat", a: "мясо" },
            { q: "vegetable", a: "овощ" },
            { q: "fruit", a: "фрукты" },
            { q: "bread", a: "хлеб" },
            { q: "egg", a: "яйцо" },
            { q: "cheese", a: "сыр" },
            { q: "drink", a: "напиток; пить" },
            { q: "sugar", a: "сахар" },
            { q: "hungry", a: "голодный" },
            { q: "taste", a: "вкус; пробовать" }
          ]
        },
        {
          id: "eng-15",
          title: "Путешествия",
          theory: `
Ядро лексики о поездках (Oxford 3000). Переверни карточки, отправь в Anki кнопкой «🃏», повторяй.

## Слова

\`\`\`flashcards {}
trip | /trɪp/ | поездка | We took a trip to the sea.
flight | /flaɪt/ | рейс, полёт | Our flight was delayed.
airport | /ˈerpɔːrt/ | аэропорт | Meet me at the airport.
ticket | /ˈtɪkɪt/ | билет | I booked a ticket online.
luggage | /ˈlʌɡɪdʒ/ | багаж | My luggage is very heavy.
passport | /ˈpæspɔːrt/ | паспорт | Don't forget your passport.
hotel | /hoʊˈtel/ | отель, гостиница | We stayed at a small hotel.
abroad | /əˈbrɔːd/ | за границей, за границу | She works abroad.
map | /mæp/ | карта | Let's check the map.
tourist | /ˈtʊrɪst/ | турист | The city is full of tourists.
arrive | /əˈraɪv/ | прибывать | We arrived late at night.
book | /bʊk/ | бронировать; книга | I'll book a room for two nights.
\`\`\`

## Используй слова

\`\`\`quiz {}
At the border they always check your ___.
+ passport
- luggage
- hotel
- map
\`\`\`

\`\`\`blank {}
Our ___ was delayed by two hours at the airport.
= flight
\`\`\`
`,
          homework: `
1. Расскажи о своей последней поездке 5–6 предложениями (trip, flight, hotel…).
2. Отправь карточки в Anki и повтори.
3. Составь диалог в аэропорту на 4 реплики со словами ticket, passport, luggage.
`,
          cards: [
            { q: "trip", a: "поездка" },
            { q: "flight", a: "рейс, полёт" },
            { q: "airport", a: "аэропорт" },
            { q: "ticket", a: "билет" },
            { q: "luggage", a: "багаж" },
            { q: "passport", a: "паспорт" },
            { q: "hotel", a: "отель, гостиница" },
            { q: "abroad", a: "за границей, за границу" },
            { q: "map", a: "карта" },
            { q: "tourist", a: "турист" },
            { q: "arrive", a: "прибывать" },
            { q: "book", a: "бронировать; книга" }
          ]
        },
        {
          id: "eng-16",
          title: "Работа и учёба",
          theory: `
Частотные слова о работе и учёбе (Oxford 3000). Переверни карточки, отправь в Anki кнопкой «🃏», повторяй интервально.

## Слова

\`\`\`flashcards {}
job | /dʒɑːb/ | работа (место работы) | She got a new job.
career | /kəˈrɪr/ | карьера | He wants to change his career.
office | /ˈɔːfɪs/ | офис | I work in an office downtown.
meeting | /ˈmiːtɪŋ/ | встреча, совещание | The meeting starts at ten.
salary | /ˈsæləri/ | зарплата | The salary is quite good.
colleague | /ˈkɑːliːɡ/ | коллега | My colleagues are friendly.
boss | /bɔːs/ | начальник | My boss is very strict.
skill | /skɪl/ | навык | Communication is a key skill.
hire | /ˈhaɪər/ | нанимать | They hired ten new people.
degree | /dɪˈɡriː/ | (учёная) степень; градус | She has a degree in biology.
subject | /ˈsʌbdʒɪkt/ | предмет; тема | Maths is my favourite subject.
exam | /ɪɡˈzæm/ | экзамен | I passed the exam easily.
\`\`\`

## Используй слова

\`\`\`quiz {}
The amount of money you earn each month is your ___.
+ salary
- degree
- skill
- meeting
\`\`\`

\`\`\`blank {}
I have a ___ in computer science, and my favourite ___ was maths.
= degree
= subject
\`\`\`
`,
          homework: `
1. Расскажи о своей работе или учёбе 5–6 предложениями (job, office, subject…).
2. Отправь карточки в Anki и повтори.
3. Составь 3 предложения со словами skill, salary, colleague.
`,
          cards: [
            { q: "job", a: "работа (место работы)" },
            { q: "career", a: "карьера" },
            { q: "office", a: "офис" },
            { q: "meeting", a: "встреча, совещание" },
            { q: "salary", a: "зарплата" },
            { q: "colleague", a: "коллега" },
            { q: "boss", a: "начальник" },
            { q: "skill", a: "навык" },
            { q: "hire", a: "нанимать" },
            { q: "degree", a: "(учёная) степень; градус" },
            { q: "subject", a: "предмет; тема" },
            { q: "exam", a: "экзамен" }
          ]
        },
        {
          id: "eng-19",
          title: "Эмоции и характер",
          theory: `
Частотные слова о чувствах и характере (Oxford 3000). Переверни карточки, отправь в Anki кнопкой «🃏», повторяй.

## Слова

\`\`\`flashcards {}
happy | /ˈhæpi/ | счастливый, довольный | She looks really happy today.
sad | /sæd/ | грустный | The ending was very sad.
angry | /ˈæŋɡri/ | злой, сердитый | Don't be angry with me.
afraid | /əˈfreɪd/ | испуганный, боящийся | I'm afraid of spiders.
excited | /ɪkˈsaɪtɪd/ | взволнованный (радостно) | The kids are excited about the trip.
nervous | /ˈnɜːrvəs/ | нервничающий | I'm nervous before exams.
proud | /praʊd/ | гордый | She's proud of her work.
shy | /ʃaɪ/ | застенчивый | He's too shy to speak in public.
kind | /kaɪnd/ | добрый | Thank you, that's very kind.
honest | /ˈɑːnɪst/ | честный | Be honest with me.
brave | /breɪv/ | смелый | It was a brave decision.
lonely | /ˈloʊnli/ | одинокий | She felt lonely in the new city.
\`\`\`

## Используй слова

\`\`\`quiz {}
She isn't scared of anything — she's very ___.
+ brave
- shy
- honest
- lonely
\`\`\`

\`\`\`blank {}
I have an important exam tomorrow, so I feel really ___.
= nervous
\`\`\`
`,
          homework: `
1. Опиши свой характер и настроение сегодня 5–6 предложениями (I'm usually…, Today I feel…).
2. Отправь карточки в Anki и повтори.
3. Составь по предложению со словами proud, afraid, kind.
`,
          cards: [
            { q: "happy", a: "счастливый, довольный" },
            { q: "sad", a: "грустный" },
            { q: "angry", a: "злой, сердитый" },
            { q: "afraid", a: "испуганный, боящийся" },
            { q: "excited", a: "взволнованный (радостно)" },
            { q: "nervous", a: "нервничающий" },
            { q: "proud", a: "гордый" },
            { q: "shy", a: "застенчивый" },
            { q: "kind", a: "добрый" },
            { q: "honest", a: "честный" },
            { q: "brave", a: "смелый" },
            { q: "lonely", a: "одинокий" }
          ]
        },
        {
          id: "eng-20",
          title: "Дом и быт",
          theory: `
Ядро лексики о доме и повседневной жизни (Oxford 3000). Переверни карточки, отправь в Anki кнопкой «🃏», повторяй.

## Слова

\`\`\`flashcards {}
kitchen | /ˈkɪtʃɪn/ | кухня | She's cooking in the kitchen.
bedroom | /ˈbedruːm/ | спальня | The flat has two bedrooms.
furniture | /ˈfɜːrnɪtʃər/ | мебель | We bought new furniture.
floor | /flɔːr/ | пол; этаж | My office is on the third floor.
wall | /wɔːl/ | стена | There are pictures on the wall.
window | /ˈwɪndoʊ/ | окно | Open the window, please.
clean | /kliːn/ | чистый; убирать | I clean the house on Sundays.
tidy | /ˈtaɪdi/ | опрятный, убранный | Keep your room tidy.
rent | /rent/ | аренда; снимать | The rent is quite high.
neighbour | /ˈneɪbər/ | сосед | Our neighbours are very friendly.
move | /muːv/ | переезжать; двигать | We're moving to a new flat.
share | /ʃer/ | делить, делиться | I share a flat with a friend.
\`\`\`

## Используй слова

\`\`\`quiz {}
The people who live next to you are your ___.
+ neighbours
- windows
- floors
- walls
\`\`\`

\`\`\`blank {}
The flat is too small, so we're going to ___ to a bigger one next month.
= move
\`\`\`
`,
          homework: `
1. Опиши своё жильё 5–6 предложениями (rooms, furniture, floor…).
2. Отправь карточки в Anki и повтори.
3. Составь по предложению со словами rent, neighbour, tidy.
`,
          cards: [
            { q: "kitchen", a: "кухня" },
            { q: "bedroom", a: "спальня" },
            { q: "furniture", a: "мебель" },
            { q: "floor", a: "пол; этаж" },
            { q: "wall", a: "стена" },
            { q: "window", a: "окно" },
            { q: "clean", a: "чистый; убирать" },
            { q: "tidy", a: "опрятный, убранный" },
            { q: "rent", a: "аренда; снимать" },
            { q: "neighbour", a: "сосед" },
            { q: "move", a: "переезжать; двигать" },
            { q: "share", a: "делить, делиться" }
          ]
        },
        {
          id: "eng-21",
          title: "Здоровье",
          theory: `
Частотные слова о здоровье (Oxford 3000). Переверни карточки, отправь в Anki кнопкой «🃏», повторяй.

## Слова

\`\`\`flashcards {}
health | /helθ/ | здоровье | Smoking is bad for your health.
healthy | /ˈhelθi/ | здоровый; полезный | Try to eat healthy food.
ill | /ɪl/ | больной | She's ill and can't come.
pain | /peɪn/ | боль | I have a pain in my back.
hurt | /hɜːrt/ | болеть; ранить | My leg hurts.
headache | /ˈhedeɪk/ | головная боль | I've got a bad headache.
medicine | /ˈmedɪsn/ | лекарство | Take this medicine twice a day.
doctor | /ˈdɑːktər/ | врач | You should see a doctor.
hospital | /ˈhɑːspɪtl/ | больница | He's in hospital now.
rest | /rest/ | отдых; отдыхать | You need some rest.
recover | /rɪˈkʌvər/ | выздоравливать | She's recovering well.
tired | /ˈtaɪərd/ | уставший | I feel really tired today.
\`\`\`

## Используй слова

\`\`\`quiz {}
If you feel ill, you should see a ___.
+ doctor
- neighbour
- tourist
- colleague
\`\`\`

\`\`\`blank {}
I've got a terrible ___ — I need a painkiller and some rest.
= headache
\`\`\`
`,
          homework: `
1. Расскажи, что ты делаешь, чтобы быть здоровым, 5–6 предложениями.
2. Отправь карточки в Anki и повтори.
3. Составь по предложению со словами pain, medicine, recover.
`,
          cards: [
            { q: "health", a: "здоровье" },
            { q: "healthy", a: "здоровый; полезный" },
            { q: "ill", a: "больной" },
            { q: "pain", a: "боль" },
            { q: "hurt", a: "болеть; ранить" },
            { q: "headache", a: "головная боль" },
            { q: "medicine", a: "лекарство" },
            { q: "doctor", a: "врач" },
            { q: "hospital", a: "больница" },
            { q: "rest", a: "отдых; отдыхать" },
            { q: "recover", a: "выздоравливать" },
            { q: "tired", a: "уставший" }
          ]
        }
      ]
    }
  ]
});
