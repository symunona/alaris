/** @jsxImportSource solid-js */
import { createSignal } from 'solid-js';

export type EventModel = { id?: number; date: string; name: string; description?: string };

export default function EventDetailView(props: { event: EventModel | null; onSave: (saved: EventModel) => void; onDelete: (id: number) => void; prefill?: { date: string }; onBack?: (id?: number) => void }) {
  const ev = () => props.event || {} as any;
  const [form, setForm] = createSignal<EventModel>({
    id: ev().id,
    date: (props.prefill && props.prefill.date) || (ev().date ? new Date(ev().date).toISOString().slice(0, 10) : ''),
    name: ev().name || '',
    description: ev().description || ''
  });

  const toAPIDate = (v: string) => {
    const d = v ? new Date(v) : null;
    if (!d || isNaN(d.getTime())) return null as any;
    return d.toISOString().slice(0, 10);
  };

  const doSave = async () => {
    const f = form();
    const payload = {
      id: f.id,
      date: toAPIDate(f.date),
      name: f.name,
      description: f.description || ''
    };
    const res = await fetch('/api/event/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const saved = await res.json();
    props.onSave(saved);
    setForm({ id: saved.id, date: saved.date ? new Date(saved.date).toISOString().slice(0,10) : '', name: saved.name || '', description: saved.description || '' });
  };

  const doDelete = async () => {
    const id = form().id;
    if (!id) return;
    if (!confirm('Delete this event? This cannot be undone.')) return;
    const res = await fetch(`/api/event/delete/${id}`, { method: 'DELETE' });
    if (res.ok) props.onDelete(id);
  };

  return (
    <div class="tag-detail">
      <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <button
          class="back-btn"
          onClick={() => {
            try { props.onBack && props.onBack(ev().id); } catch {}
            if (history.length > 1) history.back(); else window.location.hash = '';
          }}
        >← Back</button>
        <button class="save-btn" style="margin-left:auto;" onClick={doSave}>Save</button>
        <button class="delete-btn" onClick={doDelete}>Delete</button>
      </div>
      <h2 class="tag-title">{ev()?.name ? `Event: ${ev()?.name}` : 'Event'}</h2>
      <div class="tag-form">
        <label>
          <span>ID</span>
          <input type="text" value={form().id ?? ''} readOnly />
        </label>
        <label>
          <span>Date</span>
          <input type="date" value={form().date} onInput={(e) => setForm({ ...form(), date: (e.currentTarget as HTMLInputElement).value })} />
        </label>
        <label>
          <span>Name</span>
          <input type="text" value={form().name} onInput={(e) => setForm({ ...form(), name: (e.currentTarget as HTMLInputElement).value })} />
        </label>
        <label style="grid-column: 1 / -1;">
          <span>Description</span>
          <textarea rows={6} value={form().description || ''} onInput={(e) => setForm({ ...form(), description: (e.currentTarget as HTMLTextAreaElement).value })} />
        </label>
      </div>
      
    </div>
  );
}
