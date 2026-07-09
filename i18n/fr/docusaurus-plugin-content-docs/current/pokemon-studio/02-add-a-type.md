---
title: "Ajouter un nouveau type"
slug: ajouter-un-nouveau-type
sidebar_position: 2
description: "Ajouter un nouveau type dans Pokémon Studio crée ses données mais pas ses graphismes, si bien que les icônes du type s'affichent mal en combat et dans les menus. Ce guide crée le type dans Studio, explique pourquoi PSDK découpe mal les spritesheets de types quand on ajoute un type, et liste chaque image à mettre à jour."
---

Ajouter un nouveau type dans **Pokémon Studio** crée ses données mais pas ses graphismes, si bien que les icônes du type s'affichent mal en combat et dans les menus. Ce guide crée le type dans Studio, explique pourquoi PSDK découpe mal les spritesheets de types quand on ajoute un type, et liste chaque image à mettre à jour.

## Créer le type dans Studio

Dans Pokémon Studio, on ouvre **Base de données > Types** et on clique sur **Nouveau type**. Deux champs comptent :

- **Nom** : le nom d'affichage du type, le texte montré partout où le type est nommé.
- **Couleur** : la couleur stockée pour le type.

Studio attribue automatiquement le **prochain identifiant libre**, puis enregistre le type dans `Data/Studio/types/<db_symbol>.json`. Cet enregistrement contient l'`id` du type, son `dbSymbol`, sa `color`, son `textId` et ses données de table des types (`damageTo`). Il ne contient aucun champ d'image : **Studio ne crée ni ne redimensionne jamais un graphisme.** La **Couleur** choisie est stockée comme une donnée, elle ne sert pas à dessiner l'icône du type.

C'est toute la raison d'être de la suite de ce guide. Pour Studio, le type est complet, mais en jeu son icône manque, et l'ajouter décale aussi l'icône de tous les autres types.

## Pourquoi les icônes de types cassent en combat

Le symptôme apparaît en combat : l'image de type affichée sur une attaque est fausse. Elle montre le mauvais type, une image décalée de quelques pixels vers le haut, ou un fragment tronqué. Supprimer le nouveau type fait tout réafficher correctement, ce qui rend la cause difficile à deviner.

PSDK stocke chaque jeu d'icônes de types dans une seule image : une spritesheet verticale avec **une ligne par type**, empilées dans l'ordre des identifiants. La ligne 0 est le type « none » vide (id 0), la ligne 1 est le premier vrai type, et ainsi de suite le long de la bande.

Le piège, c'est que le fichier n'indique pas la hauteur d'une ligne. Au chargement, PSDK découpe l'image en autant de lignes égales qu'il y a de types dans la base :

```ruby
# Helper d'interface : autant de lignes que de types dans la base
super(viewport, 1, each_data_type.size)
```

```ruby
# SpriteSheet : la hauteur d'une ligne est calculée, jamais stockée
h = value.height / @nb_y
```

La hauteur de chaque ligne vaut donc `hauteur de l'image ÷ nombre de types`. Avec les 18 types par défaut plus l'emplacement « none », les spritesheets fournies font 19 lignes et chaque ligne tombe sur une frontière nette. Dès qu'on ajoute un type, `each_data_type.size` passe à 20, PSDK découpe la **même** image en 20 lignes, chaque ligne raccourcit, et chaque icône est lue dans la mauvaise tranche. Toute la bande paraît décalée et tronquée. C'est ça, le bug.

La correction en découle directement : le nombre de types a augmenté, donc chaque image doit grandir d'une ligne pour garder la même hauteur de ligne.

## Les spritesheets à mettre à jour

