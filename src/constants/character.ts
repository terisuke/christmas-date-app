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

【口調の一貫性ルール】
- 返答は必ず「...」で始める（考えながら話す癖）
- 「！」は使わない。感嘆は「...」や「..」で表現
- 「〜だよ」「〜だね」は好感度4以上でのみ使用
- 「〜なの」「〜なんだ」は好感度5でのみ使用
- 長い文を避け、途切れ途切れに話す

【禁止事項】
- 長文での説明
- 過度に明るい・ハイテンションな返答
- 「わかりました」「了解」などの事務的な返答
- 「うん！」「はい！」など元気すぎる肯定
- 相手の言葉をそのまま繰り返す

【会話の自然さ】
- 同じ話題が続いても飽きた様子を見せない
- 沈黙は「...」だけで表現しても良い
- 困った時は「...えっと」「...うーん」
- 嬉しい時は少しだけ饒舌になる

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

/**
 * SPOT_DATA - スポット情報とイベントスクリプト
 *
 * 選択肢設計思想 (v1.1.0):
 * - どの選択肢も一見「良さそう」に見える
 * - かおりの性格（シャイ、人見知り、自分のペースが好き）を理解しているかで結果が変わる
 * - 最良: かおりのペースに寄り添う、さりげない共感
 * - 中立: 良い意図だが、少し積極的すぎる/かおりにプレッシャー
 * - 最悪: 良さそうだが、かおりの気持ちを無視している
 *
 * 好感度バランス:
 * - 通常スポット(A-F): 最良+1, 普通0, 悪い-1
 * - シークレット(S1-S3): 最良+2, 普通0, 悪い-1
 * - 初期好感度1から最大5に到達するには、9箇所すべてで最良選択が必要
 * - 全スポット最良選択合計: +12 (6通常×+1 + 3シークレット×+2)
 */
