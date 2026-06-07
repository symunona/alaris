package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/symunona/alaris/db"
)

func (a *App) ToggleTop(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(r.PathValue("id"))
	p, err := a.DB.ToggleTop(id)
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	jsonResp(w, p)
}

func (a *App) RateEntry(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(r.PathValue("id"))
	var body struct{ Delta int `json:"delta"` }
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", 400)
		return
	}
	p, err := a.DB.RatePost(id, body.Delta)
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	jsonResp(w, p)
}

func (a *App) SaveEntry(w http.ResponseWriter, r *http.Request) {
	var p db.Post
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "bad request", 400)
		return
	}
	saved, err := a.DB.SavePost(&p)
	if err != nil {
		slog.Error("SaveEntry", "err", err)
		http.Error(w, "internal error", 500)
		return
	}
	jsonResp(w, saved)
}

func (a *App) GetTags(w http.ResponseWriter, r *http.Request) {
	tags, err := a.DB.GetTags()
	if err != nil {
		http.Error(w, "internal error", 500)
		return
	}
	jsonResp(w, tags)
}

func (a *App) SaveTag(w http.ResponseWriter, r *http.Request) {
	var t db.Tag
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "bad request", 400)
		return
	}
	saved, err := a.DB.SaveTag(&t)
	if err != nil {
		slog.Error("SaveTag", "err", err)
		http.Error(w, "internal error", 500)
		return
	}
	jsonResp(w, saved)
}

func (a *App) DeleteTag(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(r.PathValue("id"))
	if err := a.DB.DeleteTag(id); err != nil {
		http.Error(w, "not found", 404)
		return
	}
	jsonResp(w, map[string]bool{"ok": true})
}

func (a *App) TagPosts(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(r.PathValue("id"))
	posts, err := a.DB.GetTagPosts(id)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	jsonResp(w, posts)
}

func (a *App) GetEvents(w http.ResponseWriter, r *http.Request) {
	events, err := a.DB.GetEvents()
	if err != nil {
		http.Error(w, "internal error", 500)
		return
	}
	jsonResp(w, events)
}

func (a *App) SaveEvent(w http.ResponseWriter, r *http.Request) {
	var e db.Event
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, "bad request", 400)
		return
	}
	saved, err := a.DB.SaveEvent(&e)
	if err != nil {
		slog.Error("SaveEvent", "err", err)
		http.Error(w, "internal error", 500)
		return
	}
	jsonResp(w, saved)
}

func (a *App) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(r.PathValue("id"))
	if err := a.DB.DeleteEvent(id); err != nil {
		http.Error(w, "not found", 404)
		return
	}
	jsonResp(w, map[string]bool{"ok": true})
}

func (a *App) DumpDB(w http.ResponseWriter, r *http.Request) {
	dump, err := a.DB.Dump()
	if err != nil {
		http.Error(w, "internal error", 500)
		return
	}
	jsonResp(w, dump)
}
