# alaris

Lightweight single-user blog engine. Started in 2015 as a Node.js experiment, rewritten in Go.

## Setup

Copy and edit config:

```
cp config.example.json config.json
```

Build and run:

```
go build -o alaris ./src && ./alaris
```

## Era system

Tags can be defined as eras with a start and end date. While inside an era, the UI reflects your position within it — custom backgrounds, visual context. Overlapping eras resolve to the shortest one.

## Backup

Weekly backup script at `scripts/backup.sh` — archives the SQLite DB and `public/content`. Keeps 4 versions, skips if content unchanged (hash check).

Enable the systemd timer:

```
systemctl --user enable --now alaris-backup.timer
```
