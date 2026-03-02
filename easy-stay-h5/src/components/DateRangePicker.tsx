import { useMemo, useState } from "react";
import { addDays, calcNights, ensureValidRange, formatDateInput } from "../utils/date";

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (next: { checkIn: string; checkOut: string }) => void;
}

interface MonthBlock {
  key: string;
  title: string;
  days: Array<Date | null>;
}

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function parseDate(input: string) {
  return new Date(`${input}T00:00:00`);
}

function toKey(date: Date) {
  return formatDateInput(date);
}

function getMonthBlocks(baseDate: Date, count: number): MonthBlock[] {
  const blocks: MonthBlock[] = [];

  for (let i = 0; i < count; i += 1) {
    const first = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
    const last = new Date(baseDate.getFullYear(), baseDate.getMonth() + i + 1, 0);
    const title = `${first.getFullYear()}年${first.getMonth() + 1}月`;
    const days: Array<Date | null> = [];

    for (let b = 0; b < first.getDay(); b += 1) days.push(null);
    for (let d = 1; d <= last.getDate(); d += 1) {
      days.push(new Date(first.getFullYear(), first.getMonth(), d));
    }

    blocks.push({
      key: `${first.getFullYear()}-${first.getMonth() + 1}`,
      title,
      days
    });
  }

  return blocks;
}

export function DateRangePicker({ checkIn, checkOut, onChange }: DateRangePickerProps) {
  const safe = ensureValidRange(checkIn, checkOut);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<"checkIn" | "checkOut">("checkIn");
  const [draft, setDraft] = useState(safe);
  const base = useMemo(() => parseDate(safe.checkIn), [safe.checkIn]);
  const monthBlocks = useMemo(() => getMonthBlocks(base, 3), [base]);
  const nights = calcNights(safe.checkIn, safe.checkOut);

  function openPanel() {
    setDraft(safe);
    setActive("checkIn");
    setOpen(true);
  }

  function selectDate(target: Date) {
    const targetKey = toKey(target);
    const checkInDate = parseDate(draft.checkIn);

    if (active === "checkIn") {
      const nextCheckOut = parseDate(draft.checkOut) <= target ? addDays(targetKey, 1) : draft.checkOut;
      setDraft({ checkIn: targetKey, checkOut: nextCheckOut });
      setActive("checkOut");
      return;
    }

    if (target <= checkInDate) {
      setDraft({ checkIn: draft.checkIn, checkOut: addDays(draft.checkIn, 1) });
      return;
    }

    setDraft({ ...draft, checkOut: targetKey });
  }

  function applyQuickNights(days: number) {
    setDraft((prev) => ({ ...prev, checkOut: addDays(prev.checkIn, days) }));
  }

  function confirm() {
    onChange(ensureValidRange(draft.checkIn, draft.checkOut));
    setOpen(false);
  }

  const draftIn = parseDate(draft.checkIn);
  const draftOut = parseDate(draft.checkOut);

  return (
    <>
      <button className="date-trigger" onClick={openPanel} type="button">
        <div>
          <strong>{safe.checkIn}</strong>
          <span>入住</span>
        </div>
        <div className="date-arrow">→</div>
        <div>
          <strong>{safe.checkOut}</strong>
          <span>离店</span>
        </div>
        <div className="date-nights">{nights} 晚</div>
      </button>

      {open ? (
        <div className="drawer-mask" onClick={() => setOpen(false)} role="presentation">
          <div className="drawer-panel date-panel" onClick={(event) => event.stopPropagation()} role="presentation">
            <div className="date-panel-head">
              <button
                className={`tab-btn ${active === "checkIn" ? "active" : ""}`}
                onClick={() => setActive("checkIn")}
                type="button"
              >
                入住 {draft.checkIn}
              </button>
              <button
                className={`tab-btn ${active === "checkOut" ? "active" : ""}`}
                onClick={() => setActive("checkOut")}
                type="button"
              >
                离店 {draft.checkOut}
              </button>
            </div>

            <div className="quick-nights">
              {[1, 2, 3].map((day) => (
                <button className="quick-btn" key={day} onClick={() => applyQuickNights(day)} type="button">
                  {day} 晚
                </button>
              ))}
            </div>

            <div className="calendar-wrap">
              {monthBlocks.map((month) => (
                <section className="calendar-month" key={month.key}>
                  <h4>{month.title}</h4>
                  <div className="calendar-week">
                    {WEEK_LABELS.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {month.days.map((date, idx) => {
                      if (!date) return <span className="calendar-day blank" key={`${month.key}-${idx}`} />;
                      const key = toKey(date);
                      const isStart = key === draft.checkIn;
                      const isEnd = key === draft.checkOut;
                      const inRange = date > draftIn && date < draftOut;
                      return (
                        <button
                          className={`calendar-day ${isStart || isEnd ? "selected" : ""} ${inRange ? "in-range" : ""}`}
                          key={key}
                          onClick={() => selectDate(date)}
                          type="button"
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="drawer-actions">
              <button className="btn-secondary" onClick={() => setOpen(false)} type="button">
                取消
              </button>
              <button className="btn-primary" onClick={confirm} type="button">
                确认日期
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
