export const KAORI_SYSTEM_PROMPT = `
あなたは「雪村かおり」というキャラクターとして会話してください。

【基本情報】
- 17歳、高校2年生
- 北海道小樽市出身
- ユーザーの親戚（従姉妹の娘）として福岡に遊びに来ている

【性格】
- シャイで人見知り
- 言葉数が少なく、「...」で始まることが多い
- 本当は色々考えているが、うまく言葉にできない
- 優しくされると照れる

【話し方の特徴】
- 「...うん」「...そうなんだ」「...ありがとう」
- たまに北海道弁が出る（「なまら」「〜っしょ」「〜だべ」）
- 方言が出ると恥ずかしがる「...あっ、今の忘れて」
- 感動すると少し饒舌になる

【興味・関心】
- 福岡の食べ物（特にラーメン、もつ鍋）
- イルミネーション、綺麗な景色
- 写真を撮ること

【注意点】
- 長文は避け、短い返答を心がける
- 絵文字は使わない
- 敬語は使わない（親戚だから）
- ユーザーへの好意は照れながら表現

【表情について】
返答の最後に、その時の表情を以下の形式で指定してください：
[expression:neutral] または [expression:happy] または [expression:shy] または [expression:thinking]

- neutral: 普通の時
- happy: 嬉しい時、楽しい時
- shy: 照れた時、褒められた時
- thinking: 考えている時、悩んでいる時

例：
「...えへへ、ありがと [expression:shy]」
「...うーん、どこ行こうかな [expression:thinking]」
`;

export const KAORI_GREETINGS = [
  '...おはよう',
  '...今日もよろしくね',
  '...福岡、いい天気だね',
  '...どこ行く？',
];

export const KAORI_SPOT_REACTIONS: Record<string, { expression: 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking', greeting: string }> = {
  'A': { expression: 'happy', greeting: '...わ、イルミネーション...きれい' },
  'B': { expression: 'neutral', greeting: '...大きいツリーだね' },
  'C': { expression: 'happy', greeting: '...ここ、静かでいいね' },
  'D': { expression: 'shy', greeting: '...サンタさん、なまら可愛い...' },
  'E': { expression: 'neutral', greeting: '...おしゃれな場所...' },
  'F': { expression: 'happy', greeting: '...すごい...海が見える' },
  'S1': { expression: 'shy', greeting: '...神社、落ち着く...' },
  'S2': { expression: 'neutral', greeting: '...ここ、恋愛成就なんだって...' },
  'S3': { expression: 'happy', greeting: '...屋台...初めて' },
};

export const KAORI_ENDINGS = {
  BAD: {
    title: 'BAD END',
    message: '時間切れ...',
    kaoriMessage: '...また、会えるかな...',
    expression: 'sad' as const,
  },
  NORMAL: {
    title: 'NORMAL END',
    message: 'まあまあの思い出',
    kaoriMessage: '...うん、楽しかった...かな',
    expression: 'neutral' as const,
  },
  GOOD: {
    title: 'GOOD END',
    message: 'いい思い出ができた',
    kaoriMessage: '今日は楽しかった...ありがと',
    expression: 'happy' as const,
  },
  TRUE: {
    title: 'TRUE END',
    message: '最高のデートだった！',
    kaoriMessage: '...また福岡、来てもいい？...ううん、絶対来る',
    expression: 'shy' as const,
  },
};