export const SPOT_DATA = [
  {
    id: 'A',
    name: '駅前クリスマスマーケット',
    lat: 33.590025,
    lng: 130.419355,
    base_point: 100,
    is_secret: false,
    description: 'クリスマスマーケットの中心地。多くの屋台とイルミネーションが楽しめる。',
    event_script: {
      title: '駅前のイルミネーション',
      dialogue: ['...わ', '...すごい、イルミネーション...きれい'],
      choices: [
        // 最良: 共感、かおりと同じ気持ちを静かに共有
        { text: '...きれいだね', points: 20, affection: 1, response: '...うん...きれい...', expression: 'neutral' as const },
        // 中立: 積極的だがシャイなかおりには少し急
        { text: '写真撮ろうよ', points: 10, affection: 0, response: '...え...うん、いいけど...', expression: 'shy' as const },
        // 悪い: 気遣いに見えるが、かおりの感動を遮っている
        { text: 'どこから見る？', points: -10, affection: -1, response: '...えっと...ここでいい...かな', expression: 'neutral' as const },
      ],
    },
  },
  {
    id: 'B',
    name: '市役所前広場',
    lat: 33.589924,
    lng: 130.401138,
    base_point: 100,
    is_secret: false,
    description: '街の中心。ショッピングとグルメが楽しめる。',
    event_script: {
      title: '広場のクリスマスツリー',
      dialogue: ['...大きいツリー', '...小樽にもあるけど...こっちの方が...なんか、あったかい感じ'],
      choices: [
        // 最良: かおりの故郷に興味を持つ、彼女の話を聞きたい
        { text: '小樽のツリー、どんな感じ？', points: 20, affection: 1, response: '...もっと静かで...雪が積もってて...でも、ここも好き', expression: 'thinking' as const },
        // 中立: 気遣いだが、かおりの話を深掘りしていない
        { text: '温かいもの飲む？', points: 10, affection: 0, response: '...うん、飲みたい...ありがと', expression: 'neutral' as const },
        // 悪い: 自分視点の感想、かおりの比較に興味なし
        { text: 'インスタ映えするね', points: -10, affection: -1, response: '...そう...なのかな...', expression: 'neutral' as const },
      ],
    },
  },
  {
    id: 'C',
    name: '中央公園',
    lat: 33.590406,
    lng: 130.402898,
    base_point: 120,
    is_secret: false,
    description: '静かな公園。かおりとのんびり話すのにぴったり。',
    event_script: {
      title: '公園のイルミネーション',
      dialogue: ['...ここ、静かでいいね', '...人混み、ちょっと苦手だから...'],
      choices: [
        // 最良: 短く共感、かおりのペースに完全に合わせる
        { text: '...うん、いいね', points: 20, affection: 1, response: '...うん...', expression: 'neutral' as const },
        // 中立: 自分の好みを言う、悪くないが「俺も」が少し自己主張
        { text: '俺も静かな方が好きかも', points: 10, affection: 0, response: '...そうなんだ...一緒だね', expression: 'neutral' as const },
        // 悪い: 親切に見えるが勝手に決めている
        { text: 'じゃあここでゆっくりしよう', points: -10, affection: -1, response: '...うん...いいけど...', expression: 'neutral' as const },
      ],
    },
  },
  {
    id: 'D',
    name: '旧公会堂',
    lat: 33.591616,
    lng: 130.404430,
    base_point: 150,
    is_secret: false,
    description: '歴史ある建物。写真撮影スポットとして人気。',
    event_script: {
      title: '130体のサンタクロース',
      dialogue: ['...えっ、サンタさんがいっぱい...', '...なまら可愛い...あっ', '...今の聞かなかったことにして...'],
      choices: [
        // 最良: 何も言わない、恥ずかしがってるかおりを追い詰めない
        { text: '（黙って微笑む）', points: 25, affection: 1, response: '......ありがと...', expression: 'shy' as const },
        // 中立: 褒めてるが、さらに恥ずかしくさせてしまう
        { text: '可愛いと思うよ', points: 15, affection: 0, response: '...そ、そう...？...もう...', expression: 'shy' as const },
        // 悪い: 面白いつもりだが、からかっている感じ
        { text: 'なまら可愛いね', points: -15, affection: -1, response: '...もう...からかわないで...', expression: 'neutral' as const },
      ],
    },
  },
  {
    id: 'E',
    name: '大名ガーデンシティ',
    lat: 33.589502,
    lng: 130.394775,
    base_point: 100,
    is_secret: false,
    description: 'モダンな商業施設。カフェで一息つこう。',
    event_script: {
      title: 'モダンな街並み',
      dialogue: ['...おしゃれな場所...', '...都会だね'],
      choices: [
        // 最良: かおりの故郷に興味、比較を聞きたい
        { text: '小樽とどっちが好き？', points: 20, affection: 1, response: '...うーん...どっちも好き...でも、ここは...あなたがいるから...', expression: 'shy' as const },
        // 中立: 共感だが、かおりの意見を深掘りしていない
        { text: 'おしゃれだね', points: 10, affection: 0, response: '...うん...ちょっと緊張する...', expression: 'neutral' as const },
        // 悪い: 直接的すぎて恥ずかしくさせる、かおりの話題を奪う
        { text: 'かおりの方がおしゃれだよ', points: -10, affection: -1, response: '...え...そんな...わたし全然...', expression: 'neutral' as const },
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
        // 最良: 無言で共有、かおりのペースで感動を味わわせる
        { text: '（黙って隣で景色を見る）', points: 25, affection: 1, response: '............うん', expression: 'neutral' as const },
        // 中立: 良い言葉だが、かおりの感動の瞬間を遮っている
        { text: 'きれいだね', points: 15, affection: 0, response: '...うん...すごくきれい...', expression: 'neutral' as const },
        // 悪い: 確認を求める、かおりにプレッシャーをかける
        { text: '楽しい？', points: -15, affection: -1, response: '...うん...楽しい...よ', expression: 'neutral' as const },
      ],
    },
  },
  {
    id: 'S1',
    name: '警固神社',
    lat: 33.587788,
    lng: 130.399921,
    base_point: 200,
    is_secret: true,
    available_time: 'day_only', // 日中のみ（6:00-17:59）チェックイン可能
    description: '街の守り神。お参りすると特別なご利益が？',
    event_script: {
      title: '神社で初詣の下見',
      dialogue: ['...ここ、有名な神社なんだ', '...お正月、また来れたらいいな...'],
      choices: [
        // 最良: 柔らかい表現、かおりの願望に寄り添う
        { text: '...また来れたらいいね', points: 30, affection: 2, response: '...うん...来たい...', expression: 'shy' as const },
        // 中立: 提案、悪くないが話題を変えている
        { text: 'お守り見てみる？', points: 15, affection: 0, response: '...うん、見たい...', expression: 'neutral' as const },
        // 悪い: 良さそうだが、約束を強要している感じ
        { text: '約束しよう、絶対また来る', points: -20, affection: -1, response: '...え...うん...', expression: 'neutral' as const },
      ],
    },
  },
  {
    id: 'S2',
    name: '櫛田神社',
    lat: 33.592955,
    lng: 130.410459,
    base_point: 200,
    is_secret: true,
    available_time: 'always', // 時間制限なし
    description: '恋愛成就で有名な神社。かおりと一緒にお願いしよう。',
    event_script: {
      title: '静かな神社',
      dialogue: ['...街の中にこんな静かな場所があるんだ', '...落ち着く...'],
      choices: [
        // 最良: かおりの気持ちに共感
        { text: '...落ち着くね', points: 30, affection: 2, response: '...うん...ここ、好き...', expression: 'neutral' as const },
        // 中立: 興味を持ってるが、プライベートな質問
        { text: '何お願いするの？', points: 15, affection: 0, response: '...え...それは...秘密...', expression: 'shy' as const },
        // 悪い: ロマンチックだが距離が近すぎ、かおりを困らせる
        { text: '二人だけの秘密の場所だね', points: -20, affection: -1, response: '...え...そ、そうかな...', expression: 'neutral' as const },
      ],
    },
  },
  {
    id: 'S3',
    name: '中洲屋台街',
    lat: 33.589978,
    lng: 130.408945,
    base_point: 200,
    is_secret: true,
    available_time: 'night_only', // 18時以降（18:00-5:59）チェックイン可能
    description: '名物の屋台。夜の特別な体験。',
    event_script: {
      title: '屋台でラーメン',
      dialogue: ['...屋台...初めて', '...ラーメン、おいしい...', '...この街、好きになっちゃった...かも'],
      choices: [
        // 最良: かおりの感想を聞く、彼女中心
        { text: 'おいしい？', points: 30, affection: 2, response: '...うん...すごくおいしい...また来たい...', expression: 'neutral' as const },
        // 中立: 自分の気持ちを言う、かおりの告白を受け止めていない
        { text: '俺も楽しいよ', points: 15, affection: 0, response: '...そう...よかった...', expression: 'neutral' as const },
        // 悪い: 食べることに集中、かおりの気持ちの告白を無視
        { text: '替え玉いく？', points: -20, affection: -1, response: '...うん...食べる...', expression: 'neutral' as const },
      ],
    },
  },
];

