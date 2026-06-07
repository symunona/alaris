// migrate imports db.json into alaris.db (SQLite).
// Run once: go run ./cmd/migrate
package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/symunona/alaris/src/db"
)

type rawPost struct {
	ID    any     `json:"id"`
	Body  string  `json:"body"`
	Date  string  `json:"date"`
	Topic any     `json:"topic"`
	Title string  `json:"title"`
	Top   any     `json:"top"`
	Grade any     `json:"grade"`
	Tag   string  `json:"tag"`
}

type rawTag struct {
	ID         any    `json:"id"`
	Name       string `json:"name"`
	Background string `json:"background"`
	StartDate  string `json:"startdate"`
	EndDate    string `json:"enddate"`
	CustomJS   string `json:"customjs"`
	Style      string `json:"style"`
}

type rawEvent struct {
	ID          any    `json:"id"`
	Date        string `json:"date"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type rawDB struct {
	Blog   []rawPost  `json:"blog"`
	Tags   []rawTag   `json:"tags"`
	Events []rawEvent `json:"events"`
}

func main() {
	src := "db.json"
	dst := "alaris.db"
	if len(os.Args) > 1 {
		src = os.Args[1]
	}
	if len(os.Args) > 2 {
		dst = os.Args[2]
	}

	data, err := os.ReadFile(src)
	if err != nil {
		slog.Error("read src", "err", err)
		os.Exit(1)
	}

	var raw rawDB
	if err := json.Unmarshal(data, &raw); err != nil {
		slog.Error("parse json", "err", err)
		os.Exit(1)
	}

	database, err := db.Open(dst)
	if err != nil {
		slog.Error("open db", "err", err)
		os.Exit(1)
	}
	defer database.Close()

	posts := make([]db.Post, 0, len(raw.Blog))
	skipped := 0
	for _, r := range raw.Blog {
		p := db.Post{
			ID:    toInt(r.ID),
			Body:  r.Body,
			Date:  normalizeDate(r.Date),
			Topic: toInt(r.Topic),
			Title: r.Title,
			Top:   toBool(r.Top),
			Grade: toFloat(r.Grade),
			Tag:   r.Tag,
		}
		if p.ID == 0 {
			skipped++
			continue
		}
		posts = append(posts, p)
	}

	tags := make([]db.Tag, 0, len(raw.Tags))
	for _, r := range raw.Tags {
		tags = append(tags, db.Tag{
			ID:         toInt(r.ID),
			Name:       r.Name,
			Background: r.Background,
			StartDate:  r.StartDate,
			EndDate:    r.EndDate,
			CustomJS:   r.CustomJS,
			Style:      r.Style,
		})
	}

	events := make([]db.Event, 0, len(raw.Events))
	for _, r := range raw.Events {
		events = append(events, db.Event{
			ID:          toInt(r.ID),
			Date:        r.Date,
			Name:        r.Name,
			Description: r.Description,
		})
	}

	slog.Info("importing", "posts", len(posts), "tags", len(tags), "events", len(events), "skipped", skipped)

	if err := database.BulkInsert(posts, tags, events); err != nil {
		slog.Error("bulk insert", "err", err)
		os.Exit(1)
	}

	slog.Info("done", "db", dst)
}

func normalizeDate(s string) string {
	layouts := []string{
		time.RFC3339,
		"2006-01-02T15:04:05-07:00",
		"2006-01-02T15:04:05Z",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}
	for _, l := range layouts {
		if t, err := time.Parse(l, s); err == nil {
			return t.Format(time.RFC3339)
		}
	}
	return s
}

func toInt(v any) int {
	switch x := v.(type) {
	case float64:
		return int(x)
	case int:
		return x
	case string:
		var n int
		fmt.Sscanf(x, "%d", &n)
		return n
	}
	return 0
}

func toBool(v any) bool {
	switch x := v.(type) {
	case bool:
		return x
	case float64:
		return x != 0
	case int:
		return x != 0
	}
	return false
}

func toFloat(v any) float64 {
	switch x := v.(type) {
	case float64:
		return x
	case int:
		return float64(x)
	}
	return 0
}