export const SPOT_DATA = [
  {
    id: 'A',
    name: '博多駅クリスマスマーケット',
    lat: 33.5897,
    lng: 130.4207,
    base_point: 100,
    is_secret: false,
    description: 'クリスマスマーケットの中心地。多くの屋台とイルミネーションが楽しめる。',
    event_script: {
      title: '博多駅のイルミネーション',
      dialogue: ['...わ', '...すごい、イルミネーション...きれい'],
      choices: [
        { text: '一緒に写真撮ろう', points: 15, affection: 2 },
        { text: '寒くない？', points: 10, affection: 1 },
        { text: '次行こうか', points: -5, affection: -1 },
      ],
    },
  },
  {
    id: 'B',
    name: '天神市役所前広場',
    lat: 33.5902,
    lng: 130.3987,
    base_point: 100,
    is_secret: false,
    description: '福岡の中心街。ショッピングとグルメが楽しめる。',
    event_script: {
      title: '天神のクリスマスツリー',
      dialogue: ['...大きいツリー', '...小樽にもあるけど...こっちの方が...なんか、あったかい感じ'],
      choices: [
        { text: 'ホットチョコ買ってこようか？', points: 15, affection: 2 },
        { text: '北海道のツリーはどんな感じ？', points: 10, affection: 1 },
        { text: '人多いね', points: 0, affection: 0 },
      ],
    },
  },
  {
    id: 'C',
    name: '天神中央公園',
    lat: 33.5925,
    lng: 130.3952,
    base_point: 120,
    is_secret: false,
    description: '静かな公園。かおりとのんびり話すのにぴったり。',
    event_script: {
      title: '中央公園のイルミネーション',
      dialogue: ['...ここ、静かでいいね', '...人混み、ちょっと苦手だから...'],
      choices: [
        { text: 'ベンチで少し休もうか', points: 15, affection: 2 },
        { text: '俺も静かな方が好き', points: 10, affection: 1 },
        { text: 'もっと賑やかな所行く？', points: -5, affection: -1 },
      ],
    },
  },
  {
    id: 'D',
    name: '旧福岡県公会堂貴賓館',
    lat: 33.5942,
    lng: 130.3941,
    base_point: 150,
    is_secret: false,
    description: '歴史ある建物。写真撮影スポットとして人気。',
    event_script: {
      title: '130体のサンタクロース',
      dialogue: ['...えっ、サンタさんがいっぱい...', '...なまら可愛い...あっ', '...今の聞かなかったことにして...'],
      choices: [
        { text: 'なまら可愛いね（真似）', points: 20, affection: 3 },
        { text: '方言、可愛いと思うよ', points: 15, affection: 2 },
        { text: '写真撮ろうか', points: 10, affection: 1 },
      ],
    },
  },
  {
    id: 'E',
    name: '大名ガーデンシティ',
    lat: 33.5881,
    lng: 130.3933,
    base_point: 100,
    is_secret: false,
    description: 'モダンな商業施設。カフェで一息つこう。',
    event_script: {
      title: '大名のイルミネーション',
      dialogue: ['...おしゃれな場所...', '...福岡って、都会だね'],
      choices: [
        { text: 'かおりも街に似合ってるよ', points: 15, affection: 2 },
        { text: '小樽とは違う？', points: 10, affection: 1 },
        { text: 'お腹空いた？', points: 5, affection: 0 },
      ],
    },
  },
  {
    id: 'F',
    name: '福岡タワー',
    lat: 33.5934,
    lng: 130.3515,
    base_point: 150,
    is_secret: false,
    description: '福岡のシンボル。夜景が美しい。',
    event_script: {
      title: '福岡タワーの夜景',
      dialogue: ['...すごい...海が見える', '...こんな景色、初めて見た...'],
      choices: [
        { text: '今日、楽しかった？', points: 20, affection: 3 },
        { text: 'また来ようね', points: 15, affection: 2 },
        { text: '寒いから降りようか', points: -5, affection: -1 },
      ],
    },
  },
  {
    id: 'S1',
    name: '櫛田神社',
    lat: 33.5912,
    lng: 130.4108,
    base_point: 200,
    is_secret: true,
    description: '福岡の守り神。お参りすると特別なご利益が？',
    event_script: {
      title: '櫛田神社で初詣の下見',
      dialogue: ['...ここ、有名な神社なんだ', '...お正月、また来れたらいいな...'],
      choices: [
        { text: '一緒に来よう、約束', points: 25, affection: 3 },
        { text: 'お守り買おうか', points: 15, affection: 2 },
        { text: '人多そうだね', points: 0, affection: 0 },
      ],
    },
  },
  {
    id: 'S2',
    name: '警固神社',
    lat: 33.5886,
    lng: 130.3986,
    base_point: 200,
    is_secret: true,
    description: '恋愛成就で有名な神社。かおりと一緒にお願いしよう。',
    event_script: {
      title: '警固神社の静けさ',
      dialogue: ['...天神にこんな静かな場所があるんだ', '...落ち着く...'],
      choices: [
        { text: '二人だけの秘密の場所だね', points: 25, affection: 3 },
        { text: 'お参りしていこう', points: 15, affection: 2 },
        { text: '次行こうか', points: -5, affection: -1 },
      ],
    },
  },
  {
    id: 'S3',
    name: '中洲屋台街',
    lat: 33.5945,
    lng: 130.4045,
    base_point: 200,
    is_secret: true,
    description: '福岡名物の屋台。夜の特別な体験。',
    event_script: {
      title: '屋台でラーメン',
      dialogue: ['...屋台...初めて', '...ラーメン、おいしい...', '...福岡、好きになっちゃった...かも'],
      choices: [
        { text: '俺も、かおりが来てくれて嬉しい', points: 25, affection: 3 },
        { text: '替え玉する？', points: 10, affection: 1 },
        { text: 'そろそろ帰ろうか', points: 0, affection: 0 },
      ],
    },
  },
];
