# KHAYIL 2026 — Frontend

Interface d'administration et pages publiques de la plateforme d'invitations KHAYIL 2026, développée pour ICC Gabon.

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| React | 18.3 | UI library |
| Vite | 5.4 | Build tool & dev server |
| React Router DOM | 6.27 | Routing SPA |
| Axios | 1.7 | Client HTTP + intercepteur JWT |
| react-hot-toast | 2.4 | Notifications |
| @react-pdf/renderer | 3.4 | Génération PDF côté client |
| qrcode.react | 4.1 | QR codes SVG / Canvas |
| lucide-react | 0.460 | Icônes |
| date-fns | 4.1 | Formatage dates (locale FR) |
| TailwindCSS | 3.4 | Utilitaires CSS |

---

## Installation

```bash
cd frontend
npm install
```

### Prérequis

- Node.js ≥ 18
- Backend Spring Boot démarré sur `http://localhost:8080`
- MySQL avec la base `invitation_db`

---

## Démarrage

```bash
# Développement (hot reload, proxy API activé)
npm run dev
# → http://localhost:3000

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

---

## Variables d'environnement

Créer un fichier `.env` à la racine du dossier `frontend/` :

```env
# URL du backend (proxy Vite — ne pas changer en dev)
VITE_API_BASE_URL=/api

# Optionnel : désactiver le proxy en prod et pointer directement
# VITE_API_BASE_URL=https://api.icc.ga
```

Le proxy Vite est configuré dans `vite.config.js` :

```js
server: {
  port: 3000,
  proxy: { '/api': 'http://localhost:8080' }
}
```

---

## Structure du projet

```
frontend/src/
│
├── api/                     # Clients HTTP
│   ├── axios.js             # Instance Axios + intercepteur JWT
│   ├── events.js            # CRUD événements
│   └── participants.js      # Gestion participants
│
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.jsx  # Capture erreurs de rendu
│   │   ├── Loader.jsx         # Spinner centré
│   │   ├── Modal.jsx          # Modal générique (Escape, scroll lock)
│   │   └── ProgramDisplay.jsx # Rendu JSON programme événement
│   ├── invitation/
│   │   ├── InvitationCard.jsx # Aperçu HTML de la carte d'invitation
│   │   └── InvitationPDF.jsx  # PDF A6 (@react-pdf/renderer)
│   ├── layout/
│   │   ├── AdminLayout.jsx    # Header + main + footer
│   │   └── Header.jsx         # Navigation avec menu burger mobile
│   └── participants/
│       ├── InvitationPreview.jsx  # Modal aperçu + téléchargement PDF
│       ├── InviteForm.jsx         # Formulaire d'invitation nominative
│       └── ParticipantsTable.jsx  # Tableau avec actions contextuelles
│
├── context/
│   └── AuthContext.jsx      # JWT token, login/logout, isAuthenticated
│
├── hooks/
│   ├── useAuth.js           # Accès au contexte Auth
│   └── useEvents.js         # Liste + suppression événements
│
├── pages/
│   ├── Dashboard.jsx        # Stats, derniers confirmés, refresh 30s
│   ├── Login.jsx            # Page de connexion admin
│   ├── Events/
│   │   ├── EventDetail.jsx  # Détail + statistiques + lien public
│   │   ├── EventForm.jsx    # Création / modification
│   │   └── EventList.jsx    # Grille des événements
│   ├── Participants/
│   │   └── ParticipantsList.jsx  # Onglets INVITED/PENDING/CONFIRMED
│   └── Public/
│       ├── ConfirmInvitation.jsx # Confirmation par token (public)
│       └── PublicRegister.jsx    # Inscription publique (public)
│
├── styles/
│   └── theme.css            # Design system complet (variables, composants, responsive)
│
├── utils/
│   ├── calendarUtils.js     # Google Calendar, iCal, WhatsApp
│   ├── dateUtils.js         # Formatage dates FR (date-fns)
│   └── exportUtils.js       # Export CSV avec BOM UTF-8
│
├── App.jsx                  # Routes + lazy loading + ErrorBoundary
└── main.jsx                 # Point d'entrée React
```

---

## Charte graphique

| Variable CSS | Valeur | Usage |
|---|---|---|
| `--color-gold` | `#D4AF37` | Accent principal |
| `--color-surface` | `#0D0D0D` | Fond de page |
| `--color-surface-2` | `#1A1A1A` | Fond des cards |
| `--color-text-primary` | `#F5F5F5` | Texte principal |
| `--color-text-muted` | `#6B6B6B` | Texte secondaire |
| `--font-serif` | `Playfair Display` | Titres |
| `--font-sans` | `Inter` | Corps |

---

## Routes

### Pages admin (JWT requis)

| Route | Composant | Description |
|---|---|---|
| `/dashboard` | `Dashboard` | Vue d'ensemble + stats |
| `/events` | `EventList` | Liste des événements |
| `/events/new` | `EventForm` | Créer un événement |
| `/events/:id` | `EventDetail` | Détail événement |
| `/events/:id/edit` | `EventForm` | Modifier un événement |
| `/events/:eventId/participants` | `ParticipantsList` | Gestion participants |

### Pages publiques (sans authentification)

| Route | Composant | Description |
|---|---|---|
| `/login` | `Login` | Connexion admin |
| `/register/:eventId` | `PublicRegister` | Inscription publique |
| `/confirm/:token` | `ConfirmInvitation` | Confirmation invitation |

---

## Flux principaux

### Invitation nominative (admin)
1. Admin ouvre `ParticipantsList` → clic "Inviter"
2. `InviteForm` : saisie prénom + email + téléphone → `POST /api/events/:id/invite`
3. Succès → `InvitationPreview` s'ouvre avec aperçu HTML + PDF téléchargeable
4. L'invité reçoit un email avec lien `/confirm/:token`

### Inscription publique (visiteur)
1. Visiteur accède à `/register/:eventId` (lien partagé par l'admin)
2. Remplit le formulaire → `POST /api/public/events/:id/register`
3. Statut `PENDING` → admin valide depuis `ParticipantsList`

### Confirmation par token
1. Invité clique sur le lien email → `/confirm/:token`
2. `GET /api/public/confirm/:token` → `INVITED → CONFIRMED`
3. Page affiche : WhatsApp, Google Calendar, iCal, QR code

---

## Comptes par défaut

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@icc.ga` | `admin123` |

> Modifiable dans `backend/src/main/resources/application.properties`

---

## Commandes utiles

```bash
# Analyser le bundle
npm run build -- --report

# Vérifier les dépendances obsolètes
npm outdated

# Mettre à jour les dépendances mineures
npm update
```

---

## Notes de déploiement

- En production, remplacer `app.confirmation-url` dans `application.properties` par l'URL réelle
- Le JWT secret doit être une variable d'environnement sécurisée (≥ 32 caractères)
- `@react-pdf/renderer` alourdit le bundle (+1.3MB gzippé) — envisager du lazy loading supplémentaire si nécessaire
- `spring.jpa.show-sql=false` en production
