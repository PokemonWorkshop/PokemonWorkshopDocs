---
title: "Comment mettre à jour Pokémon Studio et corriger l'erreur « endommagé » sur macOS ?"
slug: mettre-a-jour-pokemon-studio-macos
sidebar_position: 1
description: "Sur macOS, Pokémon Studio ne se met pas à jour automatiquement, et une version fraîchement téléchargée refuse souvent de s'ouvrir avec une erreur trompeuse indiquant qu'elle est « endommagée ». Ce guide explique pourquoi cela arrive et comment mettre à jour Pokémon Studio manuellement puis le débloquer."
---

Sur macOS, Pokémon Studio ne se met pas à jour automatiquement, et une version fraîchement téléchargée refuse souvent de s'ouvrir avec une erreur trompeuse indiquant qu'elle est « endommagée ». Ce guide explique pourquoi cela arrive et comment mettre à jour Pokémon Studio manuellement puis le débloquer.

## Pourquoi le message « endommagé » apparaît

Lorsqu'on télécharge une application en dehors de l'App Store, macOS lui appose un indicateur de **quarantaine** — un attribut étendu nommé `com.apple.quarantine`. Au premier lancement, **Gatekeeper** (la couche de sécurité de macOS) inspecte cet indicateur et vérifie que l'application est signée et notariée par un identifiant Apple Developer enregistré.

Pokémon Studio est une application open source développée par la communauté, qui n'est **pas notariée par Apple**. Gatekeeper refuse donc de l'exécuter et affiche un message du type :

```text
« Pokémon Studio » est endommagé et ne peut pas être ouvert. Vous devriez le placer dans la corbeille.
```

L'application n'est **pas** réellement endommagée. Ce message est simplement la façon dont macOS signale une application bloquée et non notariée. Retirer l'indicateur de quarantaine indique à Gatekeeper de l'autoriser à s'exécuter.

## Build de dev ou mise à jour manuelle

La manière de mettre à jour dépend du type de build que l'on utilise :

- **Build de dev** : si on a cloné Pokémon Studio depuis GitHub et qu'on l'exécute depuis les sources, il se met à jour automatiquement à chaque fois que l'on récupère les dernières modifications avec Git. Rien d'autre n'est nécessaire.
- **Build de release** : si on utilise une version packagée, il n'y a **aucune mise à jour automatique sur macOS**. C'est la principale différence avec Windows, où Studio se met à jour tout seul. Sur macOS, on télécharge chaque nouvelle version manuellement et on retire de nouveau l'indicateur de quarantaine.

Si on vient de Windows et qu'on a l'habitude de voir Studio se mettre à jour seul, cette étape manuelle est normale — ce n'est pas un bug.

## Télécharger la dernière version

1. Ouvrir la [page des releases de Pokémon Studio](https://github.com/PokemonWorkshop/PokemonStudio/releases).
2. Télécharger l'asset **darwin** de la dernière release (`darwin` est le nom interne que macOS donne à son noyau).
3. Extraire l'archive. Certains navigateurs (par exemple Arc) l'extraient automatiquement dans le dossier **Téléchargements** ; sinon, double-cliquer sur le fichier téléchargé pour décompresser l'application `Pokemon Studio.app`.

## Retirer l'attribut de quarantaine

Ouvrir l'application **Terminal** et se placer dans le dossier qui contient l'application — généralement `Downloads` :

```bash
cd ~/Downloads
```

Puis effacer les attributs étendus de l'application :

```bash
xattr -cr "Pokemon Studio.app"
```

- `xattr` gère les attributs étendus des fichiers. L'option `-c` les efface (**c**lear) et `-r` applique le changement de manière récursive (**r**ecursive) à tout le contenu du bundle `.app`.
- Le bundle sur le disque s'appelle `Pokemon Studio.app` **sans accent** (même si l'application s'affiche sous le nom **Pokémon Studio**), donc le saisir exactement tel quel. Si on l'a renommée, adapter la commande en conséquence.

Si la commande renvoie une erreur de permission, préfixer avec `sudo` et saisir le mot de passe du Mac à l'invite :

```bash
sudo xattr -cr "Pokemon Studio.app"
```

Une fois la commande terminée, double-cliquer sur `Pokemon Studio.app`. Gatekeeper ne voit plus l'indicateur de quarantaine, et l'application s'ouvre normalement. On peut ensuite la déplacer dans le dossier **Applications** pour la conserver à cet endroit.

## Conclusion

- Le message « endommagé » est trompeur : il signifie que Gatekeeper de macOS a bloqué une application non notariée, pas que le fichier est corrompu.
- Les builds de dev récupérés depuis GitHub se mettent à jour automatiquement ; les versions packagées sur macOS doivent être mises à jour manuellement, sans auto-update.
- Télécharger l'asset **darwin** depuis la page des releases et extraire l'application `Pokemon Studio.app`.
- Lancer `xattr -cr "Pokemon Studio.app"` (ajouter `sudo` si nécessaire) pour effacer l'indicateur de quarantaine, puis ouvrir l'application normalement.
