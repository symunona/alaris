package main

import (
	"encoding/json"
	"html/template"
	"log/slog"
	"net/http"
	"os"

	"github.com/symunona/alaris/db"
	"github.com/symunona/alaris/handlers"
	"github.com/symunona/alaris/middleware"
)

func main() {
	cfg, err := loadConfig("config.json")
	if err != nil {
		slog.Error("load config", "err", err)
		os.Exit(1)
	}

	database, err := db.Open("alaris.db")
	if err != nil {
		slog.Error("open db", "err", err)
		os.Exit(1)
	}
	defer database.Close()

	tmpl, err := loadTemplates()
	if err != nil {
		slog.Error("load templates", "err", err)
		os.Exit(1)
	}

	app := &handlers.App{
		DB:          database,
		PageSize:    cfg.PageSize,
		Title:       cfg.Title,
		Tagline:     cfg.Tagline,
		Footer:      cfg.Footer,
		FooterTitle: cfg.FooterTitle,
		ServerRoot:  cfg.ServerRoot,
		Templates:   tmpl,
	}

	auth := func(h http.HandlerFunc) http.Handler {
		return middleware.BasicAuth(cfg.Admin.Users, h)
	}

	mux := http.NewServeMux()

	// Static files
	mux.Handle("GET /public/", http.StripPrefix("/public/", http.FileServer(http.Dir("public"))))
	mux.Handle("GET /css/", http.StripPrefix("/css/", http.FileServer(http.Dir("public/css"))))
	mux.Handle("GET /js/", http.StripPrefix("/js/", http.FileServer(http.Dir("public/js"))))
	mux.Handle("GET /dist/", http.StripPrefix("/dist/", http.FileServer(http.Dir("public/dist"))))
	mux.Handle("GET /content/", http.StripPrefix("/content/", http.FileServer(http.Dir("public/content"))))

	// Public routes
	mux.HandleFunc("GET /", app.Index)
	mux.HandleFunc("GET /api/part", app.Part)
	mux.HandleFunc("GET /id/{id}", app.Index)

	// Auth routes - pages
	mux.Handle("GET /all", auth(app.All))
	mux.Handle("GET /stat", auth(app.Stat))
	mux.Handle("GET /grader", auth(app.Grader))
	mux.Handle("GET /weeks", http.HandlerFunc(app.Weeks))

	// Auth routes - API
	mux.Handle("GET /api/partAll", auth(app.PartAll))
	mux.Handle("GET /api/id/{id}", auth(app.GetByID))
	mux.Handle("GET /api/rnd", auth(app.GetRandom))
	mux.Handle("GET /api/db", auth(app.DumpDB))
	mux.Handle("GET /api/tags", auth(app.GetTags))
	mux.Handle("GET /api/list", auth(app.GetTags))
	mux.Handle("GET /api/tag/posts/{id}", auth(app.TagPosts))
	mux.Handle("GET /api/events", auth(app.GetEvents))
	mux.Handle("GET /api/content", auth(app.ListContent))

	mux.Handle("POST /api/top/{id}", auth(app.ToggleTop))
	mux.Handle("POST /api/entry/rate/{id}", auth(app.RateEntry))
	mux.Handle("POST /api/entry/save", auth(app.SaveEntry))
	mux.Handle("POST /api/tag/save", auth(app.SaveTag))
	mux.Handle("POST /api/event/save", auth(app.SaveEvent))
	mux.Handle("POST /api/upload", auth(app.Upload))

	mux.Handle("DELETE /api/tag/delete/{id}", auth(app.DeleteTag))
	mux.Handle("DELETE /api/event/delete/{id}", auth(app.DeleteEvent))

	// /{offset} must come last — catches numeric offsets like /10, /20
	mux.HandleFunc("GET /{offset}", app.Index)

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}
	slog.Info("alaris starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("server", "err", err)
		os.Exit(1)
	}
}

func loadTemplates() (*template.Template, error) {
	funcMap := template.FuncMap{
		"marshalJSON": func(v any) (string, error) {
			b, err := json.Marshal(v)
			return string(b), err
		},
		"unescaped": func(s string) template.HTML {
			return template.HTML(s)
		},
		"not": func(v any) bool {
			switch x := v.(type) {
			case bool:
				return !x
			case int:
				return x == 0
			case float64:
				return x == 0
			}
			return true
		},
	}
	return template.New("").Funcs(funcMap).ParseGlob("templates/*.html")
}
