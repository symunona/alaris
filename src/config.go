package main

import (
	"encoding/json"
	"os"
)

type Config struct {
	DB struct {
		Src     string `json:"src"`
		Prettyfy bool  `json:"prettyfy"`
	} `json:"db"`
	Admin struct {
		Users map[string]string `json:"users"`
	} `json:"admin"`
	ServerRoot  string `json:"serverRoot"`
	Title       string `json:"title"`
	Tagline     string `json:"tagline"`
	Footer      string `json:"footer"`
	FooterTitle string `json:"footerTitle"`
	PageSize    int    `json:"pageSize"`
	Debug       bool   `json:"debug"`
	Port        string `json:"port"`
}

func loadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	if cfg.PageSize == 0 {
		cfg.PageSize = 10
	}
	if cfg.Port == "" {
		cfg.Port = "3000"
	}
	return &cfg, nil
}
