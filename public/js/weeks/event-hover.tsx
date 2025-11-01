/** @jsxImportSource solid-js */

export default function EventHover(props: { events: { id?: number; date: string; name: string; description?: string }[] }) {
  const evs = () => props.events || [];
  return (
    <div class="event-hover">
      <div class="event-hover-title">Events ({evs().length})</div>
      <ul class="event-hover-list">
        {evs().slice(0, 6).map((e) => (
          <li tabIndex={0}>
            {e.id != null ? (
              <a
                href={`#events/${e.id}`}
                class="event-item-link"
              >
                <span class="event-date">{e.date}</span>
                <span class="event-name">{e.name}</span>
                {e.description ? <div class="event-desc">{e.description}</div> : null}
              </a>
            ) : (
              <div>
                <span class="event-date">{e.date}</span>
                <span class="event-name">{e.name}</span>
                {e.description ? <div class="event-desc">{e.description}</div> : null}
              </div>
            )}
          </li>
        ))}
      </ul>
      {evs().length > 6 ? <div class="event-more">and {evs().length - 6} more…</div> : null}
    </div>
  );
}
