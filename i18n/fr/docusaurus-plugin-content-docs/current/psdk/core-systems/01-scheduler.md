---
title: "Scheduler"
slug: scheduler
sidebar_position: 1
description: "Le Scheduler exécute son code à des moments précis sans modifier le moteur : les événements du cycle de vie d'une scène comme chaque frame ou un warp, et les actions sur la carte comme un pas ou un saut. Ce guide couvre les deux schedulers et quand utiliser chacun."
---

Le Scheduler exécute son code à des moments précis sans modifier le moteur : les événements du cycle de vie d'une scène comme chaque frame ou un warp, et les actions sur la carte comme un pas ou un saut. Ce guide couvre les deux schedulers et quand utiliser chacun.

## Pourquoi il existe

Une scène PSDK fait déjà beaucoup pendant sa vie : elle s'initialise, se met à jour à chaque frame, gère les warps, se libère. La carte fait aussi son propre travail : elle déplace le joueur, le fait sauter, compte ses pas. Quand on veut ajouter un comportement à l'un de ces moments, le mauvais réflexe est de modifier le code source du moteur. La prochaine mise à jour l'écraserait, et on se battrait contre le moteur à chaque version.

Le **Scheduler** est l'alternative propre. Au lieu de modifier le moteur, on **enregistre une tâche** : un morceau de code plus le moment où il doit s'exécuter. Le moteur l'exécute au bon moment. C'est le compagnon runtime du [monkey-patch](/getting-started/customize-psdk/monkey-patch-dans-psdk) : le monkey-patch change ce que fait une méthode, le Scheduler ajoute du code à des moments bien connus sans toucher à aucune méthode.

## Deux façons de planifier

PSDK fournit deux schedulers complémentaires, et la première chose à bien cerner est celui auquel un besoin donné appartient.

