---
title: "Tester une Merge Request PSDK"
slug: tester-une-merge-request-psdk
sidebar_position: 3
description: "Tester une Merge Request PSDK est une autre façon de contribuer au développement du moteur. Cela permet de vérifier les nouvelles fonctionnalités et corrections avant qu'elles soient disponibles pour tout le monde. Ce guide explique quels outils installer, comment trouver une Merge Request, la tester et signaler le résultat des tests."
---

Tester une Merge Request PSDK est une autre façon de contribuer au développement du moteur. Cela permet de vérifier les nouvelles fonctionnalités et corrections avant qu'elles soient disponibles pour tout le monde. Ce guide explique quels outils installer, comment trouver une Merge Request, la tester et signaler le résultat des tests.

Il n'est pas nécessaire d'écrire du code Ruby pour réaliser les tests. Également, la RubyGem dédiée gère les commandes Git nécessaires pour préparer un projet sur une Merge Request.

## Installer les outils

### Prérequis pour la RubyGem psdk-cli

Pour tester une Merge Request, on configure un projet PSDK sur la branche Git de cette Merge Request. La RubyGem `psdk-cli` fournit des outils en ligne de commande qui facilitent cette configuration.

On installe Ruby et Git avant d'installer la gem. On n'a pas besoin d'utiliser les commandes Git soi-même, mais `psdk-cli` a besoin des deux outils. Suivre les instructions au début de [Préparer son environnement de développement](/getting-started/customize-psdk/preparer-son-environnement) pour les installer, puis revenir à ce guide.

### Installer la RubyGem

Pour installer la RubyGem, ouvrir un terminal et lancer la commande suivante. Exécuter le fichier `cmd.bat` du projet PSDK pour ouvrir un terminal dans ce projet.

```bash
gem install psdk-cli
```

Pour confirmer l'installation, lancer `psdk-use --help`. La commande doit afficher ses sous-commandes disponibles.

## Trouver une Merge Request à tester

Ouvrir la [page des Merge Requests PSDK](https://gitlab.com/pokemonsdk/pokemonsdk/-/merge_requests) et chercher les **Merge Requests ouvertes portant le label `Need to be tested`**.

![Page GitLab de la liste des MR](/img/misc/psdk-mr-list-page.png)

On peut aussi utiliser **le canal Discord `#psdk-testers-notifications`**. Chaque samedi matin, une notification automatique liste les Merge Requests portant le label `Need to be tested`. Le rôle `Team Tests` est nécessaire pour accéder à ce canal.

![Exemple de message de notification Discord](/img/misc/testers-notification.png)

## Récupérer la Merge Request

**Chaque Merge Request possède un numéro**. Sur la liste GitLab et sa page de détail, il apparaît après le point d'exclamation, par exemple `!1884`. La notification Discord affiche aussi ce numéro.

Dans un terminal ouvert à la **racine du projet PSDK utilisé pour les tests**, lancer `psdk-use mr` suivi du **numéro de la Merge Request**. Exécuter `cmd.bat` pour ouvrir un terminal au bon emplacement.

```bash
psdk-use mr 1884
```

Remplacer `1884` par le numéro de la Merge Request choisie. Pour vérifier que le projet est prêt à tester, lancer `psdk-cli version`. Chercher une ligne commençant par `Project's PSDK git target: [mr-1884] ...` ; le **numéro entre crochets doit correspondre** à celui passé à `psdk-use`.

```text
psdk-cli version
...
Project's PSDK git target: [mr-1884] e4b98d59 Remove CounterBase
```

## Tester la modification

Avant de tester, **lire toute la description de la Merge Request**. Elle donne le contexte, explique ce qui a changé et peut indiquer une préparation nécessaire, comme l'installation de ressources avant de lancer le jeu. Elle liste aussi les tests qui confirment que la Merge Request fonctionne comme prévu. Réaliser des tests supplémentaires pertinents lorsqu'un autre comportement mérite d'être vérifié.

Pendant le test :

- Reproduire le scénario décrit dans la Merge Request, puis vérifier le résultat attendu.
- Essayer les cas normaux et les cas d'échec proches lorsque c'est pertinent, surtout lorsque le test concerne une correction de bug.
- Noter les étapes exactes suivies afin de pouvoir décrire précisément le problème si quelque chose échoue.
- **Demander des instructions précises à l'auteur de la Merge Request** lorsqu'un test n'est pas clair ou que ses instructions sont incomplètes.

## Signaler le résultat

Les testeurs ont besoin d'une autorisation pour modifier la checklist de la Merge Request. Pour être ajouté comme testeur, **demander dans le canal Discord `#psdk-testers`**. Il est possible de commencer les tests en attendant qu'un maintainer donne l'accès.

Lorsque tous les tests requis passent, cocher les cases de test dans la description de la Merge Request. Retirer le label `Need to be tested` une fois les tests terminés, sauf si la Merge Request est suffisamment importante pour nécessiter davantage de tests indépendants. En cas de doute, demander dans `#psdk-testers` s'il faut retirer le label.

Lorsqu'un test échoue, le **signaler dans la discussion de la Merge Request**. Indiquer quel test était en cours, quel résultat était attendu et ce qui s'est produit. Utiliser des fils distincts pour des problèmes distincts afin de faciliter leur suivi. Une Merge Request ne peut pas être fusionnée tant qu'elle contient des fils non résolus. Le testeur qui a ouvert un fil, et *non l'auteur de la Merge Request*, le résout lorsque la discussion a abouti.

## Conclusion

- Installer Ruby, Git et `psdk-cli` avant de tester une Merge Request.
- Trouver une Merge Request ouverte avec le **label `Need to be tested`**, puis utiliser `psdk-use mr [ID]` depuis la racine du projet pour récupérer sa branche.
- Suivre les instructions de test de l'auteur, tester les cas liés lorsque c'est pertinent et demander des précisions lorsque nécessaire.
- Marquer les tests réussis dans la checklist de la Merge Request, ou **signaler les échecs dans sa discussion**.
- **Demander des précisions dans `#psdk-testers` ou dans la discussion de la Merge Request** lorsque la procédure de test n'est pas claire.
