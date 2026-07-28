---
title: "Installer et configurer Tiled"
slug: installer-et-configurer-tiled
sidebar_position: 2
description: "Pokémon Studio n'embarque pas Tiled : il lance la copie installée sur la machine, aussi bien pour ouvrir une carte que pour générer les aperçus de cartes qu'il affiche. Il lui faut donc le chemin exact de cette installation, et ce qu'il attend à cet endroit diffère sur Windows, Linux et macOS. Cette page couvre l'installation de Tiled et la déclaration correcte de son chemin."
---

Pokémon Studio n'embarque pas Tiled : il lance la copie installée sur la machine, aussi bien pour ouvrir une carte que pour générer les aperçus de cartes qu'il affiche. Il lui faut donc le chemin exact de cette installation, et ce qu'il attend à cet endroit diffère sur Windows, Linux et macOS. Cette page couvre l'installation de Tiled et la déclaration correcte de son chemin.

## Installer Tiled

Tiled se télécharge depuis son [site officiel](https://www.mapeditor.org). Il est gratuit et disponible pour Windows, Linux et macOS.

On l'installe à son emplacement par défaut. Une copie portable extraite dans un dossier temporaire fonctionne jusqu'au nettoyage de ce dossier, moment où Pokémon Studio perd l'éditeur sans explication évidente.

## Pourquoi Pokémon Studio a besoin du chemin

Deux fonctionnalités en dépendent :

- **Ouvrir une carte.** L'action **Ouvrir avec Tiled** lance l'éditeur sur le fichier `.tmx` de la carte sélectionnée.
- **Générer les aperçus de cartes.** Les images de prévisualisation que Studio affiche pour chaque carte ne sont pas dessinées par Studio. Il exécute `tmxrasterizer`, le moteur de rendu en ligne de commande livré avec Tiled, et range le résultat dans `Data/Tiled/Overviews`. Les calques réservés sont masqués pendant ce rendu, de sorte qu'un aperçu montre la carte telle que le joueur la voit.

Comme `tmxrasterizer` se trouve à côté du binaire de Tiled, Studio déduit son emplacement du chemin déclaré. Un mauvais chemin casse donc les deux fonctionnalités d'un coup.

## Déclarer le chemin dans Pokémon Studio

Le réglage se trouve dans **Paramètres**, onglet **Cartes**, champ **Chemin d'installation de Tiled**. On y dépose le fichier, ou on clique sur le champ pour aller le chercher.

### Windows

On pointe vers l'**exécutable de Tiled** lui-même, pas vers son dossier. Le fichier doit être `tiled.exe`, en général :

```bash
C:\Program Files\Tiled\tiled.exe
```

Studio vérifie le nom du fichier et refuse tout autre choix avec le message « Le chemin d'installation de Tiled choisi est invalide. »

### Linux

On pointe vers l'**AppImage** de Tiled si c'est ainsi qu'il a été installé. Avec une installation par gestionnaire de paquets, on pointe vers le binaire `tiled` ; Studio s'attend alors à trouver `tmxrasterizer` dans le même répertoire.

### macOS

On pointe vers l'application Tiled dans le dossier **Applications**. Studio y cherche le moteur de rendu, à l'emplacement `Contents/MacOS/tmxrasterizer`.

## Vérifier que ça fonctionne

On ouvre n'importe quelle carte avec **Ouvrir avec Tiled**. Si l'éditeur démarre sur le bon `.tmx`, le chemin est valide. Si Studio affiche « Le chemin d'installation de Tiled n'a pas été configuré. », le champ est encore vide et le bouton **Configurer le chemin d'installation** mène directement à la bonne page de paramètres.

## Conclusion

- Tiled s'installe séparément et se télécharge sur `mapeditor.org` ; Pokémon Studio ne fait que le lancer.
- Le chemin se déclare dans **Paramètres**, onglet **Cartes**, champ **Chemin d'installation de Tiled**.
- Sur Windows le champ attend le fichier `tiled.exe`, sur Linux l'AppImage ou le binaire, sur macOS l'application.
- Studio a besoin de ce chemin à la fois pour ouvrir les cartes et pour exécuter `tmxrasterizer`, qui produit les aperçus rangés dans `Data/Tiled/Overviews`.
- Une installation dans un dossier temporaire ou portable fonctionne jusqu'à la disparition de ce dossier.
