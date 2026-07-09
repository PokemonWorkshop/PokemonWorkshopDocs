---
title: "Traduire son jeu avec des fichiers CSV"
slug: traduire-son-jeu-avec-csv
sidebar_position: 3
description: "PSDK garde chaque ligne de dialogue des events dans des fichiers CSV où chaque colonne est une langue. Ce guide explique comment extraire le texte de son jeu vers ces fichiers avec l'outil eventtext2csv, le traduire dans Pokémon Studio, et laisser le joueur changer de langue en jeu."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK garde chaque ligne de dialogue des events dans des **fichiers CSV** où chaque colonne est une langue. Ce guide explique comment extraire le texte de son jeu vers ces fichiers avec l'outil **eventtext2csv**, le traduire dans **Pokémon Studio**, et laisser le joueur changer de langue en jeu.

## Le principe

Un jeu multilingue ne peut pas dupliquer chaque event une fois par langue : les maps deviendraient impossibles à maintenir, et corriger une seule faute de frappe obligerait à la corriger dans toutes les langues à la main. PSDK résout ça en sortant le texte des dialogues **hors** des events. Chaque ligne vit dans un fichier CSV sous `Data/Text/Dialogs/`, où chaque **ligne** est une réplique et chaque **colonne** est une langue. Un event ne contient plus la phrase elle-même, seulement une **référence** vers une ligne. À l'exécution, le moteur lit la colonne qui correspond à la langue du joueur et l'affiche.

Le workflow tient donc en quatre étapes : écrire son jeu une seule fois dans une langue, extraire tout son texte vers des fichiers CSV, le traduire dans Pokémon Studio, puis déclarer les langues que le joueur peut choisir.

## Étape 1 : écrire son jeu dans une seule langue

On construit son jeu dans RMXP comme d'habitude, en écrivant chaque dialogue en texte clair dans sa langue source, celle dans laquelle on rédige. Une commande **Show Text** contient simplement la phrase lisible, exactement telle que le joueur la verra. Inutile de penser à la traduction pour l'instant : l'extraction vient plus tard, une fois le contenu en place. La phase d'écriture reste ainsi rapide et on se concentre sur le jeu lui-même.

## Étape 2 : extraire le texte avec eventtext2csv

PSDK fournit un outil, **eventtext2csv**, qui parcourt chaque map, collecte le texte de chaque message et de chaque choix, l'écrit dans des fichiers CSV, et réécrit chaque event pour qu'il pointe vers la ligne correspondante. On obtient un fichier CSV par map, nommé d'après la map : le moteur utilise l'id `1000 + id_de_la_map`, donc la map 5 produit `Data/Text/Dialogs/1005.csv`.

On le lance depuis le dossier du projet, le projet étant **non compilé** pour que le code source soit disponible (voir [Préparer son environnement de développement](/getting-started/customize-psdk/preparer-son-environnement)) :

```bash
psdk --util=eventtext2csv
```

L'outil demande quelles langues préparer, sous forme d'une liste de codes séparés par des virgules (par exemple `en,fr,it,de,es`). On appuie sur **Entrée** pour utiliser toutes les langues que le projet déclare comme disponibles. Il crée alors une colonne par langue dans chaque fichier.

Quelques points utiles à savoir :

- Il ne touche qu'aux events qui contiennent du texte. Une map sans dialogue ne produit aucun fichier.
- Il est **idempotent** : une ligne qui pointe déjà vers une ligne de CSV est laissée intacte. On peut écrire de nouveaux events plus tard et relancer l'outil pour n'extraire que le nouveau texte.
- Après extraction, l'event affiche toujours la phrase d'origine dans RMXP (l'outil la conserve après la référence, comme rappel), mais à l'exécution seule la référence est lue.
- L'id de base `1000` peut être décalé avec la variable d'environnement `TEXT_EVENT_OFFSET`, mais la valeur par défaut convient à la plupart des projets.

:::note

L'outil est interactif (il lit la réponse dans la console) et n'existe que dans un projet non compilé. Il n'est pas disponible dans un build de sortie.

:::

## Étape 3 : traduire le texte dans Pokémon Studio

Une fois le texte extrait, on le traduit dans **Pokémon Studio**, qui édite les fichiers de texte de PSDK via une interface dédiée, de sorte qu'on n'ouvre jamais un CSV soi-même. On ouvre son projet et on clique sur **Gestion des textes** dans la barre de navigation à gauche. Elle comporte deux onglets :

- L'onglet **Textes** liste chaque fichier de texte par son numéro. On choisit celui de sa map, par exemple `1005`, pour voir ses entrées dans la langue source. De là, on peut éditer une ligne, ajouter une nouvelle entrée ou faire une recherche dans le fichier.
- L'onglet **Traduction** est l'endroit où l'on traduit : il affiche une entrée à la fois, avec la langue source d'un côté et un champ pour chaque autre langue. On remplit chaque traduction, on choisit la langue cible, et on passe à l'entrée suivante.

Studio enregistre directement dans les fichiers de texte du jeu. En développement, relancer le jeu suffit à voir le nouveau texte : PSDK recompile les fichiers modifiés automatiquement, sans étape de build manuelle.

## Étape 4 : laisser le joueur choisir la langue

On déclare les langues que le jeu propose dans Pokémon Studio, sur la page **Langue**. On y accède via le bouton **Gérer les langues** de la page Gestion des textes, puis on choisit la **Langue par défaut**, les langues disponibles en jeu et les éventuelles autres langues de traduction.

Studio enregistre ça dans `Data/configs/language_config.json` :

```json
{
  "defaultLanguage": "en",
  "choosableLanguageCode": ["en", "fr"],
  "choosableLanguageTexts": ["English", "Français"]
}
```

- `defaultLanguage` est le code utilisé avant que le joueur ait fait un choix.
- `choosableLanguageCode` liste les codes entre lesquels le joueur peut basculer.
- `choosableLanguageTexts` est le libellé affiché pour chacun, dans le même ordre.

Le joueur change alors de langue depuis le menu **Options** en jeu ; le moteur recharge tous les textes dans la langue choisie, et le choix est conservé dans les options du joueur.

:::note

Ce guide couvre la traduction du texte rédigé dans les events RMXP. Pour lire ces textes depuis ses propres scripts Ruby, voir [Ajouter du texte multilingue](/psdk/ui-development/mystery-gift/ajouter-du-texte-multilingue).

:::

## Conclusion

- Le dialogue des events n'est pas stocké dans les events mais dans les **fichiers de texte** de PSDK, avec une entrée par ligne et une **langue par colonne**.
- On écrit son jeu dans une langue, puis on lance **`psdk --util=eventtext2csv`** pour extraire chaque message et chaque choix vers des fichiers par map (`1000 + id_de_la_map`) et réécrire les events en références.
- On **traduit** le texte extrait dans l'éditeur Gestion des textes de **Pokémon Studio** ; le mode développement recompile les fichiers modifiés automatiquement.
- On déclare les langues proposées sur la page **Langue** de Studio ; le joueur bascule depuis le menu **Options** et le choix est sauvegardé.