- Les **tâches de cycle de vie** (`Scheduler`) réagissent à la vie d'une **scène** : chaque frame, à son initialisation, lors d'un warp, à sa libération. À utiliser pour tout ce qui est lié à une scène affichée à l'écran.
- Les **tâches d'événement** (`Scheduler::EventTasks`) réagissent aux actions d'un **personnage sur la carte** : un pas, un saut, une glissade. À utiliser pour tout ce qui est lié au déplacement du joueur (ou d'un événement).

La suite du guide couvre chacune, puis comment choisir.

## Les tâches de cycle de vie

### Comment ça marche

Le scheduler de cycle de vie est un registre de tâches indexé par deux clés : une **raison** (le genre de moment) et une **classe de scène** (où elle s'applique).

```ruby
# Conceptuellement :
tasks[raison][classe_de_scene] = [tache, tache, ...]
```

Il n'y a que trois opérations, et bien les distinguer lève l'essentiel de la confusion :

- On **enregistre** une tâche avec `add_proc` ou `add_message`. C'est ce qu'on écrit.
- Le moteur **déclenche** une raison avec `start`, ce qui exécute toutes les tâches enregistrées dessous. Le moteur appelle déjà cela à chaque point du cycle de vie, donc on n'appelle quasiment jamais `start` soi-même.
- On **désenregistre** une tâche avec `__remove_task` quand elle n'est plus nécessaire.

En résumé : notre rôle est d'enregistrer ; c'est le moteur qui déclenche.

### Les raisons

Une **raison** est le moment du cycle de vie qui déclenche une tâche. Il en existe dix, chacune déclenchée par le moteur à un point précis :

| Raison | Quand elle se déclenche |
| --- | --- |
| `:on_update` | À chaque frame, en continu tant que la scène est affichée. C'est la boucle principale, l'endroit pour tout ce qui doit tourner en permanence. |
| `:on_init` | Juste après la création de la scène, avant qu'elle n'apparaisse à l'écran. L'endroit pour préparer ses éléments. |
| `:on_transition` | Quand la scène joue sa transition visuelle, le fondu d'entrée ou de sortie entre deux scènes. |
| `:on_scene_switch` | Juste avant que la scène ne cède la place à une autre, c'est-à-dire quand le jeu change de scène. |
| `:on_dispose` | Quand la scène se ferme et libère ses ressources. L'endroit pour nettoyer ce qu'on a créé. |
| `:on_warp_start` | Au moment où le joueur commence à passer sur une autre carte (on appelle ça un **warp**), avant tout le reste. |
| `:on_warp_process` | Une fois le joueur arrivé sur la nouvelle carte, mais avant que les états du jeu ne soient rafraîchis. |
| `:on_warp_end` | Quand le changement de carte est terminé, juste avant que la transition de la nouvelle carte ne se joue. |
| `:on_hour_update` | Quand l'horloge en jeu passe à l'heure suivante (système jour/nuit), par exemple pour rafraîchir les Pokémon sauvages disponibles. |
| `:on_getting_tileset_name` | Quand le moteur de carte choisit quel **tileset**, la planche de tuiles graphiques, charger pour la carte courante. |

`:on_update` est celle qu'on utilise le plus souvent : c'est la boucle par frame, l'équivalent du `update` d'une scène, mais apporté depuis l'extérieur.

### Enregistrer : `add_proc` ou `add_message`

Il y a deux façons d'enregistrer, et le choix ne porte que sur l'endroit où vit le code.

`add_proc` exécute un **bloc**. On l'utilise pour de la logique inline :

```ruby
Scheduler.add_proc(:on_update, Scene_Map, 'MyGame::MapHud', 100) do
  $map_hud&.update
end
```

`add_message` envoie une **méthode** à un objet. On l'utilise quand le comportement vit déjà dans une méthode d'un objet qu'on a sous la main :

```ruby
Scheduler.add_message(:on_update, Scene_Map, 'MyGame::MapHud', 100, $map_hud, :update)
```

Les deux prennent les mêmes quatre premiers arguments :

- `raison` : l'une des raisons ci-dessus.
- `klass` : la classe de scène à laquelle la tâche appartient (une classe comme `Scene_Map`, ou le symbole `:any` pour s'exécuter sur toutes les scènes). La tâche ne se déclenche que tant qu'une scène de cette classe est active.
- `name` : une chaîne identifiant la tâche. On la préfixe d'un namespace (par exemple `'MyGame::MapHud'`) pour qu'elle soit unique et facile à retirer plus tard.
- `priority` : un entier qui ordonne la tâche par rapport aux autres (voir plus bas).

Il y a une différence subtile mais importante. `add_message` capture l'objet **au moment de l'enregistrement**, donc `$map_hud` doit déjà exister quand on enregistre. `add_proc` évalue son bloc **à chaque exécution de la tâche**, donc il peut lire un global défini plus tard. Quand la cible peut ne pas encore exister, on privilégie `add_proc` avec la navigation sûre, comme montré ci-dessus.

### Priorité et `:any`

Quand plusieurs tâches partagent la même raison et la même classe, la **priorité** décide de l'ordre : un numéro de priorité plus élevé s'exécute en premier. Une tâche enregistrée avec la priorité `1000` s'exécute avant une enregistrée avec `100`.

La classe `:any` est spéciale. Ses tâches s'exécutent pour **toutes** les scènes de cette raison, et elles s'exécutent **avant** les tâches liées à une classe précise. Donc avec à la fois une tâche `:any` et une tâche `Scene_Map` sur `:on_update`, la tâche `:any` s'exécute en premier sur la carte. On utilise `:any` pour un comportement qui doit suivre le joueur à travers toutes les scènes (un raccourci global, une surcouche de debug), et une classe concrète quand le comportement n'a de sens que dans une seule scène.

### Retirer une tâche, et un mot sur `start`

Une tâche vit jusqu'à ce qu'on la retire. On utilise `__remove_task` avec les **mêmes** raison, classe, nom et priorité que ceux de l'enregistrement :

```ruby
Scheduler.__remove_task(:on_update, Scene_Map, 'MyGame::MapHud', 100)
```

Le `name` et la `priority` sont ce qui permet au Scheduler de retrouver la tâche exacte à supprimer, d'où l'importance d'un nom unique et préfixé. C'est ainsi qu'une fonctionnalité que l'on active et désactive (un effet météo, une lumière dynamique) s'enregistre quand elle est activée et se retire quand elle est désactivée.

On croise `Scheduler.start(raison, classe_de_scene)` dans le moteur, mais on l'appelle rarement soi-même : c'est le moteur qui déclenche une raison, pas nous. Par exemple, `Graphics.update` exécute `Scheduler.start(:on_update)` à chaque frame, et une scène exécute `Scheduler.start(:on_init, self.class)` dans son `main`. On n'appelle `start` que si l'on invente sa propre raison, ce qui implique aussi de la déclarer d'abord dans `Scheduler.init`, et qu'on choisit où la déclencher. C'est rare (voir [Déclencher sa propre action](#déclencher-sa-propre-action) pour l'équivalent plus simple côté événements).

### Ce que PSDK planifie ainsi

Ces tâches ne reposent pas sur une API spéciale : les fonctionnalités du moteur lui-même sont construites sur exactement les appels ci-dessus. Les voir rend le rôle concret :

| Fonctionnalité | Raison | Ce qu'elle fait |
| --- | --- | --- |
| Croissance des baies | `:on_update` | Fait pousser les baies plantées via le système de temps. |
| Lumière dynamique | `:on_update`, `:on_init`, `:on_warp_end` | Met à jour les sources de lumière de la carte à chaque frame et les reconstruit au changement de carte. |
| Surcouche de debug | `:on_update` (`:any`) | Rafraîchit le débogueur par-dessus chaque scène. |
| Soft reset | `:on_update` (`:any`) | Surveille la combinaison de touches de soft reset sur chaque scène. |

Le système de lumière dynamique, par exemple, enregistre sa mise à jour par frame sur la carte et la retire quand elle n'est plus nécessaire, exactement comme le ferait notre propre code :

```ruby
Scheduler.add_message(:on_update, Scene_Map, 'NuriYuri::DynamicLight', 100, self, :update)
# ...plus tard, une fois désactivé :
Scheduler.__remove_task(:on_update, Scene_Map, 'NuriYuri::DynamicLight', 100)
```

### Un exemple complet

Supposons que l'on ait construit un HUD personnalisé qui doit se rafraîchir à chaque frame tant que le joueur est sur la carte. On place un seul script dans son projet (par exemple `scripts/My_Project/0001 Map HUD.rb`) qui enregistre la tâche au chargement :

```ruby
module MyProject
  # Le HUD de carte personnalisé, créé et stocké dans un global à l'ouverture de la carte.
  module_function

  def update_map_hud
    $map_hud&.update
  end
end

# Enregistrement unique, au chargement du script. Le moteur s'occupe du reste.
Scheduler.add_proc(:on_update, Scene_Map, 'MyProject::MapHud', 100) do
  MyProject.update_map_hud
end
```

C'est toute l'intégration. Comme la tâche est liée à `Scene_Map`, elle ne s'exécute que sur la carte, jamais en combat ni dans un menu, donc aucun test de scène n'est nécessaire dans le bloc. On n'a modifié aucun fichier du moteur, et la prochaine mise à jour de PSDK laisse le code intact.

## Les tâches d'événement

Le scheduler de cycle de vie ne sait rien du joueur qui se déplace. C'est le rôle du second scheduler, `Scheduler::EventTasks`. Il réagit aux **actions d'un personnage sur la carte**, et c'est lui qui fait tourner les mécaniques liées au déplacement.

### Comment ça marche

Une tâche d'événement est enregistrée contre trois choses : un **type d'action**, un **événement** et une **carte**. Quand un personnage effectue cette action, le moteur déclenche les tâches correspondantes et leur transmet le personnage qui s'est déplacé.

Les six types d'action sont le début et la fin des trois façons dont un personnage peut se déplacer :

- `:begin_step` / `:end_step` : un pas, case par case.
- `:begin_jump` / `:end_jump` : un saut, comme descendre un rebord ou une commande de déplacement « Saut ».
- `:begin_slide` / `:end_slide` : une glissade, comme sur la glace ou les rapides.

`:end_step` est de loin la plus courante : « le joueur vient de faire un pas » est le hook derrière la plupart des mécaniques de la carte.

### Enregistrer et retirer

On enregistre avec `on`, et le bloc reçoit le personnage qui a déclenché la tâche :

```ruby
# Exécuter du code chaque fois que le joueur termine un pas
Scheduler::EventTasks.on(:end_step, 'MyGame::StepCounter', -1) do |event|
  $game_variables[STEP_COUNT_ID] += 1
end
```

Les arguments sont :

- `task_type` : l'une des six actions ci-dessus.
- `description` : une chaîne identifiant la tâche, comme le `name` d'une tâche de cycle de vie. Sert à la retirer plus tard.
- `event_id` : quel personnage la déclenche. `-1` est le joueur, `-2` son premier suiveur, `-3` le deuxième, et ainsi de suite ; un nombre positif est un événement de la carte par son id ; `:any` correspond à tous les personnages. Vaut `:any` par défaut.
- `map_id` : sur quelle carte elle se déclenche, ou `:any` pour toutes les cartes. Vaut `:any` par défaut.

Le bloc est appelé avec `|event, event_id, map_id|` : le `Game_Character` qui s'est déplacé, et (utile pour les tâches `:any`) quel événement et quelle carte c'était.

On retire une tâche avec `delete`, en réutilisant les mêmes type, description, événement et carte :

```ruby
Scheduler::EventTasks.delete(:end_step, 'MyGame::StepCounter', -1, :any)
```

### Déclencher sa propre action

Les six actions ci-dessus sont celles que le moteur de carte déclenche, mais le système ne les code pas en dur : `EventTasks` accepte n'importe quel type d'action qu'on invente. Pour ajouter le sien, on enregistre un handler avec `on` sous un nouveau symbole, puis on appelle `trigger` là où cette action doit se produire, en passant le personnage concerné :

```ruby
# Une action personnalisée que l'on déclenche soi-même depuis son propre code (monkey-patché)
Scheduler::EventTasks.on(:begin_surf, 'MyGame::SurfSplash', -1) do |event|
  # jouer une éclaboussure là où le joueur commence à surfer
end

# ...à l'endroit où le surf commence, dans son patch :
Scheduler::EventTasks.trigger(:begin_surf, $game_player)
```

Cela fonctionne parce qu'un type de tâche d'événement est créé à la demande. Le scheduler de cycle de vie est plus strict : ses raisons sont une liste fixe mise en place au démarrage, et enregistrer une tâche sur une raison inconnue est **silencieusement ignoré**. Ajouter une raison de cycle de vie inédite implique de patcher `Scheduler.init` pour la déclarer d'abord. C'est pourquoi, en pratique, on réutilise les dix raisons existantes et on n'invente de nouveaux déclencheurs que du côté des événements.

### Ce que PSDK planifie ainsi

L'essentiel de ce qui se produit « pendant que le joueur marche » est une tâche d'événement sur le joueur (`event_id -1`) :

| Tâche | Action | Ce qu'elle fait |
| --- | --- | --- |
| Repousse | `:end_step` | Décompte les pas de Repousse restants. |
| Poison | `:end_step` | Applique les dégâts de poison pendant la marche. |
| Éclosion | `:end_step` | Fait progresser les œufs vers l'éclosion. |
| Pension | `:end_step` | Met à jour l'état de la Pension. |
| Évolution à la marche | `:end_step` | Gère les évolutions qui dépendent du nombre de pas. |
| Démarrage de combat | `:begin_step` | Tire une rencontre sauvage au début du pas. |
| Poussière au saut | `:end_jump` | Crée des particules de poussière ou d'eau là où un personnage atterrit. |

La tâche de poussière au saut est un bon modèle car elle s'applique à tous les personnages, pas seulement au joueur :

```ruby
Scheduler::EventTasks.on(:end_jump, 'Dust after jumping') do |event|
  next if event.particles_disabled

  particle = Game_Character::SurfTag.include?(event.system_tag) ? :water_dust : :dust
  Yuki::Particles.add_particle(event, particle)
end
```

## Lequel utiliser ?

- Le comportement doit s'exécuter **en continu ou à une frontière de scène** (chaque frame, à l'init, sur un warp, à la libération) : on utilise une **tâche de cycle de vie** (`Scheduler.add_proc` / `add_message`).
- Le comportement doit s'exécuter **quand un personnage se déplace** sur la carte (un pas, un saut, une glissade) : on utilise une **tâche d'événement** (`Scheduler::EventTasks.on`).

Un compteur de pas est une tâche d'événement. Un rafraîchissement de HUD par frame est une tâche de cycle de vie. En cas de doute, on se demande si le déclencheur est « le joueur a fait quelque chose » (tâche d'événement) ou « la scène a atteint un moment » (tâche de cycle de vie).