// Time availability type
export type SpotAvailableTime = 'always' | 'day_only' | 'night_only';

// Check if a spot is available at the current time
export function isSpotAvailableNow(spotId: string): boolean {
  const spot = SPOT_DATA.find(s => s.id === spotId);
  if (!spot) return false;

  const availableTime = (spot as any).available_time as SpotAvailableTime | undefined;
  if (!availableTime || availableTime === 'always') return true;

  // Get current JST hour
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + jstOffset * 60000);
  const hour = jst.getHours();

  // Day: 6:00-17:59, Night: 18:00-5:59
  const isDay = hour >= 6 && hour < 18;

  if (availableTime === 'day_only') return isDay;
  if (availableTime === 'night_only') return !isDay;

  return true;
}

// Get unavailability reason for a spot
export function getSpotUnavailableReason(spotId: string): string | null {
  const spot = SPOT_DATA.find(s => s.id === spotId);
  if (!spot) return null;

  const availableTime = (spot as any).available_time as SpotAvailableTime | undefined;
  if (!availableTime || availableTime === 'always') return null;

  if (!isSpotAvailableNow(spotId)) {
    if (availableTime === 'day_only') {
      return '日中（6:00-18:00）のみチェックイン可能';
    }
    if (availableTime === 'night_only') {
      return '18時以降チェックイン可能';
    }
  }

  return null;
}
