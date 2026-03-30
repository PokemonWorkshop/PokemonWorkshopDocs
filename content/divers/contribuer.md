---
title: "Comment contribuer à la documentation ?"
slug: contribuer
sidebar_position: 1
description: "Ce guide explique comment ajouter ou modifier des pages de documentation, les conventions de style à respecter, et le workflow de contribution via Pull Request."
---

Ce guide explique comment ajouter ou modifier des pages de documentation, les conventions de style à respecter, et le workflow de contribution via Pull Request.

## Prérequis

- [Git](https://git-scm.com/) installé et configuré (voir le guide [Comment utiliser Git avec PSDK ?](/utiliser-git-avec-psdk)).
- [Bun](https://bun.sh/) installé pour lancer le site en local.
- Un compte GitHub avec accès au dépôt [PokemonWorkshop/pokemon-workshop-docs](https://github.com/PokemonWorkshop/pokemon-workshop-docs).

## Lancer le site en local

Cloner le dépôt et installer les dépendances :

```bash
git clone git@github.com:PokemonWorkshop/pokemon-workshop-docs.git
cd pokemon-workshop-docs/docs
bun install
```

Lancer le serveur de développement :

```bash
bun start
```

Le site est accessible sur `http://localhost:3000`. Les modifications sont rechargées automatiquement.

## Structure du projet

La documentation est dans le dossier `content/`, organisée par section :

```
content/
├── index.md                  # Page d'accueil
├── getting-started/          # Démarrage
├── ruby-course/              # Cours Ruby
├── rpg-maker/                # RPG Maker
├── psdk/                     # PSDK (battle-engine, ui-development)
│   ├── battle-engine/
│   └── ui-development/
├── studio/                   # Studio
├── tiled/                    # Tiled
└── divers/                   # Guides divers
```

Chaque dossier contient un fichier `_category_.json` qui définit le label et la position de la section dans la sidebar. La sidebar est générée automatiquement depuis l'arborescence.

## Ajouter une page

### Créer le fichier

Créer un fichier `.md` dans le dossier de la section appropriée. Le nom du fichier détermine l'URL par défaut (sauf si un `slug` est défini dans le frontmatter).

Pour ordonner les pages dans la sidebar, préfixer le nom du fichier avec un numéro : `01-mon-sujet.md`, `02-autre-sujet.md`.

### Frontmatter obligatoire

Chaque page commence par un bloc frontmatter YAML :

```markdown
---
title: "Titre de la page sous forme de question"
slug: slug-url-de-la-page
sidebar_position: 1
description: "Description concise du contenu. Cette description est reprise comme premier paragraphe de la page."
---
```

- **title** : toujours formulé sous forme de question (`"Comment faire X ?"`, `"Qu'est-ce que X ?"`). Entouré de guillemets.
- **slug** : l'identifiant URL de la page, en kebab-case, sans accent. Pas de slash au début.
- **sidebar_position** : position dans la section (1, 2, 3...). Vérifier les positions existantes pour éviter les doublons.
- **description** : résumé du contenu en une ou deux phrases. Ce texte est répété tel quel comme premier paragraphe du corps de la page.

### Premier paragraphe

Le premier paragraphe après le frontmatter reprend mot pour mot la `description`. Cela assure la cohérence entre les aperçus (listes, moteur de recherche) et le contenu de la page.

### Ajouter une section

Pour créer une nouvelle section (un nouveau dossier dans `content/`), ajouter un fichier `_category_.json` :

```json
{
  "label": "Nom de la section",
  "position": 8,
  "link": {
    "type": "generated-index"
  }
}
```

Ajuster `position` pour placer la section au bon endroit dans la sidebar.

## Modifier une page existante

Ouvrir le fichier `.md` correspondant, apporter les modifications, et vérifier le rendu en local avec `bun start`. S'assurer que les liens internes fonctionnent toujours après la modification.

## Conventions de style

### Langue et ton

- Rédiger en **français**.
- Utiliser le **on** impersonnel plutôt que "vous" ou "tu" : _"On crée un commit"_, pas _"Vous créez un commit"_.
- Ton direct et pédagogique. Expliquer le **pourquoi**, pas seulement le **comment**.

### Structure d'une page

1. **Frontmatter** avec title, slug, sidebar_position, description.
2. **Paragraphe d'introduction** (identique à la description).
3. **Sections `##`** pour les grandes parties.
4. **Sous-sections `###`** si nécessaire. Ne pas descendre en dessous de `###`.
5. **Section `## Conclusion`** en fin de page : liste à puces résumant les points clés.

### Formatage

- **Gras** pour les noms de concepts, de boutons, ou de menus : _Cliquer sur **Add key**_.
- `Code inline` pour les noms de fichiers, commandes, méthodes, variables : _Le fichier `solargraph.yml`_.
- Blocs de code avec la langue spécifiée :

````markdown
```ruby
def example
  puts "Hello"
end
```
````

Les langues supportées sont : `ruby`, `bash`, `json`, `yaml`, `markdown`.

- Tableaux Markdown pour les données tabulaires (commandes, comparaisons).
- Listes à puces avec tiret (`-`), pas d'astérisque.
- Indentation de 2 espaces dans les blocs de code Ruby.
- Une ligne vide avant et après chaque titre, bloc de code, et tableau.

### Liens internes

Utiliser des chemins relatifs ou des slugs pour les liens entre pages :

```markdown
Voir le guide [Comment utiliser Git avec PSDK ?](/utiliser-git-avec-psdk).
```

Ne pas utiliser de chemins de fichiers (`content/getting-started/using-git.md`).

### Images

Placer les images dans `static/img/` dans un sous-dossier correspondant à la section. Référencer avec un chemin absolu :

```markdown
![Description de l'image](/img/ma-section/mon-image.png)
```

Formats acceptés : PNG, SVG. Préférer SVG pour les diagrammes.

## Workflow de contribution

### 1. Créer une branche

Depuis `main` à jour :

```bash
git checkout main
git pull
git checkout -b docs/sujet-de-la-page
```

Nommer la branche `docs/` suivi d'un résumé court en kebab-case.

### 2. Écrire et vérifier

- Rédiger la page en suivant les conventions ci-dessus.
- Vérifier le rendu en local avec `bun start`.
- Vérifier que le build passe sans erreur :

```bash
bun run build
```

### 3. Committer

Un commit par changement logique. Message en anglais, concis, au présent :

```bash
git add content/psdk/battle-engine/17-new-topic.md
git commit -m "Add guide for new battle engine topic"
```

### 4. Pousser et ouvrir une Pull Request

```bash
git push -u origin docs/sujet-de-la-page
```

Ouvrir une Pull Request sur GitHub vers `main`. Dans la description :

- Résumer le contenu ajouté ou modifié.
- Mentionner les sections impactées.
- Ajouter une capture d'écran du rendu si c'est une nouvelle page.

### 5. Revue et merge

Un reviewer vérifie :

- Le respect des conventions de style.
- L'exactitude technique du contenu.
- Le bon fonctionnement des liens et du build.

Après approbation, la PR est mergée dans `main`.

## Conclusion

- La documentation est dans `content/`, organisée par section avec une sidebar autogénérée.
- Chaque page a un frontmatter avec title (sous forme de question), slug, sidebar_position et description.
- Rédiger en français, au "on", avec un ton pédagogique. Expliquer le pourquoi.
- Vérifier le rendu en local (`bun start`) et le build (`bun run build`) avant de soumettre.
- Contribuer via une branche `docs/...`, un commit propre, et une Pull Request relue avant merge.
