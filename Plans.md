# Plans.md - タスク管理

**プロジェクト**: かおりと福岡クリスマス
**現在のブランチ**: `feature/gps-background`
**最終更新**: 2024-12-24 (Phase 4.4 完了)

---

## 🟢 完了済みフェーズ

### Phase 1: 基盤構築 `cc:完了`
- [x] Expo プロジェクト初期化
- [x] Expo Router セットアップ
- [x] Supabase 連携
- [x] 基本画面実装（タイトル、ホーム、マップ、チャット、エンディング）

### Phase 2: ゲーム機能 `cc:完了`
- [x] GameContext（グローバル状態管理）
- [x] スポットチェックイン機能
- [x] イベントシステム（ノベルゲーム風、選択肢）
- [x] 歩数カウント連携
- [x] マルチエンディング（基本版）

### Phase 3.1: UI/UX 改善 `cc:完了`
- [x] ビジュアルノベル風 UI（main.tsx）
- [x] キャラクター表情システム
- [x] シークレットスポット解放条件

### Phase 3.2: 認証システム `cc:完了`
- [x] Clerk 認証統合
- [x] Google OAuth 対応
- [x] ゲストモード対応

### Phase 3.3: ビジュアル改善 `cc:完了`
- [x] GPS ベース背景切り替え
- [x] キャラクタースプライト統合
- [x] 昼夜システム
- [x] VN レイアウト最適化

---

## 🟢 完了済みフェーズ（続き）

### Phase 4: マルチシナリオ完成 `cc:完了`

**目標**: 好感度×スコアで13種類のエンディング分岐を実装 ✅

**詳細仕様**: `docs/multi-scenario-spec.md`
**優先度マトリクス**: `docs/priority_matrix.md`

#### 4.1 基盤実装 `cc:完了`
- [x] `src/constants/endings.ts` - 13種類のエンディングデータ定義
- [x] `GameContext.tsx` - getEndingType() を好感度×スコア対応に更新
- [x] `src/components/EndingScene.tsx` - エンディング演出コンポーネント

#### 4.2 シナリオ執筆 `cc:完了`
- [x] BAD END シナリオ（2種: BAD_A, BAD_B）
- [x] NORMAL END シナリオ（5種: NORMAL_A〜E）
- [x] GOOD END シナリオ（5種: GOOD_A〜E）
- [x] TRUE END シナリオ（1種）

#### 4.3 画面実装 `cc:完了`
- [x] `app/ending.tsx` - 新エンディングシステム対応にリファクタリング
- [x] タイプライター効果・演出追加
- [x] 全13分岐のテスト・デバッグ（282テスト合格）

#### 4.4 UX改善 `cc:完了`
- [x] 好感度の可視化（ハートアイコン）- main.tsx のスコアバッジに実装済み
- [x] エンディングギャラリー画面 - app/gallery.tsx, app/gallery-detail.tsx
- [x] スキップ機能（AUTO/SKIP モード）- EndingScene.tsx に実装

---

## 🔴 現在のフェーズ

---

## 🟡 今後のフェーズ

### Phase 5: 品質向上 `cc:TODO`
- [ ] feature/gps-background を develop にマージ
- [ ] PR レビュー対応
- [ ] テストカバレッジ向上

### Phase 6: AI 機能強化 `cc:TODO`
- [ ] Claude API 連携（AI 会話）
- [ ] 会話履歴の永続化
- [ ] キャラクター性格の一貫性向上

### Phase 7: 追加機能 `cc:TODO`
- [ ] AR モード検討
- [ ] SNS シェア機能強化
- [ ] アチーブメントシステム

### Phase 8: リリース準備 `cc:TODO`
- [ ] EAS Build 設定
- [ ] App Store / Google Play 申請準備
- [ ] パフォーマンス最適化

---

## メモ

### マルチシナリオ設計方針

**エンディング分岐マトリクス**（実装済み）:
| 好感度 | スコア<600 | 600-1199 | 1200-1799 | ≥1800 |
|--------|-----------|----------|-----------|-------|
| 1 | BAD_A | NORMAL_A | NORMAL_A | NORMAL_A |
| 2 | BAD_B | NORMAL_B | GOOD_A | GOOD_A |
| 3 | BAD_B | NORMAL_C | GOOD_B | GOOD_B |
| 4 | NORMAL_D | NORMAL_D | GOOD_C | GOOD_D |
| 5 | NORMAL_E | NORMAL_E | GOOD_E | **TRUE** |

**TRUE END 条件**: 好感度5（MAX）+ スコア1800以上
**設計思想**: 高好感度（4-5）プレイヤーはBAD ENDにならない（努力を報いる設計）

**参考資料**:
- [VNDev Wiki - Branching](https://vndev.wiki/Branching)
- [乙女ゲーの好感度システム](https://harf-way.com/column/favorability-rating/)

### 既知の課題
- ESLint 警告（`continue-on-error: true` で CI 通過）
- 一部のキャラクター画像は絵文字フォールバック中

### 技術的決定
- VN UI: 絶対位置配置方式を採用（Flex ゾーン方式より安定）
- Clerk タイムアウト: 10秒でゲストモードにフォールバック
- Metro: 静的 require のみ使用（動的インポート不可）
