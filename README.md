# かおりと福岡クリスマス (Christmas Date App)

北海道から来たいとこ「雪村かおり」と過ごす福岡クリスマスデートシミュレーションゲーム

## アプリ概要

- **キャラクター**: 雪村かおり (17歳、北海道小樽出身)
- **設定**: 福岡のクリスマスマーケットを巡るデートゲーム
- **制限時間**: 24時間
- **目標**: スポットチェックインでポイント獲得、好感度UP、マルチエンディング

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、Supabaseの認証情報を設定:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabaseデータベースの設定

Supabase Dashboardで以下を実行:

1. **匿名認証を有効化**:
   - Authentication > Providers > Anonymous Sign-Ins を有効化

2. **マイグレーションの実行**:
   - SQL Editorで `supabase/migrations/001_initial.sql` を実行

3. **シードデータの投入**:
   - SQL Editorで `supabase/seed.sql` を実行

### 4. アプリの起動

```bash
# 開発サーバー起動
npm start

# iOSシミュレータ
npm run ios

# Androidエミュレータ
npm run android

# Web
npm run web
```

## ゲーム機能

### 実装済み機能

- タイトル画面とオープニングストーリー
- ホーム画面（24時間カウントダウン、好感度表示、歩数カウント）
- マップ画面（福岡9スポット一覧、距離計算、チェックイン判定）
- スポット詳細画面（チェックイン機能）
- イベント画面（ノベルゲーム風、タイプライター演出、選択肢システム）
- チャット機能（かおりとの会話）
- エンディング画面（3種類のエンディング）
- SNSシェア機能（Twitter、一般シェア、コピー）
- 位置情報サービス（50m判定）
- 歩数カウント（100歩 = 1ポイント）
- Supabase連携（匿名認証、データ保存）
- GameContext（グローバル状態管理）
- CharacterDisplay（キャラクター表示コンポーネント）

### 今後実装予定

- [ ] Claude API連携（AI会話）
- [ ] ARモード
- [ ] キャラクター画像（現在はプレースホルダー）
- [ ] VRM対応（将来）

## 福岡スポット一覧

### 通常スポット

| ID | 名前 | ポイント |
|----|------|---------|
| A | 博多駅クリスマスマーケット | 100pt |
| B | 天神市役所前広場 | 100pt |
| C | 天神中央公園 | 120pt |
| D | 旧福岡県公会堂貴賓館 | 150pt |
| E | 大名ガーデンシティ | 100pt |
| F | 福岡タワー | 150pt |

### シークレットスポット

| ID | 名前 | ポイント |
|----|------|---------|
| S1 | 櫛田神社 | 200pt |
| S2 | 警固神社 | 200pt |
| S3 | 中洲屋台街 | 200pt |

## エンディング条件

| エンディング | スコア | かおりのセリフ |
|-------------|--------|---------------|
| BAD END | 0-299pt | 「...また、会えるかな...」 |
| NORMAL END | 300-599pt | 「今日は楽しかった...ありがと」 |
| GOOD END | 600pt+ | 「...また福岡、来てもいい？」 |

## プロジェクト構成

```
christmas-date-app/
├── app/                          # 画面コンポーネント (Expo Router)
│   ├── _layout.tsx              # ルートレイアウト
│   ├── index.tsx                # タイトル画面
│   ├── opening.tsx              # オープニング
│   ├── home.tsx                 # ホーム画面
│   ├── map.tsx                  # マップ画面
│   ├── chat.tsx                 # チャット画面
│   ├── event.tsx                # イベント画面
│   ├── ending.tsx               # エンディング画面
│   ├── share.tsx                # シェア画面
│   └── spot/[id].tsx            # スポット詳細
├── src/
│   ├── components/
│   │   └── CharacterDisplay.tsx # キャラクター表示
│   ├── constants/
│   │   └── character.ts         # キャラクター設定・スポットデータ
│   ├── contexts/
│   │   └── GameContext.tsx      # ゲーム状態管理
│   ├── services/
│   │   └── supabase.ts          # Supabase接続
│   └── types/
│       └── index.ts             # TypeScript型定義
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql      # DBマイグレーション
│   └── seed.sql                 # 初期データ
├── assets/
│   └── images/kaori/            # キャラクター画像（プレースホルダー）
├── .env.local                   # 環境変数
└── .env.example                 # 環境変数テンプレート
```

## 技術スタック

- **Framework**: Expo SDK 52+ / React Native
- **Navigation**: Expo Router
- **Database**: Supabase (PostgreSQL)
- **Location**: expo-location
- **Sensors**: expo-sensors (Pedometer)
- **Icons**: @expo/vector-icons
- **Language**: TypeScript

## データベース設計

### Tables

- `users`: ユーザー情報、スコア、好感度、歩数
- `spots`: スポット情報、座標、ポイント、イベントスクリプト
- `checkins`: チェックイン履歴、獲得ポイント、選択肢
- `chat_logs`: チャット履歴

### RLS (Row Level Security)

- ユーザーは自分のデータのみ読み書き可能
- スポットデータは全員閲覧可能

## 開発メモ

### 位置情報テスト

開発時は天神エリア (33.5904, 130.4017) をデフォルト位置として設定。
実機テストでは実際の位置情報が使用されます。

### キャラクター画像

現在はプレースホルダー（色付き四角と顔文字）で代用。
`assets/images/kaori/` に画像を追加することで差し替え可能:
- neutral.png: 通常表情
- happy.png: 嬉しい表情
- shy.png: 照れた表情
- sad.png: 悲しい表情

### 将来のVRM対応

`CharacterDisplay.tsx` はVRM対応を見据えて分離設計。
Three.js/react-three-fiberへの移行が容易な構造になっています。

---

Generated: 2024-12-20
