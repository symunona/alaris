package db

import (
	"database/sql"
	"fmt"
	"log/slog"
	"math"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

const schema = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS blog (
	id      INTEGER PRIMARY KEY,
	body    TEXT    NOT NULL DEFAULT '',
	date    TEXT    NOT NULL DEFAULT '',
	topic   INTEGER NOT NULL DEFAULT 0,
	title   TEXT    NOT NULL DEFAULT '',
	top     INTEGER NOT NULL DEFAULT 0,
	grade   REAL    NOT NULL DEFAULT 0,
	tag     TEXT    NOT NULL DEFAULT ''
);

CREATE VIRTUAL TABLE IF NOT EXISTS blog_fts USING fts5(
	title, body, tag,
	content=blog, content_rowid=id,
	tokenize='unicode61'
);

CREATE TRIGGER IF NOT EXISTS blog_ai AFTER INSERT ON blog BEGIN
	INSERT INTO blog_fts(rowid, title, body, tag) VALUES (new.id, new.title, new.body, new.tag);
END;
CREATE TRIGGER IF NOT EXISTS blog_ad AFTER DELETE ON blog BEGIN
	INSERT INTO blog_fts(blog_fts, rowid, title, body, tag) VALUES ('delete', old.id, old.title, old.body, old.tag);
END;
CREATE TRIGGER IF NOT EXISTS blog_au AFTER UPDATE ON blog BEGIN
	INSERT INTO blog_fts(blog_fts, rowid, title, body, tag) VALUES ('delete', old.id, old.title, old.body, old.tag);
	INSERT INTO blog_fts(rowid, title, body, tag) VALUES (new.id, new.title, new.body, new.tag);
END;

CREATE TABLE IF NOT EXISTS tags (
	id         INTEGER PRIMARY KEY,
	name       TEXT NOT NULL DEFAULT '',
	background TEXT NOT NULL DEFAULT '',
	startdate  TEXT NOT NULL DEFAULT '',
	enddate    TEXT NOT NULL DEFAULT '',
	customjs   TEXT NOT NULL DEFAULT '',
	style      TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS events (
	id          INTEGER PRIMARY KEY,
	date        TEXT NOT NULL DEFAULT '',
	name        TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT ''
);
`

// isPublicSQL is the SQLite expression for the is-public visibility rule.
// isWithinHalfYear: years_since < 2 (confusingly named in original JS)
// minimumGrade:     years_since / 2
const isPublicSQL = `(
	(top = 1 AND topic = 0 AND (
		(julianday('now') - julianday(date)) / 365.25 < 2.0
		OR (grade > 0 AND grade > (julianday('now') - julianday(date)) / 365.25 / 2.0)
	))
	OR (topic = 6 AND date != '')
)`

type Post struct {
	ID    int     `json:"id"`
	Body  string  `json:"body"`
	Date  string  `json:"date"`
	Topic int     `json:"topic"`
	Title string  `json:"title"`
	Top   bool    `json:"top"`
	Grade float64 `json:"grade"`
	Tag   string  `json:"tag"`
	// computed, not stored
	Tags                  []string `json:"tags"`
	IsPublic              bool     `json:"isPublic"`
	IsWithinHalfYear      bool     `json:"isWithinHalfYear"`
	MinimumGradeToBeVisible float64 `json:"minimumGradeToBeVisible"`
}

type Tag struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Background string `json:"background"`
	StartDate  string `json:"startdate"`
	EndDate    string `json:"enddate"`
	CustomJS   string `json:"customjs"`
	Style      string `json:"style"`
}

type Event struct {
	ID          int    `json:"id"`
	Date        string `json:"date"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type DB struct {
	conn *sql.DB
}

func Open(path string) (*DB, error) {
	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	conn.SetMaxOpenConns(1) // SQLite: single writer
	if _, err := conn.Exec(schema); err != nil {
		return nil, fmt.Errorf("schema init: %w", err)
	}
	return &DB{conn: conn}, nil
}

func (d *DB) Close() { d.conn.Close() }

// computePostFields fills derived fields on a post.
func computePostFields(p *Post) {
	t, err := time.Parse(time.RFC3339, p.Date)
	if err != nil {
		// try common fallbacks
		for _, layout := range []string{"2006-01-02T15:04:05-07:00", "2006-01-02 15:04:05", "2006-01-02"} {
			if t2, e2 := time.Parse(layout, p.Date); e2 == nil {
				t = t2
				err = nil
				break
			}
		}
	}
	if err == nil {
		yearsSince := time.Since(t).Hours() / 8766.0
		p.IsWithinHalfYear = yearsSince/2 < 1
		p.MinimumGradeToBeVisible = math.Round(yearsSince/2*10) / 10
		p.IsPublic = p.Top && p.Topic == 0 &&
			(p.IsWithinHalfYear || (p.Grade > 0 && p.Grade > yearsSince/2))
	}
	if p.Tag != "" {
		parts := strings.Split(p.Tag, ",")
		p.Tags = make([]string, 0, len(parts))
		for _, t := range parts {
			if s := strings.TrimSpace(t); s != "" {
				p.Tags = append(p.Tags, s)
			}
		}
	} else {
		p.Tags = []string{}
	}
}

func scanPost(rows *sql.Rows) (*Post, error) {
	var p Post
	var topInt int
	err := rows.Scan(&p.ID, &p.Body, &p.Date, &p.Topic, &p.Title, &topInt, &p.Grade, &p.Tag)
	if err != nil {
		return nil, err
	}
	p.Top = topInt != 0
	computePostFields(&p)
	return &p, nil
}

func (d *DB) queryPosts(query string, args ...any) ([]Post, error) {
	rows, err := d.conn.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var posts []Post
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, *p)
	}
	if posts == nil {
		posts = []Post{}
	}
	return posts, rows.Err()
}

