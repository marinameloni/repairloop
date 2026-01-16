# Repair Loop Game

Un jeu collaboratif basé sur Nuxt.js et Node.js où les joueurs réparent et explorent un monde.

## Architecture

### Frontend (Nuxt.js / Vue 3)
- **Pages** : `index.vue`, `game.vue`
- **Components** : `Map.vue`, `Player.vue`, `Chat.vue`, `Tile.vue`
- **Composables** : `usePlayer.js`, `useWorld.js`
- **Plugins** : Socket.io pour la communication en temps réel

### Backend (Node.js + SQLite3)
- **Routes** : Players, Tiles, Actions, Chat
- **Models** : Player, WorldTile, ActionLog
- **Database** : SQLite3 avec tables pour joueurs, tuiles, actions et messages

## Installation

### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/players` - Récupérer tous les joueurs
- `GET /api/players/:id` - Récupérer un joueur
- `POST /api/players` - Créer un joueur
- `PUT /api/players/:id` - Mettre à jour un joueur
- `DELETE /api/players/:id` - Supprimer un joueur

- `GET /api/tiles` - Récupérer toutes les tuiles
- `GET /api/tiles/:id` - Récupérer une tuile
- `POST /api/tiles` - Créer une tuile
- `PUT /api/tiles/:id` - Mettre à jour une tuile
- `DELETE /api/tiles/:id` - Supprimer une tuile

- `GET /api/chat` - Récupérer les messages
- `POST /api/chat` - Envoyer un message

## Licence

MIT
