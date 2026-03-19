# 営業日報システム

営業担当者が日々の顧客訪問・課題・翌日計画を記録し、上長がフィードバックを行うための日報管理システムです。

## 技術スタック

| カテゴリ          | 技術                         |
| ----------------- | ---------------------------- |
| 言語              | TypeScript                   |
| フレームワーク    | Next.js 16 (App Router)      |
| UI                | shadcn/ui + Tailwind CSS v4  |
| DB ORM            | Prisma 7 (PostgreSQL)        |
| 認証              | JWT (jose / httpOnly Cookie) |
| APIバリデーション | Zod                          |
| テスト            | Vitest + Testing Library     |
| デプロイ          | Google Cloud Run             |

## 機能

- **日報管理**: 作成・編集・提出（下書き / 提出済みステータス）
- **訪問記録**: 1日報に複数件の顧客訪問記録を登録
- **コメント**: 上長が日報にフィードバックコメントを投稿
- **顧客マスタ**: 顧客の登録・編集・有効/無効切替
- **営業マスタ**: ユーザー（営業・上長）の登録・編集・有効/無効切替
- **権限制御**: 営業ロール / 上長ロールによるアクセス制御

## セットアップ

### 前提条件

- Node.js 20+
- PostgreSQL

### インストール

```bash
npm install
```

### 環境変数

`.env` ファイルをプロジェクトルートに作成します。

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-secret-key"
```

### DB セットアップ

```bash
# マイグレーション実行
npm run db:migrate

# 初期データ投入
npm run db:seed
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

### シードデータのログイン情報

| ロール | メールアドレス      | パスワード  |
| ------ | ------------------- | ----------- |
| 上長   | manager@example.com | password123 |
| 営業   | sales@example.com   | password123 |

## コマンド一覧

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run test         # テスト実行
npm run test:watch   # テストウォッチモード
npm run test:coverage # カバレッジ計測
npm run lint         # ESLint
npm run typecheck    # TypeScript型チェック
npm run db:generate  # Prismaクライアント生成
npm run db:migrate   # DBマイグレーション
npm run db:seed      # 初期データ投入
npm run db:studio    # Prisma Studio起動
```

## プロジェクト構成

```
src/
├── app/
│   ├── api/v1/          # APIルートハンドラー
│   │   ├── auth/        # 認証 (login / logout)
│   │   ├── reports/     # 日報API
│   │   ├── customers/   # 顧客マスタAPI
│   │   └── users/       # 営業マスタAPI
│   ├── (auth)/          # 認証不要ページ (login)
│   └── (dashboard)/     # 認証必要ページ
│       ├── reports/     # 日報一覧・詳細・作成・編集
│       ├── customers/   # 顧客マスタ
│       └── users/       # 営業マスタ
├── components/          # 共通UIコンポーネント
├── lib/
│   ├── auth/            # JWT認証ユーティリティ
│   └── prisma.ts        # Prismaクライアント
├── hooks/               # カスタムフック
├── types/               # 型定義
└── test/                # テストヘルパー
prisma/
├── schema.prisma        # DBスキーマ
└── seed.ts              # 初期データ
docs/                    # 要件定義・API仕様書等
```

## API概要

ベースURL: `/api/v1`

| メソッド | パス                    | 説明                    |
| -------- | ----------------------- | ----------------------- |
| POST     | `/auth/login`           | ログイン                |
| POST     | `/auth/logout`          | ログアウト              |
| GET/POST | `/reports`              | 日報一覧取得 / 作成     |
| GET/PUT  | `/reports/:id`          | 日報詳細取得 / 更新     |
| POST     | `/reports/:id/submit`   | 日報提出                |
| GET/POST | `/reports/:id/comments` | コメント一覧取得 / 投稿 |
| GET/POST | `/customers`            | 顧客一覧取得 / 作成     |
| GET/PUT  | `/customers/:id`        | 顧客詳細取得 / 更新     |
| PATCH    | `/customers/:id/status` | 顧客有効・無効切替      |
| GET/POST | `/users`                | ユーザー一覧取得 / 作成 |
| GET/PUT  | `/users/:id`            | ユーザー詳細取得 / 更新 |
| PATCH    | `/users/:id/status`     | ユーザー有効・無効切替  |

詳細は [API仕様書](docs/API仕様書.md) を参照してください。
