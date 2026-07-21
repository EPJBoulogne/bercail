# Bercail

Application de planification et d'organisation pour l'église — calendrier
partagé, départements, rôles, disponibilités, et un module Louange
(répertoire de chants, listes, synchronisation avec portail.yt).

## Démarrage

1. Installer les dépendances :
   ```
   npm install
   ```

2. Créer votre fichier d'environnement :
   ```
   cp .env.local.example .env.local
   ```
   Remplissez-le avec les clés de votre projet Supabase **Bercail-dev**
   (Project Settings → API Keys → Publishable and secret API keys).

3. Lancer le serveur de développement :
   ```
   npm run dev
   ```
   Ouvrez [http://localhost:3000](http://localhost:3000). Vous devriez
   voir une page confirmant que la connexion Supabase est configurée.

## Prochaines étapes

- [ ] Schéma de base de données + policies RLS (users, departments, events,
      songs, setlists...)
- [ ] Authentification (email + mot de passe, création de compte par
      l'admin uniquement)
- [ ] Reconstruction des pages du sandbox avec de vraies données
- [ ] Edge Function de synchronisation avec `songs_export.php` (portail.yt)
- [ ] Déploiement sur Netlify avec les clés du projet **Bercail-prod**

## Structure

```
app/                  Pages (Next.js App Router)
lib/supabase/client.ts   Client Supabase pour composants navigateur
lib/supabase/server.ts   Client Supabase pour Server Components
middleware.ts             Rafraîchit la session à chaque navigation
```
