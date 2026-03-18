import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 シードデータを投入します...');

  // ============================================================
  // ユーザー作成
  // ============================================================
  const passwordHash = await bcrypt.hash('password123', 10);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      name: '鈴木 部長',
      email: 'manager@example.com',
      passwordHash,
      role: 'manager',
      department: '営業統括部',
      isActive: true,
    },
  });

  const sales1 = await prisma.user.upsert({
    where: { email: 'yamada@example.com' },
    update: {},
    create: {
      name: '山田 太郎',
      email: 'yamada@example.com',
      passwordHash,
      role: 'sales',
      department: '東京営業部',
      isActive: true,
    },
  });

  const sales2 = await prisma.user.upsert({
    where: { email: 'tanaka@example.com' },
    update: {},
    create: {
      name: '田中 花子',
      email: 'tanaka@example.com',
      passwordHash,
      role: 'sales',
      department: '大阪営業部',
      isActive: true,
    },
  });

  const _inactiveUser = await prisma.user.upsert({
    where: { email: 'inactive@example.com' },
    update: {},
    create: {
      name: '無効 ユーザー',
      email: 'inactive@example.com',
      passwordHash,
      role: 'sales',
      department: '東京営業部',
      isActive: false,
    },
  });

  console.log('✅ ユーザー作成完了:', { manager: manager.name, sales1: sales1.name, sales2: sales2.name });

  // ============================================================
  // 顧客作成
  // ============================================================
  const customerA = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      companyName: '株式会社A',
      contactPerson: '佐藤 次郎',
      phone: '03-1234-5678',
      address: '東京都千代田区丸の内1-1-1',
      isActive: true,
    },
  });

  const customerB = await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      companyName: '株式会社B',
      contactPerson: '高橋 一郎',
      phone: '06-2345-6789',
      address: '大阪府大阪市北区梅田2-2-2',
      isActive: true,
    },
  });

  const customerC = await prisma.customer.upsert({
    where: { id: 3 },
    update: {},
    create: {
      companyName: '株式会社C',
      contactPerson: '伊藤 三郎',
      phone: '052-3456-7890',
      address: '愛知県名古屋市中区栄3-3-3',
      isActive: true,
    },
  });

  const _inactiveCustomer = await prisma.customer.upsert({
    where: { id: 4 },
    update: {},
    create: {
      companyName: '旧取引先株式会社',
      contactPerson: '廃業 太郎',
      phone: '03-9999-9999',
      address: '東京都港区',
      isActive: false,
    },
  });

  console.log('✅ 顧客作成完了:', { A: customerA.companyName, B: customerB.companyName, C: customerC.companyName });

  // ============================================================
  // 日報作成（山田さん — 提出済み）
  // ============================================================
  const report1 = await prisma.dailyReport.upsert({
    where: {
      userId_reportDate: {
        userId: sales1.id,
        reportDate: new Date('2026-03-17'),
      },
    },
    update: {},
    create: {
      userId: sales1.id,
      reportDate: new Date('2026-03-17'),
      problem: 'A社の予算確保が難航している。決裁者へのアプローチ方法を相談したい。',
      plan: 'B社へのフォローアップ電話をする。C社の提案書を完成させる。',
      status: 'submitted',
      submittedAt: new Date('2026-03-17T18:00:00Z'),
      visitRecords: {
        create: [
          {
            customerId: customerA.id,
            visitedAt: '10:00',
            visitContent: '新製品の提案を行った。担当者は興味を示していたが、予算の関係で来月再訪を希望とのこと。',
          },
          {
            customerId: customerB.id,
            visitedAt: '14:00',
            visitContent: '契約更新の手続きを完了した。次回は新サービスについて紹介予定。',
          },
          {
            customerId: customerC.id,
            visitedAt: '16:30',
            visitContent: '初回訪問。会社概要と製品ラインナップを紹介した。担当者の反応は良好。',
          },
        ],
      },
    },
  });

  // ============================================================
  // 日報作成（山田さん — 下書き）
  // ============================================================
  const report2 = await prisma.dailyReport.upsert({
    where: {
      userId_reportDate: {
        userId: sales1.id,
        reportDate: new Date('2026-03-18'),
      },
    },
    update: {},
    create: {
      userId: sales1.id,
      reportDate: new Date('2026-03-18'),
      problem: 'B社の担当者が異動になりそうで、引き継ぎが心配。',
      plan: 'A社に予算確保の進捗確認をする。',
      status: 'draft',
      visitRecords: {
        create: [
          {
            customerId: customerA.id,
            visitedAt: '11:00',
            visitContent: '先週の提案への返答を確認。予算申請中とのこと。来週の回答を待つ。',
          },
        ],
      },
    },
  });

  // ============================================================
  // 日報作成（田中さん — 提出済み）
  // ============================================================
  const report3 = await prisma.dailyReport.upsert({
    where: {
      userId_reportDate: {
        userId: sales2.id,
        reportDate: new Date('2026-03-18'),
      },
    },
    update: {},
    create: {
      userId: sales2.id,
      reportDate: new Date('2026-03-18'),
      problem: null,
      plan: 'C社への提案資料を準備する。',
      status: 'submitted',
      submittedAt: new Date('2026-03-18T17:30:00Z'),
      visitRecords: {
        create: [
          {
            customerId: customerB.id,
            visitedAt: '13:00',
            visitContent: '担当者交代のご挨拶。新担当の田村氏に改めてサービス内容を説明した。',
          },
          {
            customerId: customerC.id,
            visitedAt: '15:30',
            visitContent: '見積書を提出。前向きに検討していただける見込み。',
          },
        ],
      },
    },
  });

  console.log('✅ 日報作成完了:', {
    report1: `${report1.id} (${sales1.name} - submitted)`,
    report2: `${report2.id} (${sales1.name} - draft)`,
    report3: `${report3.id} (${sales2.name} - submitted)`,
  });

  // ============================================================
  // コメント作成（上長 → 山田さんの提出済み日報）
  // ============================================================
  const comment = await prisma.comment.create({
    data: {
      dailyReportId: report1.id,
      userId: manager.id,
      content: 'A社については私からも経営層にアプローチしてみます。引き続き粘り強く対応をお願いします。',
    },
  });

  console.log('✅ コメント作成完了:', { id: comment.id, user: manager.name });

  console.log('\n🎉 シードデータの投入が完了しました！');
  console.log('\n📧 ログイン情報（全ユーザー共通パスワード: password123）');
  console.log(`  上長: ${manager.email}`);
  console.log(`  営業1: ${sales1.email}`);
  console.log(`  営業2: ${sales2.email}`);
}

main()
  .catch((e) => {
    console.error('❌ シードエラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
