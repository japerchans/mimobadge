import { ja } from "@/lib/ja";
import type { StructuredCareRecord } from "@/types";

export function CareRecordView({
  record,
  empty,
}: {
  record?: StructuredCareRecord;
  empty?: string;
}) {
  if (!record)
    return empty ? <p className="care-record-fallback">{empty}</p> : null;
  const measurement = (kind: string) =>
    record.measurements.find((item) => item.kind === kind)?.value;
  const emptyValue = "会話内に記録なし";
  const vitalSigns = [
    ["体温", measurement("temperature")],
    ["血圧", measurement("blood-pressure")],
    ["脈拍", measurement("pulse")],
    ["SpO₂", measurement("spo2")],
  ];
  const dailyLife = [
    ["食事", measurement("meal")],
    ["水分", measurement("fluid")],
    ["排泄", measurement("elimination")],
  ];
  const observationGroups = [
    ["本人の訴え・言葉", record.subjective],
    ["観察した状態", record.objective],
    ["職員の判断", record.assessment],
  ] as const;
  const categoryLabels = [...new Set(record.focus.map(ja))];
  return (
    <div className="care-record-document" lang="ja">
      {categoryLabels.length > 0 && (
        <div className="care-record-topline">
          <span>記録項目</span>
          <div>
            {categoryLabels.map((label) => (
              <b key={label}>{label}</b>
            ))}
          </div>
        </div>
      )}

      <section className="care-form-section">
        <h4>バイタル</h4>
        <div className="care-vitals" aria-label="バイタル記録">
          {vitalSigns.map(([label, value]) => (
            <div className={value ? "recorded" : "empty"} key={label}>
              <span>{label}</span>
              <strong>{value || emptyValue}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="care-form-section">
        <h4>食事・水分・排泄</h4>
        <div className="care-daily-life">
          {dailyLife.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong className={value ? "" : "empty-value"}>
                {value || emptyValue}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="care-form-section">
        <h4>状態・観察</h4>
        <div className="care-observations">
          {observationGroups.map(([label, values]) => (
            <div key={label}>
              <span>{label}</span>
              {values.length ? (
                values.map((value, index) => (
                  <p key={`${value}-${index}`}>{value}</p>
                ))
              ) : (
                <p className="empty-value">{emptyValue}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="care-action-grid">
        <section className="care-form-section">
          <h4>実施したケア</h4>
          {record.intervention.length ? (
            record.intervention.map((value, index) => (
              <p key={`${value}-${index}`}>{value}</p>
            ))
          ) : (
            <p className="empty-value">{emptyValue}</p>
          )}
        </section>
        <section className="care-form-section">
          <h4>次の対応・申し送り</h4>
          {record.plan.length ? (
            record.plan.map((value, index) => (
              <p key={`${value}-${index}`}>{value}</p>
            ))
          ) : (
            <p className="empty-value">{emptyValue}</p>
          )}
        </section>
      </div>
    </div>
  );
}
