package handlers

import (
	"encoding/json"
	"html/template"
	"log/slog"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/symunona/alaris/src/db"
)

type App struct {
	DB       *db.DB
	PageSize int
	Title    string
	Tagline  string
	Footer   string
	FooterTitle string
	ServerRoot  string
	Templates   *template.Template
}

type indexData struct {
	Title       string
	Tagline     string
	Footer      string
	FooterTitle string
	Admin       bool
	OffsetStart int
	Eras        template.JS
	YearLinks   []db.YearLink
	Entries     []db.Post
}

type statData struct {
	Title       string
	Tagline     string
	Footer      string
	FooterTitle string
	ServerRoot  string
	Offset      int
	DBJson      template.JS
}

func (a *App) renderIndex(w http.ResponseWriter, r *http.Request, admin bool) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit := a.PageSize

	keyword := r.URL.Query().Get("keyword")
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		// check path param from /{id} route
		idStr = r.PathValue("id")
	}

	var posts []db.Post
	var err error

	if idStr != "" {
		id, _ := strconv.Atoi(idStr)
		p, e := a.DB.GetPostByID(id)
		if e == nil {
			posts = []db.Post{*p}
		} else {
			posts = []db.Post{}
		}
	} else if admin {
		posts, _, err = a.DB.GetAllPosts(offset, limit, keyword)
	} else {
		posts, _, err = a.DB.GetPublicPosts(offset, limit, keyword)
	}
	if err != nil {
		slog.Error("renderIndex query", "err", err)
		http.Error(w, "internal error", 500)
		return
	}

	eras, err := a.DB.GetTags()
	if err != nil {
		eras = []db.Tag{}
	}
	erasJSON, _ := json.Marshal(eras)

	yearLinks, err := a.DB.YearOffsets(!admin)
	if err != nil {
		yearLinks = []db.YearLink{}
	}

	data := indexData{
		Title:       a.Title,
		Tagline:     a.Tagline,
		Footer:      a.Footer,
		FooterTitle: a.FooterTitle,
		Admin:       admin,
		OffsetStart: offset,
		Eras:        template.JS(erasJSON),
		YearLinks:   yearLinks,
		Entries:     posts,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := a.Templates.ExecuteTemplate(w, "index.html", data); err != nil {
		slog.Error("template index", "err", err)
	}
}

func (a *App) Index(w http.ResponseWriter, r *http.Request) {
	// GET / and GET /{offset} both hit here
	// /{offset} is a legacy numeric-offset path
	offsetPath := r.PathValue("offset")
	if offsetPath != "" {
		q := r.URL.Query()
		if q.Get("offset") == "" {
			// rewrite path offset into query param
			r2 := r.Clone(r.Context())
			vals := r2.URL.Query()
			vals.Set("offset", offsetPath)
			r2.URL.RawQuery = vals.Encode()
			r = r2
		}
	}
	a.renderIndex(w, r, false)
}

func (a *App) All(w http.ResponseWriter, r *http.Request) {
	a.renderIndex(w, r, true)
}

func (a *App) Part(w http.ResponseWriter, r *http.Request) {
	a.renderPart(w, r, false)
}

func (a *App) PartAll(w http.ResponseWriter, r *http.Request) {
	a.renderPart(w, r, true)
}

func (a *App) renderPart(w http.ResponseWriter, r *http.Request, admin bool) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 {
		limit = a.PageSize
	}
	keyword := r.URL.Query().Get("keyword")

	var posts []db.Post
	var err error
	if admin {
		posts, _, err = a.DB.GetAllPosts(offset, limit, keyword)
	} else {
		posts, _, err = a.DB.GetPublicPosts(offset, limit, keyword)
	}
	if err != nil {
		slog.Error("renderPart", "err", err)
		http.Error(w, "internal error", 500)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := a.Templates.ExecuteTemplate(w, "part.html", map[string]any{
		"Entries": posts,
		"Admin":   admin,
	}); err != nil {
		slog.Error("template part", "err", err)
	}
}

func (a *App) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(r.PathValue("id"))
	p, err := a.DB.GetPostByID(id)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	jsonResp(w, p)
}

func (a *App) GetRandom(w http.ResponseWriter, r *http.Request) {
	p, err := a.DB.GetRandomPost()
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	jsonResp(w, p)
}

func (a *App) Grader(w http.ResponseWriter, r *http.Request) {
	p, err := a.DB.GetRandomPost()
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	eras, _ := a.DB.GetTags()
	erasJSON, _ := json.Marshal(eras)
	yearLinks, _ := a.DB.YearOffsets(false)

	data := indexData{
		Title:     a.Title,
		Admin:     true,
		Eras:      template.JS(erasJSON),
		YearLinks: yearLinks,
		Entries:   []db.Post{*p},
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := a.Templates.ExecuteTemplate(w, "index.html", data); err != nil {
		slog.Error("template grader", "err", err)
	}
}

func (a *App) Stat(w http.ResponseWriter, r *http.Request) {
	dump, err := a.DB.Dump()
	if err != nil {
		http.Error(w, "internal error", 500)
		return
	}
	dbJSON, _ := json.Marshal(dump)
	data := statData{
		Title:       a.Title,
		Tagline:     a.Tagline,
		Footer:      a.Footer,
		FooterTitle: a.FooterTitle,
		ServerRoot:  a.ServerRoot,
		DBJson:      template.JS(dbJSON),
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := a.Templates.ExecuteTemplate(w, "stat.html", data); err != nil {
		slog.Error("template stat", "err", err)
	}
}

func (a *App) Weeks(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, filepath.Join("public", "weeks.html"))
}

func jsonResp(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
