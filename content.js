// 지문별 학습 콘텐츠 (단어 · 문법 · 독해 · 말하기)
// 문법 카테고리: 문장의 5형식 / 동사(수의 일치 · 시제 · 태) / 준동사(to부정사 · 동명사 · 분사) 등 독해 핵심 문법

window.GRAMMAR_CATS = {
  form5:    { name: '문장의 5형식', desc: '동사 뒤에 어떤 요소(목적어·보어)가 오는지에 따라 문장 구조가 정해집니다. 특히 5형식(S+V+O+O.C)은 cause/force/allow + 목적어 + to부정사 형태로 독해 지문에 자주 나옵니다.' },
  agree:    { name: '수의 일치', desc: '동사는 수식어를 걷어낸 "진짜 주어"에 수를 맞춥니다. 주어 뒤에 전치사구·분사구가 길게 붙으면 헷갈리기 쉽습니다. data(복수), A and B(복수), 동명사 주어(단수)에 주의하세요.' },
  tense:    { name: '시제 (현재완료)', desc: 'have/has + p.p.는 과거에 시작된 일이 현재까지 이어지거나 현재에 영향을 줄 때 씁니다. since(~이래로), over the past ~, for ~ 와 자주 함께 쓰입니다. 명백한 과거 시점(in 1890, yesterday)과는 함께 쓰지 않습니다.' },
  voice:    { name: '태 (수동태)', desc: '주어가 동작을 "당하는" 경우 be + p.p.를 씁니다. 행위자는 by로 나타내며, 조동사와 함께 쓰면 can/could be + p.p. 형태가 됩니다.' },
  toinf:    { name: 'to부정사', desc: 'to + 동사원형. 명사적(~하는 것), 형용사적(~할, 명사 수식), 부사적(~하기 위해, ~해서) 용법이 있습니다. want/hope/begin 등은 to부정사를 목적어로 취합니다.' },
  gerund:   { name: '동명사', desc: '동사 + -ing가 명사 역할(주어·목적어·전치사의 목적어)을 합니다. 동명사 주어는 단수 취급하며, 전치사(in, of, about, without) 뒤에는 동명사를 씁니다.' },
  particip: { name: '분사 · 분사구문', desc: '현재분사(-ing, 능동/진행)와 과거분사(p.p., 수동/완료)는 명사를 수식하거나 분사구문을 만듭니다. 문장 끝의 ", leading to / increasing ~"은 결과를 나타내는 분사구문입니다.' },
  relative: { name: '관계사', desc: '관계대명사(who, which, that)는 앞의 명사를 꾸미는 절을 이끕니다. 콤마 뒤의 which는 앞 문장 전체를 가리킬 수 있습니다(계속적 용법).' },
  cond:     { name: '조건 · 가정', desc: 'If절(조건), Without ~(~이 없다면), even if(~하더라도) 등 조건 표현과 could/may/would 같은 추측 조동사가 함께 쓰여 예측을 나타냅니다.' },
  compare:  { name: '비교 · 특수구문', desc: '배수 비교(twice as ~ as), 비교급 강조, 부분부정(not all), 도치(Below are ~), 강조구문(It was ~ that) 등 독해에서 해석을 헷갈리게 하는 구문입니다.' }
};

