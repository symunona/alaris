package middleware

import (
	"crypto/subtle"
	"encoding/base64"
	"net/http"
	"strings"
)

// BasicAuth wraps h with HTTP Basic Auth checked against users map.
func BasicAuth(users map[string]string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := parseBasicAuth(r)
		if !ok || !checkCredentials(users, user, pass) {
			w.Header().Set("WWW-Authenticate", `Basic realm="Alaris"`)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func checkCredentials(users map[string]string, user, pass string) bool {
	expected, exists := users[user]
	if !exists {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(pass), []byte(expected)) == 1
}

func parseBasicAuth(r *http.Request) (user, pass string, ok bool) {
	auth := r.Header.Get("Authorization")
	if !strings.HasPrefix(auth, "Basic ") {
		return "", "", false
	}
	decoded, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(auth, "Basic "))
	if err != nil {
		return "", "", false
	}
	parts := strings.SplitN(string(decoded), ":", 2)
	if len(parts) != 2 {
		return "", "", false
	}
	return parts[0], parts[1], true
}
