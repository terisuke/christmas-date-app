# AGENTS.md - 開発ワークフロー

このファイルは Claude Code との開発フローを定義します。

## プロジェクト概要

**かおりと福岡クリスマス** - クリスマスデートシミュレーションゲーム
- Expo SDK 54 / React Native
- TypeScript + Expo Router
- Clerk 認証 + Supabase バックエンド

## 開発モード

**Solo モード**: Claude Code と直接対話して開発

## ワークフロー

### 1. 計画フェーズ
```
ユーザー: 「〇〇を作りたい」
↓
Claude Code: Plans.md にタスクを追加
↓
ユーザー: 確認・承認
```

### 2. 実装フェーズ
```
Claude Code: タスクを実行 (cc:WIP)
↓
テスト・検証
↓
タスク完了 (cc:完了)
```

### 3. レビューフェーズ
```
変更内容を確認
↓
必要に応じて修正
↓
コミット・プッシュ
```

## マーカー凡例

| マーカー | 状態 | 説明 |
|---------|------|------|
| `cc:TODO` | 未着手 | Claude Code が実行予定 |
| `cc:WIP` | 作業中 | 現在実装中 |
| `cc:完了` | 完了 | 実装・テスト完了 |
| `cc:blocked` | ブロック | 依存タスク待ち |

## 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `/plan-with-agent` | 新しいタスクの計画を作成 |
| `/work` | Plans.md のタスクを実行 |
| `/sync-status` | 現在の状態を確認・Plans.md を更新 |
| `/validate` | プロジェクト検証（テスト・ビルド） |

## 品質基準

- [ ] TypeScript エラーなし (`npm run typecheck`)
- [ ] テスト通過 (`npm test`)
- [ ] ESLint 警告対応 (`npm run lint`)
- [ ] 動作確認（Expo Go または実機）

## 意思決定記録

重要な決定は `.claude/memory/decisions.md` に記録されます。
