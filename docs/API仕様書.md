# 営業日報システム API仕様書

---

## 共通仕様

### ベースURL

```
/api/v1
```

### 認証

- JWT Bearer Token による認証
- リクエストヘッダーに以下を付与

```
Authorization: Bearer {token}
```

### レスポンス形式

- Content-Type: `application/json`

#### 成功時

```json
{
  "data": { ... }
}
```

#### エラー時

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエスト不正 |
| 401 | 未認証 |
| 403 | 権限なし |
| 404 | リソースが存在しない |
| 409 | 競合（重複など） |
| 422 | バリデーションエラー |
| 500 | サーバーエラー |

---

## エンドポイント一覧

| # | メソッド | パス | 説明 | 権限 |
|---|---------|------|------|------|
| 1 | POST | `/auth/login` | ログイン | 全員 |
| 2 | POST | `/auth/logout` | ログアウト | 認証済み |
| 3 | GET | `/reports` | 日報一覧取得 | 営業・上長 |
| 4 | POST | `/reports` | 日報作成 | 営業 |
| 5 | GET | `/reports/:id` | 日報詳細取得 | 営業・上長 |
| 6 | PUT | `/reports/:id` | 日報更新 | 営業 |
| 7 | POST | `/reports/:id/submit` | 日報提出 | 営業 |
| 8 | GET | `/reports/:id/comments` | コメント一覧取得 | 営業・上長 |
| 9 | POST | `/reports/:id/comments` | コメント投稿 | 上長 |
| 10 | GET | `/customers` | 顧客一覧取得 | 営業・上長 |
| 11 | POST | `/customers` | 顧客作成 | 上長 |
| 12 | GET | `/customers/:id` | 顧客詳細取得 | 営業・上長 |
| 13 | PUT | `/customers/:id` | 顧客更新 | 上長 |
| 14 | PATCH | `/customers/:id/status` | 顧客有効・無効切替 | 上長 |
| 15 | GET | `/users` | ユーザー一覧取得 | 上長 |
| 16 | POST | `/users` | ユーザー作成 | 上長 |
| 17 | GET | `/users/:id` | ユーザー詳細取得 | 上長 |
| 18 | PUT | `/users/:id` | ユーザー更新 | 上長 |
| 19 | PATCH | `/users/:id/status` | ユーザー有効・無効切替 | 上長 |

---

## 認証

### POST /auth/login

ログインしてJWTトークンを取得する。

**リクエスト**

```json
{
  "email": "sales@example.com",
  "password": "password123"
}
```

