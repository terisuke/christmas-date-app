# Plans.md - タスク管理

**プロジェクト**: 雪の降らない聖夜に
**現在のブランチ**: `feature/gps-background`
**最終更新**: 2024-12-24 (Phase 8 追加機能完了)

---

## 🟢 完了済みフェーズ（Phase 1-7 アーカイブ済み）

<details>
<summary>Phase 1-7 詳細（クリックで展開）</summary>

- **Phase 1**: 基盤構築（Expo, Router, Supabase）
- **Phase 2**: ゲーム機能（GameContext, チェックイン, イベント）
- **Phase 3**: UI/UX改善, Clerk認証, GPS背景
- **Phase 4**: マルチシナリオ13種エンディング
- **Phase 5**: 品質向上（98%カバレッジ, 322テスト）
- **Phase 6**: AI機能強化（OpenRouter, 会話履歴永続化）
- **Phase 7**: UX改善（歩数可視化, スポット接近通知, ゲーミフィケーション）

詳細は `docs/` ディレクトリ参照
</details>

---

## 🟢 完了済みフェーズ（最新）

### Phase 8: 追加機能 `cc:完了`

#### 8.1 画像付きシェア機能 `cc:完了`
- [x] react-native-view-shot でカード画像キャプチャ
- [x] expo-sharing で画像シェア
- [x] エンディングカードにカテゴリバッジ追加

#### 8.2 スクリーンショット保存機能 `cc:完了`
- [x] expo-media-library で端末保存
- [x] 権限リクエスト処理
- [x] 保存成功/失敗のフィードバック

#### 8.3 アチーブメントシステム `cc:完了`
- [x] 13種類のアチーブメント定義（common/rare/epic/legendary）
- [x] AsyncStorage による進捗永続化
- [x] GameContext 統合（自動アンロック検知）
- [x] アチーブメント通知コンポーネント
- [x] アチーブメント一覧画面（app/achievements.tsx）
- [x] ボーナスポイント付与システム
- [x] 23件のユニットテスト追加（345テスト合格）

**アチーブメント一覧**:
| ID | 名前 | 条件 | レアリティ | ボーナス |
|----|------|------|-----------|---------|
| first_step | 初めの一歩 | 初チェックイン | Common | +50pt |
| walker_2k | お散歩日和 | 2,000歩 | Common | +30pt |
| walker_5k | ウォーカー | 5,000歩 | Rare | +50pt |
| walker_10k | 健脚 | 10,000歩 | Epic | +100pt |
| chatterbox | おしゃべり | 会話30回 | Rare | +50pt |
| explorer | 探検家 | 通常6スポット制覇 | Rare | +200pt |
| secret_finder | 秘密発見 | シークレット発見 | Rare | +100pt |
| all_spots | 完全制覇 | 全9スポット制覇 | Epic | +300pt |
| heart_opener | 心を開いて | 好感度MAX | Epic | +150pt |
| true_end | TRUE END | TRUE END到達 | Legendary | +500pt |
| collector | 思い出コレクター | 全13エンディング | Legendary | +1000pt |
| speed_runner | 時間厳守 | 残り1時間以上 | Common | +50pt |
| high_scorer | ハイスコアラー | 2,000pt以上 | Epic | +100pt |

---

## 🟡 今後のフェーズ

### Phase 9: リリース準備 `cc:TODO`
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
