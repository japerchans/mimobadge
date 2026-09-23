import { ja } from "@/lib/ja";
import type {
  CareMeasurement,
  CareRecordField,
  StructuredCareRecord,
} from "@/types";

const measurementFields: {
  kind: CareMeasurement["kind"];
  label: string;
  placeholder: string;
}[] = [
  { kind: "temperature", label: "体温", placeholder: "例：36.5 ℃" },
  { kind: "blood-pressure", label: "血圧", placeholder: "例：128/72 mmHg" },
  { kind: "pulse", label: "脈拍", placeholder: "例：68 回/分" },
  { kind: "spo2", label: "SpO₂", placeholder: "例：97 %" },
  { kind: "meal", label: "食事", placeholder: "例：朝食 100 %" },
  { kind: "fluid", label: "水分", placeholder: "例：200 mL" },
  { kind: "elimination", label: "排泄", placeholder: "例：排尿あり" },
];

const lines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export function CareRecordEditor({
  record,
  onChange,
  disabled,
}: {
  record: StructuredCareRecord;
  onChange: (record: StructuredCareRecord) => void;
  disabled?: boolean;
}) {
  const measurementValue = (kind: CareMeasurement["kind"]) =>
    record.measurements.find((item) => item.kind === kind)?.value || "";
  const updateMeasurement = (
    kind: CareMeasurement["kind"],
    label: string,
    value: string,
  ) => {
    const measurements = record.measurements.filter(
      (item) => item.kind !== kind,
    );
    if (value.trim()) measurements.push({ kind, label, value: value.trim() });
    onChange({ ...record, measurements, entries: undefined });
  };
  const updateText = (field: CareRecordField, value: string) =>
    onChange({ ...record, [field]: lines(value), entries: undefined });

  return (
    <div className="care-record-document care-record-editor" lang="ja">
      <section className="care-form-section">
        <div className="care-form-heading">
          <h4>バイタル</h4>
          <span>会話にない項目は空欄のままで構いません</span>
        </div>
        <div className="care-vitals care-vitals-editable">
          {measurementFields.slice(0, 4).map((field) => (
            <label key={field.kind}>
              <span>{field.label}</span>
              <input
                value={measurementValue(field.kind)}
                placeholder={field.placeholder}
                disabled={disabled}
                onChange={(event) =>
                  updateMeasurement(field.kind, field.label, event.target.value)
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section className="care-form-section">
        <h4>食事・水分・排泄</h4>
        <div className="care-daily-life care-daily-life-editable">
          {measurementFields.slice(4).map((field) => (
            <label key={field.kind}>
              <span>{field.label}</span>
              <input
                value={measurementValue(field.kind)}
                placeholder={field.placeholder}
                disabled={disabled}
                onChange={(event) =>
                  updateMeasurement(field.kind, field.label, event.target.value)
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section className="care-form-section">
        <h4>状態・観察</h4>
        <div className="care-observations care-observations-editable">
          {(
            [
              ["subjective", "本人の訴え・言葉"],
              ["objective", "観察した状態"],
              ["assessment", "職員の判断"],
            ] as const
          ).map(([field, label]) => (
            <label key={field}>
              <span>{label}</span>
              <textarea
                rows={2}
                value={record[field].join("\n")}
                placeholder="会話に記録がある場合に入力"
                disabled={disabled}
                onChange={(event) => updateText(field, event.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <div className="care-action-grid care-action-editable">
        <section className="care-form-section">
          <label>
            <h4>実施したケア</h4>
            <textarea
              rows={3}
              value={record.intervention.join("\n")}
              placeholder="実際に行った介助・声かけ"
              disabled={disabled}
              onChange={(event) =>
                updateText("intervention", event.target.value)
              }
            />
          </label>
        </section>
        <section className="care-form-section">
          <label>
            <h4>次の対応・申し送り</h4>
            <textarea
              rows={3}
              value={record.plan.join("\n")}
              placeholder="継続して確認すること"
              disabled={disabled}
              onChange={(event) => updateText("plan", event.target.value)}
            />
          </label>
        </section>
      </div>
    </div>
  );
}

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
