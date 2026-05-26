# SMS Backend — Les Petits Génies de la Robotique

Mini backend serverless qui envoie un **SMS automatique** au parent et à l'académie quand le formulaire d'inscription du site est soumis.

## Architecture

```
Formulaire site (GitHub Pages)
        │
        ├──► Web3Forms (email auto au parent + académie) ✅ déjà actif
        │
        └──► Cette fonction Vercel ──► Twilio ──► SMS parent + SMS académie
```

## Déploiement — Pas à pas (≈ 20 min)

### 1) Créer un compte Twilio (5 min)

1. Aller sur https://www.twilio.com/try-twilio
2. S'inscrire avec `robotics.academy.contact@gmail.com`
3. Vérifier le téléphone de l'académie (numéro Luxembourg)
4. **$15 de crédit gratuit** offerts (≈ 150 SMS)
5. Dans la console Twilio → **Account Info** → copier :
   - `Account SID` (commence par `AC...`)
   - `Auth Token`

### 2) Configurer l'expéditeur SMS (5 min)

**Option recommandée : Alphanumeric Sender ID** (gratuit, fonctionne LU/FR/DE)

1. Twilio Console → **Messaging** → **Senders** → **Alphanumeric Sender IDs**
2. Cliquer **Create new** → entrer : `PetitsGen` (max 11 caractères, sans espace)
3. Validation automatique sous quelques minutes pour LU/FR/DE
4. Le SMS s'affichera avec "PetitsGen" comme expéditeur au lieu d'un numéro

**Option alternative : acheter un numéro Twilio Luxembourg** (~$1/mois)

1. Twilio Console → **Phone Numbers** → **Buy a number**
2. Sélectionner Luxembourg → choisir un numéro SMS
3. Utiliser ce numéro comme `TWILIO_FROM`

### 3) Créer un compte Vercel (3 min)

1. Aller sur https://vercel.com/signup
2. Se connecter avec GitHub (recommandé)
3. Autoriser Vercel à accéder aux repos GitHub

### 4) Déployer le backend (5 min)

1. Sur Vercel → **Add New...** → **Project**
2. Importer le repo `nassirabarhoumi/les-petits-genies-robotique`
3. **IMPORTANT** : dans **Root Directory**, cliquer **Edit** et choisir `sms-backend`
4. Framework Preset : **Other** (laisser par défaut)
5. **Avant de déployer**, cliquer **Environment Variables** et ajouter :

   | Nom | Valeur |
   |---|---|
   | `TWILIO_SID` | `ACxxxxx...` (depuis Twilio) |
   | `TWILIO_TOKEN` | votre auth token Twilio |
   | `TWILIO_FROM` | `PetitsGen` (ou votre numéro Twilio) |
   | `ACADEMY_PHONE` | `+352XXXXXXXXX` (le numéro qui reçoit les notifications) |

6. Cliquer **Deploy**
7. Une fois déployé, copier l'URL (ex: `https://lpg-sms-backend.vercel.app`)

### 5) Connecter le formulaire à Vercel (2 min)

1. Dans `lpg-temp/index.html`, chercher `SMS_BACKEND_URL`
2. Remplacer par : `https://VOTRE-PROJET.vercel.app/api/sms`
3. Commit + push

## Test

1. Aller sur https://nassirabarhoumi.github.io/les-petits-genies-robotique/#inscription
2. Remplir le formulaire avec **votre propre numéro** comme parent
3. Soumettre
4. Vous devriez recevoir :
   - 📧 Email de notification (Web3Forms)
   - 📱 SMS de confirmation sur le numéro du parent
   - 📱 SMS de notification sur `ACADEMY_PHONE`

## Coûts

- **Vercel** : gratuit (100 GB-hours/mois, largement suffisant)
- **Twilio** : $15 offerts au démarrage. Après :
  - SMS vers Luxembourg : ~$0.082
  - SMS vers France : ~$0.077
  - SMS vers Allemagne : ~$0.10
  - Soit ≈ €0.07-0.10 par inscription (2 SMS)
- **Estimation** : 20 inscriptions/mois = ~€2.80/mois

## Sécurité

- ✅ Clés Twilio jamais exposées (env vars côté serveur)
- ✅ CORS limité à `nassirabarhoumi.github.io`
- ✅ Validation des champs requis
- ✅ `.env` ignoré par Git

## Désactivation temporaire

Pour désactiver le SMS sans toucher au site : supprimer les env vars Twilio sur Vercel. La fonction renverra une 500 mais Web3Forms continuera d'envoyer les emails normalement.
