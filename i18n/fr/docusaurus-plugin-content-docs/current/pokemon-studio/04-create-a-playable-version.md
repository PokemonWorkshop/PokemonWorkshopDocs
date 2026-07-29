---
title: "Créer une version jouable"
slug: creer-une-version-jouable
sidebar_position: 4
description: "Pokémon Studio transforme un projet en jeu autonome que les joueurs peuvent lancer sans installer Studio, PSDK ni Ruby. Ce guide couvre la fenêtre de compilation : comment l'ouvrir depuis le Tableau de bord, à quoi servent le nom du jeu, le numéro de version et les quatre options de mise à jour, et où trouver le dossier Release prêt à partager qu'elle produit."
---

**Pokémon Studio** transforme un projet en jeu autonome que les joueurs peuvent lancer sans installer Studio, PSDK ni Ruby. Ce guide couvre la fenêtre de compilation : comment l'ouvrir depuis le Tableau de bord, à quoi servent le nom du jeu, le numéro de version et les quatre options de mise à jour, et où trouver le dossier Release prêt à partager qu'elle produit.

## Compiler ou lancer le jeu ?

Deux boutons distincts produisent deux résultats très différents, et mieux vaut les distinguer avant de compiler.

Le **bouton de lancement** de la barre de navigation, **Lancer le jeu**, avec **Mode Debug** et **Mode Debug rapide** dans son menu déroulant, exécute le projet sur place, directement depuis ses fichiers source. C'est ainsi qu'on teste ce que l'on construit. Il ne produit jamais rien que l'on puisse transmettre à quelqu'un d'autre, et **Lancer le jeu** signifie ici « exécuter sans les outils de debug », pas « lancer le build final ».

La **compilation** est la seule fonctionnalité qui produit un jeu distribuable : un dossier `Release/` autonome, embarquant sa propre copie du moteur, prêt à zipper et à partager. On y recourt pour diffuser une version ; on garde le bouton de lancement tant que l'on travaille encore.

## Ouvrir la fenêtre de compilation

On se rend dans le **Tableau de bord**. Sa barre de contrôle, en haut de la page, contient un seul bouton : **Créer une version jouable**. Un clic dessus ouvre la fenêtre **Création d'une version jouable**.

## Configurer la version

La fenêtre demande deux informations sur le build, puis quelle part de celui-ci recompiler.

- **Nom du jeu** : pré-rempli avec le titre actuel du projet. C'est le nom stocké dans le jeu compilé.
- **Numéro de version** : un nombre entier, pré-rempli avec la version actuelle plus un, Studio partant du principe que chaque compilation est une nouvelle release. La valeur est réécrite dans le projet, si bien que la compilation suivante proposera le numéro d'après.

En dessous, **Options de compilation** regroupe quatre interrupteurs, tous activés par défaut :

| Option                            | Ce qu'elle recompile                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Mettre à jour les visuels         | Les modifications apportées aux graphismes                                                 |
| Mettre à jour les bibliothèques   | Les modifications appliquées aux bibliothèques Ruby                                        |
| Mettre à jour l'audio             | Les modifications appliquées à l'audio                                                     |
| Mettre à jour les binaires du jeu | Les modifications appliquées aux fichiers binaires (l'exécutable du moteur et son runtime) |

Pourquoi des interrupteurs ? La compilation écrit dans le dossier `Release/` et le conserve d'une exécution à l'autre. Désactiver une option indique à Studio de sauter cette partie et de réutiliser ce que la compilation précédente y a déjà déposé.

D'où la règle : pour la **première** compilation d'un projet, on laisse les quatre activés, sinon le build est livré sans ces fichiers. Aux compilations suivantes, on désactive les parties auxquelles on n'a pas touché (l'audio et les binaires changent rarement) pour accélérer nettement le build. Les scripts et les données du jeu, eux, sont toujours recompilés, quels que soient les interrupteurs.

:::note[Windows uniquement]
L'exécutable produit par Studio ne fonctionne que sur les systèmes Windows 10 et Windows 11. La fenêtre affiche l'avertissement correspondant lorsqu'on compile sous macOS ou Linux.
:::

## Lancer la compilation

On clique sur **Compiler le projet**. Studio ouvre une fenêtre distincte qui suit le build : une barre de progression avançant à chaque étape (scripts, graphismes, données, bibliothèques, audio, binaires) et un journal en direct de tout ce que le moteur affiche.

Une fois terminé, la fenêtre indique **L'exécutable du jeu a été créée avec succès !** et propose trois actions :

- **Afficher dans le dossier** ouvre le dossier `Release/` avec le jeu sélectionné.
- **Copier dans le presse-papiers** copie l'intégralité du journal.
- **Enregistrer les logs** écrit le journal dans le dossier `logs` du projet, pratique en cas d'échec à signaler.

## Récupérer votre build

Le jeu compilé se trouve dans un dossier **`Release/`** à la racine du projet. Il est autonome : sous Windows, il contient `Game.exe` aux côtés du moteur, de ses données et de son propre runtime Ruby, si bien qu'un joueur n'a qu'à décompresser le dossier et double-cliquer sur `Game.exe`. Aucune installation de Studio, de PSDK ni de Ruby n'est requise.

Pour le distribuer, on zippe le dossier `Release/` entier et on partage l'archive. C'est le fichier que les joueurs téléchargent.

Sous macOS et Linux, le dossier embarque un lanceur `Game.sh` et une distribution Ruby intégrée à la place de `Game.exe`.

## Conclusion

La compilation est le remplaçant en un clic de l'ancien build en ligne de commande : on renseigne un nom et une version, on choisit ce qu'il faut recompiler, et Studio produit un dossier `Release/` autonome que l'on peut zipper et partager. On garde le bouton de lancement pour les tests au quotidien, et on compile dès que l'on tient une version digne d'être remise aux joueurs.
