const labels: Record<string, string> = {
  "Invalid origin.": "送信元を確認できません。画面を再読み込みしてください。",
  "Too many attempts. Try again in five minutes.":
    "試行回数の上限に達しました。5分後にお試しください。",
  "Invalid access code, or login is not configured.":
    "アクセスコードが正しくないか、ログイン設定が未完了です。",
  "Session secret is not configured.":
    "ログイン設定が未完了です。管理者に確認してください。",
  "Request too large.": "送信内容が大きすぎます。内容を短くしてください。",
  "Failed to fetch":
    "通信できませんでした。接続を確認してもう一度お試しください。",
  "You do not have permission to make changes.": "変更する権限がありません。",
  "Recording not found.": "録音が見つかりません。",
  "Resident not found.": "入居者が見つかりません。",
  "Caregiver not found.": "担当職員が見つかりません。",
  "This room already has a resident.":
    "この居室にはすでに入居者が登録されています。",
  "A finalized recording cannot be reassigned.":
    "確定済みの記録は別の入居者に変更できません。",
  "Select a resident before processing.":
    "処理を始める前に入居者を選択してください。",
  "This recording is not ready for review.":
    "まだ確認できません。録音の整理を完了してください。",
  "Review items do not match.":
    "確認項目が更新されています。画面を再読み込みしてください。",
  "Review item not found.": "確認する項目が見つかりません。",
  "Select a resident first.": "入居者を選択してください。",
  "Information not found.": "情報が見つかりません。",
  Overview: "確認待ち",
  Recordings: "録音一覧",
  "Care records": "介護記録",
  Handoffs: "申し送り",
  Residents: "入居者",
  Staff: "職員",
  Settings: "設定",
  "Recording review": "録音の確認",
  "Not found": "見つかりません",
  MimoBadge: "こころん",
  "No approved information for this resident.":
    "家族レポートに使える確認済み情報がまだありません。",
  "Family report not found.": "家族レポートが見つかりません。",
  "Created family report": "家族レポートを作成しました",
  "Updated family report": "家族レポートを更新しました",
  "Sakura Care Home": "さくらケアホーム",
  "Facility workspace": "介護記録",
  "Find a resident or staff member": "入居者・職員を検索",
  "Find a person…": "名前・部屋番号で検索",
  RESIDENTS: "入居者",
  "CARE TEAM": "担当職員",
  "Settings & access": "設定・利用情報",
  "Caregiver · Day shift": "介護職員 · 日勤",
  DEMO: "デモ",
  "Show sidebar": "一覧を開く",
  "Hide sidebar": "一覧を閉じる",
  Workspace: "介護記録",
  "Sample facility": "デモ施設",
  "Dismiss message": "通知を閉じる",
  "Try again": "再読み込み",
  "Opening your care workspace…": "記録を読み込んでいます…",
  "Simulate a dock transfer": "デモ録音を追加",
  "Associate with a resident": "会話した入居者",
  "Associate later": "あとで選ぶ",
  Cancel: "キャンセル",
  "Transferring…": "追加中…",
  "Simulate transfer": "録音を追加",
  "Recording received from demo dock": "デモ録音を追加しました",
  "A sample badge recording will arrive in the review queue. No microphone or physical badge is needed.":
    "サンプルの会話を追加して、記録の確認から確定までを試せます。実際の録音は行いません。",
  "Speaker separation does not identify a resident. Confirm this association before reviewing.":
    "会話した入居者を選んでください。声の区別だけでは本人を特定できません。",
  "New recording": "未処理",
  Processing: "整理中",
  "Needs review": "要確認",
  Approved: "確定済み",
  "Pending review": "確認待ち",
  Edited: "編集済み",
  Excluded: "除外",
  Failed: "処理失敗",
  "Close dialog": "閉じる",
  "Unassigned interaction": "入居者未選択",
  "Prepare recording": "録音を準備",
  "Separate speakers": "話者を区別",
  "Create transcript": "文字起こし",
  "Organize useful information": "情報を整理",
  "Prepare care record": "下書きを作成",
  "Review approved. Resident workspace updated.":
    "記録を確定し、入居者の情報に反映しました。",
  "Review draft saved": "下書きを保存しました",
  "All recordings": "すべての録音",
  "Associate this interaction": "会話した入居者を選択",
  "This review is complete": "記録を確定しました",
  "Approved information is available to the care team. The raw conversation has been removed.":
    "確定した情報を職員間で共有できます。会話の全文は削除しました。",
  "Open resident workspace": "入居者の記録を開く",
  "Final care record": "確定した介護記録",
  "No care record was retained from this review.":
    "この録音から保存された介護記録はありません。",
  "Information remembered": "反映した情報",
  "TODAY’S CARE": "今日の介護記録",
  "RESIDENT PROFILE": "プロフィール",
  "RESIDENT ASSOCIATION": "会話した入居者",
  "Choose a resident": "入居者を選択",
  "Choose resident": "入居者を選択",
  "Manually confirmed · speaker labels alone do not identify a resident.":
    "入居者を確認してください。話者の区別は本人確認ではありません。",
  "Associate interaction with resident": "会話した入居者を選択",
  "Resident association confirmed": "入居者を設定しました",
  "Confirm resident": "この入居者に設定",
  "Continue processing this conversation": "中断した処理を再開できます",
  "The recording is ready to process": "録音が届いています",
  "Separate the conversation, organize useful details, and prepare a record for your review.":
    "会話から必要な情報を整理して、介護記録の下書きを作成します。",
  "Processing…": "整理しています…",
  "Resume demo processing": "処理を再開",
  "Process demo recording": "下書きを作成",
  "Simulated processing · sample transcript · no external AI service":
    "デモ用の会話を使います。実際の音声解析は行いません。",
  "Source conversation": "元の会話",
  Badge: "バッジ",
  "· simulated recording": "· デモ録音",
  Caregiver: "介護職員",
  Resident: "入居者",
  "The transcript has expired. Verify the available source excerpts before approval.":
    "会話全文の保存期間が終了しました。残っている出典を確認してから確定してください。",
  "Raw transcript is removed after approval or after 7 days.":
    "会話全文は記録の確定後、または7日後に削除します。",
  "What’s worth remembering": "記録に残す内容",
  "Review every item": "内容ごとに確認",
  "Today’s care": "今日の介護記録",
  "Resident profile": "プロフィール",
  "Not retained": "記録しない会話",
  items: "件",
  Restore: "記録に戻す",
  Exclude: "記録から除外",
  "Source excerpt": "根拠となる発言",
  "Source excerpt expired.": "発言の保存期間が終了しました。",
  "Edited by you · review before approving":
    "編集した内容です。確定前に確認してください。",
  "From previous interactions": "過去の記録から",
  "Existing approved information for comparison. Approving a profile item updates its category and preserves the previous value in history.":
    "すでに確認された情報です。プロフィールを更新しても、以前の内容は履歴に残ります。",
  "Draft care record": "介護記録の下書き",
  Regenerate: "選択内容から作り直す",
  "Check that the wording matches the information you chose to keep.":
    "残す内容と文章が一致しているか確認してください。",
  "You make the final decision.": "確認した内容だけを記録に残します。",
  "Save draft": "下書きを保存",
  "Approve review": "内容を確認して確定",
  "Approve this care review?": "この内容で記録を確定しますか？",
  "No daily care record selected.": "今日の介護記録は選択されていません。",
  "Excluded items will be discarded. The raw transcript will be removed.":
    "除外した内容は保存しません。会話の全文は削除されます。",
  "Keep reviewing": "確認に戻る",
  "Approving…": "確定中…",
  "Approve & update resident": "確定して入居者情報に反映",
  "Information removed from resident workspace": "入居者の情報を削除しました",
  "Resident information updated": "入居者の情報を更新しました",
  "Remove this information?": "この情報を削除しますか？",
  "This removes the item from the current workspace and future handoffs. Existing finalized records and saved handoffs remain historical snapshots.":
    "現在のプロフィールと今後の申し送りから削除します。過去に確定した記録・保存済みの申し送りは変更されません。",
  "Current value": "現在の内容",
  "Where this came from": "情報の出典",
  "Care interaction ·": "介護中の会話 ·",
  "Last reviewed": "最終確認",
  "Reviewed by": "確認した職員",
  "Previous values": "変更履歴",
  "Source interaction": "元の会話を開く",
  Remove: "削除",
  "Saving…": "保存中…",
  "Remove information": "情報を削除",
  "Save changes": "変更を保存",
  "From the dock to a reviewed care record.":
    "録音を選んで内容を確認し、介護記録を確定します。",
  "Simulate dock transfer": "デモ録音を追加",
  "Needs attention": "未確認",
  "Review queue": "確認待ちの録音",
  "Recording history": "録音履歴",
  "Demo badge · simulated audio": "デモ用の録音データ",
  "No recordings in this view.": "該当する録音はありません。",
  "A workspace for each person in your care.":
    "名前を選ぶと、その方の記録とプロフィールを開けます。",
  "Search name or room": "名前・部屋番号で検索",
  Room: "居室",
  "Finalized records, reviewed and approved by the care team.":
    "職員が内容を確認し、確定した記録です。",
  "Filter care records by resident": "入居者で絞り込む",
  "All residents": "すべての入居者",
  "Approved records are historical snapshots.":
    "確定時点の内容を保存しています。",
  "Approved by": "確認した職員：",
  "View source": "元の記録を見る",
  "A thoughtful handoff": "申し送り",
  "What the next caregiver needs, from information already reviewed.":
    "確定した記録とプロフィールを次の担当者へ共有します。",
  "Handoff snapshot saved": "申し送りを保存しました",
  "Generating…": "作成中…",
  "Generate handoff": "申し送りを作成・保存",
  "Current shift": "今日の内容",
  "Saved handoffs": "保存済み",
  Today: "今日の記録",
  "Useful context": "対応の参考",
  Download: "テキストを保存",
  "No saved handoffs yet. Generate one from the current shift.":
    "保存済みの申し送りはありません。「申し送りを作成・保存」から作成できます。",
  "Care team": "担当職員",
  "People and badge assignments for this facility.":
    "担当する入居者とバッジを確認できます。",
  Shift: "勤務時間",
  "Assigned badge": "使用バッジ",
  "The boundaries of this facility prototype.":
    "データの保存方法と操作履歴を確認できます。",
  Facility: "施設",
  "Current role": "権限",
  "Caregiver · can review and approve": "介護職員（確認・確定が可能）",
  "Data storage": "データの保存先",
  "Local demo file": "この端末のデモファイル",
  "Audio processing": "音声の処理",
  "Simulated providers · no real audio analysis":
    "デモ処理（実際の音声解析は未接続）",
  "Transcript retention": "会話全文の保存期間",
  "Removed on approval or after 7 days": "記録確定後、または7日後に削除",
  "Resident memory": "入居者情報の保存",
  "Approved items and source excerpts only": "確認済みの内容と出典の抜粋のみ",
  "This prototype contains fictional residents. Real deployment needs individual sign-in, operational retention jobs, and a production audio provider.":
    "すべて架空のデータです。実運用には個人別ログイン、定期削除、音声解析サービスの接続が必要です。",
  "Recent activity": "操作履歴",
  "Audit log": "操作記録",
  "Added resident": "入居者を追加",
  "Imported SD card recording": "録音ファイルを取り込み",
  "Imported recording file": "録音ファイルを取り込み",
  "Review or edit information to see activity here.":
    "確認・編集の操作を行うと、履歴が表示されます。",
  "Sign out": "ログアウト",
  "Sign in to the facility prototype.": "施設のデモ環境にログインします。",
  "Facility access code": "施設のアクセスコード",
  "Signing in…": "ログイン中…",
  "Sign in": "ログイン",
  "Fictional demo data. Access is managed by your prototype administrator.":
    "架空のデモデータを使用しています。アクセスコードは管理者に確認してください。",
  "Please sign in.": "ログインしてください。",
  "Could not save changes. Please try again.":
    "変更を保存できませんでした。もう一度お試しください。",
  "Invalid request origin.":
    "送信元を確認できません。画面を再読み込みしてください。",
  "Storage unavailable. Check the database configuration and migration.":
    "データを読み込めません。データベースの設定を確認してください。",
  "Check the submitted fields.": "入力内容を確認してください。",
  "This review changed in another window. Reload before saving.":
    "別の画面で更新されています。再読み込みしてから保存してください。",
  "This item changed. Reload before editing.":
    "この情報は更新されています。再読み込みしてから編集してください。",
  "The care record cannot be empty.": "介護記録の本文を入力してください。",
  "Clear the draft when all care information is rejected.":
    "介護情報をすべて除外した場合は、下書きも空にしてください。",
  Sleep: "睡眠",
  Meals: "食事",
  Hydration: "水分",
  Elimination: "排泄",
  Vitals: "バイタル",
  Mood: "表情・気分",
  Assistance: "介助",
  Medication: "服薬",
  "Pain or discomfort": "痛み・不快感",
  "Avoid or NG": "避ける対応",
  "Former occupation": "以前の仕事",
  Interests: "好きなこと",
  Family: "ご家族",
  "Life history": "生活歴",
  Preferences: "好み",
  Personality: "人柄",
  "Care preferences": "ケアの希望",
  Communication: "会話の好み",
  Routine: "生活習慣",
  Activity: "活動",
  Engagement: "交流",
  Observation: "様子",
  "Small talk": "雑談",
  "Shift lead": "日勤リーダー",
  "Hanako Tanaka": "たなか はなこ",
  "Ichiro Suzuki": "すずき いちろう",
  "Kyoko Sato": "さとう きょうこ",
  "Masao Yamamoto": "やまもと まさお",
  "Sachiko Kobayashi": "こばやし さちこ",
  "Weather conversation — no care information retained.":
    "天気の雑談のため、介護情報には残しません。",
  "Rejected information removed": "除外した情報は削除済み",
  "Simulated dock transfer": "デモ録音を追加",
  "Associated interaction with resident": "入居者を設定",
  "Demo processing completed": "録音の整理を完了",
  "Approved review and finalized selected information":
    "内容を確認して記録を確定",
  "Saved review draft": "下書きを保存",
  "Deleted resident information": "入居者情報を削除",
  "Edited resident information": "入居者情報を編集",
  "Generated handoff from approved information": "申し送りを作成",
  person: "人",
  place: "場所",
  event: "出来事",
  time: "時期",
};
export function ja(value: string): string {
  if (labels[value]) return labels[value];
  const split = value.indexOf(": ");
  if (split > 0 && labels[value.slice(0, split)])
    return labels[value.slice(0, split)] + "：" + value.slice(split + 2);
  return value;
}

export function jaHandoff(value: string): string {
  return value
    .replace(/ · Room (\d+)/g, " · $1号室")
    .replace(/^Today$/gm, "今日の記録")
    .replace(/^Useful context$/gm, "対応の参考")
    .replace(
      /No approved care information today\./g,
      "今日の確定した記録はありません。",
    );
}
