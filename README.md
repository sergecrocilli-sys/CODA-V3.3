# CODA V3 — Assistant local métier

Version orientée assistant local métier de préparation de réponses.

- Aucune connexion Gmail ou Outlook.
- Aucun accès direct aux mails.
- L’utilisateur colle uniquement le message à traiter.
- CODA analyse localement le contenu saisi.
- CODA prépare une réponse métier prête à adapter.
- Aucun envoi automatique.
- Validation humaine obligatoire.

Déposer les fichiers à la racine GitHub Pages.


## V3.1
- Ajout du bouton Nouveau mail.
- Ajout du bouton Accueil.
- Ajout de resetWorkspace().
- L'objet du mail est désormais indiqué comme facultatif.
- Cache PWA : coda-v3-1-assistant-local-metier.


## V3.2
- Boutons visibles `+ Nouveau mail` et `Accueil` ajoutés au-dessus de la zone de saisie.
- Navigation latérale enrichie : Nouveau mail / Paramètres / Accueil.
- Objet du mail confirmé comme facultatif.
- Cache PWA : coda-v3-2-assistant-local-metier.


## V4 — Test IA locale Ollama

Cette version ajoute un mode expérimental :
- Réponse rapide CODA : règles locales.
- IA locale : appel à Ollama sur `http://localhost:11434/api/generate`.

Pré-requis pour le mode IA locale :
1. Installer Ollama sur le PC.
2. Lancer un modèle local, par exemple `llama3.2`.
3. Dans CODA, choisir `IA locale — Ollama`.
4. Cliquer sur `Tester la connexion IA locale`.

Si l’IA locale n’est pas disponible, CODA revient automatiquement au moteur rapide par règles.
Cache PWA : coda-v4-test-ia-locale-ollama.


## Modèle IA locale par défaut
Modèle Ollama par défaut : `llama3.2`.
Ce paramètre est défini dans `index.html` (champ `ollama-model`) et dans `app.js` (valeur par défaut `state.ollamaModel`).

## V4.1 — IA locale visible dans l'espace de travail

- Ajout du bloc IA locale directement au-dessus du mail reçu.
- Bouton `Tester IA locale` visible dans l'écran principal.
- Boutons `+ Nouveau mail`, `Accueil` et `Paramètres / IA locale` visibles.
- Modèle par défaut : `llama3.2`.
- Cache PWA : `coda-v4-1-test-ia-locale-ollama`.


## V4.1.1
- Correction JavaScript : suppression du double `async` qui bloquait les boutons.

## V3.3 — Version règles locales corrigée

- Boutons visibles `+ Nouveau mail`, `Accueil`, `Paramètres`.
- Navigation latérale enrichie.
- Objet du mail facultatif.
- Pas de bloc IA locale.
- Moteur règles locales enrichi pour les incohérences administratives / comptables.
- Cache PWA : `coda-v3-3-assistant-local-metier`.
