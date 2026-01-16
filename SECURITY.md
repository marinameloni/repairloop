# 🔒 SECURITY DOCUMENTATION - Repair Loop

## Overview

Ce document explique toutes les mesures de sécurité implémentées dans l'application Repair Loop.

---

## 1. HELMET - Headers de Sécurité HTTP

**Qu'est-ce que c'est?**
Helmet ajoute des headers HTTP qui protègent contre les attaques courantes.

**Headers configurés:**

- `Strict-Transport-Security (HSTS)`: Force HTTPS pendant 1 an
- `Content-Security-Policy (CSP)`: Bloque les scripts/styles non autorisés (protection XSS)
- `X-Content-Type-Options`: Empêche le "MIME sniffing"
- `X-Frame-Options`: Empêche le clickjacking
- `X-XSS-Protection`: Protection XSS supplémentaire

**Exemple d'attaque bloquée:**

```html
<!-- Avant: Script malveillant injecté -->
<script src="https://attacker.com/steal.js"></script>

<!-- Après: Bloqué par CSP -->
❌ Refused to load the script because it violates the Content Security Policy
```

---

## 2. RATE LIMITING - Prévention du Brute Force

**Qu'est-ce que c'est?**
Limite le nombre de requêtes par IP pour empêcher les attaques par force brute.

**Configuration:**

```javascript
- Global: 100 requêtes par 15 minutes
- Auth (login/register): 10 requêtes par 15 minutes
- skipSuccessfulRequests: true (ne compte pas les logins réussis)
```

**Exemple d'attaque bloquée:**

```
❌ Request 1: Login alice / password1
❌ Request 2: Login alice / password2
...
❌ Request 11: "429 Too Many Requests"
```

---

## 3. CORS - Contrôle des Origines Croisées

**Qu'est-ce que c'est?**
Contrôle quels domaines peuvent accéder à votre API.

**Configuration:**

```javascript
Allowed origin: http://localhost:3000 (votre frontend)
Allowed methods: GET, POST, PUT, DELETE
Allowed headers: Content-Type, Authorization
```

**Exemple d'attaque bloquée:**

```
Request from attacker.com → API
❌ CORS policy: Access-Control-Allow-Origin does not match
```

---

## 4. JWT - Authentification Sécurisée

**Qu'est-ce que c'est?**
Les tokens JWT remplacent les sessions. Chaque token est signé avec un secret.

**Processus:**

1. Utilisateur se connecte
2. Serveur génère un JWT token valide 7 jours
3. Frontend stocke le token
4. Chaque requête envoie: `Authorization: Bearer <token>`
5. Serveur vérifie la signature du token

**Structure d'un JWT:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.     // Header
eyJpZCI6MSwiaWF0IjoxNjM5NzQ...             // Payload (data)
9T_wIZf3X8_vlxF8_x5Y...                     // Signature (secret)
```

**Avantages:**

- ✅ Stateless (pas de session à stocker)
- ✅ Signé cryptographiquement
- ✅ Expiration automatique
- ✅ Impossible à forger sans le secret

---

## 5. HACHAGE DES MOTS DE PASSE - Bcrypt

**Qu'est-ce que c'est?**
Les mots de passe sont hachés avec Bcrypt avant d'être stockés.

**Processus:**

```javascript
Password: "MyPassword123"
  ↓ Bcrypt (10 rounds)
