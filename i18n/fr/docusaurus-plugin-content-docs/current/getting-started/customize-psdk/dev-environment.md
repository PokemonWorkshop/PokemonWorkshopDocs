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

Git est l'outil de gestion de versions utilisé dans tout PSDK, et VSCode s'en sert pour toutes ses fonctions de gestion de versions. Sans lui, les étapes Git des guides suivants ne fonctionneront pas.

1. Télécharger [Git pour Windows](https://git-scm.com/download/win).
2. Lancer l'installeur. Les options par défaut conviennent : continuer à cliquer sur **Next**, puis **Install**.
3. Le vérifier dans **cmd**, depuis n'importe quel dossier :

```bash
git --version
```

Un numéro de version confirme que Git est installé.

4. Configurer son identité pour que Git puisse signer chaque commit avec un auteur. Toujours dans **cmd**, depuis n'importe quel dossier :

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre-email@example.com"
```

Utiliser la même adresse e-mail que son compte GitHub ou GitLab pour que ses commits soient rattachés à son profil. L'option `--global` l'applique à tous les dépôts de la machine, donc on ne le fait qu'une fois.

## Installer Visual Studio Code

1. Télécharger [Visual Studio Code](https://code.visualstudio.com).
2. Installer et lancer VSCode.
3. Installer les extensions suivantes depuis le panneau Extensions (Ctrl+Shift+X) :
   - **Ruby Solargraph** : autocomplétion, documentation au survol, diagnostics.
   - **Ruby LSP** : support avancé du langage Ruby (highlighting, navigation, formatting).

## Installer les gems

Ouvrir **cmd** **en mode administrateur** (clic droit sur l'entrée invite de commandes, "Exécuter en tant qu'administrateur") et installer Solargraph et Ruby LSP :

```bash
gem install solargraph
gem install ruby-lsp
```

## Configurer VSCode

Ouvrir les **paramètres utilisateur JSON** : Ctrl+Shift+P, puis exécuter "Preferences: Open User Settings (JSON)". Ajouter les lignes suivantes à l'intérieur des `{ }` existantes, en séparant chaque entrée par une virgule :

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

- Adapter le chemin `C:\\Ruby40-x64\\bin` au dossier `bin` de son installation Ruby. Le nom du dossier RubyInstaller reflète la version installée (par exemple `C:\\Ruby40-x64` pour Ruby 4.0, `C:\\Ruby34-x64` pour Ruby 3.4).
- `editor.tabSize: 2` : PSDK utilise une indentation de 2 espaces.
- `solargraph.diagnostics: true` : active les diagnostics RuboCop via Solargraph.

## Rendre le code PSDK visible à Solargraph

Solargraph a besoin d'accéder au code source de PSDK pour proposer l'autocomplétion sur les classes du moteur (`Battle::Logic`, `GamePlay::Base`, `UI::SpriteStack`, etc.). Comme le code PSDK n'est pas directement dans le dossier `scripts/`, il faut indiquer à Solargraph où le trouver.

Il y a deux façons d'accéder au code PSDK, et le choix détermine comment les mises à jour fonctionnent :

- **Via le dépôt pokemonsdk** : le dépôt forké devient la source de vérité. Les mises à jour de PSDK ne sont **pas** automatiques — il faut synchroniser soi-même le dépôt avec l'officiel (voir [Contribuer à PSDK](/misc/utiliser-git-avec-psdk), section "Maintenir son fork à jour").
- **Via le lien symbolique** : les fichiers pointent vers l'installation Pokémon Studio. Quand on met à jour PSDK depuis Pokémon Studio, ces fichiers sont mis à jour automatiquement.

### Générer le fichier solargraph.yml

Les deux cas ci-dessous éditent `scripts/solargraph.yml`. Si ce fichier n'existe pas encore, le générer d'abord. Dans **cmd**, depuis la **racine du projet** :

```bash
cd scripts
solargraph config
```

Ensuite, suivre le cas qui correspond au projet pour remplir la section `include`.

### Si le dépôt pokemonsdk est dans le projet

Si le dossier `pokemonsdk/` existe à la racine du projet (après avoir forké et cloné le dépôt, voir [Contribuer à PSDK](/misc/utiliser-git-avec-psdk)), le fichier `solargraph.yml` dans `scripts/` doit contenir :

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

Ouvrir **cmd** **en mode administrateur**, se placer dans le dossier `scripts/` du projet, et créer le lien :

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

### Vérifier que le code est bien analysé

À l'ouverture du dossier, les deux serveurs de langage démarrent et analysent les fichiers Ruby. Au premier lancement, cette analyse peut prendre un moment (plus longtemps sur une machine lente), et l'autocomplétion comme la documentation au survol restent vides tant qu'elle n'est pas finie. Un résultat vide signifie généralement que l'analyse est encore en cours, pas que la configuration est cassée. Il y a deux façons de suivre son avancement :

- **Ruby LSP** affiche sa progression dans la barre d'état en bas de la fenêtre ("Initializing Ruby LSP", puis un indicateur d'indexation).
- **Solargraph** (le serveur qui lit `solargraph.yml` et fournit l'autocomplétion du moteur PSDK) n'utilise pas la barre d'état. Ouvrir le panneau Output (Ctrl+Shift+U, ou menu View puis Output) et sélectionner **Ruby Language Server** dans la liste déroulante : son journal montre l'analyse en cours et toute erreur de configuration, par exemple un mauvais chemin dans `solargraph.yml`.

Si l'autocomplétion n'affiche toujours rien une fois l'analyse terminée, redémarrer Solargraph : Ctrl+Shift+P, puis exécuter "Restart Solargraph".

## Comment PSDK charge les scripts

Configurer Solargraph n'affecte que l'éditeur. Cela ne change pas quels fichiers PSDK exécute réellement. Le moteur ne charge un script de `scripts/` que si son nom commence par **3 à 5 chiffres, puis un espace, puis le nom**, par exemple :

```
001 Test.rb
```

Un fichier nommé `test.rb` ou `pokemon_name.rb` est ignoré par le moteur : Solargraph l'autocomplète quand même, mais il ne s'exécute jamais en jeu, ce qui est une source fréquente de confusion. Les scripts officiels de PSDK utilisent 3 chiffres ; 4 ou 5 fonctionnent aussi, donc les anciens projets numérotés sur 5 chiffres continuent de se charger. Un underscore est accepté à la place de l'espace (`001_Test.rb`), mais la convention est l'espace.

PSDK charge ces fichiers dans l'ordre croissant de leur numéro, puis alphabétique à numéro égal. Le numéro contrôle donc l'ordre de chargement :

- Deux fichiers indépendants peuvent partager le même numéro sans aucun conflit : `007 James.rb` et `007 Bond.rb` se chargent tous les deux (Bond avant James, par ordre alphabétique).
- Si un fichier dépend d'une classe ou d'une constante définie dans un autre, le fichier dont il dépend doit avoir le plus petit numéro. Charger `020 Battler.rb` avant le `010 Creature.rb` dont il a besoin provoque un crash au démarrage.

Les sous-dossiers de `scripts/` suivent la même logique : PSDK ne descend que dans un sous-dossier dont le nom commence aussi par un nombre (par exemple `001 My Plugin/`), et les fichiers d'un dossier se chargent avant ceux de ses sous-dossiers numérotés.

## Tester l'environnement

Pour vérifier que tout fonctionne, créer un script de test nommé `001 Test.rb` dans `scripts/` (le préfixe numérique est requis pour que PSDK le charge en jeu, voir la section précédente) :

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

On peut aussi choisir quelles vues GitLens apparaissent dans la vue **Source Control**, en ajoutant le paramètre suivant aux mêmes **paramètres utilisateur JSON** que plus haut, à l'intérieur des `{ }` existantes. Pour chaque vue, `false` la garde visible et `true` la masque, donc la configuration ci-dessous masque les vues **Contributors** et **Tags** et garde les autres :

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
- Installer VSCode avec les extensions Ruby Solargraph et Ruby LSP. Configurer les paramètres utilisateur JSON pour le tabsize, les diagnostics, et le chemin Ruby.
- Rendre le code PSDK visible à Solargraph via le `solargraph.yml` : soit un chemin relatif vers `pokemonsdk/`, soit un lien symbolique `psdk_scripts/`.
- Copier le `.rubocop.yml` de PSDK dans `scripts/` pour que RuboCop utilise les conventions du projet.
- Toujours ouvrir le dossier `scripts/` dans VSCode pour que Solargraph et RuboCop trouvent leurs configurations.
- Nommer chaque script `NNN Nom.rb` (3 à 5 chiffres puis un espace) pour que PSDK le charge ; le numéro fixe l'ordre de chargement.
- Optionnellement, installer **GitLens** pour l'historique Git, le blame et les informations de contributeurs, utile quand on collabore sur un projet.