PSDK fournit dix spritesheets indexées par type réparties dans deux dossiers, `graphics/interface/` (combat et menus) et `graphics/pokedex/` (l'écran Pokédex). Chacune est une seule colonne avec une ligne par type, actuellement **19 lignes** (le type « none » plus les 18 types par défaut) :

| Fichier | Taille actuelle | Hauteur de ligne | Ce qu'il alimente |
| ------- | --------------- | ---------------- | ----------------- |
| `graphics/interface/battle/types.png` | 120 × 513 | 27 px | Icône de type sur les attaques dans le menu d'attaques en combat |
| `graphics/interface/battle_attack_dummy.png` | 155 × 1007 | 53 px | Plaque de type gérée par le helper `AttackDummySprite` |
| `graphics/interface/types.png` | 32 × 266 | 14 px | Icônes de types dans les menus ; image de repli si aucun fichier localisé |
| `graphics/interface/types_en.png` | 32 × 266 | 14 px | Variante anglaise de `interface/types.png` |
| `graphics/interface/types_fr.png` | 32 × 266 | 14 px | Variante française de `interface/types.png` |
| `graphics/interface/types_es.png` | 32 × 266 | 14 px | Variante espagnole de `interface/types.png` |
| `graphics/pokedex/types.png` | 48 × 304 | 16 px | Icônes de types sur l'écran Pokédex ; image de repli si aucun fichier localisé |
| `graphics/pokedex/types_en.png` | 48 × 304 | 16 px | Variante anglaise de `pokedex/types.png` |
| `graphics/pokedex/types_fr.png` | 48 × 304 | 16 px | Variante française de `pokedex/types.png` |
| `graphics/pokedex/types_es.png` | 48 × 304 | 16 px | Variante espagnole de `pokedex/types.png` |

Les deux dossiers possèdent des variantes localisées (`types_en.png`, `types_fr.png`, `types_es.png`) : l'icône inclut le nom du type sous forme de texte, il y a donc une image par langue. PSDK charge `types_<langue>.png` depuis le dossier concerné pour la langue courante et se rabat sur le `types.png` de ce même dossier quand le fichier localisé manque. On met à jour la variante de chaque langue présente dans son jeu ; si l'on ne garde que `types.png` dans un dossier, ce seul fichier y suffit.

## Ajouter la ligne de son type

Pour chaque fichier du tableau, l'opération est la même :

1. Ouvrir la spritesheet dans un éditeur d'images qui préserve la transparence (couche alpha du PNG).
2. Augmenter la **hauteur du canevas** d'exactement une hauteur de ligne, la valeur du tableau : `interface/battle/types.png` passe de 513 à 540, `battle_attack_dummy.png` de 1007 à 1060, `interface/types.png` et ses variantes de 266 à 280, `pokedex/types.png` et ses variantes de 304 à 320. On garde la largeur inchangée.
3. Dessiner l'icône de son type dans la **nouvelle ligne du bas**. Son indice de ligne est l'identifiant du type, donc le type ajouté en dernier occupe la dernière ligne.
4. Garder toutes les lignes à la même hauteur. Le moteur suppose des lignes égales, donc une ligne mal alignée ou de demi-hauteur décale tout ce qui suit.

On réenregistre chaque fichier à son chemin d'origine sous `graphics/interface/` ou `graphics/pokedex/`. Copier une ligne existante comme gabarit est la façon la plus sûre de garder les dimensions et la ligne de base de la nouvelle icône cohérentes avec les autres.

## Vérifier en combat

Les changements d'icônes de types ne se voient qu'en jeu, jamais dans Studio :

1. On lance son jeu.
2. On démarre un combat avec une attaque qui utilise le nouveau type.
3. On ouvre le menu d'attaques et on vérifie l'icône de type sur l'attaque, puis on ouvre le résumé d'un Pokémon et le Pokédex pour vérifier les icônes des menus et du Pokédex.

Si une icône est décalée ou tronquée, la hauteur de la spritesheet concernée est fausse d'une ligne : on revérifie que `hauteur de l'image ÷ nombre de types` donne un nombre entier et que chaque ligne a la même hauteur.

## Conclusion

- **Pokémon Studio ne crée que les données du type** (`Data/Studio/types/<db_symbol>.json`) ; il ne génère ni ne redimensionne jamais les icônes.
- PSDK découpe chaque spritesheet de types en `hauteur de l'image ÷ nombre de types` lignes, donc ajouter un type sans agrandir les images décale toutes les icônes.
- On met à jour les dix spritesheets indexées par type réparties entre `graphics/interface/` (`battle/types.png`, `battle_attack_dummy.png`, `types.png` et ses variantes `types_en/fr/es.png`) et `graphics/pokedex/` (`types.png` et ses variantes `types_en/fr/es.png`), en ajoutant une ligne par nouveau type.
- La nouvelle icône va dans la **dernière ligne** (indice de ligne = identifiant du type), et chaque ligne doit garder la même hauteur.
- Les icônes de types ne s'affichent qu'en jeu : on vérifie dans un vrai combat, dans le résumé et dans le Pokédex, pas dans Studio.