const postCols = "id, body, date, topic, title, top, grade, tag"

// GetPublicPosts returns visible posts for the public feed, optionally filtered by keyword.
func (d *DB) GetPublicPosts(offset, limit int, keyword string) ([]Post, int, error) {
	return d.getPosts(true, offset, limit, keyword)
}

// GetAllPosts returns all posts (admin view).
func (d *DB) GetAllPosts(offset, limit int, keyword string) ([]Post, int, error) {
	return d.getPosts(false, offset, limit, keyword)
}

func (d *DB) getPosts(publicOnly bool, offset, limit int, keyword string) ([]Post, int, error) {
	var where string
	var args []any

	if keyword != "" {
		// FTS5 search: join on fts table
		ftsQ := keyword + "*" // prefix match
		if publicOnly {
			where = fmt.Sprintf(`id IN (SELECT rowid FROM blog_fts WHERE blog_fts MATCH ?) AND %s`, isPublicSQL)
		} else {
			where = `id IN (SELECT rowid FROM blog_fts WHERE blog_fts MATCH ?)`
		}
		args = append(args, ftsQ)
	} else if publicOnly {
		where = isPublicSQL
	} else {
		where = "1=1"
	}

	var total int
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM blog WHERE %s", where)
	if err := d.conn.QueryRow(countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	q := fmt.Sprintf("SELECT %s FROM blog WHERE %s ORDER BY date DESC LIMIT ? OFFSET ?", postCols, where)
	posts, err := d.queryPosts(q, append(args, limit, offset)...)
	return posts, total, err
}

func (d *DB) GetPostByID(id int) (*Post, error) {
	rows, err := d.conn.Query(fmt.Sprintf("SELECT %s FROM blog WHERE id = ?", postCols), id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	return scanPost(rows)
}

func (d *DB) GetRandomPost() (*Post, error) {
	rows, err := d.conn.Query(fmt.Sprintf("SELECT %s FROM blog ORDER BY RANDOM() LIMIT 1", postCols))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	return scanPost(rows)
}

func (d *DB) SavePost(p *Post) (*Post, error) {
	if p.ID == 0 {
		if p.Date == "" {
			p.Date = time.Now().Format(time.RFC3339)
		}
		var maxID int
		d.conn.QueryRow("SELECT COALESCE(MAX(id),0) FROM blog").Scan(&maxID)
		p.ID = maxID + 1
		_, err := d.conn.Exec(
			"INSERT INTO blog (id,body,date,topic,title,top,grade,tag) VALUES (?,?,?,?,?,?,?,?)",
			p.ID, p.Body, p.Date, p.Topic, p.Title, boolInt(p.Top), p.Grade, p.Tag,
		)
		if err != nil {
			return nil, err
		}
	} else {
		_, err := d.conn.Exec(
			"UPDATE blog SET body=?,date=?,topic=?,title=?,top=?,grade=?,tag=? WHERE id=?",
			p.Body, p.Date, p.Topic, p.Title, boolInt(p.Top), p.Grade, p.Tag, p.ID,
		)
		if err != nil {
			return nil, err
		}
	}
	return d.GetPostByID(p.ID)
}

func (d *DB) ToggleTop(id int) (*Post, error) {
	p, err := d.GetPostByID(id)
	if err != nil {
		return nil, err
	}
	p.Top = !p.Top
	return d.SavePost(p)
}

func (d *DB) RatePost(id int, delta int) (*Post, error) {
	p, err := d.GetPostByID(id)
	if err != nil {
		return nil, err
	}
	p.Grade += float64(delta)
	return d.SavePost(p)
}

// YearLink is a year and its offset in the paginated feed (newest-first).
type YearLink struct {
	Year   string `json:"year"`
	Offset int    `json:"offset"`
}

// YearOffsets returns years sorted newest-first with their feed offset, for the year picker.
func (d *DB) YearOffsets(publicOnly bool) ([]YearLink, error) {
	where := "1=1"
	if publicOnly {
		where = isPublicSQL
	}
	rows, err := d.conn.Query(
		fmt.Sprintf("SELECT strftime('%%Y', date) as yr FROM blog WHERE %s ORDER BY date DESC", where),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	seen := map[string]bool{}
	var links []YearLink
	i := 0
	for rows.Next() {
		var yr string
		rows.Scan(&yr)
		if !seen[yr] {
			seen[yr] = true
			links = append(links, YearLink{Year: yr, Offset: i})
		}
		i++
	}
	return links, rows.Err()
}

// Tags

func (d *DB) GetTags() ([]Tag, error) {
	rows, err := d.conn.Query("SELECT id,name,background,startdate,enddate,customjs,style FROM tags ORDER BY startdate")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tags []Tag
	for rows.Next() {
		var t Tag
		rows.Scan(&t.ID, &t.Name, &t.Background, &t.StartDate, &t.EndDate, &t.CustomJS, &t.Style)
		tags = append(tags, t)
	}
	if tags == nil {
		tags = []Tag{}
	}
	return tags, rows.Err()
}

func (d *DB) GetTagByID(id int) (*Tag, error) {
	var t Tag
	err := d.conn.QueryRow("SELECT id,name,background,startdate,enddate,customjs,style FROM tags WHERE id=?", id).
		Scan(&t.ID, &t.Name, &t.Background, &t.StartDate, &t.EndDate, &t.CustomJS, &t.Style)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (d *DB) SaveTag(t *Tag) (*Tag, error) {
	if t.ID == 0 {
		var maxID int
		d.conn.QueryRow("SELECT COALESCE(MAX(id),0) FROM tags").Scan(&maxID)
		t.ID = maxID + 1
		_, err := d.conn.Exec(
			"INSERT INTO tags (id,name,background,startdate,enddate,customjs,style) VALUES (?,?,?,?,?,?,?)",
			t.ID, t.Name, t.Background, t.StartDate, t.EndDate, t.CustomJS, t.Style,
		)
		return t, err
	}
	_, err := d.conn.Exec(
		"UPDATE tags SET name=?,background=?,startdate=?,enddate=?,customjs=?,style=? WHERE id=?",
		t.Name, t.Background, t.StartDate, t.EndDate, t.CustomJS, t.Style, t.ID,
	)
	return t, err
}

func (d *DB) DeleteTag(id int) error {
	res, err := d.conn.Exec("DELETE FROM tags WHERE id=?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (d *DB) GetTagPosts(tagID int) ([]Post, error) {
	tag, err := d.GetTagByID(tagID)
	if err != nil {
		return nil, err
	}
	return d.queryPosts(
		fmt.Sprintf("SELECT %s FROM blog WHERE date >= ? AND date <= ? ORDER BY date DESC", postCols),
		tag.StartDate, tag.EndDate,
	)
}

// Events

func (d *DB) GetEvents() ([]Event, error) {
	rows, err := d.conn.Query("SELECT id,date,name,description FROM events ORDER BY date")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var events []Event
	for rows.Next() {
		var e Event
		rows.Scan(&e.ID, &e.Date, &e.Name, &e.Description)
		events = append(events, e)
	}
	if events == nil {
		events = []Event{}
	}
	return events, rows.Err()
}

func (d *DB) SaveEvent(e *Event) (*Event, error) {
	if e.ID == 0 {
		var maxID int
		d.conn.QueryRow("SELECT COALESCE(MAX(id),0) FROM events").Scan(&maxID)
		e.ID = maxID + 1
		_, err := d.conn.Exec(
			"INSERT INTO events (id,date,name,description) VALUES (?,?,?,?)",
			e.ID, e.Date, e.Name, e.Description,
		)
		return e, err
	}
	_, err := d.conn.Exec(
		"UPDATE events SET date=?,name=?,description=? WHERE id=?",
		e.Date, e.Name, e.Description, e.ID,
	)
	return e, err
}

func (d *DB) DeleteEvent(id int) error {
	res, err := d.conn.Exec("DELETE FROM events WHERE id=?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// Dump returns all data for the /api/db endpoint.
func (d *DB) Dump() (map[string]any, error) {
	posts, _, err := d.GetAllPosts(0, 100000, "")
	if err != nil {
		return nil, err
	}
	tags, err := d.GetTags()
	if err != nil {
		return nil, err
	}
	events, err := d.GetEvents()
	if err != nil {
		return nil, err
	}
	return map[string]any{"blog": posts, "tags": tags, "events": events}, nil
}

// Stats

type Stats struct {
	BlogCount  int `json:"blogCount"`
	TagCount   int `json:"tagCount"`
	EventCount int `json:"eventCount"`
}

func (d *DB) GetStats() (*Stats, error) {
	var s Stats
	d.conn.QueryRow("SELECT COUNT(*) FROM blog").Scan(&s.BlogCount)
	d.conn.QueryRow("SELECT COUNT(*) FROM tags").Scan(&s.TagCount)
	d.conn.QueryRow("SELECT COUNT(*) FROM events").Scan(&s.EventCount)
	return &s, nil
}

func boolInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// BulkInsert is used by the migration tool.
func (d *DB) BulkInsert(posts []Post, tags []Tag, events []Event) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, p := range posts {
		_, err := tx.Exec(
			"INSERT OR REPLACE INTO blog (id,body,date,topic,title,top,grade,tag) VALUES (?,?,?,?,?,?,?,?)",
			p.ID, p.Body, p.Date, p.Topic, p.Title, boolInt(p.Top), p.Grade, p.Tag,
		)
		if err != nil {
			slog.Error("insert blog", "id", p.ID, "err", err)
			return err
		}
	}
	for _, t := range tags {
		_, err := tx.Exec(
			"INSERT OR REPLACE INTO tags (id,name,background,startdate,enddate,customjs,style) VALUES (?,?,?,?,?,?,?)",
			t.ID, t.Name, t.Background, t.StartDate, t.EndDate, t.CustomJS, t.Style,
		)
		if err != nil {
			return err
		}
	}
	for _, e := range events {
		_, err := tx.Exec(
			"INSERT OR REPLACE INTO events (id,date,name,description) VALUES (?,?,?,?)",
			e.ID, e.Date, e.Name, e.Description,
		)
		if err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	// Rebuild FTS index
	_, err = d.conn.Exec("INSERT INTO blog_fts(blog_fts) VALUES('rebuild')")
	return err
}
