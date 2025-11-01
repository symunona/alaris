/** Utils for weeks view */

function addDays(d: Date, days: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

// Class aggregator similar to popular libraries. Usage: cx('a', { b: cond }, ['c', { d: cond2 }])
export function cx(...args: any[]): string {
  const out: string[] = [];
  const add = (v: any) => {
    if (!v) return;
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(add);
    else if (typeof v === 'object') {
      for (const k in v) if (Object.prototype.hasOwnProperty.call(v, k) && v[k]) out.push(k);
    }
  };
  args.forEach(add);
  return out.join(' ');
}

function startOfISOWeek(d: Date): Date {
  const nd = new Date(d);
  const day = nd.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  nd.setDate(nd.getDate() + diff);
  nd.setHours(0, 0, 0, 0);
  return nd;
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

export type Tag = {
  id: any;
  name: any;
  startdate: string;
  enddate: string;
  startWeek: number;
  endWeek: number;
  place?: string;
  length?: number;
}
export type YearMap = Record<number, Tag[]>;
export type TagMap = Record<string | number, any>;
export type YearSlotMap = Record<number, Tag[][]>;

function getYearSlotMap(yearMap: YearMap): YearSlotMap {
  const yearSlotMap: YearSlotMap = {};
  for (const y of Object.keys(yearMap)) {
    const year = parseInt(y, 10);

    const yearTags = yearMap[year].sort((a, b) => (b.length || 0) - (a.length || 0));

    const slots: Tag[][] = [];

    for(const tag of yearTags) {
     // Find first slot, which has tags that are not overlapping with my current tag.
     let slotIndex = 0;
     while(slotIndex < slots.length) {
       const slot = slots[slotIndex];
       let overlap = false;
       for(const otherTag of slot) {
         if(tag.startWeek < otherTag.endWeek && tag.endWeek > otherTag.startWeek) {
           overlap = true;
           break;
         }
       }
       if(!overlap) break;
       slotIndex++;
     }

     if(slotIndex === slots.length) {
       slots.push([]);
     }
     slots[slotIndex].push(tag);
    }

    for(const slot of slots) {
      slot.sort((a, b) => a.startWeek - b.startWeek);
    }

    yearSlotMap[year] = slots;
  }
  // Sort each year by fill
  // for(const year of Object.keys(yearSlotMap)) {
  //   for (let i = 0; i < yearSlotMap[year].length; i++) {
  //     const slot = yearSlotMap[year][i];
  //     const fill = slot.reduce((acc, tag) => acc + tag.length, 0);
  //     yearSlotMap[year][i].fill = fill;
  //   }
  //   yearSlotMap[year].sort((a, b) => b.fill - a.fill);
  //   yearSlotMap[year] = yearSlotMap[year].map((slot) => slot.tags);
  // }
  // console.log(yearSlotMap);

  return yearSlotMap;
}

export function processTags(
  tags: Tag[],
  cfg: { startDate: Date; baseYearLabel: number; years: number }
): { yearMap: YearMap; tagById: Record<string | number, any>; tagsList: any[], yearSlotMap: YearSlotMap } {
  const { startDate, baseYearLabel, years } = cfg;

  // index raw tags by id for detail view
  const idx: Record<string | number, any> = {};
  for (const t of tags) if (t && t.id != null) idx[t.id] = t;

  const maps = tags.map((tag: Tag) => {
    const start = tag.startdate ? new Date(tag.startdate) : null;
    const end = tag.enddate ? new Date(tag.enddate) : null;
    const weekMap: Record<string, true> = {};
    if (start) {
      let cur = startOfISOWeek(start);
      const last = end ? end : start;
      while (cur <= last) {
        weekMap[isoWeekKey(cur)] = true;
        cur = addDays(cur, 7);
      }
    }
    return { id: tag.id ?? null, name: tag.name ?? null, start, end, weekMap, startdate: tag.startdate, enddate: tag.enddate, place: tag.place };
  });

  const rows: { labelYear: number; firstDate: Date; pad: number }[] = [];
  for (let r = 0; r < years; r++) {
    const labelYear = baseYearLabel + r;
    const rowStart = new Date(labelYear, 0, 1);
    rows.push({ labelYear, firstDate: rowStart, pad: 0 });
  }
  const rowsByYear: Record<number, { labelYear: number; firstDate: Date; pad: number }> = Object.create(null);
  for (const r of rows) rowsByYear[r.labelYear] = r;

  function weeksInRow(y: number): number { return 52; }

  function weekIndexFor(d: Date, y: number): number {
    const r = rowsByYear[y];
    if (!r) return 1;
    const diffDays = Math.floor((+d - +r.firstDate) / (1000 * 60 * 60 * 24));
    const idx = Math.floor(diffDays / 7) + 1;
    const maxW = 52;
    return Math.max(1, Math.min(maxW, idx));
  }

  const yearMap: YearMap = {};
  for (const t of maps) {
    const hasStart = t.start instanceof Date && !isNaN((t.start as Date).getTime());
    const hasEnd = t.end instanceof Date && !isNaN((t.end as Date).getTime());

    if (hasStart && t.start) {
      const s: Date = t.start as Date;
      const y = s.getFullYear();
      const startWeek = weekIndexFor(s, y);
      const endWeek = hasEnd && t.end && (t.end as Date).getFullYear() === y ? weekIndexFor(t.end as Date, y) : weeksInRow(y);
      (yearMap[y] = yearMap[y] || []).push({ id: t.id, name: t.name, startWeek: startWeek, endWeek: endWeek, length: endWeek - startWeek + 1, startdate: t.startdate, enddate: t.enddate, place: t.place });
    }

    if (hasEnd && t.end) {
      const e: Date = t.end as Date;
      const ye = e.getFullYear();
      if (!hasStart || !t.start || ye !== (t.start as Date).getFullYear()) {
        const startWeek = 1;
        const endWeek = weekIndexFor(e, ye);
        (yearMap[ye] = yearMap[ye] || []).push({ id: t.id, name: t.name, startWeek: startWeek, endWeek: endWeek, length: endWeek - startWeek + 1, startdate: t.startdate, enddate: t.enddate, place: t.place });
      }
    }

    if (hasStart && hasEnd && t.start && t.end) {
      const sy = (t.start as Date).getFullYear();
      const ey = (t.end as Date).getFullYear();
      if (ey - sy >= 2) {
        for (let y = sy + 1; y <= ey - 1; y++) {
          const startWeek = 1;
          const endWeek = weeksInRow(y);
          (yearMap[y] = yearMap[y] || []).push({ id: t.id, name: t.name, startWeek: startWeek, endWeek: endWeek, length: endWeek - startWeek + 1, startdate: t.startdate, enddate: t.enddate, place: t.place });
        }
      }
    }
  }

  return { yearMap, tagById: idx, tagsList: tags, yearSlotMap: getYearSlotMap(yearMap) };
}

// Events utilities
export type Event = {
  id?: number;
  date: string; // ISO date (YYYY-MM-DD)
  name: string;
  description?: string;
}

export type EventsByWeek = Record<string, Event[]>; // key is isoWeekKey

export function processEvents(events: Event[]): { eventsByWeek: EventsByWeek; eventById: Record<number, Event>; eventsList: Event[] } {
  const eventsByWeek: EventsByWeek = {};
  const eventById: Record<number, Event> = {};
  for (const e of events || []) {
    const d = e.date ? new Date(e.date) : null;
    if (!d || isNaN(d.getTime())) continue;
    const wk = isoWeekKey(startOfISOWeek(d));
    (eventsByWeek[wk] = eventsByWeek[wk] || []).push(e);
    if (e.id != null) eventById[e.id] = e as Event;
  }
  return { eventsByWeek, eventById, eventsList: events || [] };
}