window.CONTENT = {
  sleep: {
    vocab: [
      { w: 'unaware', pos: 'adj.', m: '알지 못하는, 의식하지 못하는', syn: 'oblivious, ignorant', ant: 'aware' },
      { w: 'surprisingly', pos: 'adv.', m: '놀라울 만큼, 의외로', syn: 'remarkably, unexpectedly', ant: 'predictably' },
      { w: 'expand', pos: 'v.', m: '넓어지다, 팽창하다', syn: 'enlarge, widen', ant: 'shrink' },
      { w: 'fluid', pos: 'n.', m: '액체, 유체', syn: 'liquid', ant: 'solid' },
      { w: 'suggest', pos: 'v.', m: '시사하다, 암시하다', syn: 'imply, indicate', ant: '' },
      { w: 'crucial', pos: 'adj.', m: '중대한, 결정적인', syn: 'vital, essential', ant: 'trivial' },
      { w: 'temporarily', pos: 'adv.', m: '일시적으로', syn: 'briefly, for now', ant: 'permanently' },
      { w: 'transfer', pos: 'v.', m: '옮기다, 이동시키다', syn: 'move, shift', ant: 'keep' },
      { w: 'benefit', pos: 'n.', m: '이점, 혜택', syn: 'advantage, gain', ant: 'drawback' },
      { w: 'workload', pos: 'n.', m: '업무량, 작업량', syn: 'burden, duties', ant: '' },
      { w: 'recommend', pos: 'v.', m: '권장하다, 추천하다', syn: 'advise, suggest', ant: 'discourage' },
      { w: 'survey', pos: 'n.', m: '설문 조사', syn: 'poll, study', ant: '' },
      { w: 'regularly', pos: 'adv.', m: '정기적으로, 규칙적으로', syn: 'routinely, often', ant: 'rarely' },
      { w: 'quality', pos: 'n.', m: '질, 품질', syn: 'standard, grade', ant: 'quantity' },
      { w: 'luxury', pos: 'n.', m: '사치(품)', syn: 'extravagance, indulgence', ant: 'necessity' }
    ],
    grammar: [
      { cat: 'tense', s: 'Today, however, scientists ___ that the brain is surprisingly active while we sleep.', o: ['have discovered', 'has discovered', 'discovering', 'were discovered'], a: 0,
        ex: '주어 scientists는 복수 → have. 과거에 발견해서 지금도 유효한 사실이므로 현재완료. 과학자들이 "발견한" 것이므로 수동태는 맞지 않습니다.' },
      { cat: 'particip', s: 'The spaces between these cells expand, ___ fluid to wash the waste away.', o: ['allowing', 'allowed', 'to allow', 'allows'], a: 0,
        ex: '콤마 뒤 결과의 분사구문. 앞 절 전체가 "~하게 해 주다"(능동) → allowing. allow A to do(5형식)도 함께 확인하세요.' },
      { cat: 'agree', s: "Some of this waste ___ linked to diseases such as Alzheimer's.", o: ['is', 'are', 'be', 'being'], a: 0,
        ex: 'Some of + 명사에서 동사는 of 뒤 명사에 맞춥니다. waste는 불가산명사 → 단수 동사 is.' },
      { cat: 'voice', s: 'When we learn something new, the information ___ only temporarily at first.', o: ['is stored', 'stores', 'is storing', 'has stored'], a: 0,
        ex: '정보는 "저장되는" 대상 → be + p.p. 수동태.' },
      { cat: 'relative', s: 'Students ___ stay up all night before an exam may actually remember less.', o: ['who', 'which', 'whose', 'what'], a: 0,
        ex: '선행사가 사람(Students)이고 관계절에서 주어 역할 → 주격 관계대명사 who. what은 선행사가 없을 때만 씁니다.' },
      { cat: 'compare', s: 'Sleep is not a break from studying ___ a part of it.', o: ['but', 'and', 'or', 'so'], a: 0,
        ex: 'not A but B = "A가 아니라 B". 잠은 공부의 휴식이 아니라 공부의 일부라는 뜻입니다.' },
      { cat: 'form5', s: 'Long working hours and heavy workloads make the problem even ___.', o: ['worse', 'badly', 'worsen', 'to worsen'], a: 0,
        ex: 'make + 목적어 + 형용사 목적격보어(5형식). 부사(badly)는 보어가 될 수 없고, even은 비교급(worse)을 강조합니다.' },
      { cat: 'gerund', s: '___ to bed at the same time every day helps the body keep a regular rhythm.', o: ['Going', 'Go', 'Gone', 'Goes'], a: 0,
        ex: '동명사 주어(~하는 것)는 단수 취급 → helps. help + 목적어 + 동사원형도 함께 확인하세요.' },
      { cat: 'toinf', s: 'Turning off screens an hour before bed also makes it easier ___ asleep.', o: ['to fall', 'fall', 'falling', 'fell'], a: 0,
        ex: 'make + it(가목적어) + 형용사 + to부정사(진목적어). "잠드는 것을 더 쉽게 만든다".' },
      { cat: 'cond', s: 'Experts recommend that adults ___ seven to nine hours of sleep each night.', o: ['get', 'gets', 'got', 'to get'], a: 0,
        ex: 'recommend / suggest / insist 뒤의 당위의 that절에서는 (should) + 동사원형을 씁니다. should가 생략되어 주어가 3인칭이어도 get.' }
    ],
    reading: [
      { type: '주제', q: '이 글의 주제로 가장 적절한 것은?', o: ['잠은 뇌 건강과 학습에 필수적이므로 우선순위로 삼아야 한다.', '스마트폰 중독을 치료하는 방법', '알츠하이머병의 최신 치료법', '직장인의 근무 시간을 줄여야 하는 경제적 이유'], a: 0,
        ex: '뇌 청소 → 기억 형성 → 수면 부족 사회 → 수면 습관 개선의 흐름으로, 잠이 "basic need"라는 결론에 이릅니다.' },
      { type: '내용 일치', q: '글의 내용과 일치하는 것은?', o: ['잠자는 동안 뇌세포 사이의 공간이 넓어진다.', '과학자들은 잠자는 동안 뇌가 거의 쉰다는 것을 밝혔다.', '전문가들은 성인에게 하루 5~6시간의 수면을 권장한다.', '성인의 절반 이상이 권장 시간보다 적게 잔다.'], a: 0,
        ex: '"the spaces between these cells expand". 뇌는 놀라울 만큼 활발하고(active), 권장 수면은 7~9시간이며, 권장보다 적게 자는 성인은 약 3분의 1입니다.' },
      { type: '내용 일치', q: '글의 내용과 일치하지 않는 것은?', o: ['새로 배운 정보는 처음부터 장기 기억에 저장된다.', '스마트폰의 청색광은 뇌에 아직 낮이라고 알려 준다.', '매일 같은 시간에 자면 몸이 규칙적인 리듬을 유지한다.', '깊은 잠을 자는 동안 뇌는 그날의 경험을 재생한다.'], a: 0,
        ex: '"the information is stored only temporarily at first" — 처음에는 일시적으로만 저장되고, 깊은 잠을 자는 동안 장기 기억으로 옮겨집니다.' },
      { type: '추론', q: '시험 전날 밤을 새우는 학생에 관한 내용에서 추론할 수 있는 것은?', o: ['잠을 줄여 공부 시간을 늘리면 오히려 학습 효과가 떨어질 수 있다.', '밤을 새우면 기억력이 좋아진다.', '시험 전에는 공부를 하지 않는 것이 좋다.', '잠은 학습과 관련이 없다.'], a: 0,
        ex: '밤을 새운 학생이 잘 잔 학생보다 덜 기억할 수 있다고 하며, 잠은 "공부의 일부"라고 말합니다.' },
      { type: '추론', q: '"Sleep is not a luxury"가 의미하는 것은?', o: ['잠은 여유가 있을 때만 누리는 것이 아니라 누구에게나 꼭 필요한 것이다.', '좋은 침대는 비싸다.', '잠을 많이 자는 것은 게으른 것이다.', '잠은 음식이나 물보다 덜 중요하다.'], a: 0,
        ex: '"it is a basic need, just like food and water" — 음식과 물처럼 기본적인 필요라는 뜻입니다.' }
    ],
    speaking: [
      { q: 'Can you explain why sleep is important for the brain in two or three sentences?', keys: ['brain', 'waste', 'memory', 'learn', 'clean', 'information', 'health', 'disease', 'because'] },
      { q: 'Do you usually get enough sleep? Why or why not?', keys: ['sleep', 'hours', 'smartphone', 'study', 'work', 'busy', 'because', 'usually', 'night'] },
      { q: 'Which habit from the passage will you try to improve your sleep, and why?', keys: ['bed', 'same', 'time', 'screen', 'phone', 'turn', 'habit', 'because', 'try'] }
    ]
  },

  heat: {
    vocab: [
      { w: 'phenomenon', pos: 'n.', m: '현상', syn: 'occurrence, event', ant: '' },
      { w: 'urban', pos: 'adj.', m: '도시의', syn: 'city, metropolitan', ant: 'rural' },
      { w: 'increasingly', pos: 'adv.', m: '점점 더', syn: 'more and more', ant: '' },
      { w: 'absorb', pos: 'v.', m: '흡수하다', syn: 'soak up, take in', ant: 'emit' },
      { w: 'release', pos: 'v.', m: '방출하다, 내보내다', syn: 'emit, give off', ant: 'absorb' },
      { w: 'evaporation', pos: 'n.', m: '증발', syn: 'vaporization', ant: 'condensation' },
      { w: 'trap', pos: 'v.', m: '가두다', syn: 'catch, hold', ant: 'free' },
      { w: 'sharply', pos: 'adv.', m: '급격히', syn: 'rapidly, steeply', ant: 'gradually' },
      { w: 'elderly', pos: 'adj.', m: '연세 드신, 나이 든', syn: 'aged, senior', ant: 'young' },
      { w: 'vicious', pos: 'adj.', m: '악의적인, 악순환의', syn: 'harmful, destructive', ant: 'virtuous' },
      { w: 'effective', pos: 'adj.', m: '효과적인', syn: 'successful, useful', ant: 'ineffective' },
      { w: 'reflect', pos: 'v.', m: '반사하다, 반영하다', syn: 'bounce back, mirror', ant: 'absorb' },
      { w: 'restore', pos: 'v.', m: '복원하다, 회복시키다', syn: 'repair, renew', ant: 'damage' },
      { w: 'noticeably', pos: 'adv.', m: '눈에 띄게', syn: 'clearly, markedly', ant: 'slightly' },
      { w: 'livable', pos: 'adj.', m: '살기 좋은', syn: 'habitable, comfortable', ant: 'uninhabitable' }
    ],
    grammar: [
      { cat: 'gerund', s: 'As more people move to cities, understanding it ___ increasingly important.', o: ['has become', 'have become', 'becoming', 'to become'], a: 0,
        ex: '동명사 주어(understanding it)는 단수 → has become. cities에 이끌려 복수 동사를 쓰지 않도록 주의!' },
      { cat: 'voice', s: 'Cities ___ mostly of concrete, asphalt and glass.', o: ['are built', 'build', 'are building', 'have built'], a: 0,
        ex: '도시는 "지어지는" 대상 → be built of(~로 지어지다) 수동태.' },
      { cat: 'toinf', s: 'Unlike forests, cities have few plants ___ the air through shade and evaporation.', o: ['to cool', 'cooling', 'cooled', 'cools'], a: 0,
        ex: '형용사적 용법의 to부정사가 plants를 뒤에서 수식: "공기를 식혀 줄 식물".' },
      { cat: 'particip', s: 'Tall buildings also trap warm air, ___ it from escaping.', o: ['preventing', 'prevented', 'to prevent', 'prevents'], a: 0,
        ex: '콤마 뒤 결과의 분사구문(능동) → preventing. prevent A from -ing(A가 ~하지 못하게 하다).' },
      { cat: 'agree', s: 'During heatwaves, the number of people who are taken to hospital ___ sharply.', o: ['rises', 'rise', 'rising', 'have risen'], a: 0,
        ex: 'the number of + 복수명사 = "~의 수"(단수) → rises. a number of(많은)는 복수 취급입니다.' },
      { cat: 'relative', s: 'People turn up their air conditioners, ___ in turn release even more heat outside.', o: ['which', 'that', 'what', 'who'], a: 0,
        ex: '콤마 뒤 계속적 용법에서는 that을 쓸 수 없습니다. 선행사(air conditioners)가 사물 → which.' },
      { cat: 'compare', s: 'A single large tree can cool the air around it as ___ as several air conditioners.', o: ['much', 'more', 'many', 'most'], a: 0,
        ex: '동등 비교 as + 원급 + as. 동사(cool)의 정도를 나타내므로 much.' },
      { cat: 'form5', s: 'Some cities have painted their roofs ___ so that they reflect sunlight.', o: ['white', 'whitely', 'to white', 'whiten'], a: 0,
        ex: 'paint + 목적어 + 형용사(목적격보어) 5형식: "지붕을 흰색으로 칠하다". 부사는 보어가 될 수 없습니다.' },
      { cat: 'particip', s: 'Others are creating "green roofs" ___ with grass and small plants.', o: ['covered', 'covering', 'to cover', 'covers'], a: 0,
        ex: '지붕은 풀로 "덮인" 것(수동) → 과거분사 covered가 roofs를 뒤에서 수식.' },
      { cat: 'cond', s: '___ cities are designed with nature in mind, they can remain livable even as the planet warms.', o: ['If', 'Unless', 'Despite', 'Without'], a: 0,
        ex: 'If + 절 = "~한다면"(조건). Unless는 "~하지 않는다면"이라 의미가 반대이고, Despite/Without 뒤에는 명사가 옵니다.' }
    ],
    reading: [
      { type: '주제', q: '이 글의 주제로 가장 적절한 것은?', o: ['도시 열섬 현상의 원인과 피해, 그리고 해결 방안', '서울 청계천의 역사', '에어컨 산업의 성장', '시골 생활의 장점'], a: 0,
        ex: '현상 소개 → 원인(Why Cities Get Hotter) → 피해(The Cost of Heat) → 해결(Cooling Our Cities)의 구조입니다.' },
      { type: '내용 일치', q: '글의 내용과 일치하는 것은?', o: ['큰 나무 한 그루는 에어컨 여러 대만큼 공기를 식힐 수 있다.', '도시의 재료들은 밤에 열을 빠르게 방출한다.', '청계천은 2015년에 복원되었다.', '젊은 사람들이 더위에 가장 취약하다.'], a: 0,
        ex: '"as much as several air conditioners". 열은 밤에 천천히(slowly) 방출되고, 청계천은 2005년 복원, 특히 위험한 사람은 노인과 혼자 사는 사람입니다.' },
      { type: '내용 일치', q: '글의 내용과 일치하지 않는 것은?', o: ['높은 건물들은 따뜻한 공기가 잘 빠져나가도록 돕는다.', '자동차, 에어컨, 공장은 추가로 열을 만들어 낸다.', '흰 지붕은 햇빛을 반사한다.', '폭염 때 병원으로 이송되는 사람이 급격히 늘어난다.'], a: 0,
        ex: '"Tall buildings ... trap warm air, preventing it from escaping." — 공기가 빠져나가지 못하게 막습니다.' },
      { type: '추론', q: "글에서 말하는 'vicious cycle(악순환)'의 내용으로 가장 적절한 것은?", o: ['더위 → 에어컨 사용 증가 → 바깥 열 증가 → 더 심한 더위', '나무 심기 → 그늘 증가 → 기온 하락', '인구 증가 → 도시 확장 → 시골 감소', '폭염 → 병원 증가 → 의료비 감소'], a: 0,
        ex: '에어컨을 세게 틀면 "in turn release even more heat outside" — 결과가 다시 원인을 키우는 구조입니다.' },
      { type: '추론', q: '글쓴이가 청계천을 언급한 이유로 가장 적절한 것은?', o: ['자연을 활용한 도시 설계가 실제로 효과가 있음을 보여 주려고', '서울의 관광지를 소개하려고', '하천 복원이 비용이 많이 든다는 것을 비판하려고', '도로를 더 많이 지어야 함을 주장하려고'], a: 0,
        ex: '하천 주변이 인근 도로보다 "noticeably cooler"해졌다는 연구를 근거로, 마지막 문장에서 자연을 염두에 둔 설계를 강조합니다.' }
    ],
    speaking: [
      { q: 'In your own words, why are cities hotter than the countryside?', keys: ['concrete', 'asphalt', 'heat', 'absorb', 'plants', 'trees', 'buildings', 'cars', 'because'] },
      { q: 'Have you ever felt the heat island effect in your city? Describe your experience.', keys: ['summer', 'hot', 'city', 'street', 'remember', 'felt', 'park', 'building', 'when'] },
      { q: 'Which solution do you think would work best for your city? Why?', keys: ['trees', 'plant', 'roof', 'white', 'green', 'stream', 'park', 'think', 'because'] }
    ]
  },

  procrast: {
    vocab: [
      { w: 'delay', pos: 'v.', m: '미루다, 지연시키다', syn: 'postpone, put off', ant: 'hurry' },
      { w: 'lazy', pos: 'adj.', m: '게으른', syn: 'idle, inactive', ant: 'diligent' },
      { w: 'psychologist', pos: 'n.', m: '심리학자', syn: '', ant: '' },
      { w: 'anxious', pos: 'adj.', m: '불안한, 걱정하는', syn: 'nervous, worried', ant: 'calm' },
      { w: 'insecure', pos: 'adj.', m: '자신 없는, 불안정한', syn: 'unsure, uncertain', ant: 'confident' },
      { w: 'instant', pos: 'adj.', m: '즉각적인', syn: 'immediate, quick', ant: 'delayed' },
      { w: 'relief', pos: 'n.', m: '안도(감), 완화', syn: 'comfort, ease', ant: 'distress' },
      { w: 'deadline', pos: 'n.', m: '마감 (기한)', syn: 'due date, time limit', ant: '' },
      { w: 'react', pos: 'v.', m: '반응하다', syn: 'respond', ant: 'ignore' },
      { w: 'reward', pos: 'n.', m: '보상', syn: 'prize, payoff', ant: 'penalty' },
      { w: 'overcome', pos: 'v.', m: '극복하다', syn: 'conquer, defeat', ant: 'surrender' },
      { w: 'strategy', pos: 'n.', m: '전략', syn: 'plan, approach', ant: '' },
      { w: 'threatening', pos: 'adj.', m: '위협적인, 부담스러운', syn: 'intimidating, scary', ant: 'reassuring' },
      { w: 'commit', pos: 'v.', m: '(~하기로) 다짐하다, 전념하다', syn: 'pledge, dedicate', ant: 'abandon' },
      { w: 'weakness', pos: 'n.', m: '약점, 나약함', syn: 'flaw, fault', ant: 'strength' }
    ],
    grammar: [
      { cat: 'form5', s: 'Instead of writing it, you find yourself ___ videos or cleaning your room.', o: ['watching', 'to watch', 'watched', 'watches'], a: 0,
        ex: 'find + 목적어 + 현재분사(5형식): "영상을 보고 있는 자신을 발견하다". 병렬된 cleaning과 형태도 맞춥니다.' },
      { cat: 'voice', s: 'This habit of delaying tasks ___ procrastination.', o: ['is called', 'calls', 'is calling', 'called'], a: 0,
        ex: '5형식 call A B의 수동태: A is called B. 습관이 "~라고 불리는" 것.' },
      { cat: 'gerund', s: 'Many people think procrastinators are simply lazy or bad at ___ time.', o: ['managing', 'manage', 'to manage', 'managed'], a: 0,
        ex: '전치사(at) 뒤에는 동명사. be bad at -ing = "~을 못하다".' },
      { cat: 'form5', s: 'When a task makes us ___ anxious, bored or insecure, our brain looks for a quick way out.', o: ['feel', 'to feel', 'feeling', 'felt'], a: 0,
        ex: '사역동사 make + 목적어 + 동사원형(5형식). to부정사를 쓰지 않습니다.' },
      { cat: 'relative', s: 'We feel even more stressed, ___ makes us want to escape again.', o: ['which', 'that', 'what', 'who'], a: 0,
        ex: '콤마 뒤 which는 앞 절 전체("더 스트레스를 받는 것")를 받습니다. 계속적 용법에 that은 불가.' },
      { cat: 'tense', s: 'Brain scans ___ that people think about their future selves like strangers.', o: ['have shown', 'has shown', 'showing', 'are shown'], a: 0,
        ex: '주어 Brain scans(복수) → have. 연구 결과가 현재까지 유효하므로 현재완료.' },
      { cat: 'cond', s: 'Their brains react as if they ___ thinking about strangers.', o: ['were', 'are', 'have been', 'will be'], a: 0,
        ex: 'as if + 과거(가정법 과거) = "마치 ~인 것처럼". 실제로는 낯선 사람이 아니라 자기 자신이므로 사실과 반대.' },
      { cat: 'voice', s: 'The good news is that procrastination can ___ with a few practical strategies.', o: ['be overcome', 'overcome', 'be overcoming', 'have overcome'], a: 0,
        ex: '미루기는 "극복되는" 대상 → 조동사 + be + p.p.' },
      { cat: 'gerund', s: 'Second, commit to ___ on it for just five minutes.', o: ['working', 'work', 'worked', 'works'], a: 0,
        ex: 'commit to의 to는 전치사 → 뒤에 동명사. look forward to -ing, be used to -ing도 같은 형태입니다.' },
      { cat: 'compare', s: 'Once you start, continuing is usually ___ easier than you expected.', o: ['much', 'very', 'more', 'most'], a: 0,
        ex: '비교급 강조 부사: much, even, still, far, a lot. very는 비교급을 꾸밀 수 없습니다.' },
      { cat: 'toinf', s: 'Students who forgave themselves were less likely ___ on the next exam.', o: ['to procrastinate', 'procrastinating', 'procrastinate', 'procrastinated'], a: 0,
        ex: 'be likely to + 동사원형 = "~할 가능성이 있다". less likely는 가능성이 더 낮다는 뜻.' }
    ],
    reading: [
      { type: '주제', q: '이 글의 주제로 가장 적절한 것은?', o: ['미루기의 원인은 감정과 미래의 나에 대한 인식이며, 실용적인 전략으로 극복할 수 있다.', '시간 관리 앱을 사용하는 방법', '게으른 사람들의 공통적인 성격', '시험 공부를 위한 최적의 시간표'], a: 0,
        ex: '원인(감정 관리, 미래 자아) → 극복 전략(작게 나누기, 5분 시작, 자기 용서)의 구조입니다.' },
      { type: '내용 일치', q: '글의 내용과 일치하는 것은?', o: ['미룬 자신을 용서한 학생들은 다음 시험에서 덜 미뤘다.', '미루기는 주로 시간 관리 능력이 부족해서 생긴다.', '일을 피해서 얻는 안도감은 오래 지속된다.', '뇌는 미래의 나를 가장 친한 친구처럼 여긴다.'], a: 0,
        ex: '"students who forgave themselves ... were less likely to procrastinate". 미루기는 감정 관리 문제이고, 안도감은 오래가지 않으며, 뇌는 미래의 나를 낯선 사람처럼 여깁니다.' },
      { type: '내용 일치', q: '글에서 제시한 미루기 극복 전략이 아닌 것은?', o: ['큰 일을 한 번에 끝까지 몰아서 하기', '큰 일을 작은 단계로 나누기', '딱 5분만 해 보기로 다짐하기', '실패했을 때 자신에게 친절하기'], a: 0,
        ex: '글은 오히려 "break a large task into smaller steps"라고 조언합니다.' },
      { type: '추론', q: '"we treat our future self as someone else"에서 추론할 수 있는 것은?', o: ['힘든 일을 미래의 나에게 떠넘기기 쉽다.', '미래를 계획하는 것은 불가능하다.', '다른 사람에게 일을 부탁하는 것이 좋다.', '미래의 나는 지금보다 더 게으를 것이다.'], a: 0,
        ex: '미래의 나를 남처럼 여기기 때문에 "happily leave the hard work to that person" 하게 됩니다.' },
      { type: '추론', q: "'딱 5분만 하기' 전략이 효과적인 이유로 가장 적절한 것은?", o: ['시작이 가장 어렵고, 일단 시작하면 계속하기가 훨씬 쉽기 때문에', '5분이면 모든 일을 끝낼 수 있기 때문에', '5분 동안 쉬면 스트레스가 사라지기 때문에', '마감이 5분 남았을 때 집중력이 높아지기 때문에'], a: 0,
        ex: '"Once you start, continuing is usually much easier than you expected."' }
    ],
    speaking: [
      { q: 'According to the passage, why do people procrastinate? Summarize the main reasons.', keys: ['emotion', 'feel', 'anxious', 'relief', 'future', 'self', 'stranger', 'avoid', 'because'] },
      { q: 'When do you usually procrastinate? Give an example from your own life.', keys: ['usually', 'when', 'assignment', 'exam', 'report', 'phone', 'videos', 'example', 'because'] },
      { q: 'Which strategy from the passage will you try first, and why?', keys: ['break', 'small', 'steps', 'five', 'minutes', 'kind', 'forgive', 'try', 'because'] }
    ]
  }
};

