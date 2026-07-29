---
title: "Configurer les évolutions d'un Pokémon"
slug: configurer-les-evolutions
sidebar_position: 3
description: "Pokémon Studio permet de donner autant d'évolutions que voulu à un Pokémon, chacune protégée par son propre jeu de conditions. Ce guide parcourt l'éditeur d'évolutions, liste toutes les conditions disponibles, et explique les deux règles qui déterminent quelle évolution se déclenche réellement : les conditions se combinent en ET au sein d'une évolution, et le moteur retient la première évolution de la liste dont toutes les conditions passent."
---

**Pokémon Studio** permet de donner autant d'évolutions que voulu à un Pokémon, chacune protégée par son propre jeu de conditions. Ce guide parcourt l'éditeur d'évolutions, liste toutes les conditions disponibles, et explique les deux règles qui déterminent quelle évolution se déclenche réellement : les conditions se combinent en ET au sein d'une évolution, et le moteur retient la première évolution de la liste dont toutes les conditions passent.

## Ouvrir l'éditeur d'évolutions

Les évolutions ne forment pas un onglet à part. On ouvre **Base de données > Pokémon**, on sélectionne son Pokémon, et on repère le bloc **Évolution** sur sa fiche. Un clic dessus ouvre l'éditeur d'évolutions.

Deux caractéristiques de cet éditeur méritent d'être connues avant d'y toucher.

Il édite **une forme à la fois**. La forme affichée sur la fiche du Pokémon est celle dont on édite les évolutions : un Pokémon à plusieurs formes possède donc une liste d'évolutions par forme.

Il affiche **une évolution par page**. Dès qu'un Pokémon en possède plusieurs, des flèches apparaissent en haut de l'éditeur pour naviguer entre elles, numérotées `#1 - <nom de la cible>`, `#2 - ...` et ainsi de suite. Ce numéro est la position dans la liste, et comme la suite de ce guide le montre, il n'a rien de cosmétique.

## Choisir la cible

**Évolue en** désigne le Pokémon produit par cette évolution. Le champ est obligatoire : tant qu'il est vide, le bouton **Nouvelle évolution** reste désactivé et on ne peut pas ajouter de seconde évolution.

**Forme** n'apparaît que si le Pokémon ciblé possède plusieurs formes. On n'y touche que pour faire évoluer vers une forme alternative précise.

Pour ajouter une autre évolution au même Pokémon, on utilise **Nouvelle évolution** dans le panneau **Évolution supplémentaire**. **Supprimer cette évolution** retire celle actuellement affichée.

## Ajouter des conditions

**Ajouter une condition** ajoute une carte de condition à l'évolution courante. Chaque carte porte une seule condition : un type choisi dans la liste déroulante **Condition d'évolution**, plus la valeur attendue par ce type.

Une évolution sans aucune condition est valide. Studio l'appelle **Aucune condition**, et le Pokémon évolue alors à n'importe quelle montée de niveau.

Voici toutes les conditions proposées par l'éditeur, dans l'ordre de la liste déroulante.

| Condition                      | Ce qui est vérifié                                 | Valeur à renseigner                                |
| ------------------------------ | -------------------------------------------------- | -------------------------------------------------- |
| Par montée de niveau           | Le Pokémon a au moins ce niveau                    | **Niveau**, de 1 à 999                             |
| Avant un certain niveau        | Le Pokémon a au plus ce niveau                     | **Niveau**, de 1 à 999                             |
| Avec une pierre évolutive      | La pierre utilisée sur le Pokémon                  | **Objet**                                          |
| Par échange de dresseur        | Le Pokémon est échangé, avec n'importe qui         | Aucune valeur                                      |
| En échange d'un Pokémon        | Le Pokémon est échangé contre cette espèce précise | **Pokémon**                                        |
| En portant un objet            | L'objet tenu par le Pokémon                        | **Objet**                                          |
| Avant un bonheur maximum       | Le bonheur vaut au plus cette valeur               | **Bonheur**, de 1 à 255                            |
| Avec un bonheur minimum        | Le bonheur vaut au moins cette valeur              | **Bonheur**, de 1 à 255                            |
| En possédant la capacité       | Le Pokémon connaît cette capacité                  | **Attaque**                                        |
| En fonction de la météo        | La météo en cours                                  | **Météo**                                          |
| En fonction de l'environnement | Le Système Tag sur lequel se tient le joueur       | **Système Tag**, un nombre à partir de 0           |
| À un moment de la journée      | Le moment de la journée en cours                   | **Moment** : Jour, Couché de soleil, Nuit ou Matin |
| Si le joueur est sur une carte | Le joueur se trouve sur l'une de ces cartes        | **Cartes**, des ID séparés par des virgules        |
| En fonction du genre           | Le genre du Pokémon                                | **Genre** : Mâle, Femelle ou Inconnu               |
| Selon une fonction             | Une condition codée en Ruby, appelée par son nom   | **Fonction**, le nom de la méthode                 |
| Par Méga-Évolution             | Réservé à la Méga-Évolution, voir plus bas         | **Objet**                                          |

