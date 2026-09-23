import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bath,
  BedDouble,
  Check,
  ClipboardCheck,
  Droplets,
  Footprints,
  Heart,
  HeartPulse,
  MessageCircleMore,
  Pill,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Toilet,
  UserRound,
  Utensils,
} from "lucide-react";
import styles from "../showcase.module.css";

const sections = ["care-record", "profile", "family-report"] as const;
type Section = (typeof sections)[number];

const sectionInfo: Record<
  Section,
  { step: string; label: string; description: string }
> = {
  "care-record": {
    step: "一つ目",
    label: "介護記録",
    description: "食事量や体調、行ったケアを整理し、下書きを作ります。",
  },
  profile: {
    step: "二つ目",
    label: "生活歴プロフィール",
    description: "趣味や思い出、ケア上の注意点を施設全体で共有します。",
  },
  "family-report": {
    step: "三つ目",
    label: "家族レポート",
    description: "その日の本人の言葉や様子を家族へ届けます。",
  },
};

export const metadata: Metadata = {
  title: "こころん｜3つの機能",
  description:
    "こころんの介護記録、生活歴プロフィール、家族レポートの動画用デモ。",
};

export async function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

function isSection(value: string): value is Section {
  return sections.includes(value as Section);
}

function DemoHeader({ active }: { active: Section }) {
  return (
    <header className={styles.header}>
      <div className={styles.brandRow}>
        <Image
          src="/logo.png"
          alt="こころん"
          width={268}
          height={96}
          priority
          className={styles.logo}
        />
        <span className={styles.demoBadge}>動画用デモ</span>
      </div>
      <nav className={styles.tabs} aria-label="機能を切り替える">
        {sections.map((section, index) => {
          const item = sectionInfo[section];
          return (
            <Link
              href={`/showcase/${section}`}
              className={`${styles.tab} ${active === section ? styles.tabActive : ""}`}
              key={section}
            >
              <span>{index + 1}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.person}>
        <Image
          src="/avatars/yamamoto.png"
          alt="山本正一さん"
          width={48}
          height={48}
        />
        <div>
          <strong>山本 正一さん</strong>
          <small>82歳・203号室</small>
        </div>
      </div>
    </header>
  );
}

function Intro({ section }: { section: Section }) {
  const item = sectionInfo[section];
  return (
    <div className={styles.intro}>
      <span className={styles.step}>{item.step}</span>
      <h1>{item.label}</h1>
      <p>{item.description}</p>
    </div>
  );
}

function CareRecordScreen() {
  return (
    <section className={`${styles.panel} ${styles.careSheet}`}>
      <div className={styles.sheetTopbar}>
        <div className={styles.sheetTitle}>
          <span className={styles.iconBubbleBlue}>
            <ClipboardCheck size={20} />
          </span>
          <div>
            <span className={styles.draftBadge}>AI下書き</span>
            <h2>日常介護記録</h2>
          </div>
        </div>
        <div className={styles.generatedFrom}>
          <Sparkles size={15} />
          9:10の会話から自動作成
        </div>
      </div>

      <div className={styles.identityGrid}>
        <div>
          <span>入居者</span>
          <strong>山本 正一 様</strong>
          <small>82歳・203号室</small>
        </div>
        <div>
          <span>記録日時</span>
          <strong>2026年9月22日　09:18</strong>
          <small>朝食後ケア</small>
        </div>
        <div>
          <span>担当職員</span>
          <strong>佐々木 美咲</strong>
          <small>介護職員</small>
        </div>
      </div>

      <div className={styles.careFormGrid}>
        <div className={styles.formMain}>
          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <HeartPulse size={17} />
              <h3>バイタル・健康状態</h3>
              <span>測定 08:45</span>
            </div>
            <div className={styles.vitalsGrid}>
              <div>
                <Thermometer size={17} />
                <span>体温</span>
                <strong>
                  36.5<small>℃</small>
                </strong>
              </div>
              <div>
                <Activity size={17} />
                <span>血圧</span>
                <strong>
                  128/72<small>mmHg</small>
                </strong>
              </div>
              <div>
                <Heart size={17} />
                <span>脈拍</span>
                <strong>
                  68<small>回/分</small>
                </strong>
              </div>
              <div>
                <Droplets size={17} />
                <span>SpO₂</span>
                <strong>
                  97<small>%</small>
                </strong>
              </div>
            </div>
            <div className={styles.conditionRow}>
              <span>意識</span>
              <b>清明</b>
              <span>表情</span>
              <b>穏やか</b>
              <span>睡眠</span>
              <b>良眠</b>
              <span>疼痛</span>
              <b className={styles.alertValue}>右膝・軽度</b>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <Utensils size={17} />
              <h3>食事・水分</h3>
            </div>
            <div className={styles.mealGrid}>
              <div>
                <span>朝食</span>
                <strong>主食 10/10</strong>
                <strong>副食 10/10</strong>
              </div>
              <div>
                <span>水分</span>
                <strong>200 mL</strong>
                <small>お茶</small>
              </div>
              <div>
                <span>食欲</span>
                <strong>良好</strong>
                <small>むせ込みなし</small>
              </div>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <MessageCircleMore size={17} />
              <h3>状態・特記事項</h3>
            </div>
            <div className={styles.noteBox}>
              朝食は主食・副食ともに完食。立ち上がり時に「右膝が少し痛む」との訴えあり。右側から見守り、手すりを使用してゆっくり立ち上がるよう声かけを行った。歩行は安定しているが、次回介助時も疼痛の有無を確認する。
            </div>
          </section>
        </div>

        <aside className={styles.careChecklist}>
          <div className={styles.formSectionTitle}>
            <UserRound size={17} />
            <h3>実施したケア</h3>
          </div>
          <div className={styles.checkGroups}>
            <div>
              <span>
                <Toilet size={16} />
                排泄
              </span>
              <p>
                <b>✓</b> トイレ誘導
              </p>
              <small>排尿あり・異常なし</small>
            </div>
            <div>
              <span>
                <Bath size={16} />
                清潔・整容
              </span>
              <p>
                <b>✓</b> 洗面・口腔ケア
              </p>
              <small>一部声かけ</small>
            </div>
            <div>
              <span>
                <Footprints size={16} />
                移動
              </span>
              <p>
                <b>✓</b> 立位・歩行見守り
              </p>
              <small>手すり使用</small>
            </div>
            <div>
              <span>
                <Pill size={16} />
                服薬
              </span>
              <p>
                <b>✓</b> 朝薬 服用確認
              </p>
              <small>飲み忘れなし</small>
            </div>
            <div>
              <span>
                <BedDouble size={16} />
                環境
              </span>
              <p>
                <b>✓</b> ベッド周辺整備
              </p>
              <small>ナースコール位置確認</small>
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.sheetReview}>
        <span>
          <ShieldCheck size={17} /> AIが会話から抽出した箇所を青色で表示
        </span>
        <span className={styles.reviewStatus}>
          <Check size={16} /> 職員が内容を確認して記録を確定
        </span>
      </div>
    </section>
  );
}

function ProfileScreen() {
  return (
    <section className={`${styles.panel} ${styles.contextGraphPanel}`}>
      <Image
        src="/showcase-context-graph.png"
        alt="山本さんの人・場所・時期・趣味・出来事・ケア上の注意を関連付けた文脈グラフ"
        width={1672}
        height={941}
        priority
        className={styles.contextGraphImage}
      />
    </section>
  );
}

function FamilyReportScreen() {
  return (
    <div className={styles.familyLayout}>
      <section className={`${styles.panel} ${styles.daySummary}`}>
        <div className={styles.panelTitle}>
          <span className={styles.iconBubbleCoral}>
            <Sparkles size={20} />
          </span>
          <div>
            <small>9月22日の会話と記録</small>
            <h2>家族に届ける内容</h2>
          </div>
        </div>
        <div className={styles.summaryItems}>
          <article>
            <span className={styles.summaryIconBlue}>
              <MessageCircleMore size={19} />
            </span>
            <div>
              <small>本人の言葉</small>
              <b>「昔は妻と三浦へ海釣りによく行った」</b>
              <p>アジがよく釣れた頃を懐かしそうに話された</p>
            </div>
          </article>
          <article>
            <span className={styles.summaryIconCoral}>
              <Heart size={19} />
            </span>
            <div>
              <small>今日の様子</small>
              <b>笑顔で10分ほど会話</b>
              <p>奥様との思い出を話す際、表情が明るくなった</p>
            </div>
          </article>
          <article>
            <span className={styles.summaryIconGold}>
              <Utensils size={19} />
            </span>
            <div>
              <small>生活の様子</small>
              <b>朝食を完食</b>
              <p>主食・副食ともに100%</p>
            </div>
          </article>
        </div>
        <div className={styles.privacyNote}>
          <ShieldCheck size={17} />
          ケア上の注意は家族向けの言葉に整えて記載
        </div>
      </section>
      <div className={styles.flowArrow} aria-hidden="true">
        <ArrowRight size={22} />
      </div>
      <section className={`${styles.panel} ${styles.letterCard}`}>
        <div className={styles.letterHeader}>
          <div>
            <span className={styles.familyBadge}>家族レポート案</span>
            <h2>山本さんの今日のご様子</h2>
          </div>
          <span>2026年9月22日</span>
        </div>
        <div className={styles.letterBody}>
          <p>ご家族様へ</p>
          <p>
            本日は朝食を完食されました。午前中は、奥様と三浦へ海釣りに出かけた頃のお話をしてくださいました。
          </p>
          <blockquote>「あの頃はアジがよく釣れたんですよ」</blockquote>
          <p>
            と、懐かしそうに笑っておられました。立ち上がりの際に右膝に少し痛みがあるとのお話があり、職員がそばで見守りました。今後も様子を確認してまいります。
          </p>
        </div>
        <div className={styles.letterFooter}>
          <span>
            <UserRound size={17} />
            担当：佐々木 美咲
          </span>
          <span className={styles.confirmed}>
            <Check size={16} /> 職員確認後に送信
          </span>
        </div>
      </section>
    </div>
  );
}

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!isSection(section)) notFound();

  return (
    <main className={styles.page}>
      <DemoHeader active={section} />
      <div className={styles.content}>
        <Intro section={section} />
        {section === "care-record" && <CareRecordScreen />}
        {section === "profile" && <ProfileScreen />}
        {section === "family-report" && <FamilyReportScreen />}
      </div>
      <footer className={styles.footer}>
        ※ 画面内の人物・記録はすべてデモ用の架空データです
      </footer>
    </main>
  );
}