// 지속적으로 틀리는 문법을 위한 추가 문제 은행 (카테고리별 자동 출제)
window.GRAMMAR_BANK = [
  { cat: 'form5', s: 'The teacher allowed us ___ the dictionary during the test.', o: ['to use', 'use', 'using', 'used'], a: 0, ex: 'allow + 목적어 + to부정사 (5형식).' },
  { cat: 'form5', s: 'The news made everyone ___.', o: ['happy', 'happily', 'to happy', 'happiness'], a: 0, ex: 'make + 목적어 + 형용사 목적격보어 (5형식). 부사는 보어가 될 수 없습니다.' },
  { cat: 'form5', s: 'I heard someone ___ my name.', o: ['call', 'to call', 'called', 'calls'], a: 0, ex: '지각동사 hear + 목적어 + 동사원형/현재분사. to부정사는 쓰지 않습니다.' },
  { cat: 'agree', s: 'The number of students ___ increasing every year.', o: ['is', 'are', 'have', 'were'], a: 0, ex: 'the number of + 복수명사 = "~의 수"(단수) → is. (a number of는 복수)' },
  { cat: 'agree', s: 'Reading books ___ your vocabulary.', o: ['improves', 'improve', 'improving', 'are improving'], a: 0, ex: '동명사 주어는 단수 취급 → improves.' },
  { cat: 'agree', s: 'The results of the experiment ___ surprising.', o: ['were', 'was', 'is', 'has been'], a: 0, ex: '주어는 results(복수). of the experiment는 수식어.' },
  { cat: 'tense', s: 'She ___ in Seoul since 2020.', o: ['has lived', 'lived', 'lives', 'is living'], a: 0, ex: 'since + 과거 시점 → 현재완료.' },
  { cat: 'tense', s: 'The museum ___ in 1990.', o: ['opened', 'has opened', 'has been open', 'opens'], a: 0, ex: '명백한 과거 시점(in 1990)에는 현재완료를 쓸 수 없습니다.' },
  { cat: 'tense', s: 'Over the past decade, smartphones ___ the way we read.', o: ['have changed', 'changed', 'change', 'had changed'], a: 0, ex: 'over the past ~ (지난 ~ 동안) → 현재완료.' },
  { cat: 'voice', s: 'The bridge ___ in 1990.', o: ['was built', 'built', 'has built', 'was building'], a: 0, ex: '다리는 "지어지는" 대상 → 과거 수동태.' },
  { cat: 'voice', s: 'The problem can ___ easily.', o: ['be solved', 'solve', 'be solving', 'solved'], a: 0, ex: '조동사 + be + p.p.' },
  { cat: 'voice', s: 'English ___ all over the world.', o: ['is spoken', 'speaks', 'is speaking', 'spoke'], a: 0, ex: '영어는 "말해지는" 대상 → 현재 수동태.' },
  { cat: 'toinf', s: 'I went to the library ___ for the exam.', o: ['to study', 'study', 'studied', 'for study'], a: 0, ex: '부사적 용법(목적): ~하기 위해.' },
  { cat: 'toinf', s: 'She decided ___ abroad.', o: ['to study', 'studying', 'study', 'studied'], a: 0, ex: 'decide는 to부정사를 목적어로 취합니다.' },
  { cat: 'gerund', s: 'He is interested in ___ novels.', o: ['writing', 'write', 'to write', 'written'], a: 0, ex: '전치사(in) 뒤에는 동명사.' },
  { cat: 'gerund', s: 'Would you mind ___ the window?', o: ['opening', 'to open', 'open', 'opened'], a: 0, ex: 'mind는 동명사를 목적어로 취합니다.' },
  { cat: 'particip', s: 'The boy ___ under the tree is my brother.', o: ['sitting', 'sat', 'to sit', 'sits'], a: 0, ex: '현재분사가 명사를 뒤에서 수식(능동·진행).' },
  { cat: 'particip', s: 'I found the movie ___.', o: ['boring', 'bored', 'bore', 'to bore'], a: 0, ex: '영화가 지루함을 "주는" 것 → 현재분사 boring. (감정을 느끼는 사람은 bored)' },
  { cat: 'particip', s: '___ from the hill, the city looks beautiful.', o: ['Seen', 'Seeing', 'To see', 'Saw'], a: 0, ex: '도시가 "보여지는" 것이므로 수동 분사구문 Seen.' },
  { cat: 'relative', s: 'This is the book ___ I told you about.', o: ['that', 'what', 'who', 'whose'], a: 0, ex: '선행사(the book)가 있으므로 what은 불가. 사물 → that/which.' },
  { cat: 'relative', s: '___ he said was true.', o: ['What', 'That', 'Which', 'Who'], a: 0, ex: '선행사가 없으므로 what(= the thing which).' },
  { cat: 'cond', s: 'If it ___ tomorrow, we will stay home.', o: ['rains', 'will rain', 'rained', 'rain'], a: 0, ex: '조건 부사절에서는 현재시제가 미래를 대신합니다.' },
  { cat: 'cond', s: 'If I ___ you, I would study harder.', o: ['were', 'am', 'will be', 'be'], a: 0, ex: '가정법 과거: If + 과거(be동사는 were), 주절 would + 원형.' },
  { cat: 'compare', s: 'This house is three times ___ that one.', o: ['as large as', 'as larger as', 'larger as', 'as large than'], a: 0, ex: '배수사 + as 원급 as.' },
  { cat: 'compare', s: 'Not all students ___ the answer.', o: ['know', 'knows', 'knowing', 'to know'], a: 0, ex: '부분부정 Not all + 복수명사 + 복수동사: "모든 학생이 아는 것은 아니다".' }
];