## Conclusion

- Le **Scheduler** exécute son code à des moments précis sans modifier le moteur, à travers deux systèmes complémentaires.
- Les **tâches de cycle de vie** (`Scheduler`) sont indexées par une **raison** et une **classe de scène**. On enregistre avec `add_proc` (bloc) ou `add_message` (méthode sur un objet) ; le moteur les déclenche avec `start` ; on les retire avec `__remove_task`.
- La **priorité** ordonne les tâches de cycle de vie (la plus haute s'exécute en premier), et les tâches `:any` s'exécutent sur toutes les scènes, avant celles liées à une classe précise.
- Les **tâches d'événement** (`Scheduler::EventTasks`) sont indexées par une **action** (`:end_step`, `:end_jump`, ...), un **événement** et une **carte**. On enregistre avec `on` et on retire avec `delete` ; le bloc reçoit le personnage qui s'est déplacé. On peut aussi inventer son propre type d'action et le déclencher avec `trigger`.
- Les fonctionnalités de PSDK reposent sur les deux : la lumière dynamique et la croissance des baies sont des tâches de cycle de vie ; le Repousse, le poison, l'éclosion et la poussière au saut sont des tâches d'événement.
- On choisit selon le déclencheur : un moment de scène est une tâche de cycle de vie, un personnage qui se déplace est une tâche d'événement.
