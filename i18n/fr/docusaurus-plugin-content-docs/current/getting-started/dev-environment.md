---
title: "Préparer son environnement de développement"
slug: preparer-son-environnement
sidebar_position: 1
description: "Avant de pouvoir écrire des scripts pour son projet PSDK, il faut installer Ruby, configurer un éditeur de code, et mettre en place l'autocomplétion pour avoir accès à la documentation et aux méthodes de PSDK pendant qu'on code. Ce guide couvre l'installation complète étape par étape."
---

Avant de pouvoir écrire des scripts pour son projet PSDK, il faut installer Ruby, configurer un éditeur de code, et mettre en place l'autocomplétion pour avoir accès à la documentation et aux méthodes de PSDK pendant qu'on code. Ce guide couvre l'installation complète étape par étape.

## Principe

L'environnement de développement PSDK repose sur trois piliers :

- **Ruby** : le langage dans lequel PSDK est écrit. Il faut l'installer sur sa machine.
- **Visual Studio Code (VSCode)** : l'éditeur de code recommandé. Avec les bonnes extensions, il offre l'autocomplétion, la documentation au survol, et le linting.
- **Solargraph** : un serveur de langage Ruby qui analyse le code PSDK et fournit l'autocomplétion. Il a besoin d'accéder au code source de PSDK pour fonctionner.

## Installer Ruby

