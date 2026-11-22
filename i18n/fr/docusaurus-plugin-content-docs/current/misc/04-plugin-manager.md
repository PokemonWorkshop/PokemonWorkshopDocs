---
title: "Créer un plugin pour la communauté"
slug: creer-un-plugin-psdk
sidebar_position: 4
description: "Le Plugin Manager empaquette des extensions de script dans un seul fichier installable qui gère les dépendances, les vérifications de version et la compatibilité entre plugins. Ce guide explique comment en construire un, le vérifier et le distribuer."
---

Le Plugin Manager empaquette des extensions de script dans un seul fichier installable qui gère les dépendances, les vérifications de version et la compatibilité entre plugins. Ce guide explique comment en construire un, le vérifier et le distribuer.

Imaginons qu'on a écrit une extension de script à partager : des scènes en plus, une UI personnalisée, un ajustement de combat. Sans plugin, la seule façon de la diffuser est de livrer un tas de scripts et de demander aux gens de les coller dans le bon ordre, en espérant qu'ils possèdent les bibliothèques nécessaires et que rien n'entre en conflit avec leurs autres extensions. Un **plugin** transforme tout cela en un seul fichier que l'utilisateur dépose dans son projet. PSDK l'installe alors, récupère ce dont il dépend et refuse de le charger si quelque chose est incompatible.

## Fonctionnement du Plugin Manager

Un plugin est un seul fichier archive avec l'extension `.psdkplug`, stocké dans `project_root/scripts` (par exemple `project_root/scripts/ebdx.psdkplug`). Tout ce dont le plugin a besoin pour s'installer vit dans cette archive.

Les règles de base :

- Un plugin stocke sa propre configuration sous `project_root/Data/configs/plugins`, ce qui permet à l'utilisateur de le régler sans toucher aux scripts.
- Les plugins sont installés dans l'ordre des dépendances, et une dépendance cyclique (A a besoin de B, B de C, C de A) est rejetée.
- Quand un plugin dépend d'un autre plugin absent, le Plugin Manager le télécharge automatiquement.
- Un plugin peut lancer un script de test pour vérifier que PSDK fournit ce dont il a besoin, et un autre pour vérifier que les autres plugins installés ne le perturbent pas.
- Un plugin peut livrer des graphismes, de l'audio et des fichiers `Data` à côté de ses scripts.
- Quand un plugin est retiré, on demande à l'utilisateur s'il souhaite conserver ou supprimer les fichiers qu'il avait installés.

:::note[Le dossier des scripts de plugins est volatil]
`project_root/scripts/00000 Plugins` est vidé et reconstruit à chaque installation ou suppression de plugins. Il ne faut jamais y placer ses propres scripts : on les écrit dans le dossier du plugin (voir ci-dessous) et on laisse le Plugin Manager les extraire.
:::

## Quand les plugins sont installés

Le Plugin Manager n'agit que lorsque quelque chose a réellement changé. Il réinstalle (ou retire) les plugins dès que l'une de ces conditions est vraie :

- Un fichier `.psdkplug` a été ajouté à `scripts` ou en a été retiré.
- La version de PSDK a changé, typiquement après une mise à jour.
- On a lancé explicitement `psdk --util=plugin load`.

Si rien n'a changé depuis la dernière exécution, il reste en retrait et le jeu démarre normalement.

## Installer psdk-cli

La construction et la gestion des plugins s'effectuent via la commande `psdk-plugin`, fournie par la gem Ruby `psdk-cli`.

Pour l'installer, ouvrir un terminal et lancer :

```bash
gem install psdk-cli
```

:::note[Prérequis Ruby]
`psdk-cli` requiert Ruby 3.2.0 ou une version plus récente. Si l'environnement de développement pour PSDK est déjà installé (voir [Préparer son environnement de développement](/getting-started/customize-psdk/preparer-son-environnement)), Ruby est déjà disponible.
:::

Pour confirmer l'installation, lancer :

```bash
psdk-plugin --help
```

## Construire un plugin

### Structurer le dossier du plugin

Un plugin peut être structuré soit au sein d'un projet PSDK existant (pratique pour tester pendant le développement), soit dans un dossier / dépôt autonome (*standalone*, idéal pour le suivi de version et l'intégration continue).

#### Dans un projet PSDK

On crée un dossier portant le nom du plugin dans `project_root/scripts` (par exemple `project_root/scripts/votre_plugin`). À l'intérieur, PSDK attend cette organisation :

