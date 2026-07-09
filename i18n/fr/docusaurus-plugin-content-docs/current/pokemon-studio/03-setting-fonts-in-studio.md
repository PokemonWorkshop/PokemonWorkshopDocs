---
title: "Configurer les polices, tailles et textes par scène"
slug: configurer-les-polices
sidebar_position: 3
description: "Pokémon Studio permet d'ajouter des polices personnalisées, de définir des tailles de texte supplémentaires et de choisir la police utilisée par les messages et les choix. Ce guide explique où se règlent les polices, comment définir la police par défaut via son ID, et comment attribuer des polices précises à des scènes et aux choix."
---

Pokémon Studio permet d'ajouter des polices personnalisées, de définir des tailles de texte supplémentaires et de choisir la police utilisée par les messages et les choix. Ce guide explique où se règlent les polices, comment définir la police par défaut via son ID, et comment attribuer des polices précises à des scènes et aux choix.

## Où se configurent les polices

Tout ce qui concerne les polices se trouve dans **Tableau de bord > Textes**, dans le groupe **Paramètres généraux**. Enregistrer cet écran écrit le fichier `Data/configs/texts_config.json` du projet, c'est lui que PSDK lit à l'exécution.

La page se divise en quatre zones :

- **Polices** : les polices disponibles dans le jeu, chacune adossée à un fichier `.ttf`.
- **Tailles alternatives** : des profils de taille réutilisables, sans avoir à ajouter un nouveau fichier de police.
- **Messages** : la mise en forme du texte dans les fenêtres de message, dont la police utilisée.
- **Choix** : les mêmes réglages pour les fenêtres de choix.