1. Se rendre sur [rubyinstaller.org](https://rubyinstaller.org/downloads/).
2. Télécharger **Ruby 4.0.1** avec le devkit (version `Ruby+Devkit 4.0.1 (x64)`).
3. Lancer l'installeur et suivre les étapes. Quand MSYS2 est proposé, accepter l'installation.
4. Vérifier l'installation en ouvrant un terminal et en tapant la commande ci-dessous. Pour ouvrir un terminal, ouvrir le menu Démarrer, taper `cmd`, et appuyer sur Entrée : c'est l'**invite de commandes** (Command Prompt), le terminal utilisé dans tout ce guide (pas PowerShell).

```bash
ruby --version
```

La version affichée doit commencer par `4.0`.

## Installer Git

Git est l'outil de gestion de versions utilisé dans tout PSDK, et VS Code s'en sert pour toutes ses fonctions de gestion de versions. Sans lui, les étapes Git des guides suivants ne fonctionneront pas.

1. Télécharger [Git pour Windows](https://git-scm.com/download/win).
2. Lancer l'installeur. Les options par défaut conviennent : continuer à cliquer sur **Next**, puis **Install**.
3. Le vérifier dans l'invite de commandes :

```bash
git --version
```

Un numéro de version confirme que Git est installé. Fermer et rouvrir VS Code ensuite pour qu'il détecte Git.

## Installer Visual Studio Code

1. Télécharger [Visual Studio Code](https://code.visualstudio.com).
2. Installer et lancer VSCode.
3. Installer les extensions suivantes depuis le panneau Extensions (Ctrl+Shift+X) :
   - **Ruby Solargraph** : autocomplétion, documentation au survol, diagnostics.
   - **Ruby LSP** : support avancé du langage Ruby (highlighting, navigation, formatting).

## Installer les gems

Ouvrir un terminal **en mode administrateur** (clic droit sur l'invite de commandes, "Exécuter en tant qu'administrateur") et installer Solargraph et Ruby LSP :

```bash
gem install solargraph
gem install ruby-lsp
```

## Configurer VSCode

Ouvrir les paramètres JSON de VSCode : Ctrl+Shift+P, puis chercher "Preferences: Open User Settings (JSON)". Ajouter les lignes suivantes à l'intérieur des `{ }` existantes, en séparant chaque entrée par une virgule :

```json
"editor.tabSize": 2,
"solargraph.diagnostics": true,
"solargraph.formatting": false,
"rubyLsp.enabledFeatures": {
    "codeActions": true,
    "diagnostics": true,
    "documentHighlights": true,
    "documentLink": true,
    "documentSymbols": true,
    "foldingRanges": true,
    "formatting": true,
    "hover": true,
    "inlayHint": true,
    "onTypeFormatting": true,
    "selectionRanges": true,
    "semanticHighlighting": true,
    "completion": true,
    "codeLens": true,
    "definition": true,
    "workspaceSymbol": true,
    "signatureHelp": true,
    "typeHierarchy": true
},
"rubyLsp.formatter": "none",
"rubyLsp.rubyExecutablePath": "C:\\Ruby40-x64\\bin"
```

- Adapter le chemin `C:\\Ruby40-x64\\bin` au dossier `bin` de votre installation Ruby. Le nom du dossier RubyInstaller reflète la version installée (par exemple `C:\\Ruby40-x64` pour Ruby 4.0, `C:\\Ruby34-x64` pour Ruby 3.4).
- `editor.tabSize: 2` : PSDK utilise une indentation de 2 espaces.
- `solargraph.diagnostics: true` : active les diagnostics RuboCop via Solargraph.

## Rendre le code PSDK visible à Solargraph

Solargraph a besoin d'accéder au code source de PSDK pour proposer l'autocomplétion sur les classes du moteur (`Battle::Logic`, `GamePlay::Base`, `UI::SpriteStack`, etc.). Comme le code PSDK n'est pas directement dans le dossier `scripts/`, il faut indiquer à Solargraph où le trouver.

Il y a deux façons d'accéder au code PSDK, et le choix détermine comment les mises à jour fonctionnent :

- **Via le lien symbolique** : les fichiers pointent vers l'installation Pokémon Studio. Quand on met à jour PSDK depuis Pokémon Studio, ces fichiers sont mis à jour automatiquement.
- **Via le dépôt pokemonsdk** : le dépôt forké devient la source de vérité. Les mises à jour de PSDK ne sont **pas** automatiques — il faut synchroniser soi-même le dépôt avec l'officiel (voir [Contribuer à PSDK](/getting-started/utiliser-git-avec-psdk), section "Maintenir son fork à jour").

### Si le dépôt pokemonsdk est dans le projet

Si le dossier `pokemonsdk/` existe à la racine du projet (après avoir forké et cloné le dépôt, voir [Contribuer à PSDK](/getting-started/utiliser-git-avec-psdk)), le fichier `solargraph.yml` dans `scripts/` doit contenir :

```yaml
---
include:
  - "../pokemonsdk/**/*.rb"
  - ./**/*.rb
exclude:
  - spec/**/*
  - test/**/*
  - vendor/**/*
  - ".bundle/**/*"
require: []
domains: []
reporters:
  - rubocop
  - require_not_found
formatter:
  rubocop:
    cops: safe
    except: []
    only: []
    extra_args: []
require_paths: []
plugins: []
max_files: 5000
```

- `"../pokemonsdk/**/*.rb"` : indique à Solargraph d'inclure tous les fichiers Ruby du dépôt pokemonsdk. C'est le chemin relatif depuis `scripts/`.
- `./**/*.rb` : inclut aussi tous les scripts utilisateur dans `scripts/`.

### Si le dépôt n'est pas dans le projet

Pour un projet sans fork du dépôt, les scripts PSDK sont embarqués en interne par Pokémon Studio. Il faut créer un **lien symbolique** pour que Solargraph puisse y accéder.

Ouvrir **cmd** (invite de commandes) **en mode administrateur**, se placer dans le dossier `scripts/` du projet, et créer le lien :

```bash
cd C:\chemin\vers\votre-projet\scripts
mklink /D psdk_scripts "%temp%\..\Programs\pokemon-studio\resources\psdk-binaries\pokemonsdk\scripts"
```

- `mklink /D` crée un lien symbolique de dossier. Le mode administrateur est requis. Cette commande est propre à cmd (ne pas utiliser PowerShell).
- `psdk_scripts` est le nom du dossier virtuel qui apparaîtra dans `scripts/`. Ne pas y mettre ses propres scripts.
- Le chemin cible pointe vers les sources Ruby de PSDK dans l'installation Pokémon Studio. `%temp%` permet d'atteindre le dossier `Programs` de l'utilisateur.

Vérifier que le lien a fonctionné : ouvrir le nouveau dossier `scripts/psdk_scripts` dans l'explorateur de fichiers, il doit afficher les fichiers `.rb` de PSDK. S'il est vide, Pokémon Studio est installé ailleurs sur la machine ; adapter le chemin cible pour qu'il pointe vers son dossier `resources/psdk-binaries/pokemonsdk/scripts`.

Ensuite, adapter le `solargraph.yml` pour inclure ce lien :

```yaml
---
include:
  - "psdk_scripts/**/*.rb"
  - ./**/*.rb
```

Le reste du fichier reste identique.

### Générer le fichier solargraph.yml

Si le fichier `solargraph.yml` n'existe pas encore dans `scripts/`, le générer. Dans **cmd**, depuis la **racine du projet** :

```bash
cd scripts
solargraph config
```

Puis modifier le fichier généré pour ajouter le chemin vers PSDK dans la section `include`.

## Configurer RuboCop

RuboCop vérifie que le code respecte les conventions de PSDK (retours explicites, pas de `for`, etc.). La configuration est dans le fichier `.rubocop.yml`. Si ce fichier n'existe pas dans `scripts/`, le copier. On lance la commande dans **cmd**, depuis la **racine du projet**.

Si on a forké le dépôt pokemonsdk, le copier depuis celui-ci :

```bash
copy pokemonsdk\scripts\.rubocop.yml scripts\.rubocop.yml
```

Pour un projet Pokémon Studio standard, le copier depuis le lien symbolique créé plus tôt (donc uniquement après que le lien existe) :

```bash
copy scripts\psdk_scripts\.rubocop.yml scripts\.rubocop.yml
```

RuboCop s'active automatiquement via Solargraph. Les lignes de code qui ne respectent pas les conventions seront soulignées en bleu dans VSCode.

## Ouvrir le bon dossier dans VSCode

Toujours ouvrir le dossier `scripts/` dans VSCode, pas la racine du projet. Dans **cmd**, depuis la **racine du projet** :

```bash
code scripts
```

C'est dans ce dossier que Solargraph et RuboCop cherchent leurs fichiers de configuration (`solargraph.yml`, `.rubocop.yml`). Si on ouvre un autre dossier, l'autocomplétion et le linting ne fonctionneront pas.

Si Solargraph ne se lance pas correctement après l'ouverture, le redémarrer manuellement : Ctrl+Shift+P, puis chercher "Restart Solargraph".

## Tester l'environnement

Pour vérifier que tout fonctionne, créer un script de test dans `scripts/` :

```ruby
# Get the name of a Pokemon from its db_symbol
# @param db_symbol [Symbol] the db_symbol of the Pokemon
# @return [String] the name of the Pokemon
def pokemon_name(db_symbol)
  return data_creature(db_symbol).name
end
```

- En tapant `data_`, Solargraph doit proposer `data_creature` en autocomplétion. Si c'est le cas, l'environnement est correctement configuré.
- En survolant `pokemon_name` avec la souris, VSCode doit afficher la documentation YARD (description, paramètre, retour).
- Si des lignes sont soulignées en bleu, RuboCop fonctionne. Corriger les avertissements pour vérifier que la configuration PSDK est bien active.

Pour tester en jeu, lancer le projet. Dans **cmd**, depuis la **racine du projet** :

```bash
psdk debug skip_title
```

Charger une partie, puis appeler la méthode dans la console de debug :

```
pokemon_name(:pikachu)
```

Si la console affiche "Pikachu", tout est en place.

## GitLens (optionnel)

Quand on travaille à plusieurs (voir [Travailler à plusieurs sur un projet PSDK](/getting-started/travailler-a-plusieurs-sur-un-projet-psdk)), l'extension **GitLens** est un ajout utile à VSCode. Elle affiche, directement dans l'éditeur, qui a modifié chaque ligne en dernier, l'historique d'un fichier et les contributeurs du projet, ce qui aide à coordonner le travail et à résoudre les conflits.

On l'installe depuis le panneau Extensions (Ctrl+Shift+X) en cherchant **GitLens**.

On peut aussi choisir quelles vues GitLens apparaissent dans le panneau **Source Control**, en ajoutant le paramètre suivant à ses paramètres JSON. Pour chaque vue, `false` la garde visible et `true` la masque, donc la configuration ci-dessous masque les vues **Contributors** et **Tags** et garde les autres :

```json
"gitlens.views.scm.grouped.views": {
    "branches": false,
    "commits": false,
    "contributors": true,
    "launchpad": false,
    "remotes": false,
    "repositories": false,
    "searchAndCompare": false,
    "stashes": false,
    "tags": true,
    "worktrees": false
}
```

## Conclusion

- Installer Ruby 4.0.1 avec le devkit, puis les gems `solargraph` et `ruby-lsp`.
- Installer VSCode avec les extensions Ruby Solargraph et Ruby LSP. Configurer les paramètres JSON pour le tabsize, les diagnostics, et le chemin Ruby.
- Rendre le code PSDK visible à Solargraph via le `solargraph.yml` : soit un chemin relatif vers `pokemonsdk/`, soit un lien symbolique `psdk_scripts/`.
- Copier le `.rubocop.yml` de PSDK dans `scripts/` pour que RuboCop utilise les conventions du projet.
- Toujours ouvrir le dossier `scripts/` dans VSCode pour que Solargraph et RuboCop trouvent leurs configurations.
- Optionnellement, installer **GitLens** pour l'historique Git, le blame et les informations de contributeurs, utile quand on collabore sur un projet.
