# Système de Webinaires avec Paiement

Système complet de gestion de webinaires avec paiement SumUp, événements Google Calendar/Meet, et notifications automatiques par email.

## 🚀 Fonctionnalités

- ✅ **Gestion des webinaires** : CRUD complet avec dates, prix, participants max
- 💳 **Paiement SumUp** : Intégration complète avec webhooks
- 📅 **Google Calendar** : Création automatique d'événements
- 🎥 **Google Meet** : Génération de liens de visioconférence uniques
- 📧 **Emails automatiques** : Confirmation et rappels J-1
- 📄 **Factures PDF** : Génération automatique après paiement
- 🔐 **Authentification JWT** : Sécurisation des endpoints
- ⏰ **Cron jobs** : Rappels automatiques 24h avant

## 📦 Stack technique

- **Backend** : Node.js + Express + TypeScript
- **Base de données** : Supabase (PostgreSQL)
- **Paiement** : SumUp API
- **Calendrier** : Google Calendar API + Google Meet
- **Email** : SMTP Zoho Mail
- **PDF** : PDFKit
- **Hébergement** : Railway

## 📁 Structure du projet

```
webinar-system/
├── src/
│   ├── config/          # Configuration (DB, JWT, env)
│   ├── middlewares/     # Auth, validation, erreurs
│   ├── models/          # Modèles de données
│   ├── routes/          # Routes API
│   ├── controllers/     # Logique métier
│   ├── services/        # Services externes (SumUp, Google, Email, PDF)
│   ├── jobs/            # Cron jobs
│   ├── types/           # Types TypeScript
│   └── app.ts           # Point d'entrée
├── .env                 # Variables d'environnement
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Installation

### 1. Cloner et installer

```bash
git clone <votre-repo>
cd webinar-system
npm install
```

### 2. Configurer les variables d'environnement

Copiez `.env.example` vers `.env` et remplissez toutes les variables.

```bash
cp .env.example .env
```

### 3. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le script SQL dans `docs/schema.sql`
3. Ajoutez les clés dans `.env`

### 4. Configurer Google Calendar

Suivez le guide dans `docs/google-setup.md` pour obtenir vos credentials OAuth2.

### 5. Configurer SumUp

1. Créez un compte marchand sur [sumup.com](https://www.sumup.com)
2. Obtenez votre API Key dans le dashboard
3. Configurez le webhook vers `https://votre-domaine.com/api/payment/webhook`

### 6. Configurer Zoho Mail

