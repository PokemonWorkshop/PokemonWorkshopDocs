---
title: "Les tuiles animées"
slug: tuiles-animees
sidebar_position: 8
description: "Les tuiles animées de Tiled fonctionnent dans un projet PSDK, sous des contraintes héritées du format RPG Maker XP visé par la conversion : les frames doivent partager un même tileset, les durées sont quantifiées selon un pas fixe, et chaque carte dispose d'un budget strict de tuiles animées distinctes. Cette page couvre la création d'une tuile animée et la façon de rester dans ce budget."
---

Les tuiles animées de Tiled fonctionnent dans un projet PSDK, sous des contraintes héritées du format RPG Maker XP visé par la conversion : les frames doivent partager un même tileset, les durées sont quantifiées selon un pas fixe, et chaque carte dispose d'un budget strict de tuiles animées distinctes. Cette page couvre la création d'une tuile animée et la façon de rester dans ce budget.

## Créer une tuile animée

Une animation se définit dans le tileset, pas dans la carte. Chaque frame est une tuile de ce même `.tsx`, donc une tuile animée à cheval sur deux tilesets est impossible : on place toutes les frames sur une seule planche.

La démo livre une référence, `TECH-Animations.tsx`, utilisée par plusieurs cartes dont `006 Beach.tmx`. L'ouvrir montre comment les frames sont disposées sur la planche avant d'être liées entre elles.

Déclarer une animation frame par frame dans l'éditeur d'animation de Tiled devient vite fastidieux. Le [plugin Bulk Animations](https://github.com/lukas-shawford/tiled-bulk-animations) automatise l'opération sur tout un tileset. Si on l'utilise, on pense à créditer ses auteurs dans son jeu.

## La durée des frames

Les durées se règlent en millisecondes dans Tiled, mais la conversion les arrondit à un pas de **100 millisecondes**. Deux conséquences en découlent :

- Une durée est tronquée vers le bas au pas inférieur. 250 ms devient 200 ms, pas 300.
- Toute durée inférieure au pas est remontée à un pas. 40 ms se joue en 100 ms.

Utiliser des multiples de 100 ms garantit donc que l'animation joue à la vitesse prévue, et non à celle que laisse la troncature. Ce pas n'est pas une propriété du format : il suit les réglages d'affichage du projet, donc un projet qui les modifie obtient un pas différent.

Rien dans la conversion ne refuse une animation longue, mais chaque frame ajoute une rangée à la texture générée, et le maximum pratique est de 32 frames : 32 frames de 32 pixels, c'est le plafond de texture de 1024 pixels autour duquel toute la conversion est bâtie. S'en tenir à 4, 8, 16 ou 32 frames est la forme recommandée.

## Le budget de tuiles animées distinctes

RPG Maker XP offre sept emplacements d'autotiles. La conversion y range 32 tuiles animées chacun, pour que la texture générée reste dans les 1024 pixels sur les machines modestes. Cela donne un plafond strict de **224 tuiles animées distinctes par carte**. Au-delà, cette carte échoue à se convertir tandis que les autres passent, et la sortie de compilation affiche :

```bash
Failed to process <nom_de_carte>: [RMXP ERROR] This map has too many animated diverse tiles (256)
```

Le nombre entre parenthèses est ce que la carte a réellement consommé. Ce message n'apparaît pas dans Studio : contrairement aux contrôles qui rejettent un fichier au moment où Studio le lit, cette limite n'est atteinte que plus tard, côté moteur. La carte reste dans la file de conversion et sera retentée au passage suivant.

Le décompte n'est pas un simple total. Les tuiles animées sont regroupées par **nombre de frames**, et chaque groupe est arrondi au multiple de 32 supérieur. Une carte utilisant 33 tuiles de 4 frames et 2 tuiles de 8 frames dépense 64 plus 32, soit 96 de ses 224, et non 35. N'utiliser que deux ou trois nombres de frames différents coûte donc bien moins de budget que de les éparpiller.

### La règle des 3

Une carte convertie possède exactement trois calques de tuiles, parce que c'est tout ce que propose RPG Maker XP. Quand plus de trois tuiles se superposent sur une position, la conversion les **fusionne** en tuiles composites. Une tuile composite qui contient une tuile animée est elle-même une nouvelle tuile animée distincte, et elle consomme du budget que rien à l'écran ne justifie.

La règle pratique : à une position portant une tuile animée, on garde au plus trois tuiles superposées. Autrement dit, on ne mappe que ce qui est visible. Les tuiles cachées sous un calque opaque coûtent du budget et ne montrent rien.

Empiler deux tuiles animées sur une même position est le cas que la fusion gère le mieux : la composite ne compte que pour une seule tuile animée. Cela ne fonctionne proprement que si les deux ont le **même nombre de frames**. Sinon, la plus courte n'est dessinée que sur ses propres frames et disparaît sur le reste du cycle, et une seule des deux cadences survit pour toute la colonne.

## Conclusion

- Toutes les frames d'une animation vivent sur le même tileset, et l'animation se déclare là plutôt que sur la carte.
- Les durées sont tronquées à un pas de 100 millisecondes par défaut, et tout ce qui est plus court est remonté à un pas.
- Une carte peut porter 224 tuiles animées distinctes, décomptées par groupes de même nombre de frames, chaque groupe arrondi au multiple de 32 supérieur.
- Plus de trois tuiles superposées sur une position pousse la conversion à les fusionner, ce qui crée des tuiles animées supplémentaires.
- `TECH-Animations.tsx` et `006 Beach.tmx` sont les références fonctionnelles à ouvrir.