- `config.yml` à la racine du dossier du plugin (`scripts/votre_plugin/config.yml`) : le manifeste du plugin (décrit plus bas).
- Un sous-dossier `scripts` contenant le code lui-même (`scripts/votre_plugin/scripts/`). Chaque fichier de script suit la norme de nommage PSDK, `XXXXX NomDuScript.rb`.
- Les scripts de test de compatibilité, le cas échéant, se placent à la racine du dossier du plugin, à côté de `config.yml`.
- **Fichiers additionnels** (configurations par défaut dans `Data/configs/plugins/`, graphismes, audio) : ils ne doivent **pas** être placés dans `scripts/votre_plugin/`. Ils résident directement à leur emplacement de destination final par rapport à la **racine du projet** (par ex. `project_root/Data/configs/your_plugin_user_config.json`, `project_root/graphics/...`). Lors de la compilation dans un projet, l'outil résout les chemins par rapport à la racine du projet.

#### Dans un dépôt autonome (*standalone*)

Si on développe le plugin dans son propre dépôt dédié en dehors d'un projet PSDK :

- `config.yml` à la racine du dépôt.
- Un sous-dossier `scripts` contenant les scripts Ruby (`scripts/XXXXX NomDuScript.rb`).
- Les scripts de test de compatibilité, le cas échéant, se placent à la racine à côté de `config.yml`.
- **Fichiers additionnels** : reproduire l'arborescence du projet PSDK directement à la racine du dépôt (par ex. `votre_depot/Data/configs/your_plugin_user_config.json`, `votre_depot/graphics/...`). Lors de la compilation en mode autonome, l'outil résout les chemins par rapport à la racine du dépôt.

