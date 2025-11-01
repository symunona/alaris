/** @jsxImportSource solid-js */
import { createSignal } from 'solid-js';

export default function TagDetailView(props: { tag: any; onSave: (saved: any) => void; onDelete: (id: number) => void; prefill?: { startdate: string; enddate: string }; onBack?: (id?: number) => void }) {
  const tag = () => props.tag || {};
  const [form, setForm] = createSignal({
    id: tag().id,
    name: tag().name || '',
    startdate: (props.prefill && props.prefill.startdate) || (tag().startdate ? new Date(tag().startdate).toISOString().slice(0, 10) : ''),
    enddate: (props.prefill && props.prefill.enddate) || (tag().enddate ? new Date(tag().enddate).toISOString().slice(0, 10) : ''),
    background: tag().background || '',
    description: tag().description || '',
    place: tag().place || ''
  });

  const toAPIDate = (v: string) => {
    const d = v ? new Date(v) : null;
    if (!d || isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  const doSave = async () => {
    const f = form();
    const payload = {
      id: f.id,
      name: f.name,
      startdate: toAPIDate(f.startdate),
      enddate: toAPIDate(f.enddate),
      background: f.background,
      description: f.description,
      place: f.place
    };
    const res = await fetch('/api/tag/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const saved = await res.json();
    props.onSave(saved);
    setForm({
      id: saved.id,
      name: saved.name || '',
      startdate: saved.startdate ? new Date(saved.startdate).toISOString().slice(0, 10) : '',
      enddate: saved.enddate ? new Date(saved.enddate).toISOString().slice(0, 10) : '',
      background: saved.background || '',
      description: saved.description || '',
      place: saved.place || ''
    });
  };

  const doDelete = async () => {
    const id = form().id;
    if (!id) return;
    if (!confirm('Delete this tag? This cannot be undone.')) return;
    const res = await fetch(`/api/tag/delete/${id}`, { method: 'DELETE' });
    if (res.ok) {
      props.onDelete(id);
    }
  };

  return (
    <div class="tag-detail">
      <button
        class="back-btn"
        onClick={() => {
          try { props.onBack && props.onBack(tag().id); } catch {}
          if (history.length > 1) history.back(); else window.location.hash = '';
        }}
      >← Back</button>
      <h2 class="tag-title">{tag()?.name ?? 'Tag'}</h2>
      <div class="tag-form">
        <label>
          <span>ID</span>
          <input type="text" value={form().id ?? ''} readOnly />
        </label>
        <label>
          <span>Name</span>
          <input type="text" value={form().name} onInput={(e) => setForm({ ...form(), name: (e.currentTarget as HTMLInputElement).value })} />
        </label>
        <label>
          <span>Start date</span>
          <input type="date" value={form().startdate} onInput={(e) => setForm({ ...form(), startdate: (e.currentTarget as HTMLInputElement).value })} />
        </label>
        <label>
          <span>End date</span>
          <input type="date" value={form().enddate} onInput={(e) => setForm({ ...form(), enddate: (e.currentTarget as HTMLInputElement).value })} />
        </label>
        <label>
          <span>Image</span>
          <input type="text" value={form().background} onInput={(e) => setForm({ ...form(), background: (e.currentTarget as HTMLInputElement).value })} />
        </label>
        <label>
          <span>Place</span>
          <input type="text" value={form().place} onInput={(e) => setForm({ ...form(), place: (e.currentTarget as HTMLInputElement).value })} />
        </label>
        <label style="grid-column: 1 / -1;">
          <span>Description</span>
          <textarea rows={6} value={form().description} onInput={(e) => setForm({ ...form(), description: (e.currentTarget as HTMLTextAreaElement).value })} />
        </label>
      </div>

      {tag()?.background ? (
        <div class="tag-image-wrap">
          <img class="tag-image" src={tag().background} alt={tag()?.name ?? 'Tag image'} />
        </div>
      ) : (
        <div class="tag-image-wrap placeholder">No image</div>
      )}
      <div class="tag-actions">
        <button class="save-btn" onClick={doSave}>Save</button>
        <button class="delete-btn" onClick={doDelete}>Delete</button>
      </div>
    </div>
  );
}
