/** @jsxImportSource solid-js */
import { render } from 'solid-js/web';
import { For, createMemo, createSignal, onMount, createEffect } from 'solid-js';
import TagDetailView from './tag-editor';
import EventDetailView from './event-editor';
import EventHover from './event-hover';
import { processTags as computeProcessTags, Tag, processEvents, Event, cx } from './utils';
import '../../css/weeks.css';


function addDays(d: Date, days: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

function formatISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoWeekInfo(d: Date): { isoYear: number; isoWeek: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { isoYear: date.getUTCFullYear(), isoWeek: weekNo };
}

function isoWeekKey(d: Date): string {
  const { isoYear, isoWeek } = isoWeekInfo(d);
  const ww = isoWeek.toString().padStart(2, '0');
  return `${isoYear}-${ww}`;
}

// Deterministic color utilities for tags
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function colorForSeed(seed: number): { bg: string; border: string } {
  const hue = seed % 360;
  const bg = `hsla(${hue} 60% 86% / 0.45)`;
  const border = `hsla(${hue} 50% 50% / 0.7)`;
  return { bg, border };
}

function colorsForTag(t: { id: any; name: any }): { bg: string; border: string } {
  const key = (t.id != null ? String(t.id) : '') + '|' + (t.name != null ? String(t.name) : '');
  return colorForSeed(hashString(key));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const s = hex.replace('#', '');
  const bigint = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function mix(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}
function rgba(c: { r: number; g: number; b: number }, a: number) { return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`; }

function getColorForYear(labelYear: number, baseYear: number, totalYears: number): string {
  const span = Math.min(90, totalYears);
  const idx = Math.max(0, Math.min(span - 1, labelYear - baseYear));
  const block = span / 4;
  const q = Math.min(3, Math.floor(idx / block));
  const t = Math.min(1, Math.max(0, (idx - q * block) / Math.max(1, block - 1)));
  const spring = hexToRgb('#86efac');
  const summer = hexToRgb('#fbbf24');
  const autumn = hexToRgb('#ef4444');
  const winter = hexToRgb('#9ca3af');
  let start: { r: number; g: number; b: number };
  let endMix: { r: number; g: number; b: number };
  if (q === 0) { start = spring; endMix = mix(spring, summer, 0.5); }
  else if (q === 1) { start = summer; endMix = mix(summer, autumn, 0.5); }
  else if (q === 2) { start = autumn; endMix = mix(autumn, winter, 0.5); }
  else { start = winter; endMix = mix(winter, spring, 0.5); }
  const a1 = 0.10, a2 = 0.12;
  const c1 = rgba(start, a1);
  const c2 = rgba(mix(start, endMix, t), a2);
  return `linear-gradient(90deg, ${c1} 0%, ${c2} 100%)`;
}

function TagHover(props: { tag: any }) {
  const t = props.tag || {};
  const start = t.startdate ? new Date(t.startdate) : null;
  const end = t.enddate ? new Date(t.enddate) : null;
  const fmt = (d: any) => {
    if (!d) return '';
    const dd = d instanceof Date ? d : new Date(d);
    if (isNaN(dd.getTime())) return '';
    return dd.toISOString().slice(0, 10);
  };
  return (
    <div class="tag-hover">
      <div class="tag-hover-title">{t.name || ''}</div>
      <div class="tag-hover-dates">
        <span>{fmt(start)}</span>
        <span> – </span>
        <span>{fmt(end)}</span>
      </div>
      {t.place ? (
        <div class="tag-hover-place">{t.place}</div>
      ) : null}
      {t.description ? (
        <div class="tag-hover-desc">{t.description}</div>
      ) : null}
      {t.background ? (
        <div class="tag-hover-image">
          <img src={t.background} alt={t.name || 'tag image'} />
        </div>
      ) : null}
      {t.postsStatus ? (
        <div class="tag-hover-posts">
          {t.postsStatus === 'loading' ? (
            <div class="tag-hover-loading">Loading posts…</div>
          ) : t.postsStatus === 'error' ? (
            <div class="tag-hover-error">Failed to load posts.</div>
          ) : (t.posts && t.posts.length > 0 ? (
            <div class="tag-hover-posts">
              <div class="tag-hover-posts-title">Posts: {t.posts.length}</div>
              <ul>
                {t.posts.slice(0, 15).map((p: any) => (
                  <li>{p.title || `Post #${p.id}`}</li>
                ))}
              </ul>
              {t.posts.length > 15 ? (
                <div class="tag-hover-more">and {t.posts.length - 15} more…</div>
              ) : null}
            </div>
          ) : (
            <div class="tag-hover-none">No posts</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const startDate = new Date('1987-05-10');
  const years = 100; // number of 52-week rows (approx years)
  const baseYearLabel = 1987;

  const [ymap, setYMap] = createSignal<Record<number, Tag[]>>({});
  const [tagById, setTagById] = createSignal<Record<string | number, any>>({});
  const [tagsList, setTagsList] = createSignal<any[]>([]);
  const [tagBlogMap, setTagBlogMap] = createSignal<Record<number, { status: 'loading' | 'loaded' | 'error'; posts: any[] }>>({});
  const [yearTagsInSlots, setYearTagsInSlots] = createSignal<Record<number, Tag[][]>>({});
  const [hash, setHash] = createSignal<string>(typeof window !== 'undefined' ? window.location.hash : '');
  const [lastEditedTagId, setLastEditedTagId] = createSignal<number | null>(null);
  const currentTagId = createMemo<number | null>(() => {
    const h = hash() || '';
    const m = h.match(/^#tags\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  });
  const isNewTag = createMemo<boolean>(() => /^#tags\/new$/.test(hash() || ''));
  const currentEventId = createMemo<number | null>(() => {
    const h = hash() || '';
    const m = h.match(/^#events\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  });
  const isNewEvent = createMemo<boolean>(() => /^#events\/new$/.test(hash() || ''));
  const [selectedWeek, setSelectedWeek] = createSignal<Date | null>(null);
  const [newTagPrefill, setNewTagPrefill] = createSignal<{ startdate: string; enddate: string } | null>(null);
  const [eventsByWeek, setEventsByWeek] = createSignal<Record<string, Event[]>>({});
  const [eventById, setEventById] = createSignal<Record<number, Event>>({});
  const [eventsList, setEventsList] = createSignal<Event[]>([]);
  const [newEventPrefill, setNewEventPrefill] = createSignal<{ date: string } | null>(null);
  // Hover tooltip state (mouse-following)
  const [hoveredEvents, setHoveredEvents] = createSignal<Event[] | null>(null);
  const [tooltip, setTooltip] = createSignal<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [hoverWeekKey, setHoverWeekKey] = createSignal<string | null>(null);
  let hideTimer: number | null = null;

  const data = createMemo(() => {
    const arr: { labelYear: number; firstDate: Date; pad: number; weeks: { title: string; start: Date }[] }[] = [];
    for (let r = 0; r < years; r++) {
      const labelYear = baseYearLabel + r;
      const jan1 = new Date(labelYear, 0, 1);
      const weeks: { title: string; start: Date }[] = [];
      for (let w = 0; w < 52; w++) {
        const weekStart = addDays(jan1, w * 7);
        const month = weekStart.toLocaleString(undefined, { month: 'short' });
        const dateStr = weekStart.toISOString().slice(0, 10);
        weeks.push({ title: `${month} • W${w + 1} • ${dateStr}`, start: weekStart });
      }
      arr.push({ labelYear, firstDate: jan1, pad: 0, weeks });
    }
    return arr;
  });

  const decades = createMemo(() => {
    const rows = data();
    const groups: { label: string; years: { labelYear: number; firstDate: Date; pad: number; weeks: { title: string; start: Date }[] }[] }[] = [];
    for (let i = 0, block = 0; i < rows.length; i += 10, block++) {
      const slice = rows.slice(i, i + 10);
      if (slice.length === 0) continue;
      let label: string;
      if (block === 0) label = 'First 10 years';
      else if (block === 1) label = 'my teens';
      else label = `my ${block}0s`;
      groups.push({ label, years: slice });
    }
    return groups;
  });

  const weekNums = createMemo(() => Array.from({ length: 52 }, (_, i) => i + 1));

  // No global editing state; TagDetailView manages its own local state.


  async function ensureTagPosts(id: number) {
    if (id == null) return;
    const cache = tagBlogMap();
    if (cache[id]) return; // already loading or loaded
    setTagBlogMap({ ...cache, [id]: { status: 'loading', posts: [] } });
    // mark tag as loading for hover display
    setTagById((prev) => ({
      ...prev,
      [id]: { ...(prev as any)[id], posts: [], postsStatus: 'loading' }
    }));
    try {
      const res = await fetch(`/api/tag/posts/${id}`);
      if (!res.ok) throw new Error('Bad response');
      const posts = await res.json();
      setTagBlogMap((prev) => ({ ...prev, [id]: { status: 'loaded', posts } }));
      // also enrich tagById for hover rendering convenience
      setTagById((prev) => ({
        ...prev,
        [id]: { ...(prev as any)[id], posts, postsStatus: 'loaded' }
      }));
    } catch (e) {
      setTagBlogMap((prev) => ({ ...prev, [id]: { status: 'error', posts: [] } }));
      setTagById((prev) => ({
        ...prev,
        [id]: { ...(prev as any)[id], posts: [], postsStatus: 'error' }
      }));
    }
  }


  function recompute(tags: any[]) {
    const { yearMap, tagById: mapIdx, tagsList, yearSlotMap } = computeProcessTags(tags, {
      startDate,
      baseYearLabel,
      years,
    });
    setTagById(mapIdx);
    setTagsList(tagsList);
    setYMap(yearMap);
    setYearTagsInSlots(yearSlotMap);
    try { console.log('Years:', yearSlotMap); } catch {}
  }

  onMount(() => {
    window.addEventListener('hashchange', () => setHash(window.location.hash));
    fetch('/api/tags')
      .then((r) => r.json())
      .then((tags) => {
        recompute(tags);
      })
      .catch((e) => console.error(e));
    fetch('/api/events')
      .then((r) => r.json())
      .then((events) => {
        const proc = processEvents(events || []);
        console.log('events by week:', proc.eventsByWeek)
        setEventsByWeek(proc.eventsByWeek);
        setEventById(proc.eventById);
        setEventsList(proc.eventsList);
      })
      .catch((e) => console.error(e));
  });

  createEffect(() => {
    if (currentTagId() == null && !isNewTag()) {
      const id = lastEditedTagId();
      if (id != null) {
        setTimeout(() => {
          const el = document.querySelector('.tag-span.edited') as HTMLElement | null;
          if (el && typeof el.scrollIntoView === 'function') {
            try { el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); } catch { el.scrollIntoView(true); }
          }
        }, 0);
      }
    }
  });

  return (
    <>
      {currentTagId() != null || isNewTag() ? (
        (() => {
          if (isNewTag()) {
            const pre = newTagPrefill();
            return (
              <TagDetailView
                tag={{}}
                onSave={(saved) => {
                  setTagById((prev) => ({ ...prev, [saved.id]: saved }));
                  const merged = [...tagsList().filter((x) => x.id !== saved.id), saved];
                  recompute(merged);
                  setSelectedWeek(null);
                  setNewTagPrefill(null);
                  setLastEditedTagId(saved.id);
                  window.location.hash = '';
                }}
                onDelete={(id) => {
                  setTagById((prev: any) => { const { [id]: _omit, ...rest } = prev; return rest as any; });
                  const merged = tagsList().filter((x) => x.id !== id);
                  recompute(merged);
                  window.location.hash = '';
                }}
                prefill={pre || { startdate: '', enddate: '' }}
              />
            );
          }
          const id = currentTagId() as number;
          const tag = tagById()[id];
          return (
            <TagDetailView
              tag={tag}
              onSave={(saved) => {
                setTagById((prev) => ({ ...prev, [saved.id]: saved }));
                const merged = [...tagsList().filter((x) => x.id !== saved.id), saved];
                recompute(merged);
                setLastEditedTagId(saved.id);
                window.location.hash = '';
              }}
              onDelete={(id) => {
                setTagById((prev) => { const { [id]: _omit, ...rest } = prev; return rest as any; });
                const merged = tagsList().filter((x) => x.id !== id);
                recompute(merged);
                window.location.hash = '';
              }}
              onBack={(id?: number) => { if (id != null) setLastEditedTagId(id); }}
            />
          );
        })()
      ) : currentEventId() != null || isNewEvent() ? (
        (() => {
          if (isNewEvent()) {
            return (
              <EventDetailView
                event={null}
                onSave={(saved) => {
                  const merged = [...eventsList().filter((x) => x.id !== saved.id), saved];
                  const proc = processEvents(merged);
                  setEventsByWeek(proc.eventsByWeek);
                  setEventById(proc.eventById);
                  setEventsList(proc.eventsList);
                  setNewEventPrefill(null);
                  window.location.hash = '';
                }}
                onDelete={(id) => {
                  const merged = eventsList().filter((x) => x.id !== id);
                  const proc = processEvents(merged);
                  setEventsByWeek(proc.eventsByWeek);
                  setEventById(proc.eventById);
                  setEventsList(proc.eventsList);
                  setNewEventPrefill(null);
                  window.location.hash = '';
                }}
                prefill={newEventPrefill() || undefined}
              />
            );
          }
          const id = currentEventId() as number;
          const ev = eventById()[id];
          return (
            <EventDetailView
              event={ev}
              onSave={(saved) => {
                const merged = [...eventsList().filter((x) => x.id !== saved.id), saved];
                const proc = processEvents(merged);
                setEventsByWeek(proc.eventsByWeek);
                setEventById(proc.eventById);
                setEventsList(proc.eventsList);
                setNewEventPrefill(null);
                window.location.hash = '';
              }}
              onDelete={(id) => {
                const merged = eventsList().filter((x) => x.id !== id);
                const proc = processEvents(merged);
                setEventsByWeek(proc.eventsByWeek);
                setEventById(proc.eventById);
                setEventsList(proc.eventsList);
                setNewEventPrefill(null);
                window.location.hash = '';
              }}
            />
          );
        })()
      ) : (
        <div class="weeks-grid">
          <For each={decades()}>
            {(dec) => (
              <div class="decade-group" aria-label={dec.label}>
                <div class="decade-header">{dec.label}</div>
                <div class="weeks-header" aria-hidden="true">
                  <div class="year-head-spacer" />
                  <For each={weekNums()}>
                    {(n) => (
                      <div class="week-head" title={`Week ${n}`}>{n}</div>
                    )}
                  </For>
                </div>
                <For each={dec.years}>
                  {(row) => (
                    <>
                      <div class="year-row" aria-label={`Year ${row.labelYear} — starting ${formatISO(row.firstDate)}`}>
                        <div class="year-head">{row.labelYear}</div>
                        <For each={row.weeks}>
                          {(w) => {
                            const isSel = () => selectedWeek() && w.start && selectedWeek()!.getTime() === w.start.getTime();
                            const season = (() => {
                              const m = w.start.getMonth();
                              if (m === 11 || m === 0 || m === 1) return 'winter';
                              if (m >= 2 && m <= 4) return 'spring';
                              if (m >= 5 && m <= 7) return 'summer';
                              return 'autumn';
                            })();
                            const weekKey = isoWeekKey(w.start);
                            const hasEvents = () => (eventsByWeek()[weekKey] || []).length > 0;
                            const onClick = () => {
                              const prev = selectedWeek();
                              if (!prev) {
                                setSelectedWeek(new Date(w.start));
                              } else if (prev.getTime() === w.start.getTime()) {
                                setSelectedWeek(null);
                              } else {
                                const a = prev < w.start ? prev : w.start;
                                const b = prev < w.start ? w.start : prev;
                                setNewTagPrefill({ startdate: a.toISOString().slice(0, 10), enddate: b.toISOString().slice(0, 10) });
                                setSelectedWeek(null);
                                window.location.hash = '#tags/new';
                              }
                            };
                            const onDblClick = () => {
                              setNewEventPrefill({ date: w.start.toISOString().slice(0, 10) });
                              window.location.hash = '#events/new';
                            };
                            return (
                              <div
                                class={cx('week-box', `season-${season}`, { 
                                  selected: isSel(), 
                                  filled: hasEvents(), 
                                  'before-my-time': w.start.getTime() < new Date('1987-05-10').getTime(), 
                                  future: w.start.getTime() > new Date().getTime() 
                                })}
                                title={w.title}
                                onClick={onClick}
                                onDblClick={onDblClick}
                                onMouseEnter={(e) => {
                                  if (!hasEvents()) return;
                                  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
                                  // Guard against re-enter on the same week causing loops
                                  if (tooltip().visible && hoverWeekKey() === weekKey) {
                                    return;
                                  }
                                  setHoverWeekKey(weekKey);
                                  const evs = eventsByWeek()[weekKey] || [];
                                  if (hoveredEvents() !== evs) setHoveredEvents(evs);
                                  const nx = Math.min(e.clientX + 12, (window.innerWidth || 1024) - 260);
                                  const ny = Math.min(e.clientY + 12, (window.innerHeight || 768) - 200);
                                  if (!tooltip() || tooltip().visible === false || tooltip().x !== nx || tooltip().y !== ny) {
                                    setTooltip({ x: nx, y: ny, visible: true });
                                  }
                                }}
                                // onMouseMove={(e) => {
                                //   if (!hasEvents()) return;
                                //   const nx = Math.min(e.clientX + 12, (window.innerWidth || 1024) - 260);
                                //   const ny = Math.min(e.clientY + 12, (window.innerHeight || 768) - 200);
                                //   setTooltip((t) => ({ ...t, x: nx, y: ny, visible: true }));
                                // }}
                                onMouseLeave={() => {
                                  if (hideTimer) clearTimeout(hideTimer);
                                  hideTimer = window.setTimeout(() => {
                                    setTooltip((t) => ({ ...t, visible: false }));
                                    setHoveredEvents(null);
                                  }, 100);
                                }}
                              />
                            );
                          }}
                        </For>
                        <div class="year-edge" style={{ background: getColorForYear(row.labelYear, baseYearLabel, years) }} />
                      </div>
                      <div class="tag-bars">
                        <div class="year-head" />
                        <div class="tag-lines">
                          <For each={yearTagsInSlots()[row.labelYear] || []}>
                            {(lane) => (
                              <div class="tag-row">
                                <For each={lane}>
                                  {(t) => {
                                    const col = colorsForTag(t);
                                    const start = row.pad + t.startWeek;
                                    const end = row.pad + t.endWeek;
                                    const nav = () => { if (t.id != null) window.location.hash = `#tags/${t.id}`; };
                                    const yearStart = new Date(row.labelYear, 0, 1).getTime();
                                    const yearEnd = new Date(row.labelYear + 1, 0, 1).getTime();
                                    const sd = t.startdate ? new Date(t.startdate).getTime() : yearStart;
                                    const ed = t.enddate ? new Date(t.enddate).getTime() : sd;
                                    const segStart = Math.max(yearStart, sd);
                                    const segEnd = Math.min(yearEnd, ed);
                                    const denom = Math.max(1, yearEnd - yearStart);
                                    const leftPct = Math.max(0, ((segStart - yearStart) / denom) * 100);
                                    const widthPct = Math.max(0.5, ((Math.max(segEnd, segStart) - segStart) / denom) * 100);
                                    return (
                                      <div
                                        class={cx('tag-span', { edited: lastEditedTagId() === t.id })}
                                        style={`--x: ${start - 1}; --w: ${end - start + 1}; --left: ${leftPct}%; --width: ${widthPct}%; background:${col.bg}; border-color:${col.border}; cursor:pointer;`}
                                        title={`${t.name} (W${t.startWeek}–W${t.endWeek})`}
                                        onClick={nav}
                                        onMouseEnter={() => ensureTagPosts(t.id)}
                                      >
                                        <span class="tag-label">{t.place? t.place + ' - ' : ''} {t.name}</span>
                                        {(() => {
                                          const full = tagById()[t.id] || {};
                                          return <TagHover tag={full} />;
                                        })()}
                                      </div>
                                    );
                                  }}
                                </For>
                              </div>
                            )}
                          </For>
                        </div>
                        <div class="tag-edge" style={{ background: getColorForYear(row.labelYear, baseYearLabel, years) }} />
                      </div>
                    </>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      )}
      {(() => {
        const tip = tooltip();
        const evs = hoveredEvents();
        return tip.visible && evs && evs.length > 0 ? (
          <div
            class="week-event-tooltip"
            style={{ left: `${tip.x}px`, top: `${tip.y}px` }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            onMouseEnter={() => {
              if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
              setTooltip((t) => ({ ...t, visible: true }));
            }}
            onMouseLeave={() => {
              if (hideTimer) clearTimeout(hideTimer);
              hideTimer = window.setTimeout(() => {
                setTooltip((t) => ({ ...t, visible: false }));
                setHoveredEvents(null);
                setHoverWeekKey(null);
              }, 140);
            }}
          >
            <EventHover events={evs} />
          </div>
        ) : null;
      })()}
    </>
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('weeks');
  if (root) render(() => <App />, root);
});