**レスポンス 200**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "山田 太郎",
      "email": "sales@example.com",
      "role": "sales",
      "department": "東京営業部"
    }
  }
}
```

**エラー 401**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

### POST /auth/logout

ログアウトしてトークンを無効化する。

**レスポンス 200**

```json
{
  "data": {
    "message": "ログアウトしました"
  }
}
```

---

## 日報

### GET /reports

日報一覧を取得する。営業は自分の日報のみ、上長は全員の日報を取得可能。

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `from` | date | - | 開始日（YYYY-MM-DD） |
| `to` | date | - | 終了日（YYYY-MM-DD） |
| `user_id` | integer | - | 担当者ID（上長のみ有効） |
| `status` | string | - | `draft` or `submitted` |
| `page` | integer | - | ページ番号（デフォルト: 1） |
| `per_page` | integer | - | 1ページあたり件数（デフォルト: 20） |

**レスポンス 200**

```json
{
  "data": {
    "reports": [
      {
        "id": 1,
        "user": {
          "id": 1,
          "name": "山田 太郎"
        },
        "report_date": "2026-03-18",
        "status": "submitted",
        "visit_count": 3,
        "comment_count": 1,
        "submitted_at": "2026-03-18T18:00:00Z",
        "updated_at": "2026-03-18T18:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "per_page": 20,
      "total_pages": 5
    }
  }
}
```

---

### POST /reports

日報を新規作成する。

**リクエスト**

```json
{
  "report_date": "2026-03-18",
  "problem": "A社の予算確保が難航している",
  "plan": "B社へのフォローアップ電話をする",
  "visit_records": [
    {
      "customer_id": 10,
      "visited_at": "10:00",
      "visit_content": "新製品の提案を行った。来週再訪の約束を取り付けた。"
    },
    {
      "customer_id": 20,
      "visited_at": "14:00",
      "visit_content": "契約更新の手続きを完了した。"
    }
  ]
}
```

**レスポンス 201**

```json
{
  "data": {
    "id": 42,
    "user_id": 1,
    "report_date": "2026-03-18",
    "problem": "A社の予算確保が難航している",
    "plan": "B社へのフォローアップ電話をする",
    "status": "draft",
    "submitted_at": null,
    "visit_records": [
      {
        "id": 101,
        "customer": {
          "id": 10,
          "company_name": "株式会社A"
        },
        "visited_at": "10:00",
        "visit_content": "新製品の提案を行った。来週再訪の約束を取り付けた。"
      }
    ],
    "created_at": "2026-03-18T09:00:00Z",
    "updated_at": "2026-03-18T09:00:00Z"
  }
}
```

**エラー 409**（同一日付の日報が既に存在する場合）

```json
{
  "error": {
    "code": "DUPLICATE_REPORT",
    "message": "指定日付の日報は既に存在します"
  }
}
```

---

### GET /reports/:id

日報詳細を取得する。

**レスポンス 200**

```json
{
  "data": {
    "id": 42,
    "user": {
      "id": 1,
      "name": "山田 太郎",
      "department": "東京営業部"
    },
    "report_date": "2026-03-18",
    "problem": "A社の予算確保が難航している",
    "plan": "B社へのフォローアップ電話をする",
    "status": "submitted",
    "submitted_at": "2026-03-18T18:00:00Z",
    "visit_records": [
      {
        "id": 101,
        "customer": {
          "id": 10,
          "company_name": "株式会社A",
          "contact_person": "佐藤 次郎"
        },
        "visited_at": "10:00",
        "visit_content": "新製品の提案を行った。来週再訪の約束を取り付けた。"
      }
    ],
    "comments": [
      {
        "id": 5,
        "user": {
          "id": 3,
          "name": "鈴木 部長"
        },
        "content": "A社については私からもフォローします。",
        "created_at": "2026-03-18T20:00:00Z"
      }
    ],
    "created_at": "2026-03-18T09:00:00Z",
    "updated_at": "2026-03-18T18:00:00Z"
  }
}
```

---

### PUT /reports/:id

日報を更新する。ステータスが `draft` の場合のみ更新可能。

**リクエスト**（POST /reports と同形式）

**レスポンス 200**（更新後の日報詳細を返す）

**エラー 403**（提出済み日報を編集しようとした場合）

```json
{
  "error": {
    "code": "REPORT_ALREADY_SUBMITTED",
    "message": "提出済みの日報は編集できません"
  }
}
```

---

### POST /reports/:id/submit

日報を提出する（ステータスを `submitted` に変更）。

**リクエスト**：なし

**レスポンス 200**

```json
{
  "data": {
    "id": 42,
    "status": "submitted",
    "submitted_at": "2026-03-18T18:00:00Z"
  }
}
```

---

## コメント

### GET /reports/:id/comments

日報のコメント一覧を取得する。

**レスポンス 200**

```json
{
  "data": {
    "comments": [
      {
        "id": 5,
        "user": {
          "id": 3,
          "name": "鈴木 部長"
        },
        "content": "A社については私からもフォローします。",
        "created_at": "2026-03-18T20:00:00Z"
      }
    ]
  }
}
```

---

### POST /reports/:id/comments

日報にコメントを投稿する。上長のみ実行可能。

**リクエスト**

```json
{
  "content": "A社については私からもフォローします。"
}
```

**レスポンス 201**

```json
{
  "data": {
    "id": 5,
    "user": {
      "id": 3,
      "name": "鈴木 部長"
    },
    "content": "A社については私からもフォローします。",
    "created_at": "2026-03-18T20:00:00Z"
  }
}
```

---

## 顧客マスタ

### GET /customers

顧客一覧を取得する。

**クエリパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `q` | string | 会社名の部分一致検索 |
| `is_active` | boolean | 有効フラグでフィルタ |

**レスポンス 200**

```json
{
  "data": {
    "customers": [
      {
        "id": 10,
        "company_name": "株式会社A",
        "contact_person": "佐藤 次郎",
        "phone": "03-1234-5678",
        "address": "東京都千代田区...",
        "is_active": true
      }
    ]
  }
}
```

---

### POST /customers

顧客を新規作成する。上長のみ実行可能。

**リクエスト**

```json
{
  "company_name": "株式会社B",
  "contact_person": "田中 三郎",
  "phone": "06-1234-5678",
  "address": "大阪府大阪市..."
}
```

**レスポンス 201**（作成した顧客情報を返す）

---

### PUT /customers/:id

顧客情報を更新する。上長のみ実行可能。

**リクエスト**（POST /customers と同形式）

**レスポンス 200**（更新後の顧客情報を返す）

---

### PATCH /customers/:id/status

顧客の有効・無効を切り替える。上長のみ実行可能。

**リクエスト**

```json
{
  "is_active": false
}
```

**レスポンス 200**

```json
{
  "data": {
    "id": 10,
    "is_active": false
  }
}
```

---

## 営業マスタ（ユーザー）

### GET /users

ユーザー一覧を取得する。上長のみ実行可能。

**レスポンス 200**

```json
{
  "data": {
    "users": [
      {
        "id": 1,
        "name": "山田 太郎",
        "email": "yamada@example.com",
        "role": "sales",
        "department": "東京営業部",
        "is_active": true
      }
    ]
  }
}
```

---

### POST /users

ユーザーを新規作成する。上長のみ実行可能。

**リクエスト**

```json
{
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "password": "password123",
  "role": "sales",
  "department": "東京営業部"
}
```

**レスポンス 201**（作成したユーザー情報を返す。パスワードは含まない）

**エラー 409**（メールアドレスが重複する場合）

```json
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "このメールアドレスは既に使用されています"
  }
}
```

---

### PUT /users/:id

ユーザー情報を更新する。上長のみ実行可能。

**リクエスト**（パスワードは省略可能）

```json
{
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "role": "sales",
  "department": "東京営業部"
}
```

**レスポンス 200**（更新後のユーザー情報を返す）

---

### PATCH /users/:id/status

ユーザーの有効・無効を切り替える。上長のみ実行可能。

**リクエスト**

```json
{
  "is_active": false
}
```

**レスポンス 200**

```json
{
  "data": {
    "id": 1,
    "is_active": false
  }
}
```
