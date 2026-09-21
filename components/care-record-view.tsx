import { careRecordFieldLabels } from "@/domain/care-record";
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
  const sections = [
    ["focus", record.focus.map(ja)],
    ["subjective", record.subjective],
    ["objective", record.objective],
    ["assessment", record.assessment],
    ["intervention", record.intervention],
    ["plan", record.plan],
  ] as const;
  return (
    <div className="structured-care-record" lang="ja">
      {record.measurements.length > 0 && (
        <div className="care-measurements" aria-label="数値記録">
          {record.measurements.map((measurement, index) => (
            <div key={`${measurement.kind}-${index}`}>
              <span>{measurement.label}</span>
              <strong>{measurement.value}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="fsoaip-grid">
        {sections.map(([field, values]) =>
          values.length ? (
            <section key={field} className={`fsoaip-field ${field}`}>
              <h4>{careRecordFieldLabels[field]}</h4>
              {values.map((value, index) => (
                <p key={`${value}-${index}`}>{value}</p>
              ))}
            </section>
          ) : null,
        )}
      </div>
    </div>
  );
}
