# 再利用パターン (Patterns)

このファイルはプロジェクトで使用する再利用可能なパターンを記録します。

---

## コンポーネントパターン

### 表情付きキャラクター表示
```tsx
import CharacterDisplay, { KaoriExpression } from '@/src/components/CharacterDisplay';

<CharacterDisplay
  expression="happy"  // neutral | happy | shy | surprised | sad | thinking
  style={{ /* optional styles */ }}
/>
```

### ゲーム状態の取得
```tsx
import { useGame } from '@/src/contexts/GameContext';

const { score, affection, checkInCount, addScore, checkIn } = useGame();
```

---

## AI レスポンス処理

### 表情タグのパース
```typescript
// AI レスポンスから表情を抽出
const EXPRESSION_REGEX = /\[expression:(neutral|happy|shy|surprised|sad|thinking)\]/;

function parseKaoriResponse(response: string): { text: string; expression: KaoriExpression } {
  const match = response.match(EXPRESSION_REGEX);
  const expression = (match?.[1] as KaoriExpression) || 'neutral';
  const text = response.replace(EXPRESSION_REGEX, '').trim();
  return { text, expression };
}
```

---

## GPS・位置情報

### 最寄りスポット検出
```tsx
import { useNearestSpot } from '@/src/hooks/useNearestSpot';

const { nearestSpot, timeOfDay, loading, error, locationEnabled } = useNearestSpot();
// nearestSpot: { id, name, distance, lat, lng, is_secret } | null
// timeOfDay: 'day' | 'night' (JST ベース)
```

---

## スタイリングパターン

### VN スタイル背景オーバーレイ
```tsx
// 昼間: 薄いオーバーレイ
<View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.1)' }} />

// 夜間: 青みがかったオーバーレイ
<View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,30,0.4)' }} />
```

---

## テストパターン

### GameContext のモック
```typescript
jest.mock('@/src/contexts/GameContext', () => ({
  useGame: () => ({
    score: 100,
    affection: 3,
    checkInCount: 2,
    addScore: jest.fn(),
    checkIn: jest.fn(),
  }),
}));
```

---

## 今後追加予定

- [ ] Supabase クエリパターン
- [ ] Clerk 認証フローパターン
