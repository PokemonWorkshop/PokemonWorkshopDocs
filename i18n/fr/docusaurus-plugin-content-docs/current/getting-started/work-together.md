---
title: "Travailler à plusieurs sur un projet PSDK"
slug: travailler-a-plusieurs-sur-un-projet-psdk
sidebar_position: 3
description: "Un projet PSDK créé avec Pokémon Studio ne contient pas de dépôt Git par défaut. Le mettre sous Git permet à plusieurs makers de travailler sur le même jeu sans s'écraser les modifications. La difficulté propre à PSDK est que les données RMXP sont stockées dans des fichiers .rxdata binaires que Git ne sait pas fusionner. Ce guide explique comment initialiser le dépôt, ce que doit contenir le .gitignore, le workflow .yml qui rend les données RMXP fusionnables, et les règles qui évitent que les contributeurs se marchent dessus."
---

Un projet PSDK créé avec Pokémon Studio ne contient pas de dépôt Git par défaut. Le mettre sous Git permet à plusieurs makers de travailler sur le même jeu sans s'écraser les modifications. La difficulté propre à PSDK est que les données RMXP sont stockées dans des fichiers `.rxdata` binaires que Git ne sait pas fusionner. Ce guide explique comment initialiser le dépôt, ce que doit contenir le `.gitignore`, le workflow `.yml` qui rend les données RMXP fusionnables, et les règles qui évitent que les contributeurs se marchent dessus.

