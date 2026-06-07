package handlers

import (
	"io"
	"log/slog"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

var allowedMIME = map[string]bool{
	"image/jpeg":    true,
	"image/png":     true,
	"image/gif":     true,
	"image/webp":    true,
	"image/svg+xml": true,
	"image/avif":    true,
}

func (a *App) Upload(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(32 << 20) // 32MB max memory
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file", 400)
		return
	}
	defer file.Close()

	// Detect MIME from first 512 bytes
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	contentType := http.DetectContentType(buf[:n])
	// Also check declared MIME
	declared := header.Header.Get("Content-Type")
	if declared != "" {
		mt, _, _ := mime.ParseMediaType(declared)
		if mt != "" {
			contentType = mt
		}
	}
	// Normalize (DetectContentType may return "image/jpeg" for jpgs)
	baseType := strings.Split(contentType, ";")[0]
	if !allowedMIME[baseType] {
		http.Error(w, "images only", http.StatusUnsupportedMediaType)
		return
	}

	dest := filepath.Join("public", "content", filepath.Base(header.Filename))
	out, err := os.Create(dest)
	if err != nil {
		slog.Error("upload create file", "err", err)
		http.Error(w, "internal error", 500)
		return
	}
	defer out.Close()

	// Write already-read bytes + rest
	out.Write(buf[:n])
	if _, err := io.Copy(out, file); err != nil {
		slog.Error("upload write", "err", err)
		http.Error(w, "internal error", 500)
		return
	}

	w.Write([]byte("ok"))
}

type fileInfo struct {
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
	MTime    string `json:"mtime"`
}

func (a *App) ListContent(w http.ResponseWriter, r *http.Request) {
	dir := filepath.Join("public", "content")
	entries, err := os.ReadDir(dir)
	if err != nil {
		jsonResp(w, []fileInfo{})
		return
	}

	var files []fileInfo
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		files = append(files, fileInfo{
			Filename: e.Name(),
			Size:     info.Size(),
			MTime:    info.ModTime().Format("2006-01-02T15:04:05Z"),
		})
	}
	sort.Slice(files, func(i, j int) bool {
		return files[i].MTime > files[j].MTime
	})
	jsonResp(w, files)
}
