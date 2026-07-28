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

Déclarer une animation frame par frame dans l'éditeur d'animation de Tiled devient vite fastidieux. Le [plugin Bulk Animations](https://github.com/lukas-shawford/tiled-bulk-animations) automatise l'opération sur tout un tileset. Si on l'utilise, on crédite ses auteurs dans son jeu : ce genre de travail mérite d'être nommé.

## La durée des frames

Les durées se règlent en millisecondes dans Tiled, mais la conversion les arrondit à un pas de **100 millisecondes**. Deux conséquences en découlent :

- Une durée est tronquée vers le bas au pas inférieur. 250 ms devient 200 ms, pas 300.
- Toute durée inférieure au pas est remontée à un pas. 40 ms se joue en 100 ms.

Utiliser des multiples de 100 ms garantit donc que l'animation joue à la vitesse prévue, et non à celle que laisse la troncature. Ce pas n'est pas une propriété du format : il suit les réglages d'affichage du projet, donc un projet qui les modifie obtient un pas différent.

Le nombre de frames lui-même n'est pas plafonné par la conversion, mais chaque frame ajoute une rangée à la texture générée. Les animations longues produisent des images hautes, un coût à garder en tête sur les machines modestes.

## Le budget de tuiles animées distinctes

RPG Maker XP range les tuiles animées dans sept emplacements d'autotiles de 32 tuiles chacun. Cela donne un plafond strict de **224 tuiles animées distinctes par carte**. Au-delà, la conversion s'arrête sur :

```bash
[RMXP ERROR] This map has too many animated diverse tiles
```

Celui-ci n'apparaît pas dans Studio. Contrairement aux contrôles évoqués plus haut, qui rejettent un fichier au moment où Studio le lit, cette limite n'est atteinte que plus tard, côté moteur : le message sort donc dans la sortie de compilation et non à côté d'un nom de fichier.

Le décompte n'est pas un simple total. Les tuiles animées sont regroupées par **nombre de frames**, et chaque groupe est arrondi au multiple de 32 supérieur. Une carte utilisant 33 tuiles de 4 frames et 2 tuiles de 8 frames dépense 64 plus 32, soit 96 de ses 224, et non 35. Limiter ses animations à un petit nombre de longueurs de frames coûte donc bien moins de budget que de les éparpiller.

### La règle des 3

Une carte convertie possède exactement trois calques de tuiles, parce que c'est tout ce que propose RPG Maker XP. Quand plus de trois tuiles se superposent sur une position, la conversion les **fusionne** en tuiles composites. Une tuile composite qui contient une tuile animée est elle-même une nouvelle tuile animée distincte, et elle consomme du budget que rien à l'écran ne justifie.

La règle pratique : à une position portant une tuile animée, on garde au plus trois tuiles superposées. Autrement dit, on ne mappe que ce qui est visible. Les tuiles cachées sous un calque opaque coûtent du budget et ne montrent rien.

Cela ne s'applique pas aux tuiles animées empilées les unes sur les autres : la conversion en fusionne autant qu'elle peut, selon leur nombre de frames.

## Conclusion

- Toutes les frames d'une animation vivent sur le même tileset, et l'animation se déclare là plutôt que sur la carte.
- Les durées sont tronquées à un pas de 100 millisecondes par défaut, et tout ce qui est plus court est remonté à un pas.
- Une carte peut porter 224 tuiles animées distinctes, décomptées par groupes de longueur de frames arrondis au multiple de 32 supérieur.
- Plus de trois tuiles superposées sur une position pousse la conversion à les fusionner, ce qui crée des tuiles animées supplémentaires.
- `TECH-Animations.tsx` et `006 Beach.tmx` sont les références fonctionnelles à ouvrir.
