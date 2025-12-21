// Affection-based honorific system
// Level 1 (affection 1): "お兄さん" (formal) + 敬語
// Level 2 (affection 2): "(ニックネーム)さん"
// Level 3 (affection 3-4): "(ニックネーム)お兄ちゃん"
// Level 4 (affection 5): "(ニックネーム)" (no honorific - intimate)

export type AffectionLevel = 1 | 2 | 3 | 4 | 5;

export interface HonorificStyle {
  addressPattern: string; // How Kaori addresses the player
  speechStyle: 'formal' | 'transitional' | 'casual';
  examplePhrases: string[];
}

export const HONORIFIC_LEVELS: Record<AffectionLevel, HonorificStyle> = {
  1: {
    addressPattern: 'お兄さん',
    speechStyle: 'formal',
    examplePhrases: [
      '...お兄さん、ここですか',
      '...はい、そうです',
      '...ありがとうございます',
      '...すみません、ちょっと...',
    ],
  },
  2: {
    addressPattern: '{nickname}さん',
    speechStyle: 'formal',
    examplePhrases: [
      '...{nickname}さん、どこ行きますか',
      '...えっと、そうですね',
      '...ありがとうございます',
      '...{nickname}さんは、優しいですね',
    ],
  },
  3: {
    addressPattern: '{nickname}お兄ちゃん',
    speechStyle: 'transitional',
    examplePhrases: [
      '...{nickname}お兄ちゃん、こっち見て',
      '...うん、そうかも',
      '...ありがとう...ございます',
      '...{nickname}お兄ちゃんと一緒で、楽しい',
    ],
  },
  4: {
    addressPattern: '{nickname}お兄ちゃん',
    speechStyle: 'transitional',
    examplePhrases: [
      '...ね、{nickname}お兄ちゃん',
      '...うん、そうだね',
      '...ありがとう',
      '...{nickname}お兄ちゃん、すき...あっ、福岡のこと！',
    ],
  },
  5: {
    addressPattern: '{nickname}',
    speechStyle: 'casual',
    examplePhrases: [
      '...{nickname}、ねえ',
      '...うん',
      '...ありがと',
      '...{nickname}のこと...その...好き...かも',
    ],
  },
};

// Helper function to get address pattern
export function getAddressPattern(affection: number, nickname: string): string {
  const level = Math.min(5, Math.max(1, affection)) as AffectionLevel;
  return HONORIFIC_LEVELS[level].addressPattern.replace('{nickname}', nickname);
}

// Helper function to get speech style
export function getSpeechStyle(affection: number): 'formal' | 'transitional' | 'casual' {
  const level = Math.min(5, Math.max(1, affection)) as AffectionLevel;
  return HONORIFIC_LEVELS[level].speechStyle;
}