Avant de commencer, s'assurer d'avoir fait la [préparation de l'environnement de développement](/getting-started/preparer-son-environnement), qui installe **Git** et **VS Code**. La plupart des étapes ci-dessous se font graphiquement dans VS Code et sur le site GitHub ou GitLab. Pour le vocabulaire Git utilisé ici (**commit**, **branche**, **remote**) et la clé SSH optionnelle, voir [Découvrir Git](/getting-started/decouvrir-git). On recommande aussi d'installer l'extension **GitLens** (voir [GitLens](/getting-started/preparer-son-environnement#gitlens-optionnel)).

## Mettre son projet sous Git

Un projet Pokémon Studio n'est qu'un dossier sur le disque. Le mettre sous Git se fait en trois étapes, toutes graphiques : créer un dépôt vide en ligne, ajouter un `.gitignore`, puis publier le projet depuis VS Code.

Il faut d'abord un compte gratuit **GitHub** ou **GitLab**. VS Code demandera de s'y connecter à la première publication, c'est aussi ainsi qu'il obtient l'autorisation de pousser vos commits.

### Créer le dépôt sur GitHub ou GitLab

Cela se fait entièrement depuis le site web.

Sur **GitHub** :

1. Cliquer sur le **+** en haut à droite, puis **New repository**.
2. Donner un nom au dépôt, et choisir **Private** si le projet ne doit pas être public.
3. Laisser les options **Add a README**, **Add .gitignore** et licence **décochées**, pour que le dépôt reste vide et puisse recevoir le projet existant.
4. Cliquer sur **Create repository**.

Sur **GitLab** :

1. Cliquer sur **New project**, puis **Create blank project**.
2. Donner un nom au projet et choisir sa visibilité.
3. **Décocher** "Initialize repository with a README", pour que le projet reste vide.
4. Cliquer sur **Create project**.

On garde la page ouverte : elle affiche l'**URL** du dépôt dont on aura besoin plus tard. Si on s'est connecté dans VS Code, on copie l'URL **HTTPS** ; si on a configuré une clé SSH (voir [Découvrir Git](/getting-started/decouvrir-git#configurer-ssh)), on copie l'URL **SSH** (elle commence par `git@`).

### Ajouter un .gitignore

Git ne doit pas suivre tout le contenu du dossier. Un projet PSDK mélange trois types de fichiers : les **fichiers source** qu'on écrit (scripts, données `.yml`), les **fichiers régénérés** que le moteur recrée tout seul (le runtime Ruby, les `.rxdata` compilés), et les **fichiers locaux** qui n'appartiennent qu'à sa machine (les sauvegardes). Seuls les fichiers source ont leur place dans Git, sinon le dépôt devient énorme et impossible à fusionner.

On crée le fichier à la racine du projet (dans VS Code, clic droit sur la liste des fichiers, **New File**, le nommer `.gitignore`) et on colle ceci comme base. C'est celui utilisé par la démo technique officielle de PSDK :

```bash
# Runtime du moteur - régénéré par PSDK/Studio, jamais committé
.gameopts
Game.rb
latest.json
psdk.bat
lib/
ruby_builtin_dlls/
pokemonsdk/
ruby.exe
rubyw.exe
msvcrt-ruby300.dll

# Sauvegardes locales et scripts de combat compilés
Saves/*
Data/Events/Battle/*.yarbc

# Données RMXP compilées (binaire) - ignorées, mais les versions .yml sont gardées
Data/Actors.rxdata
Data/AnimatedTiles.rxdata
Data/Animations.rxdata
Data/CommonEvents.rxdata
Data/System.rxdata
Data/Tilesets.rxdata
Data/Map*.rxdata
!Data/Map*.rxdata.yml
Data/configs/*.rxdata
!Data/configs/*.rxdata.yml
Data/PSDK/Maplinks.rxdata
!Data/PSDK/Maplinks.rxdata.yml
Data/PSDK/SystemTags.rxdata
!Data/PSDK/SystemTags.rxdata.yml

# Texte compilé et données Studio
Data/Text/Dialogs/*.dat
Data/Studio/psdk.dat

# Artefacts de build
PSDK_Technical_Demo_*.zip
Release/
project.psa
```

Deux points méritent d'être compris ici :

- Le runtime du moteur (`lib/`, `ruby.exe`, `pokemonsdk/`, `psdk.bat`, ...) est fourni par Pokémon Studio ou en clonant le moteur. Il est lourd et spécifique à la machine, donc on ne le committe jamais. Chaque membre de l'équipe le récupère sur sa propre machine.
- Les données RMXP compilées (`.rxdata`) sont **binaires**. Elles sont ignorées, tandis que les lignes `!Data/...rxdata.yml` gardent explicitement les versions **texte** `.yml` suivies. Cette séparation est tout l'objet du workflow yml ci-dessous.

La ligne `PSDK_Technical_Demo_*.zip` correspond à l'archive de release de la démo. Dans son propre projet, on la remplace par le nom de sa propre archive de release.

### Publier son projet avec VS Code

Le `.gitignore` en place, VS Code peut publier le projet sans le terminal. Chaque action ci-dessous se lance depuis la **palette de commandes** : on appuie sur `Ctrl+Shift+P` et on tape la commande. La position exacte des boutons change selon la version de VS Code et GitLens la réorganise, donc la palette est la façon fiable de trouver une action (astuce : taper `Git:` liste toutes les actions Git de sa version).

1. Ouvrir le dossier du projet dans VS Code : **File > Open Folder**.
2. Lancer **`Git: Initialize Repository`** pour commencer à suivre le dossier.
3. Ouvrir la vue **Source Control** (l'icône de branche dans la barre de gauche, ou `Ctrl+Shift+G`). Comme le `.gitignore` est déjà là, seuls les bons fichiers apparaissent. On les indexe tous avec le **+**, on tape un message comme `Initial commit`, puis on lance **`Git: Commit`** (ou on appuie sur `Ctrl+Entrée` dans le champ de message).
4. Lancer **`Git: Add Remote`**, coller l'URL du dépôt affichée sur le site, et la nommer `origin`.
5. Lancer **`Git: Push`** pour envoyer le projet. Au tout premier envoi, la commande peut s'appeler **`Git: Publish Branch`**, et VS Code peut demander de se connecter à GitHub ou GitLab.

:::note[Le premier envoi est long]
Un projet PSDK contient des dizaines de milliers de fichiers (graphismes, audio, cartes, données) et peut peser plusieurs centaines de mégaoctets, donc le premier envoi peut prendre plusieurs minutes, voire davantage sur une connexion lente. On le laisse finir sans l'interrompre : VS Code affiche la progression dans la barre d'état en bas. Une fois terminé, on vérifie que la vue **Source Control** n'affiche plus de modifications en attente, et on rafraîchit la page du dépôt sur GitHub ou GitLab, où les fichiers et le dernier commit doivent maintenant apparaître.
:::

Si on préfère la ligne de commande, la page du dépôt affiche aussi les commandes équivalentes (`git init`, `git add .`, `git commit`, `git remote add origin <url>`, `git push -u origin main`).

## Versionner les données RMXP : le workflow yml

Les cartes, animations, événements communs et configurations sont enregistrés par RMXP et Studio sous forme de fichiers `.rxdata`. Ce sont des fichiers **binaires** : quand deux makers modifient la même carte, Git ne sait pas fusionner les deux versions. Il ne peut qu'en garder une et jeter l'autre, donc quelqu'un perd toujours son travail.

PSDK résout ça avec un aller-retour entre `.rxdata` (binaire, utilisé par le jeu) et `.yml` (texte, utilisé par Git). On committe les `.yml`, on ignore les `.rxdata`, et on passe de l'un à l'autre en **double-cliquant** sur l'un des deux scripts à la racine du projet :

- `convert_rxdata_to_yml.bat` convertit les `.rxdata` en `.yml`. On double-clique dessus **avant chaque commit**, pour que la version texte qui arrive dans Git corresponde à ce qu'on vient de faire.
- `convert_yml_to_rxdata.bat` reconvertit les `.yml` en `.rxdata`. On double-clique dessus **après chaque pull**, pour que le jeu utilise les données que ses coéquipiers viennent de partager.

:::warning[Fermer RMXP et Studio d'abord]
Toujours **sauvegarder et fermer RMXP et Pokémon Studio avant de double-cliquer sur l'un ou l'autre script**, dans les deux sens. S'ils restent ouverts, les données qu'ils gardent en mémoire peuvent écraser les fichiers fraîchement convertis au moment où on sauvegarde, annulant silencieusement la conversion (et le travail du coéquipier). Le script ouvre une petite fenêtre de console qui se referme d'elle-même après une seconde ou deux ; pour confirmer que ça a marché, on vérifie que les fichiers `.yml` (ou `.rxdata`) viennent de changer, ou on lance le script depuis l'invite de commandes pour lire sa sortie si quelque chose semble anormal.
:::

La première fois qu'on clone le projet, les fichiers `.rxdata` n'existent pas encore (ils sont ignorés), donc le jeu planterait. Double-cliquer sur `convert_yml_to_rxdata.bat` une fois après le clone est **obligatoire** : cela reconstruit les `.rxdata` depuis les `.yml` committés.

La règle à retenir est courte :

- **Convertir avant de partager** (`convert_rxdata_to_yml.bat`, puis commit).
- **Restaurer après avoir reçu** (pull, puis `convert_yml_to_rxdata.bat`).

## Rejoindre un projet existant

Quand on rejoint un projet déjà hébergé sur GitHub ou GitLab, on le clone au lieu de le créer. Dans VS Code, on ouvre la **palette de commandes** (`Ctrl+Shift+P`), on lance **`Git: Clone`**, on colle l'URL du dépôt et on choisit où l'enregistrer.

Les fichiers `.rxdata` ne sont pas dans le dépôt (ils sont ignorés), donc le jeu ne peut pas encore se lancer. On fait ceci une fois, dans l'ordre :

1. Ouvrir le projet dans **Pokémon Studio** une fois, pour qu'il génère le bon `psdk.bat`, puis fermer Studio.
2. **Double-cliquer sur `convert_yml_to_rxdata.bat`** pour reconstruire les données binaires depuis les `.yml` committés.

Cette étape de restauration est **obligatoire** au premier clone, sinon le jeu plante faute de `.rxdata`. Ensuite, on est configuré exactement comme le reste de l'équipe.

## Workflow au quotidien

Une fois que tout le monde est configuré, la boucle quotidienne sur un projet partagé est toujours la même, et c'est surtout des clics. Supposons qu'on veuille ajouter une nouvelle carte.

**1. Récupérer la dernière version.** On vérifie que le nom de branche affiché dans la barre d'état (en bas de la fenêtre) est `main`, puis on lance **`Git: Pull`** depuis la palette de commandes (`Ctrl+Shift+P`). Une fois terminé, RMXP et Studio fermés, on **double-clique sur `convert_yml_to_rxdata.bat`** pour appliquer au jeu les dernières modifications de ses coéquipiers.

**2. Créer une branche.** On lance **`Git: Create Branch`** et on la nomme d'après la zone qu'on touche (voir [Ne pas se marcher dessus](#ne-pas-se-marcher-dessus)), par exemple `maps/nouvelle-ville`.

**3. Faire le travail** dans RMXP et Studio. Quand on est prêt à le partager, on sauvegarde et on **ferme RMXP et Studio**, puis on **double-clique sur `convert_rxdata_to_yml.bat`** pour transformer les données en texte.

**4. Committer et pousser.** Dans la vue Source Control, on indexe ses modifications avec le **+**, on tape un message comme `Add the new town map`, on lance **`Git: Commit`**, puis **`Git: Push`** pour envoyer la branche en ligne (le bouton bleu **Sync Changes** dans la barre d'état fait à la fois le pull et le push).

**5. Ouvrir la demande.** Juste après le push, GitHub affiche une bannière **Compare & pull request** et GitLab une bannière **Create merge request**. On clique dessus pour ouvrir une **Pull Request** (GitHub) ou une **Merge Request** (GitLab). Un coéquipier la relit, puis elle est fusionnée dans `main`.

**6. Tout le monde** lance **`Git: Pull`** dans VS Code, puis (RMXP et Studio fermés) double-clique sur `convert_yml_to_rxdata.bat` pour récupérer la carte.

Cette boucle garde `main` toujours fonctionnel et permet à plusieurs personnes d'avancer en parallèle, chacune sur sa branche.

## Ne pas se marcher dessus

Même avec le workflow `.yml`, deux personnes qui modifient la même carte en même temps produisent quand même un conflit pénible. La vraie solution est organisationnelle, pas technique. Ces règles viennent de la façon dont la démo technique de PSDK est maintenue.

**Nommer les branches par zone.** On préfixe la branche par la partie du projet qu'elle touche : `maps/`, `events/`, `texts/`, `resources/`. Par exemple `maps/nouvelle-ville`, `events/nouvelle-ville`, `texts/traduction-nouvelle-ville`, `resources/nouvelle-ui`. Tout le monde voit d'un coup d'oeil ce qu'une branche modifie.

**Une seule personne par carte et par catégorie.** Pour une carte donnée, le **mapping** (les tuiles) et l'**eventing** (les événements) sont deux travaux distincts. Une seule personne doit tenir chaque travail pour une carte donnée à un instant T :

- Autorisé : le maker A retravaille le mapping de la Map X pendant que le maker B travaille sur les événements de la Map X.
- Autorisé : le maker A fait le mapping de la Map X et aussi ses événements, car les changements de mapping obligent à adapter certains événements.
- Interdit : le maker A et le maker B modifient tous les deux le mapping de la Map X (l'un ajoute des tuiles animées, l'autre corrige quelque chose).
- Interdit : le maker A corrige des événements sur la Map X pendant que le maker B ajoute de nouveaux événements à la Map X.

**Communiquer avant de commencer.** On demande toujours si quelqu'un travaille déjà sur la carte qu'on veut toucher. La convention de nommage des branches aide, mais un petit message évite le reste.

**Faire les conversions Tiled sur sa propre branche.** Une conversion de carte Tiled modifie beaucoup de fichiers d'un coup. On la lance sur sa branche et on inclut le résultat dans le commit de cette branche, pour qu'elle n'entre jamais en collision avec la conversion de quelqu'un d'autre.

## Résoudre un conflit sur un fichier yml

Comme les cartes et les données sont versionnées en texte `.yml`, un conflit est désormais quelque chose qu'on peut réellement corriger au lieu de perdre un fichier. Quand un pull signale un conflit, les fichiers concernés apparaissent sous **Merge Changes** dans la vue Source Control de VS Code.

On recommande de résoudre les conflits dans **VS Code avec l'extension GitLens**. On ouvre un fichier `.yml` en conflit et on clique sur **Resolve in Merge Editor**. L'éditeur de fusion affiche les deux versions côte à côte, avec les boutons **Accept Current Change**, **Accept Incoming Change** et **Accept Both Changes** pour chaque bloc en conflit. GitLens ajoute l'auteur et l'historique de chaque côté, ce qui aide à décider lequel garder.

Une fois qu'un fichier est correct, on clique sur **Complete Merge** dans l'éditeur de fusion : le fichier passe dans les modifications indexées. Quand tous les conflits sont réglés, on lance **`Git: Commit`** pour terminer, puis (RMXP et Studio fermés) on **double-clique sur `convert_yml_to_rxdata.bat`** pour reconstruire les données binaires afin que le jeu reflète le résultat fusionné.

## Conclusion

- Un projet Pokémon Studio ne contient pas de dépôt Git par défaut. Avec un compte GitHub ou GitLab, on crée le dépôt vide, on ajoute un `.gitignore` **avant le premier commit**, puis on publie le projet depuis VS Code.
- Le `.gitignore` garde les fichiers source (`.yml`, scripts) et ignore tout ce qui est régénéré (runtime du moteur, `.rxdata` binaires) ou local (sauvegardes).
- Les données RMXP sont binaires et non fusionnables. PSDK les convertit en texte `.yml`, toujours RMXP et Studio fermés : double-clic sur `convert_rxdata_to_yml.bat` avant de partager, `convert_yml_to_rxdata.bat` après avoir reçu, et une fois après le premier clone (ouvrir d'abord le projet dans Studio pour générer `psdk.bat`).
- La boucle quotidienne : pull et restore, brancher, travailler, convert, commit, push, puis ouvrir une Pull Request ou Merge Request.
- Pour éviter les conflits, on nomme les branches par zone, on garde une seule personne par carte et par catégorie, on communique avant de commencer, et on lance les conversions Tiled sur sa propre branche.
- Les conflits sur les fichiers `.yml` se résolvent dans l'éditeur de fusion de VS Code, puis `convert_yml_to_rxdata.bat` reconstruit les données binaires.