1. Créez un compte sur [zoho.com/mail](https://www.zoho.com/mail/)
2. Activez SMTP dans les paramètres
3. Créez un mot de passe d'application

## 🚀 Démarrage

### Mode développement

```bash
npm run dev
```

### Build et production

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentification

```
POST   /api/auth/register      # Créer un compte
POST   /api/auth/login          # Se connecter
GET    /api/auth/me             # Profil utilisateur (auth requise)
```

### Webinaires

```
GET    /api/webinars                 # Lister tous les webinaires
GET    /api/webinars/:id             # Détails d'un webinaire
POST   /api/webinars                 # Créer un webinaire (auth)
PUT    /api/webinars/:id             # Modifier un webinaire (auth)
DELETE /api/webinars/:id             # Supprimer un webinaire (auth)
GET    /api/webinars/:id/registrations  # Liste des inscrits (auth)
GET    /api/webinars/stats/summary   # Statistiques
```

### Inscriptions

```
POST   /api/registrations        # S'inscrire à un webinaire
GET    /api/registrations/my     # Mes inscriptions (auth)
GET    /api/registrations/:id    # Détails d'une inscription
DELETE /api/registrations/:id    # Annuler une inscription (auth)
```

### Paiements

```
POST   /api/payment/webhook      # Webhook SumUp
GET    /api/payment/return       # Page de retour après paiement
GET    /api/payment              # Liste des paiements (auth)
GET    /api/payment/:id/status   # Statut d'un paiement
```

## 🔄 Workflow complet

### 1. Création d'un webinaire

```bash
curl -X POST http://localhost:3000/api/webinars \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Formation TypeScript Avancé",
    "description": "Apprenez TypeScript en profondeur",
    "start_date": "2026-02-15T14:00:00Z",
    "end_date": "2026-02-15T17:00:00Z",
    "price": 99.99,
    "max_participants": 50
  }'
```

### 2. Inscription d'un participant

```bash
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "webinar_id": "uuid-du-webinaire",
    "user": {
      "email": "participant@example.com",
      "name": "Jean Dupont",
      "company": "Acme Corp"
    }
  }'
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "registration": {
      "id": "uuid-inscription",
      "status": "pending"
    },
    "payment": {
      "id": "uuid-paiement",
      "amount": 99.99,
      "checkout_url": "https://pay.sumup.com/xxxxx"
    }
  },
  "message": "Inscription créée. Veuillez procéder au paiement."
}
```

### 3. Paiement et confirmation

1. Le participant est redirigé vers SumUp
2. Après paiement, SumUp appelle le webhook
3. Le système :
   - Confirme le paiement
   - Crée l'événement Google Calendar + Meet
   - Génère la facture PDF
   - Envoie l'email de confirmation avec le lien Meet

### 4. Rappel automatique

24h avant le webinaire, un email de rappel est automatiquement envoyé.

## 🔐 Sécurité

- Toutes les routes sensibles sont protégées par JWT
- Les webhooks SumUp sont vérifiés via signature
- Rate limiting sur toutes les routes
- Headers de sécurité avec Helmet
- Validation des données avec Zod

## 📊 Base de données

Le schéma Supabase comprend 4 tables principales :

- `users` : Utilisateurs
- `webinars` : Webinaires
- `registrations` : Inscriptions
- `payments` : Paiements

Toutes les tables ont des triggers `updated_at` automatiques et des index optimisés.

## 🎯 Tests

### Test manuel avec curl

```bash
# Health check
curl http://localhost:3000/health

# Lister les webinaires
curl http://localhost:3000/api/webinars

# Créer un utilisateur
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "company": "Test Corp"
  }'
```

### Test avec Postman

Importez la collection Postman disponible dans `docs/postman-collection.json`.

## 🚢 Déploiement sur Railway

### 1. Préparer le projet

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Connecter à Railway

1. Allez sur [railway.app](https://railway.app)
2. Créez un nouveau projet
3. Connectez votre repo GitHub
4. Railway détectera automatiquement Node.js

### 3. Configurer les variables

Dans Railway, ajoutez toutes les variables de votre `.env` :

- `NODE_ENV=production`
- `PORT=3000`
- `API_URL=https://votre-app.railway.app`
- Toutes les autres variables...

### 4. Déployer

```bash
git push origin main
```

Railway déploiera automatiquement votre application.

## 📝 Commandes utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Production
npm start

# Nettoyer
rm -rf dist node_modules
npm install

# Vérifier TypeScript
npx tsc --noEmit
```

## 🐛 Débogage

### Logs

Consultez les logs dans la console ou dans Railway :

```bash
# En local
npm run dev

# Sur Railway
railway logs
```

### Problèmes courants

**Erreur Supabase** : Vérifiez les clés API et que le schéma SQL est bien exécuté

**Erreur Google Calendar** : Vérifiez le refresh token et les scopes OAuth2

**Erreur SumUp** : Vérifiez l'API key et le merchant code

**Erreur Email** : Vérifiez les credentials SMTP Zoho

## 📚 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [SumUp API](https://developer.sumup.com/docs)
- [Google Calendar API](https://developers.google.com/calendar)
- [Zoho Mail SMTP](https://www.zoho.com/mail/help/zoho-smtp.html)

## 📄 Licence

MIT

## 👤 Auteur

- Daniil Stepanov 

## 🙏 Remerciements

- Anthropic pour Claude
- Supabase pour la base de données
- SumUp pour le paiement
- Google pour Calendar/Meet