Pour un exemple concret, le [dépôt psdk-plugins](https://gitlab.com/NuriYuri/psdk-plugins) montre comment les dossiers sources de plugins sont organisés.

### Le fichier config.yml

Ce fichier est le manifeste du plugin. Il ressemble à ceci :

```yaml
--- !ruby/object:PluginManager::Config
name: test
authors:
- Yuri
version: 0.0.0.0
deps: []
psdk_compatibility_script: psdk.rb
retry_psdk_compatibility_after_plugin_load: false
additional_compatibility_script: add.rb
added_files:
- Data/configs/plugins/test/*.yml
```

Chaque champ :

- `name` : le nom du plugin, sous forme de chaîne. Il doit être un nom de fichier valide.
- `authors` : la liste des auteurs ayant travaillé sur le plugin.
- `version` : la version courante, au format `m.b.a.c` où `m` est le majeur, `b` la beta, `a` l'alpha et `c` la correction. Les quatre sont des nombres.
- `deps` : la liste des dépendances et des incompatibilités (détaillée plus bas).
- `psdk_compatibility_script` : le nom du script qui vérifie que le plugin est compatible avec PSDK. Optionnel, on retire la ligne si on ne l'utilise pas.
- `retry_psdk_compatibility_after_plugin_load` : un booléen indiquant si `psdk_compatibility_script` doit aussi s'exécuter une fois tous les plugins installés et chargés.
- `additional_compatibility_script` : le nom du script qui vérifie que le plugin fonctionne avec les autres plugins installés. Optionnel, on retire la ligne si on ne l'utilise pas.
- `added_files` : la liste des fichiers livrés par le plugin. Cette valeur est passée au `Dir[]` de Ruby, elle accepte donc des globs ou des chemins de fichiers explicites. L'endroit d'où ces fichiers sont lus dépend du contexte dans lequel vous compilez le plugin :
  - **Dans un projet PSDK** : les chemins sont résolus par rapport à la **racine du projet** (par ex. `Data/configs/plugins/test/*.yml` cherche dans `project_root/Data/configs/plugins/test/`). Les fichiers doivent déjà exister à leur emplacement définitif dans le projet.
  - **Dans un dépôt autonome** : les chemins sont résolus par rapport à la **racine de votre dépôt de plugin** (par ex. `Data/configs/plugins/test/*.yml` cherche dans `votre_depot/Data/configs/plugins/test/`).
  Lorsqu'un utilisateur installe l'archive `.psdkplug`, ces fichiers sont extraits vers ces mêmes chemins relatifs par rapport à la racine de son projet. Pour livrer un fichier situé à la racine, on préfixe son chemin par `./`, par exemple `./mon_fichier.extension`.

:::important[Résolution des chemins pour les fichiers additionnels]
Comme `added_files` enregistre le chemin relatif exact où les fichiers seront extraits dans le projet utilisateur :
- Dans un **projet PSDK**, ne placez pas les fichiers additionnels dans `scripts/votre_plugin/`. Laissez-les à leur emplacement réel dans le projet (`Data/...`, `graphics/...`).
- Dans un **dépôt autonome**, reproduisez l'arborescence cible depuis la racine de votre dépôt (`Data/...`, `graphics/...`).
:::

### Déclarer les dépendances et les incompatibilités

La liste `deps` décrit à la fois les plugins dont celui-ci a besoin et les plugins avec lesquels il ne peut pas coexister. Les bornes de version sont optionnelles et inclusives. Chaque entrée accepte :

- `:name` : le nom de la dépendance (ou du plugin incompatible).
- `:incompatible` : un booléen. À `true`, le plugin nommé est déclaré incompatible au lieu d'être une dépendance.
- `:url` : l'URL du fichier du plugin, utilisée pour le télécharger quand c'est une dépendance manquante.
- `:version_min` : la version minimale acceptée (optionnelle, inclusive).
- `:version_max` : la version maximale acceptée (optionnelle, inclusive).

L'exemple ci-dessous dépend de `super_plugin`, de `ruby_descr` à partir de la version `3.0.1.0`, de `yaml` jusqu'à `1.5.3.0`, de `litergss` entre `2.0.0.0` et `2.255.255.255`, et déclare `rgss` et `essentials` (entre `1.0.0.0` et `25.0.0.0`) comme incompatibles :

```yaml
deps:
- :name: super_plugin
  :url: https://download.psdk.pokemonworkshop.com/plugins/super_plugin.psdkplug
- :name: ruby_descr
  :url: https://download.psdk.pokemonworkshop.com/plugins/ruby_descr.psdkplug
  :version_min: 3.0.1.0
- :name: yaml
  :url: https://download.psdk.pokemonworkshop.com/plugins/yaml.psdkplug
  :version_max: 1.5.3.0
- :name: litergss
  :url: https://download.psdk.pokemonworkshop.com/plugins/litergss.psdkplug
  :version_min: 2.0.0.0
  :version_max: 2.255.255.255
- :name: rgss
  :incompatible: true
- :name: essentials
  :incompatible: true
  :version_min: 1.0.0.0
  :version_max: 25.0.0.0
```

:::warning[Les URLs de dépendances doivent télécharger en direct]
Une URL de dépendance doit permettre à PSDK de récupérer le fichier en HTTPS sans aucun « mur de téléchargement ». Des hébergeurs comme MediaFire ou Mega exigent un navigateur pour atteindre le fichier réel, PSDK ne peut donc pas y télécharger. On utilise un hébergeur qui sert le fichier `.psdkplug` directement.
:::

### Construire le fichier .psdkplug

Les plugins sont compilés en archives `.psdkplug` à l'aide de la commande `psdk-plugin build` de `psdk-cli`.

#### Compiler dans un projet PSDK

Lorsque vous êtes dans un projet PSDK (un dossier contenant un fichier `project.studio`), passez le nom du dossier du plugin :

```bash
psdk-plugin build nom_du_plugin
```

Remplacez `nom_du_plugin` par le nom du dossier sous `scripts/`. Par défaut, la commande compile l'archive dans le répertoire courant.

Pour générer le fichier `.psdkplug` directement dans votre dossier `scripts/` afin que PSDK puisse le détecter et l'installer :

```bash
psdk-plugin build nom_du_plugin --out-dir=scripts
```

#### Compiler en mode autonome (en dehors d'un projet PSDK)

Si vous développez votre plugin dans un dossier ou un dépôt Git isolé, placez-vous à la racine du dossier du plugin et lancez :

```bash
psdk-plugin build
```

En dehors d'un projet PSDK, `psdk-plugin build` prend automatiquement le répertoire courant (`.`) comme source du plugin.

Vous pouvez aussi cibler un autre dossier ou spécifier un dossier de sortie :

```bash
psdk-plugin build chemin/vers/plugin --out-dir=dist
```

Si vous êtes dans un dossier de projet PSDK mais souhaitez compiler un dossier de plugin autonome sans tenir compte de la structure du projet, utilisez l'option `--no-psdk-project` :

```bash
psdk-plugin build chemin/vers/plugin --no-psdk-project
```

#### Options de la commande

| Option | Description |
| --- | --- |
| `[PLUGIN_NAME]` | Nom du dossier du plugin dans `scripts/` (dans un projet) ou chemin du dossier (en mode autonome, par défaut `.`). |
| `--out-dir` | Répertoire de sortie pour le fichier `.psdkplug` généré (par défaut `.`). |
| `--no-psdk-project` | Force le mode autonome en ignorant la détection du projet PSDK. |

### Vérifier les fichiers empaquetés

Une fois compilé, assurez-vous que le fichier `.psdkplug` se trouve dans le dossier `scripts/` de votre projet. Le moyen le plus simple de confirmer que chaque fichier est bien entré dans l'archive est de forcer une réinstallation :

```bash
psdk --util=plugin load
```

Cela réinstalle le plugin et affiche chaque fichier ignoré parce qu'il existe déjà à sa destination. Voici la sortie pour un plugin nommé `test` qui livre trois fichiers :

```text
================================================================================
#                           PSDK Plugin Manager v1.0                           #
# Something changed in your plugins!                                           #
================================================================================
PSDK checked!
Extracting scripts for test plugin...
Extracting resources of test plugin...
Skipping Data/configs/credits_config.yml (exist)
Skipping Data/configs/save_config.yml (exist)
Skipping Data/configs/scene_title_config.yml (exist)
```

Voir ses fichiers listés comme ignorés confirme qu'ils ont bien été empaquetés.

### Les scripts de compatibilité

Les scripts de compatibilité permettent à un plugin d'interrompre l'installation avec une raison claire au lieu de planter le jeu plus tard. Ce sont de simples scripts Ruby qui lèvent une exception (`raise`) quand quelque chose ne va pas :

- `psdk_compatibility_script` s'exécute avant le chargement du plugin, pour vérifier que PSDK lui-même fournit ce dont le plugin a besoin.
- `additional_compatibility_script` s'exécute après le chargement de tous les plugins, pour vérifier que les autres plugins installés ne le perturbent pas.
- `retry_psdk_compatibility_after_plugin_load`, à `true`, relance `psdk_compatibility_script` une seconde fois après le chargement de tous les plugins, utile lorsqu'un autre plugin a pu modifier ce sur quoi la première vérification reposait.

Si l'un de ces scripts lève une exception, le Plugin Manager signale le plugin comme incompatible et s'arrête.

## Lister les plugins installés

Pour voir quels plugins sont actuellement installés dans votre projet PSDK, avec la version et les auteurs de chaque plugin, lancez :

```bash
psdk-plugin list
```

:::note[À exécuter dans un projet PSDK]
`psdk-plugin list` doit être exécuté depuis un répertoire de projet PSDK. La commande lit la liste des plugins enregistrés dans `scripts/plugins.dat`.
:::

## Distribuer un plugin

La façon de distribuer un plugin dépend de la possibilité que d'autres plugins en dépendent.

S'il peut servir de dépendance, on héberge le fichier `.psdkplug` quelque part d'accessible en HTTPS avec un téléchargement direct (la même règle « pas de mur de téléchargement » que pour les URLs de dépendances), ou on demande au Pokémon Workshop s'il peut l'héberger. Ainsi, le Plugin Manager peut le récupérer automatiquement pour quiconque en dépend.

S'il est autonome, l'utilisateur n'a qu'à déposer le fichier dans `project_root/scripts`. Tant que les dépendances sont correctement décrites, tout est géré à l'installation.

:::tip[Prévenir des incompatibilités en amont]
Si le plugin est incompatible avec un autre plugin ou avec certaines versions de PSDK, on en informe les utilisateurs avant qu'ils ne le téléchargent. Le Plugin Manager détectera le conflit, mais un avertissement leur évite la surprise.
:::

## Conclusion

Un plugin n'est qu'un dossier avec un manifeste `config.yml`, compilé en un seul fichier `.psdkplug` avec `psdk-plugin build` de `psdk-cli`. Le manifeste déclare la version, les fichiers à livrer, les dépendances à télécharger et les incompatibilités à rejeter, tandis que des scripts de compatibilité optionnels laissent le plugin échouer tôt avec un message lisible. Une fois construit et vérifié avec `psdk --util=plugin load`, on le distribue en téléchargement direct HTTPS, et le Plugin Manager se charge de l'installer dans le bon ordre sur chaque projet.
