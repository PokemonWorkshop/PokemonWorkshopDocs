---
title: "Comment préparer les assets et les textes avant de créer une UI dans PSDK ?"
slug: preparer-assets-ui
sidebar_position: 0
description: "Avant d'écrire la moindre ligne de Ruby, une UI a besoin de ses graphismes et de ses textes traduits. Cette étape de préparation installe les assets et le CSV de Mystery Gift pour que la scène s'affiche vraiment."
---

Ce guide est l'étape de préparation d'une série de 10 où l'on construit pas à pas une UI Mystery Gift complète. Avant d'écrire le moindre Ruby dans [le guide suivant](./01-ui-scene.md), votre UI a besoin de deux types de ressources non-code en place : ses **graphismes** et ses **textes traduits**. Sans eux, la scène se charge mais n'affiche rien à l'écran. Ici, on installe les deux pour l'exemple Mystery Gift.

## Principe

Une UI dans PSDK ne se résume pas à des fichiers Ruby. Deux catégories de ressources vivent **en dehors** du dossier `scripts/`, dans le projet de jeu lui-même :

- **Graphismes** : des images PNG chargées depuis les dossiers de cache du projet. L'UI Mystery Gift utilise le cache `interface`, donc ses images vivent sous `graphics/interface/`.
- **Texte** (i18n) : chaque chaîne visible par le joueur est stockée dans un fichier CSV sous `Data/Text/Dialogs/`, identifié par un numéro. En développement, le moteur lit ces CSV directement, et garde un cache `.dat` par langue pour accélérer les choses.

Le code Ruby référence ces ressources par leur nom (`'mystery_gift/header'`) ou par leur ID (`TEXT_FILE_ID = 311_125`). Si une ressource est manquante ou mal placée, la référence échoue silencieusement : un sprite vide, ou du texte anglais là où on attendait une traduction.

## Où va chaque ressource

| Ressource         | Source (téléchargement ci-dessous)              | Chemin cible dans votre projet               |
| ----------------- | ----------------------------------------------- | -------------------------------------------- |
| 7 graphismes      | `*.png`                                          | `graphics/interface/mystery_gift/`           |
| Texte i18n        | `311125.csv`                                     | `Data/Text/Dialogs/311125.csv`               |

Le nom de dossier `mystery_gift` (sous `graphics/interface/`) est le préfixe utilisé dans chaque appel `add_sprite`/`add_background`, par exemple `add_sprite(0, 0, 'mystery_gift/header')`. Le nom de fichier `311125.csv` correspond à la constante `TEXT_FILE_ID = 311_125` que le code utilise avec `ext_text`.

## Graphismes

Créez le dossier `graphics/interface/mystery_gift/` dans votre projet et déposez-y les 7 images ci-dessous. Chacune est montrée à sa taille réelle, avec son rôle et ses dimensions.

### `background.png` — fond plein écran

![background.png](/assets/psdk/ui-development/mystery-gift/background.png)

