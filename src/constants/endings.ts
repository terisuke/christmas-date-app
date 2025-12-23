import { KaoriExpression } from '../components/CharacterDisplay';

// Ending types based on affection × score matrix
export type EndingType =
  | 'BAD_A' | 'BAD_B'
  | 'NORMAL_A' | 'NORMAL_B' | 'NORMAL_C' | 'NORMAL_D' | 'NORMAL_E'
  | 'GOOD_A' | 'GOOD_B' | 'GOOD_C' | 'GOOD_D' | 'GOOD_E'
  | 'TRUE';

export type EndingCategory = 'BAD' | 'NORMAL' | 'GOOD' | 'TRUE';

export interface EndingDialogue {
  speaker: '' | 'かおり';
  text: string;
  expression: KaoriExpression;
}

export interface EndingData {
  id: EndingType;
  category: EndingCategory;
  title: string;
  subtitle: string;
  theme: string;
  bgColor: string;
  dialogues: EndingDialogue[];
  finalMessage: string;
}

/**
 * Get ending type based on affection and score
 * Matrix:
 * | Affection | <600      | 600-1199  | 1200-1799 | >=1800   |
 * |-----------|-----------|-----------|-----------|----------|
 * | 1         | BAD_A     | NORMAL_A  | NORMAL_A  | NORMAL_A |
 * | 2         | BAD_B     | NORMAL_B  | GOOD_A    | GOOD_A   |
 * | 3         | BAD_B     | NORMAL_C  | GOOD_B    | GOOD_B   |
 * | 4         | NORMAL_D  | NORMAL_D  | GOOD_C    | GOOD_D   |
 * | 5         | NORMAL_E  | NORMAL_E  | GOOD_E    | TRUE     |
 *
 * Note: High affection (4-5) never results in BAD END
 */
export function getEndingTypeFromMatrix(score: number, affection: number): EndingType {
  // TRUE END: affection 5 + score >= 1800
  if (affection === 5 && score >= 1800) return 'TRUE';

  // GOOD END D: affection 4 + score >= 1800
  if (affection === 4 && score >= 1800) return 'GOOD_D';

  // GOOD END E: affection 5 + score 1200-1799
  if (affection === 5 && score >= 1200) return 'GOOD_E';

  // GOOD END C: affection 4 + score 1200-1799
  if (affection === 4 && score >= 1200) return 'GOOD_C';

  // GOOD END B: affection 3 + score >= 1200
  if (affection === 3 && score >= 1200) return 'GOOD_B';

  // GOOD END A: affection 2 + score >= 1200
  if (affection === 2 && score >= 1200) return 'GOOD_A';

  // High affection (4-5) with low score still gets NORMAL (not BAD)
  // This rewards players who invested in relationship
  if (affection === 5) return 'NORMAL_E';
  if (affection === 4) return 'NORMAL_D';

  // NORMAL END C: affection 3 + score 600-1199
  if (affection === 3 && score >= 600) return 'NORMAL_C';

  // NORMAL END B: affection 2 + score 600-1199
  if (affection === 2 && score >= 600) return 'NORMAL_B';

  // NORMAL END A: affection 1 + score 600-1199
  if (affection === 1 && score >= 600) return 'NORMAL_A';

  // BAD END B: affection 2-3 + score < 600
  if (affection >= 2) return 'BAD_B';

  // BAD END A: affection 1 + score < 600
  return 'BAD_A';
}

export function getEndingCategory(endingType: EndingType): EndingCategory {
  if (endingType === 'TRUE') return 'TRUE';
  if (endingType.startsWith('GOOD')) return 'GOOD';
  if (endingType.startsWith('NORMAL')) return 'NORMAL';
  return 'BAD';
}

// ============================================
// ENDING DATA - 12 Types
// ============================================