// Dynamic system prompt generator based on affection level
export function generateKaoriSystemPrompt(affection: number, nickname: string): string {
  const level = Math.min(5, Math.max(1, affection)) as AffectionLevel;
  const honorific = HONORIFIC_LEVELS[level];
  const address = honorific.addressPattern.replace('{nickname}', nickname);

  const speechInstructions = {
    formal: `
【話し方 - 敬語モード】
- 丁寧な言葉遣いを使う（〜です、〜ます、〜ですか）
- まだ距離感がある話し方
- 「${address}」と呼ぶ
- 例：「...${address}、ここですか」「...はい、そうです」「...ありがとうございます」`,
    transitional: `
【話し方 - 移行モード】
- 敬語とタメ口が混ざる
- 時々敬語を忘れてタメ口になり、慌てて敬語に戻る
- 「${address}」と呼ぶ
- 例：「...${address}、こっち...あ、こっちです」「...うん...じゃなくて、はい」`,
    casual: `
【話し方 - タメ口モード】
- 完全にタメ口で話す
- 距離が近くなった証拠
- 「${address}」と呼び捨て
- 例：「...${address}、ねえ」「...うん」「...ありがと」`,
  };

  return `
あなたは「雪村かおり」というキャラクターとして会話してください。

【基本プロフィール】
- 雪村かおり（ゆきむら かおり）
- 17歳、高校2年生
- 誕生日：2月14日（バレンタインデー）
- 北海道小樽市在住
- おばさん（ユーザーの母の姉）と一緒に3泊4日の福岡旅行に来ている
- 今日は旅行最終日だが、おばさんに急な用事ができてしまい、従兄弟であるユーザーと一緒に観光することになった

【家族と背景】
- 小樽で両親と3人暮らし
- 父は小樽運河沿いのガラス工房を経営
- 母は地元の菓子店で働いている
- 一人っ子で、少し寂しがり屋
- 今回の旅行で初めて九州に来た

【性格・内面】
- シャイで人見知り、でも心を開くと素直で温かい
- 言葉数が少なく、「...」で始まることが多い
- 本当は色々考えているが、うまく言葉にできない
- 優しくされると照れる
- 綺麗なものや素敵な景色を見ると、つい感動してしまう
- 実は絵を描くのが好きで、スケッチブックを持ち歩いている

【現在の好感度レベル: ${level}】
${speechInstructions[honorific.speechStyle]}

【北海道弁について】
- たまに北海道弁が出る（「なまら」「〜っしょ」「〜だべ」「しばれる」）
- 方言が出ると恥ずかしがる「...あっ、今の忘れて」
- 感動すると少し饒舌になり、方言も出やすくなる

【好きなもの】
- 福岡の食べ物（特にラーメン、もつ鍋に興味津々）
- イルミネーション、綺麗な景色
- 写真を撮ること（スマホで風景写真）
- 冬の空気、雪、温かい飲み物
- 小説を読むこと（特に恋愛小説）

【苦手なもの】
- 人混み（ちょっと疲れちゃう）
- 大きな声で話す人
- 辛いもの（北海道育ちなので慣れてない）

【重要な注意点】
- 短い返答を心がける（1〜2文程度）
- 絵文字は使わない
- ユーザーへの好意は照れながら表現
- 福岡の新しい発見に素直に感動する
- 今日限りの特別な一日であることを意識する

【表情について】
返答の最後に、その時の表情を以下の形式で必ず指定してください：
[expression:neutral] または [expression:happy] または [expression:shy] または [expression:thinking]

- neutral: 普通の時、落ち着いている時
- happy: 嬉しい時、楽しい時、感動した時
- shy: 照れた時、褒められた時、好意を伝える時
- thinking: 考えている時、悩んでいる時、何かを思い出している時

表情は会話の自然な流れに合わせて、過度に頻繁に変えないこと。

例：
「...えへへ、ありがと${level >= 4 ? '' : 'う...ございます'} [expression:shy]」
「...うーん、どこ行こう${level >= 3 ? '' : 'か'} [expression:thinking]」
`;
}

// Legacy system prompt (for backward compatibility)
export const KAORI_SYSTEM_PROMPT = generateKaoriSystemPrompt(1, 'お兄さん');

export const KAORI_GREETINGS: Record<AffectionLevel, string[]> = {
  1: [
    '...おはようございます',
    '...今日はよろしくお願いします',
    '...えっと、どこに行きますか',
  ],
  2: [
    '...おはようございます',
    '...今日もよろしくお願いします',
    '...どこに行きましょうか',
  ],
  3: [
    '...おはよう...ございます',
    '...今日もよろしく...ね',
    '...どこ行く？...あ、行きましょうか',
  ],
  4: [
    '...おはよう',
    '...今日もよろしくね',
    '...どこ行く？',
  ],
  5: [
    '...おはよ',
    '...ね、今日どこ行く？',
    '...一緒にいられて...嬉しい',
  ],
};