- **Cible :** `graphics/interface/mystery_gift/background.png` · **Taille :** 320×240 (tout l'écran)
- Dessiné derrière tout le reste par `GenericBase`. Renvoyé par l'override `background_filename`.
- [Télécharger background.png](/assets/psdk/ui-development/mystery-gift/background.png)

### `header.png` — barre de titre

![header.png](/assets/psdk/ui-development/mystery-gift/header.png)

- **Cible :** `graphics/interface/mystery_gift/header.png` · **Taille :** 320×18
- La barre derrière le titre de la scène, dessinée par la Composition en haut de l'écran.
- [Télécharger header.png](/assets/psdk/ui-development/mystery-gift/header.png)

### `frame.png` — cadre de contenu

![frame.png](/assets/psdk/ui-development/mystery-gift/frame.png)

- **Cible :** `graphics/interface/mystery_gift/frame.png` · **Taille :** 304×188 (correspond à `FRAME_WIDTH` × `FRAME_HEIGHT`)
- Le panneau qui contient la liste des cadeaux. Sa taille détermine les constantes de layout `FRAME_*`.
- [Télécharger frame.png](/assets/psdk/ui-development/mystery-gift/frame.png)

### `received_banner.png` — bannière « cadeau reçu »

![received_banner.png](/assets/psdk/ui-development/mystery-gift/received_banner.png)

- **Cible :** `graphics/interface/mystery_gift/received_banner.png` · **Taille :** 280×28 (correspond à `BANNER_WIDTH` × `BANNER_HEIGHT`)
- Fond de la bannière qui apparaît en fondu quand un cadeau est réclamé (voir le guide sur les animations).
- [Télécharger received_banner.png](/assets/psdk/ui-development/mystery-gift/received_banner.png)

### `button_background.png` — barre de boutons du bas

![button_background.png](/assets/psdk/ui-development/mystery-gift/button_background.png)

- **Cible :** `graphics/interface/mystery_gift/button_background.png` · **Taille :** 320×26
- La bande derrière les boutons ctrl en bas de l'écran. Renvoyée par l'override `button_background_filename`.
- [Télécharger button_background.png](/assets/psdk/ui-development/mystery-gift/button_background.png)

### `gift_row.png` — ligne de cadeau (spritesheet)

![gift_row.png](/assets/psdk/ui-development/mystery-gift/gift_row.png)

- **Cible :** `graphics/interface/mystery_gift/gift_row.png` · **Taille :** 577×24
- **Spritesheet 2×1** : deux colonnes (gauche = normal, droite = sélectionné), une ligne. `set_rect_div(0, 0, 2, 1)` affiche la cellule normale, `set_rect_div(1, 0, 2, 1)` la sélectionnée. Chaque cellule fait 288 de large (576 / 2, plus un séparateur transparent d'1px → 577 au total), ce qui correspond à `GIFT_ROW_WIDTH`.
- [Télécharger gift_row.png](/assets/psdk/ui-development/mystery-gift/gift_row.png)

### `buttons.png` — boutons ctrl (spritesheet)

![buttons.png](/assets/psdk/ui-development/mystery-gift/buttons.png)

- **Cible :** `graphics/interface/mystery_gift/buttons.png` · **Taille :** 149×39
- **Spritesheet 2×2** : colonne 0 = A/X/Y, colonne 1 = B ; ligne 0 = normal, ligne 1 = pressé. Les cellules sont séparées par 1px de transparence (≈74×19 par cellule). Renvoyé par l'override `button_texture` du ControlButton personnalisé (voir le guide GenericBase).
- [Télécharger buttons.png](/assets/psdk/ui-development/mystery-gift/buttons.png)

### Remplacer les graphismes

Vous pouvez remplacer n'importe quelle image par la vôtre tant que vous gardez le même nom de fichier, le même dossier cible et — pour les deux spritesheets — la même disposition en grille (même nombre de cellules, séparateurs transparents d'1px). Si vous changez les dimensions d'un sprite, mettez à jour la constante de layout correspondante dans `001 Constants.rb` (par exemple `FRAME_WIDTH` si vous redimensionnez `frame.png`).

## Texte (CSV i18n)

Tout le texte visible par le joueur vit dans un seul fichier CSV. Téléchargez-le et placez-le dans `Data/Text/Dialogs/311125.csv` :

[Télécharger 311125.csv](/assets/psdk/ui-development/mystery-gift/311125.csv)

```csv
en,fr,it,de,es,ko,kana
Enter Code,Code,,,,,
Quit,Quitter,,,,,
Mystery Gift,Cadeau Mystère,,,,,
Enter your gift code,Entrez votre code cadeau,,,,,
Invalid code!,Code invalide !,,,,,
Gift already claimed!,Cadeau déjà réclamé !,,,,,
You received %s!,Vous avez reçu %s !,,,,,
No gifts claimed yet,Aucun cadeau réclamé,,,,,
Claim this gift?,Réclamer ce cadeau ?,,,,,
Gift received!,Cadeau reçu !,,,,,
Yes,Oui,,,,,
No,Non,,,,,
```

- Le nom de fichier **doit** être `311125.csv`, en correspondance avec `TEXT_FILE_ID = 311_125` déclaré dans `001 Constants.rb`. Le code lit une ligne avec `ext_text(TEXT_FILE_ID, index_ligne)`.
- La ligne 0 (après l'en-tête) est l'ID 0, la ligne 1 l'ID 1, et ainsi de suite — ces index correspondent aux constantes `TEXT_*` (le guide i18n détaille tout ça).
- La première colonne est le code de langue. Les cellules vides retombent sur la valeur `en`, donc un projet tournant dans une langue non remplie affiche quand même l'anglais.

### Compiler le texte

En développement, vous n'avez rien à compiler. Quand un texte est demandé, PSDK cherche d'abord un cache `.dat` compilé (par exemple `311125.fr.dat`), et **retombe sur la lecture directe de `311125.csv`** s'il n'y a pas de cache. Le texte s'affiche donc dès que le CSV est en place.

PSDK maintient aussi ce cache à jour tout seul : à chaque lancement, il régénère les `.dat` quand un CSV est **plus récent** que son cache (une comparaison des dates de modification). Après avoir **modifié** le CSV, relancez simplement le jeu avec `debug_fast.bat` et le changement est pris en compte.

**Si une modification ne s'affiche pas en jeu**, forcez une régénération complète en supprimant **tous** les fichiers `.dat` de `Data/Text/Dialogs/`, puis relancez. Supprimer un ou deux fichiers ne sert à rien : PSDK ne recompile tout que lorsque le cache est entièrement absent ou qu'un CSV est plus récent que son `.dat` — un seul `.dat` manquant n'est jamais détecté à lui seul (le texte retombe simplement sur le CSV). Quand vous compilerez votre jeu pour une release, la compilation standard du projet embarque les textes pour vous — aucune étape manuelle en développement.

## Vérification

Avant de continuer, vérifiez que :

- `graphics/interface/mystery_gift/` contient les 7 fichiers PNG.
- `Data/Text/Dialogs/311125.csv` existe.

Une fois les assets et le texte en place, vous êtes prêt à écrire le premier fichier Ruby dans [le guide de la scène](./01-ui-scene.md).

## Conclusion

- Une UI a besoin de deux types de ressources non-code : les graphismes (sous `graphics/interface/`) et le texte i18n (un CSV sous `Data/Text/Dialogs/`).
- Les graphismes sont référencés par nom (`'mystery_gift/<fichier>'`) ; le nom du dossier est le préfixe utilisé dans `add_sprite`/`add_background`.
- Les spritesheets (`gift_row`, `buttons`) regroupent plusieurs états dans une seule image, découpés avec `set_rect_div` — gardez la disposition en grille en les remplaçant.
- Le nom du fichier CSV correspond à `TEXT_FILE_ID` ; les index de ligne correspondent aux constantes `TEXT_*`.
- En développement, le CSV est lu directement — le poser suffit ; le cache `.dat` se régénère automatiquement quand le CSV est plus récent. Pour forcer une régénération, supprimez **tous** les `.dat` de `Data/Text/Dialogs/`.