**En possédant la capacité** existe en quatre exemplaires dans les données, sous forme de quatre emplacements distincts : c'est ce qui permet à une même évolution d'exiger jusqu'à quatre capacités différentes. La liste déroulante ne propose que le prochain emplacement libre, on n'a donc jamais à se soucier de la numérotation.

**Selon une fonction** est la porte de sortie pour tout ce que cette liste ne sait pas exprimer. La valeur est le nom d'une méthode Ruby écrite du côté de PSDK, et Studio ne vérifie pas son existence : une faute de frappe ici plante le jeu avec un `NoMethodError` dès que le moteur teste l'évolution, on vérifie donc l'orthographe contre son script. Écrire cette méthode est un sujet à part entière, non traité ici.

## Comment les conditions se combinent

C'est ici que les évolutions dérapent le plus souvent, parce que deux règles différentes s'appliquent à deux niveaux différents.

**Au sein d'une évolution, les conditions se combinent en ET.** Chaque carte de condition de la page doit passer. Une évolution exigeant un bonheur minimum de 160 et le moment Nuit ne se déclenche que si les deux sont vraies.

**Entre les évolutions, c'est un OU.** Un Pokémon possédant trois évolutions peut emprunter n'importe laquelle des trois.

Ce qui surprend, c'est la façon dont ce OU se résout. Le moteur parcourt la liste **de haut en bas et s'arrête à la première évolution dont toutes les conditions passent**. Il ne regarde jamais les suivantes. L'ordre de la liste fait donc partie de la logique, ce n'est pas de la présentation.

La conséquence mérite d'être énoncée clairement : **on place l'évolution la plus exigeante en premier**. Si une évolution large se trouve au-dessus d'une plus étroite, la large gagne toujours et l'étroite devient inatteignable, quoi que fasse le joueur.

Imaginons un Pokémon qui doit évoluer en A au niveau 20, et en B au niveau 20 en tenant un objet. Dans cet ordre, B ne se produira jamais : le joueur a beau faire tenir l'objet, l'unique condition de A passe déjà, et A est testée en premier. En les inversant, les deux fonctionnent.

L'Évoli par défaut illustre bien la règle. Nymphali exige un bonheur minimum de 160 plus une fonction, Noctali exige un bonheur minimum de 160 plus le moment Nuit, et Nymphali est listé au-dessus de Noctali. Un Évoli bien aimé qui satisfait la fonction de Nymphali devient donc Nymphali, même de nuit. Cet ordre est délibéré, pas accidentel.

:::note
Évoli embarque aussi Phyllali et Givrali avec une condition **cartes** valant `-1`, qui n'est l'ID d'aucune carte réelle. Ce sont des marque-places : le projet par défaut les laisse volontairement inatteignables, en attendant qu'on y renseigne les cartes de ses propres rochers moussus et glacés.
:::

## Les règles imposées par l'éditeur

Quelques contraintes sont câblées dans l'éditeur, plus faciles à comprendre qu'à découvrir.

**Un type de condition par évolution.** Dès qu'un type est utilisé, il disparaît de la liste déroulante de toutes les autres cartes de la même évolution. On ne peut donc pas exiger deux objets tenus dans une seule évolution : « tient l'objet A ou l'objet B » demande deux évolutions distinctes. Les niveaux sont l'exception qui confirme la règle : **Par montée de niveau** et **Avant un certain niveau** sont deux types distincts, encadrer un niveau entre 20 et 30 dans une seule évolution fonctionne donc.

**La Méga-Évolution est un cas à part.** Ajouter **Par Méga-Évolution** bascule l'éditeur en mode Méga : **Évolue en** cesse d'être une liste déroulante et devient un `Mega-<nom>` grisé. On ne choisit plus la cible, Studio la déduit.

C'est que cette condition n'en est pas vraiment une. La Méga-Évolution est gérée ailleurs, par le moteur de combat, et une évolution portant cette condition ne se déclenche jamais comme une évolution normale. Il faut la voir comme un marqueur déclarant que ce Pokémon possède une forme Méga, pas comme une règle évaluée par le moteur.

**Les valeurs sont validées à l'enregistrement.** Laisser un champ obligatoire vide ou hors bornes bloque la sauvegarde et place le curseur sur le champ fautif. Cela vaut aussi au moment de passer d'une évolution à une autre : une condition à moitié remplie retient sur la page courante jusqu'à ce qu'on la complète ou qu'on la supprime.

## Conclusion

- Les évolutions vivent dans le bloc **Évolution** de la fiche d'un Pokémon, une liste **par forme**, une évolution **par page d'éditeur**.
- Au sein d'une évolution, les conditions se combinent en **ET** ; entre les évolutions, c'est un **OU**.
- Le moteur retient la **première** évolution de la liste dont toutes les conditions passent : on **place l'évolution la plus exigeante en premier**, sans quoi elle devient inatteignable.
- Un type de condition ne sert qu'**une fois par évolution** ; exprimer un « ou » entre deux valeurs d'un même type demande deux évolutions.
- **Par Méga-Évolution** est un marqueur de Méga-Évolution, pas une condition évaluée par le moteur : elle fige la cible et ne déclenche jamais d'évolution normale.
- **Selon une fonction** est l'issue quand aucune condition native ne convient ; la valeur est le nom d'une méthode Ruby qu'on écrit soi-même.
