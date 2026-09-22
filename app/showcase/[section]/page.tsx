import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookHeart,
  Check,
  ClipboardCheck,
  Fish,
  Heart,
  MapPin,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
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
    <div className={styles.twoColumn}>
      <section className={`${styles.panel} ${styles.transcriptPanel}`}>
        <div className={styles.panelTitle}>
          <span className={styles.iconBubbleBlue}>
            <MessageCircleMore size={20} />
          </span>
          <div>
            <small>今日 9:10の会話</small>
            <h2>会話から必要な情報を抽出</h2>
          </div>
        </div>
        <div className={styles.chatList}>
          <div className={styles.staffMessage}>
            <b>佐々木</b>
            <p>朝ごはんはいかがでしたか？</p>
          </div>
          <div className={styles.residentMessage}>
            <b>山本さん</b>
            <p>全部食べました。立つ時に右の膝が少し痛みます。</p>
          </div>
          <div className={styles.staffMessage}>
            <b>佐々木</b>
            <p>右側で見守りますね。手すりを使ってゆっくり立ちましょう。</p>
          </div>
        </div>
        <div className={styles.extractRow}>
          <span>
            <Utensils size={16} /> 朝食 100%
          </span>
          <span>
            <ShieldCheck size={16} /> 右膝痛
          </span>
          <span>
            <UserRound size={16} /> 見守り
          </span>
        </div>
      </section>

      <div className={styles.flowArrow} aria-hidden="true">
        <Sparkles size={18} />
        <ArrowRight size={22} />
      </div>

      <section className={`${styles.panel} ${styles.recordPanel}`}>
        <div className={styles.recordHeading}>
          <div>
            <span className={styles.draftBadge}>AI下書き</span>
            <h2>介護記録</h2>
          </div>
          <span className={styles.timestamp}>9月22日 09:18</span>
        </div>
        <dl className={styles.recordGrid}>
          <div>
            <dt>食事</dt>
            <dd>
              <strong>朝食 100%</strong>
              <small>主食・副食ともに完食</small>
            </dd>
          </div>
          <div>
            <dt>本人の言葉</dt>
            <dd>「立つ時に右の膝が少し痛む」</dd>
          </div>
          <div>
            <dt>行ったケア</dt>
            <dd>
              右側から見守り、手すりを案内。ゆっくり立ち上がるよう声かけ。
            </dd>
          </div>
          <div>
            <dt>次回の確認</dt>
            <dd>立ち上がり時の右膝の痛みと歩行状態を確認する。</dd>
          </div>
        </dl>
        <div className={styles.reviewBar}>
          <ClipboardCheck size={19} />
          <span>
            <b>職員が確認して確定</b>
            <small>内容は送信前に修正できます</small>
          </span>
          <Check size={18} />
        </div>
      </section>
    </div>
  );
}

function ProfileScreen() {
  const nodes = [
    {
      className: styles.nodeHobby,
      icon: <Fish size={20} />,
      label: "趣味",
      value: "海釣り",
      note: "若い頃から30年以上",
    },
    {
      className: styles.nodePerson,
      icon: <Heart size={20} />,
      label: "大切な人",
      value: "妻・洋子さん",
      note: "一緒に釣りへ出かけた",
    },
    {
      className: styles.nodePlace,
      icon: <MapPin size={20} />,
      label: "思い出の場所",
      value: "三浦の海",
      note: "アジ釣りの思い出",
    },
    {
      className: styles.nodeCare,
      icon: <ShieldCheck size={20} />,
      label: "ケア上の注意",
      value: "立ち上がり時は右膝に注意",
      note: "2026/9/22 更新",
    },
  ];
  return (
    <div className={styles.profileLayout}>
      <section className={`${styles.panel} ${styles.profileCard}`}>
        <Image
          src="/avatars/yamamoto.png"
          alt="山本正一さん"
          width={92}
          height={92}
        />
        <span className={styles.liveBadge}>会話から更新中</span>
        <h2>山本 正一さん</h2>
        <p>
          穏やかで、人に昔の話をすることが好き。海や釣りの話題では特に表情が明るくなる。
        </p>
        <div className={styles.profileMeta}>
          <span>82歳</span>
          <span>203号室</span>
          <span>要介護2</span>
        </div>
        <div className={styles.sourceNote}>
          <MessageCircleMore size={17} />
          <span>
            <b>今日の会話から2件追加</b>
            <small>元の発言と日時をいつでも確認できます</small>
          </span>
        </div>
      </section>
      <section className={`${styles.panel} ${styles.memoryMap}`}>
        <div className={styles.mapTitle}>
          <div>
            <small>施設で共有する理解</small>
            <h2>山本さんの生活歴プロフィール</h2>
          </div>
          <BookHeart size={24} />
        </div>
        <div className={styles.graph}>
          <div className={styles.centerNode}>
            <Image src="/avatars/yamamoto.png" alt="" width={54} height={54} />
            <b>山本さん</b>
            <small>その人らしさ</small>
          </div>
          {nodes.map((node) => (
            <article
              className={`${styles.memoryNode} ${node.className}`}
              key={node.label}
            >
              {node.icon}
              <span>
                <small>{node.label}</small>
                <b>{node.value}</b>
                <em>{node.note}</em>
              </span>
            </article>
          ))}
        </div>
        <p className={styles.mapFootnote}>
          <Sparkles size={16} />{" "}
          会話を重ねるたびに、職員みんなの「山本さんへの理解」が深まります
        </p>
      </section>
    </div>
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