export const ENDINGS: Record<EndingType, EndingData> = {
  // ============================================
  // BAD ENDINGS (2 types)
  // ============================================
  BAD_A: {
    id: 'BAD_A',
    category: 'BAD',
    title: 'BAD END',
    subtitle: 'すれ違いの終わり',
    theme: '心を開けなかった',
    bgColor: '#2c2c2c',
    finalMessage: 'きっと、何かが足りなかったんだ...',
    dialogues: [
      { speaker: '', text: '夕暮れの駅前。かおりを見送る時間が来た。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日は、ありがとうございました', expression: 'neutral' },
      { speaker: '', text: '彼女の声は、朝と変わらない丁寧な響き。', expression: 'neutral' },
      { speaker: 'かおり', text: '...お兄さんのおかげで、福岡を見られました', expression: 'neutral' },
      { speaker: 'かおり', text: '...えっと、それでは...', expression: 'neutral' },
      { speaker: '', text: '何か言いたそうに口を開きかけて、でもすぐに閉じてしまう。', expression: 'sad' },
      { speaker: 'かおり', text: '...さようなら', expression: 'sad' },
      { speaker: '', text: '彼女は小さく頭を下げると、改札の向こうに消えていった。', expression: 'sad' },
      { speaker: '', text: '結局、本当の笑顔を見ることはできなかった。', expression: 'sad' },
    ],
  },

  BAD_B: {
    id: 'BAD_B',
    category: 'BAD',
    title: 'BAD END',
    subtitle: '届かなかった想い',
    theme: '時間が足りなかった',
    bgColor: '#3d3d3d',
    finalMessage: '「また」という言葉は、お互いの口から出なかった。',
    dialogues: [
      { speaker: '', text: '夕暮れの駅前。思ったより早く、この時間が来てしまった。', expression: 'neutral' },
      { speaker: 'かおり', text: '...もう、行かなきゃ', expression: 'sad' },
      { speaker: 'かおり', text: '...あっという間だったね', expression: 'sad' },
      { speaker: '', text: '彼女の声には、確かに寂しさが混じっている。', expression: 'sad' },
      { speaker: 'かおり', text: '...もっと、色んな所に行きたかったな', expression: 'thinking' },
      { speaker: 'かおり', text: '...一緒に...', expression: 'shy' },
      { speaker: '', text: '言いかけて、彼女は首を振った。', expression: 'sad' },
      { speaker: 'かおり', text: '...ううん、なんでもない', expression: 'sad' },
      { speaker: 'かおり', text: '...今日は、ありがとう', expression: 'neutral' },
      { speaker: 'かおり', text: '...さようなら', expression: 'sad' },
      { speaker: '', text: '彼女は振り返らずに、改札を通り抜けていった。', expression: 'sad' },
    ],
  },

  // ============================================
  // NORMAL ENDINGS (5 types)
  // ============================================
  NORMAL_A: {
    id: 'NORMAL_A',
    category: 'NORMAL',
    title: 'NORMAL END',
    subtitle: '礼儀正しいお別れ',
    theme: '従兄弟として無難に',
    bgColor: '#4a5568',
    finalMessage: '悪くはない一日だった。でも、それだけだった。',
    dialogues: [
      { speaker: '', text: '駅前の待合所。帰りの時間が近づいている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日は、本当にありがとうございました', expression: 'neutral' },
      { speaker: 'かおり', text: '...色んな所に連れて行っていただいて', expression: 'neutral' },
      { speaker: '', text: '彼女は丁寧にお辞儀をした。朝と変わらない、きちんとした態度。', expression: 'neutral' },
      { speaker: 'かおり', text: '...福岡、いい所ですね', expression: 'neutral' },
      { speaker: 'かおり', text: '...おばさんにも、伝えておきます', expression: 'neutral' },
      { speaker: '', text: '彼女は小さく微笑んだ。でもそれは、初対面の人に向ける笑顔だった。', expression: 'neutral' },
      { speaker: 'かおり', text: '...お兄さんも、お元気で', expression: 'neutral' },
      { speaker: 'かおり', text: '...では、失礼します', expression: 'shy' },
      { speaker: '', text: '彼女は礼儀正しく別れを告げ、改札へ向かった。', expression: 'neutral' },
    ],
  },

  NORMAL_B: {
    id: 'NORMAL_B',
    category: 'NORMAL',
    title: 'NORMAL END',
    subtitle: '友達以上になれなくて',
    theme: '距離が縮まらない',
    bgColor: '#4a5568',
    finalMessage: '友達としては楽しかった。でも、それ以上には...',
    dialogues: [
      { speaker: '', text: '駅のホーム。電車の時間が迫っている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、楽しかったです', expression: 'neutral' },
      { speaker: 'かおり', text: '...ありがとうございました', expression: 'shy' },
      { speaker: '', text: '彼女は少し照れたように笑った。', expression: 'shy' },
      { speaker: 'かおり', text: '...また、機会があれば...', expression: 'thinking' },
      { speaker: '', text: '「機会があれば」——その言葉が、二人の距離を物語っていた。', expression: 'neutral' },
      { speaker: 'かおり', text: '...お元気で', expression: 'neutral' },
      { speaker: '', text: '電車が来た。彼女は小さく手を振って、乗り込んでいった。', expression: 'neutral' },
    ],
  },

  NORMAL_C: {
    id: 'NORMAL_C',
    category: 'NORMAL',
    title: 'NORMAL END',
    subtitle: 'あと一歩',
    theme: '惜しい展開',
    bgColor: '#4a5568',
    finalMessage: 'あと少しだけ、時間があれば...',
    dialogues: [
      { speaker: '', text: '夕暮れの駅前。オレンジ色の光が二人を照らしている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、なまら楽しかった...あっ', expression: 'happy' },
      { speaker: 'かおり', text: '...また方言出ちゃった...', expression: 'shy' },
      { speaker: '', text: '彼女は恥ずかしそうに俯いた。', expression: 'shy' },
      { speaker: 'かおり', text: '...ね、また...', expression: 'thinking' },
      { speaker: '', text: '何かを言いかけて、彼女は口をつぐんだ。', expression: 'thinking' },
      { speaker: 'かおり', text: '...ううん、なんでもない', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日は、ありがとう', expression: 'shy' },
      { speaker: '', text: '彼女は小さく手を振って、改札へ向かった。', expression: 'neutral' },
      { speaker: '', text: 'あと少しだけ、何かが足りなかった気がする。', expression: 'thinking' },
    ],
  },

  NORMAL_D: {
    id: 'NORMAL_D',
    category: 'NORMAL',
    title: 'NORMAL END',
    subtitle: '言えなかった言葉',
    theme: '勇気が出なかった',
    bgColor: '#5a6578',
    finalMessage: '伝えたい言葉があったのに、勇気が出なかった。',
    dialogues: [
      { speaker: '', text: '夜の駅前。イルミネーションが輝いている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、すごく楽しかった', expression: 'happy' },
      { speaker: 'かおり', text: '...ありがとう', expression: 'shy' },
      { speaker: '', text: '彼女の目には、言葉にできない何かが浮かんでいた。', expression: 'shy' },
      { speaker: 'かおり', text: '...あの、ね', expression: 'thinking' },
      { speaker: 'かおり', text: '...えっと...', expression: 'shy' },
      { speaker: '', text: '彼女は何度か口を開きかけて、結局何も言えなかった。', expression: 'sad' },
      { speaker: 'かおり', text: '...ごめん、なんでもない', expression: 'sad' },
      { speaker: 'かおり', text: '...また、いつか', expression: 'shy' },
      { speaker: '', text: '彼女は寂しそうに微笑んで、改札へ向かった。', expression: 'sad' },
      { speaker: '', text: 'お互いに、伝えたいことがあったはずなのに。', expression: 'thinking' },
    ],
  },

  NORMAL_E: {
    id: 'NORMAL_E',
    category: 'NORMAL',
    title: 'NORMAL END',
    subtitle: '約束のない再会',
    theme: '想いはあるが...',
    bgColor: '#5a6578',
    finalMessage: '気持ちは通じ合っているのに、約束はできなかった。',
    dialogues: [
      { speaker: '', text: '夜の博多駅。別れの時間が近づいている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、本当に楽しかった', expression: 'happy' },
      { speaker: 'かおり', text: '...一緒にいられて、嬉しかった', expression: 'shy' },
      { speaker: '', text: '彼女の頬が、イルミネーションの光で赤く染まっている。', expression: 'shy' },
      { speaker: 'かおり', text: '...ね、また会えるかな', expression: 'thinking' },
      { speaker: '', text: 'その問いかけに、確かな答えを返せなかった。', expression: 'thinking' },
      { speaker: 'かおり', text: '...そう、だよね', expression: 'sad' },
      { speaker: 'かおり', text: '...北海道と福岡、遠いもんね', expression: 'sad' },
      { speaker: '', text: '彼女は寂しそうに笑った。', expression: 'sad' },
      { speaker: 'かおり', text: '...でも、忘れないから', expression: 'shy' },
      { speaker: 'かおり', text: '...今日のこと、ずっと覚えてる', expression: 'happy' },
      { speaker: '', text: '彼女は小さく手を振って、改札の向こうに消えていった。', expression: 'neutral' },
    ],
  },

  // ============================================
  // GOOD ENDINGS (5 types)
  // ============================================
  GOOD_A: {
    id: 'GOOD_A',
    category: 'GOOD',
    title: 'GOOD END',
    subtitle: '楽しかったね',
    theme: '良い思い出',
    bgColor: '#48bb78',
    finalMessage: '楽しい一日だった。きっと、良い思い出になる。',
    dialogues: [
      { speaker: '', text: '夕暮れの駅前。穏やかな時間が流れている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、楽しかったです', expression: 'happy' },
      { speaker: 'かおり', text: '...福岡、いい所ですね', expression: 'happy' },
      { speaker: '', text: '彼女は心からの笑顔を見せてくれた。', expression: 'happy' },
      { speaker: 'かおり', text: '...また、来たいな', expression: 'shy' },
      { speaker: 'かおり', text: '...その時は、また案内してくれますか？', expression: 'shy' },
      { speaker: '', text: '彼女の目には、小さな期待が浮かんでいた。', expression: 'shy' },
      { speaker: 'かおり', text: '...ありがとうございました', expression: 'happy' },
      { speaker: 'かおり', text: '...お元気で', expression: 'happy' },
      { speaker: '', text: '彼女は明るく手を振って、改札へ向かった。', expression: 'happy' },
    ],
  },

  GOOD_B: {
    id: 'GOOD_B',
    category: 'GOOD',
    title: 'GOOD END',
    subtitle: 'また会いたい',
    theme: '再会の約束',
    bgColor: '#48bb78',
    finalMessage: '連絡先を交換した。きっと、また会える。',
    dialogues: [
      { speaker: '', text: '夜の駅前。イルミネーションが輝いている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、なまら楽しかった', expression: 'happy' },
      { speaker: 'かおり', text: '...あっ、また方言...', expression: 'shy' },
      { speaker: '', text: '彼女は照れながらも、嬉しそうに笑っていた。', expression: 'happy' },
      { speaker: 'かおり', text: '...ね、LINE交換してもいい？', expression: 'shy' },
      { speaker: '', text: '彼女は少し緊張した様子でスマホを取り出した。', expression: 'shy' },
      { speaker: 'かおり', text: '...やった', expression: 'happy' },
      { speaker: 'かおり', text: '...これで、また話せるね', expression: 'happy' },
      { speaker: 'かおり', text: '...じゃあ、また連絡するね', expression: 'shy' },
      { speaker: '', text: '彼女は嬉しそうに手を振って、改札へ向かった。', expression: 'happy' },
    ],
  },

  GOOD_C: {
    id: 'GOOD_C',
    category: 'GOOD',
    title: 'GOOD END',
    subtitle: '特別な人',
    theme: '恋の予感',
    bgColor: '#ed64a6',
    finalMessage: 'お互いを特別に思っている。これは、恋の始まり。',
    dialogues: [
      { speaker: '', text: '夜の博多駅。イルミネーションが二人を照らしている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、すごく楽しかった', expression: 'happy' },
      { speaker: 'かおり', text: '...一緒にいられて、嬉しかった', expression: 'shy' },
      { speaker: '', text: '彼女の頬が、光に照らされて赤く染まっている。', expression: 'shy' },
      { speaker: 'かおり', text: '...ね、また会える？', expression: 'thinking' },
      { speaker: 'かおり', text: '...会いたい', expression: 'shy' },
      { speaker: '', text: '彼女は真っ直ぐにこちらを見つめていた。', expression: 'shy' },
      { speaker: 'かおり', text: '...約束、してくれる？', expression: 'shy' },
      { speaker: '', text: '彼女の手が、そっとこちらの手に触れた。', expression: 'shy' },
      { speaker: 'かおり', text: '...ありがとう', expression: 'happy' },
      { speaker: 'かおり', text: '...絶対、また会おうね', expression: 'happy' },
      { speaker: '', text: '彼女は幸せそうに微笑んで、改札へ向かった。', expression: 'happy' },
    ],
  },

  GOOD_D: {
    id: 'GOOD_D',
    category: 'GOOD',
    title: 'GOOD END',
    subtitle: '君だけの福岡',
    theme: '深い絆',
    bgColor: '#ed64a6',
    finalMessage: '深い絆で結ばれた。この街は、二人の特別な場所になった。',
    dialogues: [
      { speaker: '', text: '夜の博多駅。別れの時間が近づいている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、最高だった', expression: 'happy' },
      { speaker: 'かおり', text: '...福岡のこと、大好きになっちゃった', expression: 'happy' },
      { speaker: '', text: '彼女は照れながらも、真っ直ぐにこちらを見つめていた。', expression: 'shy' },
      { speaker: 'かおり', text: '...ね、また一緒に来よう', expression: 'shy' },
      { speaker: 'かおり', text: '...この街、二人の場所にしよう', expression: 'shy' },
      { speaker: '', text: '彼女の目には、確かな想いが込められていた。', expression: 'shy' },
      { speaker: 'かおり', text: '...約束だよ', expression: 'happy' },
      { speaker: '', text: '彼女は小指を差し出した。', expression: 'shy' },
      { speaker: 'かおり', text: '...指切り、しよ', expression: 'shy' },
      { speaker: '', text: '冬の夜、二人の小指が結ばれた。', expression: 'happy' },
      { speaker: 'かおり', text: '...じゃあ、また来るね', expression: 'happy' },
      { speaker: '', text: '彼女は幸せそうに手を振って、改札へ向かった。', expression: 'happy' },
    ],
  },

  GOOD_E: {
    id: 'GOOD_E',
    category: 'GOOD',
    title: 'GOOD END',
    subtitle: '言葉にできない',
    theme: '想いを伝えられない',
    bgColor: '#ed64a6',
    finalMessage: 'お互いの気持ちは分かっている。言葉にしなくても。',
    dialogues: [
      { speaker: '', text: '夜の博多駅。イルミネーションが二人を照らしている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、本当に楽しかった', expression: 'happy' },
      { speaker: 'かおり', text: '...一緒にいられて、すごく嬉しかった', expression: 'shy' },
      { speaker: '', text: '彼女は何かを言いたそうに、口を開きかけた。', expression: 'thinking' },
      { speaker: 'かおり', text: '...あの、ね', expression: 'shy' },
      { speaker: 'かおり', text: '...えっと、その...', expression: 'shy' },
      { speaker: '', text: '彼女の顔が、真っ赤に染まっていく。', expression: 'shy' },
      { speaker: 'かおり', text: '...ごめん、うまく言えない', expression: 'shy' },
      { speaker: 'かおり', text: '...でも、分かってくれるよね？', expression: 'shy' },
      { speaker: '', text: '彼女は照れながらも、こちらを真っ直ぐに見つめていた。', expression: 'shy' },
      { speaker: 'かおり', text: '...また、会おうね', expression: 'happy' },
      { speaker: 'かおり', text: '...絶対、だよ', expression: 'happy' },
      { speaker: '', text: '言葉にしなくても、お互いの気持ちは分かっていた。', expression: 'happy' },
    ],
  },

  // ============================================
  // TRUE ENDING
  // ============================================
  TRUE: {
    id: 'TRUE',
    category: 'TRUE',
    title: 'TRUE END',
    subtitle: 'また、この街で',
    theme: '相思相愛、再会の約束',
    bgColor: '#f56565',
    finalMessage: '9時間のクリスマスは、始まりの物語だった。',
    dialogues: [
      { speaker: '', text: '夜の博多駅。イルミネーションが二人を照らしている。', expression: 'neutral' },
      { speaker: 'かおり', text: '...今日、楽しかった', expression: 'happy' },
      { speaker: 'かおり', text: '...ううん、楽しかっただけじゃなくて...', expression: 'shy' },
      { speaker: '', text: '彼女は言葉を探すように、イルミネーションを見上げた。', expression: 'thinking' },
      { speaker: 'かおり', text: '...一緒にいると、なんか...落ち着く', expression: 'shy' },
      { speaker: 'かおり', text: '...変かな、初めて会ったのに', expression: 'shy' },
      { speaker: '', text: '彼女は照れたように目を伏せた。', expression: 'shy' },
      { speaker: 'かおり', text: '...でも、なまら楽しかった...あっ', expression: 'happy' },
      { speaker: 'かおり', text: '...また方言出ちゃった...もう', expression: 'shy' },
      { speaker: '', text: '彼女は頬を赤くして、でも笑っていた。', expression: 'happy' },
      { speaker: 'かおり', text: '...ね', expression: 'thinking' },
      { speaker: 'かおり', text: '...また、会える...よね？', expression: 'shy' },
      { speaker: '', text: '彼女の目には、不安と期待が混じっている。', expression: 'shy' },
      { speaker: 'かおり', text: '...うん！', expression: 'happy' },
      { speaker: 'かおり', text: '...約束...だよ', expression: 'shy' },
      { speaker: '', text: '彼女は小指を差し出した。', expression: 'shy' },
      { speaker: 'かおり', text: '...指切り、しよ', expression: 'shy' },
      { speaker: '', text: '冬の夜、二人の小指が結ばれた。', expression: 'happy' },
      { speaker: 'かおり', text: '...のこと...', expression: 'shy' },
      { speaker: 'かおり', text: '...好き、かも...', expression: 'shy' },
      { speaker: '', text: '彼女は俯きながら、でも確かにそう言った。', expression: 'shy' },
      { speaker: '', text: '「また、この街で」——それが、二人の約束になった。', expression: 'happy' },
    ],
  },
};

// Helper to get ending data
export function getEndingData(endingType: EndingType): EndingData {
  return ENDINGS[endingType];
}

// Get all endings for gallery/collection feature
export function getAllEndings(): EndingData[] {
  return Object.values(ENDINGS);
}

// Check if ending is unlocked (for save data)
export function isEndingUnlocked(endingType: EndingType, unlockedEndings: EndingType[]): boolean {
  return unlockedEndings.includes(endingType);
}
