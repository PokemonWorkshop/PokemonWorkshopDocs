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
- **Produire les aperçus de cartes.** L'image affichée dans l'onglet **Carte** d'une carte est produite par un outil livré avec Tiled, pas par Studio. Sans le chemin, le bouton **Générer l'aperçu de la carte** reste grisé.

Un mauvais chemin casse les deux d'un coup, et aucun des deux échecs n'en donne la raison.

## Déclarer le chemin dans Pokémon Studio

Le réglage se trouve dans **Paramètres**, onglet **Cartes**, champ **Chemin d'installation de Tiled**. On y dépose le fichier, ou on clique sur le champ pour aller le chercher.

### Windows

On pointe vers l'**exécutable de Tiled** lui-même, pas vers son dossier. Le fichier doit être `tiled.exe`, en général :

```bash
C:\Program Files\Tiled\tiled.exe
```

Studio vérifie le nom du fichier et refuse tout autre choix avec le message « Le chemin d'installation de Tiled choisi est invalide. »

### Linux

On pointe vers l'**AppImage** de Tiled si c'est ainsi qu'il a été installé, ou vers le binaire `tiled` pour une installation par gestionnaire de paquets.

### macOS

On pointe vers l'application Tiled dans le dossier **Applications**.

## Vérifier que ça fonctionne

On ouvre n'importe quelle carte avec **Ouvrir avec Tiled**. Si l'éditeur démarre sur le bon `.tmx`, le chemin est valide. Si Studio affiche « Le chemin d'installation de Tiled n'a pas été configuré. », le champ est encore vide et le bouton **Configurer le chemin d'installation** mène directement à la bonne page de paramètres.

## Conclusion

- Tiled s'installe séparément et se télécharge sur `mapeditor.org` ; Pokémon Studio ne fait que le lancer.
- Le chemin se déclare dans **Paramètres**, onglet **Cartes**, champ **Chemin d'installation de Tiled**.
- Sur Windows le champ attend le fichier `tiled.exe`, sur Linux l'AppImage ou le binaire, sur macOS l'application.
- Studio a besoin de ce chemin à la fois pour ouvrir les cartes et pour exécuter `tmxrasterizer`, qui produit les aperçus rangés dans `Data/Tiled/Overviews`.
- Une installation dans un dossier temporaire ou portable fonctionne jusqu'à la disparition de ce dossier.
