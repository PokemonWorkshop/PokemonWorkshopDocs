---
title: "Fondations de l'animation"
slug: les-bases
sidebar_position: 1
description: "PSDK anime tout via Yuki::Animation, un système basé sur le temps où l'on construit de petits blocs d'animation et où on les combine en séquence ou en parallèle. Cette page explique cette logique de base ; les usages spécifiques sont couverts dans leurs propres guides."
---

PSDK anime tout via **Yuki::Animation**, un système basé sur le temps où l'on construit de petits blocs d'animation et où on les combine en séquence ou en parallèle. Cette page explique cette logique de base ; les usages spécifiques sont couverts dans leurs propres guides.

## Comment fonctionne une animation

Une animation Yuki est **basée sur le temps, pas sur les frames**. Elle a une `duration` en secondes et progresse de `0` (début) à `1` (fin) sur cette durée, en lisant le temps écoulé sur l'horloge de la scène courante, ce qui la rend cohérente quel que soit le taux de rafraîchissement.

Quel que soit ce qu'elle anime, elle répond aux mêmes quatre messages : `start`, `update`, `done?` et `duration`. La piloter, c'est toujours la même boucle : on la démarre, puis on la met à jour à chaque frame jusqu'à ce qu'elle se déclare terminée.

```ruby
animation.start
until animation.done?
  animation.update
  Graphics.update
end
```

Dans une scène, on n'écrit pas cette boucle soi-même : la scène met l'animation à jour à notre place, à chaque frame. On l'écrit dans des scripts autonomes, ou pour se représenter ce que fait le système.

Tous les helpers vivent dans le module `Yuki::Animation`, en général aliasé sur une variable locale courte :

```ruby
ya = Yuki::Animation
```

## Les briques de base

Une brique anime une seule chose, et elles partagent toutes la même forme : la **durée** d'abord, puis l'**objet** à animer, puis les valeurs de départ et d'arrivée. La plus générale est `scalar`, qui interpole une seule propriété numérique via sa méthode de modification :

```ruby
# Fade a sprite out over 0.5s (opacity 255 -> 0)
ya.scalar(0.5, sprite, :opacity=, 255, 0)
```

`move` est la même idée pour une position sous forme de vecteur `(x, y)` :

```ruby
# Move a sprite from (0, 5) to (100, 32) in 3s
ya.move(3, sprite, 0, 5, 100, 32)
```

Et `wait` ne fait simplement rien pendant une durée, pour tenir une pause dans une séquence :

```ruby
ya.wait(1.0)
```

C'est tout le patron. Des helpers dédiés existent pour les autres cas courants (opacité, rotation, décalage d'origine, cellules de planche de sprites) ; ils suivent tous la même forme `durée, objet, départ, arrivée`.

## Séquencer et paralléliser

La vraie force, c'est la composition. Deux combinateurs assemblent les briques, et tous deux se comportent comme une seule animation, on peut donc les imbriquer librement :

- `ya.player(a, b, c)` joue ses animations l'une après l'autre (**séquentiel**).
- `ya.parallel(a, b, c)` les joue en même temps (**simultané**).

```ruby
ya = Yuki::Animation

# Fade in while sliding down, hold one second, then fade out
animation = ya.player(
  ya.parallel(
    ya.scalar(0.3, sprite, :opacity=, 0, 255),
    ya.move(0.3, sprite, sprite.x, sprite.y - 20, sprite.x, sprite.y)
  ),
  ya.wait(1.0),
  ya.scalar(0.3, sprite, :opacity=, 255, 0)
)

animation.start
until animation.done?
  animation.update
  Graphics.update
end
```

`player` attend que chaque étape (y compris un groupe `parallel` qu'elle contient) soit terminée avant de passer à la suivante. Cette imbrication séquentiel/parallèle suffit à décrire la plupart des animations.

## Conclusion

- Une animation Yuki est **basée sur le temps** : une `duration`, une progression de `0` à `1`, pilotée par `start` / `update` / `done?`.
- On construit avec des briques qui partagent une seule forme : `ya.scalar` pour une propriété numérique, `ya.move` pour une position, `ya.wait` pour une pause ; les autres helpers suivent la même forme.
- On compose avec `ya.player` (séquentiel) et `ya.parallel` (simultané), imbriqués selon le besoin.
- Dans une scène, c'est la scène qui pilote `update` ; en autonome, on boucle jusqu'à `done?`.
- Tout le reste (intégration UI, distorsions, sauvegarde, commandes) vit dans des guides dédiés.