Hashed: $2b$10$X8vZ9K7...dGT2Qu (impossible à reverser)
```

**Pourquoi 10 rounds?**

- Plus de rounds = plus sûr mais plus lent
- 10 rounds = ~100ms par hash (bon équilibre)
- Même avec le hash, impossible de trouver le mot de passe

**Protection contre:**

- Rainbow tables
- Brute force (lent grâce aux rounds)
- Fuites de données (les hashs ne servent à rien)

---

## 6. VALIDATION & SANITISATION DES INPUTS

**Qu'est-ce que c'est?**
Vérifier et nettoyer tous les inputs utilisateur.

**Validations implémentées:**

### Username

```javascript
- Longueur: 3-20 caractères
- Caractères: Lettres, chiffres, -, _
- Pas de caractères spéciaux (prévient l'injection)
```

### Password

```javascript
- Longueur: 6+ caractères
- Doit contenir: MAJUSCULES + minuscules + chiffres
- Raison: Renforce la complexité
```

### Avatar Type

```javascript
- Doit être: 'girl' ou 'boy'
- Rejeté si autre valeur
```

**Exemple d'attaque bloquée (SQL Injection):**

```
Input: username = "admin'; DROP TABLE players; --"

Avant sécurité:
❌ Requête exécutée: DELETE players

Après validation:
✅ Rejeté: "Username can only contain letters, numbers, -, _"
```

---

## 7. PREPARED STATEMENTS - Protection SQL Injection

**Qu'est-ce que c'est?**
Les paramètres sont séparés de la requête SQL.

**Sécurisé:**

```javascript
db.run(
  "INSERT INTO players (username, password) VALUES (?, ?)",
  [username, hashedPassword] // Les ? sont remplaces séparément
);
```

**Non sécurisé (ancien code):**

```javascript
db.run(
  `INSERT INTO players VALUES ('${username}', '${password}')` // ❌ Injection possible
);
```

---

## 8. ERREUR HANDLING - Ne pas révéler les détails

**Qu'est-ce que c'est?**
Les messages d'erreur ne révèlent pas d'infos sensibles.

**Configuration:**

```javascript
Development: Affiche les détails complèts
Production: Affiche un message générique

Example:
Development: "Database connection failed: could not open game.db"
Production: "Internal server error"
```

**Pourquoi?**

- Les erreurs détaillées aident les attaquants
- Permet de trouver des vulnérabilités

---

## 9. PAYLOAD SIZE LIMIT

**Qu'est-ce que c'est?**
Limite la taille des requêtes POST.

```javascript
express.json({ limit: "10kb" });
```

**Protection contre:**

- Denial of Service (DoS) attacks
- Requêtes trop lourdes qui plantent le serveur

---

## 10. Environment Variables - Secrets Protégés

**Qu'est-ce que c'est?**
Les secrets sont dans `.env`, jamais dans le code.

**Fichier `.env`:**

```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...  # Ne jamais committer!
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

**Fichier `.env.example`:**

```
JWT_SECRET=your-super-secret-key-change-this-in-production
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

**Workflow:**

1. ✅ Committer `.env.example`
2. ❌ NE PAS committer `.env`
3. En production: Injecter les secrets via l'environnement

---

## FRONTEND SECURITY

### 1. Token Storage

```javascript
// ✅ SÛRE (accessible au JavaScript mais pas au XSS)
sessionStorage.setItem("token", token);

// ❌ MOINS SÛRE (accessible aux scripts injectés)
localStorage.setItem("token", token);

// 🔒 PLUS SÛRE (inaccessible au JavaScript)
// HttpOnly cookie (à implémenter)
```

### 2. XSS Protection

```javascript
// ✅ Sûr - Vue.js échappe automatiquement
<div>{{ userInput }}</div>

// ❌ NON SÛR - Permet l'injection HTML
<div v-html="userInput"></div>
```

### 3. HTTPS

```
Production: TOUJOURS utiliser HTTPS
Certificat SSL gratuit: Let's Encrypt
```

---

## CHECKLIST DE DÉPLOIEMENT

Avant de déployer en production:

- [ ] Générer un nouveau JWT_SECRET (fort et aléatoire)
- [ ] Définir NODE_ENV=production
- [ ] Configurer CORS_ORIGIN avec le domaine réel
- [ ] Activer HTTPS/SSL
- [ ] Supprimer les logs de debug
- [ ] Tester le rate limiting
- [ ] Implémenter les logs de sécurité
- [ ] Backup de la base de données
- [ ] Surveiller les erreurs 401/403
- [ ] Configurer un WAF (Web Application Firewall)

---

## DÉPANNAGE

### JWT Expired

```
Erreur: "Token expired"
Solution: Utilisateur doit se reconnecter
```

### CORS Error

```
Erreur: "CORS policy: Access-Control-Allow-Origin"
Solution: Vérifier CORS_ORIGIN dans .env
```

### Rate Limited

```
Erreur: "429 Too Many Requests"
Solution: Attendre 15 minutes ou redémarrer le serveur
```

---

## RESSOURCES SUPPLÉMENTAIRES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Helmet Documentation](https://helmetjs.github.io/)

---

**Mise à jour: 16 Janvier 2026**
**Status: ✅ Sécurité renforcée en béton!**