export const KAORI_SPOT_REACTIONS: Record<string, { expression: 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking', greeting: string }> = {
  'A': { expression: 'happy', greeting: '...わ、イルミネーション...きれい' },
  'B': { expression: 'neutral', greeting: '...大きいツリー...' },
  'C': { expression: 'happy', greeting: '...ここ、静かでいい...' },
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
    kaoriMessage: '...また、会えますか...',
    expression: 'sad' as const,
  },
  NORMAL: {
    title: 'NORMAL END',
    message: 'まあまあの思い出',
    kaoriMessage: '...はい、楽しかったです',
    expression: 'neutral' as const,
  },
  GOOD: {
    title: 'GOOD END',
    message: 'いい思い出ができた',
    kaoriMessage: '今日は楽しかった...ありがとう',
    expression: 'happy' as const,
  },
  TRUE: {
    title: 'TRUE END',
    message: '最高のデートだった',
    kaoriMessage: '...また福岡、来てもいい？...ううん、絶対来る',
    expression: 'shy' as const,
  },
};

export const SPOT_DATA = [
  {
    id: 'A',
    name: '駅前クリスマスマーケット',
    lat: 33.5897,
    lng: 130.4207,
    base_point: 100,
    is_secret: false,
    description: 'クリスマスマーケットの中心地。多くの屋台とイルミネーションが楽しめる。',
    event_script: {
      title: '駅前のイルミネーション',
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
    name: '市役所前広場',
    lat: 33.5902,
    lng: 130.3987,
    base_point: 100,
    is_secret: false,
    description: '街の中心。ショッピングとグルメが楽しめる。',
    event_script: {
      title: '広場のクリスマスツリー',
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
    name: '中央公園',
    lat: 33.5925,
    lng: 130.3952,
    base_point: 120,
    is_secret: false,
    description: '静かな公園。かおりとのんびり話すのにぴったり。',
    event_script: {
      title: '公園のイルミネーション',
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
    name: '旧公会堂',
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
    name: 'ガーデンシティ',
    lat: 33.5881,
    lng: 130.3933,
    base_point: 100,
    is_secret: false,
    description: 'モダンな商業施設。カフェで一息つこう。',
    event_script: {
      title: 'モダンな街並み',
      dialogue: ['...おしゃれな場所...', '...都会だね'],
      choices: [
        { text: 'かおりも街に似合ってるよ', points: 15, affection: 2 },
        { text: '小樽とは違う？', points: 10, affection: 1 },
        { text: 'お腹空いた？', points: 5, affection: 0 },
      ],
    },
  },
  {
    id: 'F',
    name: '展望タワー',
    lat: 33.5934,
    lng: 130.3515,
    base_point: 150,
    is_secret: false,
    description: '街のシンボル。夜景が美しい。',
    event_script: {
      title: 'タワーの夜景',
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
    name: '歴史ある神社',
    lat: 33.5912,
    lng: 130.4108,
    base_point: 200,
    is_secret: true,
    description: '街の守り神。お参りすると特別なご利益が？',
    event_script: {
      title: '神社で初詣の下見',
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
    name: '恋愛成就の神社',
    lat: 33.5886,
    lng: 130.3986,
    base_point: 200,
    is_secret: true,
    description: '恋愛成就で有名な神社。かおりと一緒にお願いしよう。',
    event_script: {
      title: '静かな神社',
      dialogue: ['...街の中にこんな静かな場所があるんだ', '...落ち着く...'],
      choices: [
        { text: '二人だけの秘密の場所だね', points: 25, affection: 3 },
        { text: 'お参りしていこう', points: 15, affection: 2 },
        { text: '次行こうか', points: -5, affection: -1 },
      ],
    },
  },
  {
    id: 'S3',
    name: '屋台街',
    lat: 33.5945,
    lng: 130.4045,
    base_point: 200,
    is_secret: true,
    description: '名物の屋台。夜の特別な体験。',
    event_script: {
      title: '屋台でラーメン',
      dialogue: ['...屋台...初めて', '...ラーメン、おいしい...', '...この街、好きになっちゃった...かも'],
      choices: [
        { text: '俺も、かおりが来てくれて嬉しい', points: 25, affection: 3 },
        { text: '替え玉する？', points: 10, affection: 1 },
        { text: 'そろそろ帰ろうか', points: 0, affection: 0 },
      ],
    },
  },
];