L'idée clé à garder en tête : dans le reste de la configuration, une police n'est jamais désignée par son nom mais par son **ID**. Chaque endroit qui choisit une police (la police par défaut, la police de message d'une scène, la police des choix) enregistre un ID de police, pas un nom de fichier. C'est ce qui rend le reste de l'écran, et l'astuce de la police par défaut ci-dessous, compréhensible.

La section **Polices** propose aussi un interrupteur **Utiliser des caractères spéciaux pour les nombres**. On le laisse activé si la police fournit ses propres glyphes pour les chiffres (la plupart des polices PSDK le font) ; il n'a aucun effet sur le choix de la police, seulement sur le rendu des nombres.

## Ajouter une nouvelle police

Dans Studio, une police est constituée de deux éléments qui doivent concorder : un fichier `.ttf` sur le disque et une entrée dans le tableau **Polices**.

1. Copier le fichier `.ttf` dans le dossier `Fonts/` du projet (par exemple `Fonts/MaPolice.ttf`).
2. Dans **Tableau de bord > Textes**, section **Polices**, cliquer sur **Ajouter une police d'écriture**.
3. Remplir les champs, puis cliquer sur **Ajouter la police d'écriture** :
   - **ID** : un numéro unique pour cette police. C'est par lui que le reste du jeu la désigne.
   - **Nom** : le nom du fichier **sans** l'extension `.ttf`. Il doit correspondre exactement au fichier, donc `MaPolice` pour `Fonts/MaPolice.ttf`.
   - **Taille** : la taille de rendu en pixels.
   - **Hauteur de ligne** : l'espace vertical occupé par une ligne, en pixels.

La nouvelle police apparaît dans le tableau sous forme de ligne. Dans `texts_config.json`, c'est une entrée de `fonts.ttfFiles` :

```json
{
  "id": 30,
  "name": "MaPolice",
  "size": 16,
  "lineHeight": 20
}
```

Studio garde le tableau trié par **ID** et signale un ID déjà utilisé : deux polices ne peuvent donc pas partager un numéro. Si le **Nom** ne correspond à aucun fichier réel de `Fonts/`, la police ne se chargera pas en jeu, même si Studio accepte l'entrée.

## Définir la police par défaut

PSDK utilise la police d'**ID 0** comme police par défaut : partout où le jeu dessine du texte sans demander de police précise, il se rabat sur la police 0. Le projet de base livre `PokemonDS` à l'ID 0. Changer « la police du jeu » ne revient donc pas à modifier une seule liste déroulante, mais à faire de **votre** police celle qui porte l'ID 0.

C'est la manipulation cachée que l'écran n'explicite pas. On ne peut pas simplement attribuer l'ID 0 à sa police tant qu'une autre police occupe le 0, car Studio refuse les ID en double. Il faut **échanger** les deux ID, en se servant d'un numéro libre comme étape intermédiaire :

1. Donner un ID libre temporaire à la police 0 actuelle (par exemple faire passer `PokemonDS` de `0` à `99`).
2. Attribuer l'ID `0` à votre police. Elle devient la police par défaut.
3. Optionnellement, donner un ID définitif à l'ancienne police en l'éditant de nouveau (par exemple déplacer `PokemonDS` de `99` à `30`), pour qu'elle reste disponible pour les scènes qui en ont besoin.

Comme le tableau se retrie par ID après chaque modification, on suit les lignes par leur nom plutôt que par leur position pendant l'échange. Une fois votre police installée à l'ID 0, tout message, choix ou élément d'interface qui n'a pas demandé de police précise l'utilisera.

## Créer des tailles supplémentaires

Une entrée de police porte déjà une **Taille** et une **Hauteur de ligne**. Lorsqu'on a besoin du *même* rendu à une taille différente, inutile d'ajouter un second `.ttf`. La section **Tailles alternatives** permet de définir des profils de taille autonomes, chacun identifié par son propre ID.

Dans la section **Tailles alternatives**, cliquer sur **Ajouter une taille alternative**, remplir **ID**, **Taille** et **Hauteur de ligne** (il n'y a pas de nom, puisqu'aucun fichier n'est en jeu), puis cliquer sur **Ajouter la taille alternative**.

```json
{
  "id": 2,
  "size": 22,
  "lineHeight": 26
}
```

Ces profils ne portent pas de police propre. Ce sont des surcharges de taille que le moteur et les scripts appliquent à du texte existant quand un ID de taille précis est demandé. Comme pour les polices, les ID doivent être uniques et la liste reste triée.

## Attribuer une police à une scène précise

La section **Messages** pilote les fenêtres de message. Elle est organisée par **scène de référence**, ce qui permet de donner à une scène un rendu différent du reste du jeu :

- **Messages par défaut** : utilisés partout sauf si une entrée plus précise correspond. C'est l'entrée dont la **Scène de référence** est laissée vide.
- **Messages en combat** : l'entrée intégrée pour la scène de combat.
- Cliquer sur **Ajouter un type de messages** pour cibler une autre scène. Renseigner sa **Scène de référence** avec le nom de classe de la scène (par exemple `Battle::Scene`). Le texte d'aide confirme la règle : *laisser la scène de référence vide pour appliquer la configuration à toutes les scènes*.

Dans chaque entrée, la liste déroulante **Police du texte des messages** est l'endroit où l'on choisit la police, présentée sous la forme `ID - Nom`. Les autres champs façonnent la même fenêtre : **Couleur du texte des messages**, **Boîte de dialogue** et **Boîte des noms** (les apparences de fenêtre), **Nombre de lignes** et **Taille de la bordure**.

Chaque entrée est un enregistrement sous `messages` dans le fichier de config, indexé par la scène de référence (`any` est l'entrée vide, fourre-tout) :

```json
"messages": {
  "any": {
    "windowSkin": null,
    "nameWindowSkin": null,
    "lineCount": 2,
    "borderSpacing": 2,
    "defaultFont": 0,
    "defaultColor": 0,
    "colorMapping": {}
  },
  "Battle::Scene": {
    "windowSkin": null,
    "nameWindowSkin": null,
    "lineCount": 2,
    "borderSpacing": 2,
    "defaultFont": 0,
    "defaultColor": 0,
    "colorMapping": {}
  }
}
```

À noter : `defaultFont` enregistre l'**ID** de la police choisie, ce qui est toute la raison d'être des ID : une police propre à une scène n'est qu'un ID différent dans ce champ.

## Attribuer une police aux choix

La section **Choix** reprend la section Messages pour les fenêtres de choix, avec moins de champs. Elle dispose de la même entrée **Choix par défaut** (scène de référence vide) et du même bouton **Ajouter un type de choix** pour cibler une scène précise.

On choisit la police avec la liste déroulante **Police du texte par défaut**, on règle la **Couleur du texte par défaut**, l'apparence **Boîte des choix** et la **Taille de la bordure**. Chaque entrée est un enregistrement sous `choices`, là encore indexé par scène de référence :

```json
"choices": {
  "any": {
    "windowSkin": null,
    "borderSpacing": 2,
    "defaultFont": 0,
    "defaultColor": 0,
    "colorMapping": {}
  }
}
```

## Conclusion

- Tous les réglages de police se trouvent dans **Tableau de bord > Textes** et sont enregistrés dans `Data/configs/texts_config.json`.
- Une police est un `.ttf` dans `Fonts/` plus une entrée (**ID**, **Nom**, **Taille**, **Hauteur de ligne**) ; tout le reste désigne une police par son **ID**, jamais par son nom.
- La police par défaut est celle d'**ID 0** : pour la changer, on fait passer sa police à l'ID 0 en utilisant un ID libre comme étape intermédiaire, car Studio interdit les ID en double.
- Les **Tailles alternatives** ajoutent des profils de taille réutilisables par ID, sans nouveau fichier de police.
- Les **Messages** et les **Choix** sont organisés par **scène de référence** : une scène de référence vide est le cas par défaut, un nom de classe comme `Battle::Scene` cible une scène, et la police se choisit par entrée via son ID.
