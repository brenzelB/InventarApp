#!/bin/bash

# --- Inventory App Update Script ---
# This script pulls the latest changes from Git, rebuilds the Next.js container,
# and restarts the application without losing local data.

# Color codes for pretty printing
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}        Inventar-App: Start Update-Prozess          ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Check if we are in a Git repository
if [ ! -d .git ]; then
    echo -e "${RED}Fehler: Kein Git-Repository in diesem Verzeichnis gefunden.${NC}"
    echo -e "Bitte stelle sicher, dass du das Skript im Hauptverzeichnis der App ausführst."
    exit 1
fi

# Detect Docker Compose Command
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}Fehler: 'docker compose' oder 'docker-compose' wurde nicht gefunden.${NC}"
    echo -e "Bitte installiere Docker Compose auf dem Server."
    exit 1
fi

echo -e "${GREEN}[1/4] Stashe lokale Änderungen & hole neuesten Code...${NC}"
# Stash local changes (e.g. .env modifications) just in case to avoid git conflicts
git stash
# Pull latest code
if git pull; then
    echo -e "${GREEN}Neuer Code erfolgreich heruntergeladen.${NC}"
else
    echo -e "${RED}Fehler beim Herunterladen des neuen Codes via git pull.${NC}"
    git stash pop
    exit 1
fi
# Re-apply local modifications
git stash pop || true

echo -e "${GREEN}[2/4] Stoppe laufende Next.js-Container...${NC}"
$DOCKER_COMPOSE down

echo -e "${GREEN}[3/4] Baue Container neu und starte App...${NC}"
if $DOCKER_COMPOSE up -d --build; then
    echo -e "${GREEN}App-Container erfolgreich neu gebaut und im Hintergrund gestartet.${NC}"
else
    echo -e "${RED}Fehler beim Bauen oder Starten der Container.${NC}"
    exit 1
fi

echo -e "${GREEN}[4/4] Überprüfe Status der Container...${NC}"
$DOCKER_COMPOSE ps

echo -e "${BLUE}====================================================${NC}"
echo -e "${GREEN}         Update erfolgreich abgeschlossen!          ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "Die Next.js-App läuft auf Port 3000."
echo -e "Datenbank-Hinweis: Deine Supabase-Datenbank wird in separaten Docker-"
echo -e "Volumes gespeichert und bleibt durch diesen Prozess unberührt."
echo -e ""
echo -e "Solltest du neue SQL-Migrationsdateien (z.B. schema.sql) einspielen"
echo -e "wollen, führe diese bitte im Supabase-Studio (SQL-Editor) aus."
echo -e "${BLUE}====================================================${NC}"
