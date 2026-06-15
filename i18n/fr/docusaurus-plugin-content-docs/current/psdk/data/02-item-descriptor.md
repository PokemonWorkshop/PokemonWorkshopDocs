---
title: "Définir le comportement d'un objet"
slug: definir-le-comportement-d-un-objet
sidebar_position: 2
description: "Ce guide explique comment PSDK transforme les données d'un objet en comportement en jeu avec le module ItemDescriptor : le wrapper lu par toutes les UI, et les fonctions de définition qui disent ce qu'un objet fait depuis le sac, sur une créature ou sur une capacité."
---

Ce guide explique comment PSDK transforme les données d'un objet en comportement en jeu avec le module **ItemDescriptor** : le wrapper lu par toutes les UI, et les fonctions de définition qui disent ce qu'un objet fait depuis le sac, sur une créature ou sur une capacité.

## Des données au comportement

Un `Studio::Item` ne contient que des **données** : prix, drapeaux, descriptions (voir [Comment accéder aux données du jeu dans PSDK ?](/psdk/data/acceder-aux-donnees-du-jeu)). Il ne dit rien de ce qui doit se passer quand le joueur utilise l'objet. Cette partie vit dans `PFM::ItemDescriptor` (`scripts/3 Studio/2 Data/0 Item/000 ItemDescriptor.rb` dans les sources de PSDK).

Quand le joueur utilise un objet, l'UI appelle `PFM::ItemDescriptor.actions(item_id)` et reçoit un **wrapper** décrivant quoi faire. Beaucoup d'interfaces appellent ce wrapper `extend_data`. Votre travail, quand vous créez un objet personnalisé, est d'enregistrer la bonne définition pour que le wrapper sorte correctement : on ne construit presque jamais un wrapper soi-même.

## Que se passe-t-il quand le joueur utilise un objet

Le déroulé complet, du sac jusqu'à l'effet :

1. Le sac appelle `PFM::ItemDescriptor.actions(item_id)` et obtient le wrapper.
2. Si `no_effect` ou `chen` est levé, le message correspondant s'affiche et tout s'arrête là.
3. Si `open_party` est levé, l'équipe s'ouvre ; pour chaque créature, l'UI appelle `on_creature_choice` (votre bloc d'utilisabilité) pour savoir si l'objet peut être utilisé sur elle.
4. Si `open_skill` est levé, la sélection de capacité s'ouvre sur la créature choisie, filtrée de la même façon par `on_skill_choice`.
5. La fonction d'utilisation correspondant au contexte s'exécute enfin : `on_use` depuis le sac, `on_creature_use` ou `on_skill_use` sur la carte. En combat, l'UI appelle `bind` et le moteur de combat déclenche `execute_battle_action` pendant le tour.

Chaque fonction de définition ci-dessous remplit une ou plusieurs de ces étapes. Vous n'écrivez que les blocs ; PSDK pilote le déroulé.

## Ce que le wrapper dit aux UI

Le wrapper porte des drapeaux que le sac, l'équipe et les UI de combat lisent :

| Propriété            | Signification quand elle est levée                                           |
| -------------------- | ---------------------------------------------------------------------------- |
| `no_effect`          | L'UI affiche le message « cet objet n'a aucun effet »                         |
| `chen`               | L'UI affiche le message « ce n'est pas le moment d'utiliser cet objet »       |
| `open_party`         | L'UI ouvre l'équipe pour que le joueur choisisse une créature                 |
| `open_skill`         | L'UI ouvre la sélection de capacité sur la créature choisie                   |
| `open_skill_learn`   | L'UI d'équipe ouvre l'apprentissage de la capacité portée par l'objet         |
| `stone_evolve`       | L'UI indique si la créature choisie peut évoluer avec cet objet               |
| `use_before_telling` | L'objet agit avant le message « l'objet est utilisé », donc peut encore refuser |
| `skill_message_id`   | ID du message affiché dans l'UI Résumé pendant la sélection de capacité       |

Il porte aussi les fonctions de comportement remplies par vos définitions : `on_creature_choice` et `on_creature_use` (l'objet est-il utilisable sur cette créature, et ce qu'il fait), `on_skill_choice` et `on_skill_use` (pareil pour une capacité), `on_use` (action depuis le sac), plus `bind(scene, creature, skill)` et `execute_battle_action` utilisées par le moteur de combat.

Une chose à garder en tête : vos blocs reçoivent des **instances vivantes**, pas des enregistrements de données. `creature` est un `PFM::Pokemon` (avec ses PV, son statut et ses capacités du moment) et `skill` est un `PFM::Skill` (une capacité apprise avec ses PP restants). Leur méthode `data` fait le pont vers les enregistrements Studio : dans les exemples plus bas, `skill.data.pp` lit les PP définis dans Pokémon Studio tandis que `skill.pp` lit les PP courants en jeu.

## Où et comment enregistrer une définition

Les définitions sont de simples appels aux fonctions `PFM::ItemDescriptor.define_*`, écrits dans votre propre script dans le dossier `scripts/` de votre projet. Chaque définition cible soit :

- un **db_symbol** (`:sacred_ash`) pour un objet précis, soit
- une **sous-classe de `Studio::Item`** (`Studio::PPIncreaseItem`) pour toute une famille d'objets.

Quand les deux existent, la définition par db_symbol gagne sur celle par classe. PSDK impose aussi un ordre de définition : on ne peut pas enregistrer une action d'utilisation avant son test d'utilisabilité (le moteur lève une erreur explicite si on essaie).

## Les objets utilisés depuis le sac

Pour un objet qui fait simplement quelque chose depuis le sac, enregistrez `define_bag_use`. Le bloc reçoit l'objet et la scène appelante. La Cendre Sacrée vanilla est un exemple complet, avec sa condition « ce n'est pas le moment » enregistrée via `define_chen_prevention` :

```ruby
PFM::ItemDescriptor.define_chen_prevention(:sacred_ash) do
  next $actors.none? { |creature| creature.dead? && !creature.egg? }
end

PFM::ItemDescriptor.define_bag_use(:sacred_ash) do
  $actors.compact.each do |pkmn|
    next unless pkmn.hp <= 0

    pkmn.cure
    pkmn.hp = pkmn.max_hp
    pkmn.skills_set.compact.each { |j| j.pp = j.ppmax }
    $scene.display_message(parse_text(22, 115, PFM::Text::PKNICK[0] => pkmn.given_name))
  end
end
```

Par défaut, le sac annonce « l'objet est utilisé », puis exécute votre bloc, puis consomme l'objet. Cet ordre est mauvais pour les objets qui peuvent se révéler inutiles au moment précis de l'usage : pensez à un Repousse alors qu'un autre repousse est encore actif. Annoncer et consommer d'abord gaspillerait l'objet.

Pour ces objets, passez le second paramètre de `define_bag_use`, `use_before_telling`, à `true` : votre bloc s'exécute **en premier** et joue le rôle de contrôle de dernière seconde. Si l'objet ne peut pas servir, affichez votre propre message d'explication et renvoyez `:unused`. Le sac saute alors le message « l'objet est utilisé » et ne consomme pas l'objet : du point de vue du joueur, il ne s'est rien passé.

Le Repousse vanilla est l'exemple canonique. Il cible aussi une **classe** cette fois (toute la famille `Studio::RepelItem`, là où la Cendre Sacrée ciblait un db_symbol). Sans repousse actif il s'applique ; sinon il explique pourquoi et refuse :

```ruby
PFM::ItemDescriptor.define_bag_use(Studio::RepelItem, true) do |item, scene|
  if PFM.game_state.get_repel_count <= 0
    $game_temp.last_repel_used_id = item.id
    next PFM.game_state.set_repel_count(Studio::RepelItem.from(item).repel_count)
  end

  scene.display_message_and_wait(parse_text(22, 47))
  next :unused
end
```

On peut se demander pourquoi le Repousse n'utilise pas simplement une prévention chen, puisque les deux mécanismes refusent une utilisation. La différence, c'est le retour au joueur : `define_chen_prevention` affiche toujours le message **générique** « ce n'est pas le moment d'utiliser cet objet », tandis que la voie `:unused` laisse l'objet afficher d'abord sa **propre** explication (ici, le texte dédié « un repousse est déjà actif ») et exécuter de la logique avant de trancher. Choisissez chen quand un refus générique suffit, comme la Cendre Sacrée sans créature K.O. ; choisissez `use_before_telling` et `:unused` quand le joueur mérite une explication précise.

## Les objets utilisés sur une créature

Cette famille demande jusqu'à trois définitions : si l'objet peut être utilisé sur la créature choisie, ce qu'il fait sur la carte, et ce qu'il fait en combat.

```ruby
PFM::ItemDescriptor.define_on_creature_usability(klass_ou_db_symbol) do |item, creature|
  # Return true if the item can be used on this creature
end

PFM::ItemDescriptor.define_on_creature_use(klass_ou_db_symbol) do |item, creature, scene|
  # Apply the item on the creature (map context)
end

PFM::ItemDescriptor.define_on_creature_battler_use(klass_ou_db_symbol) do |item, creature, scene|
  # Apply the item on the creature (battle context)
end
```

Enregistrer l'utilisabilité lève automatiquement `open_party` sur le wrapper, donc le sac sait qu'il doit ouvrir l'équipe. La Gracidée vanilla est un exemple réel et compact :

```ruby
PFM::ItemDescriptor.define_on_creature_usability(:gracidea) do |_item, creature|
  next false if creature.egg?
  next false unless creature.db_symbol == :shaymin
  next false if creature.form == creature.shaymin_form(:gracidea)

  next true
end

PFM::ItemDescriptor.define_on_creature_use(:gracidea) do |_item, _creature, scene|
  scene.update_pokemon_form(:gracidea)
end
```

Pour le versant combat, les objets de boost de statistiques (Attaque + et compagnie, `Studio::StatBoostItem`) montrent le motif complet. Notez la prévention chen inversée : ces objets sont réservés au combat, donc « ce n'est pas le moment » est levé sur la carte. En combat, la créature est un `PFM::PokemonBattler` (son API de combattant s'obtient avec `.from`) et la scène est la scène de combat, dont la `logic` expose les handlers par lesquels votre action doit passer :

```ruby
PFM::ItemDescriptor.define_chen_prevention(Studio::StatBoostItem) do
  next !$game_temp.in_battle
end

PFM::ItemDescriptor.define_on_creature_usability(Studio::StatBoostItem) do |item, creature|
  next false if creature.egg? || !PFM::PokemonBattler.from(creature).can_fight?

  next creature.send(:"#{item.stat}_stage") < 6
end

PFM::ItemDescriptor.define_on_creature_battler_use(Studio::StatBoostItem) do |item, creature, scene|
  boost_item = Studio::StatBoostItem.from(item)
  creature.loyalty -= boost_item.loyalty_malus

  scene.logic.stat_change_handler.stat_change(boost_item.stat, boost_item.count, creature)
end
```

## Les objets utilisés sur une capacité d'une créature

Une couche de plus : après l'utilisabilité sur la créature, on définit si l'objet peut agir sur la capacité choisie, puis ce qu'il fait. Enregistrer l'utilisabilité sur la capacité lève `open_skill` sur le wrapper ; le second paramètre optionnel est le `skill_message_id` affiché dans l'UI Résumé.

Le PP Plus vanilla montre la chaîne complète avec les noms de propriétés actuels :

```ruby
PFM::ItemDescriptor.define_chen_prevention(Studio::PPIncreaseItem) do
  next $game_temp.in_battle
end

PFM::ItemDescriptor.define_on_creature_usability(Studio::PPIncreaseItem) do |_, creature|
  next false if creature.egg?

  moves = $game_temp.in_battle ? PFM::PokemonBattler.from(creature).moveset : creature.skills_set
  next moves.any? { |move| (move.data.pp * 8 / 5) > move.ppmax }
end

PFM::ItemDescriptor.define_on_move_usability(Studio::PPIncreaseItem, 35) do |_, skill|
  next (skill.data.pp * 8 / 5) > skill.ppmax
end

PFM::ItemDescriptor.define_on_move_use(Studio::PPIncreaseItem) do |item, creature, skill, scene|
  creature.loyalty -= Studio::HealingItem.from(item).loyalty_malus
  if Studio::PPIncreaseItem.from(item).is_max
    skill.ppmax = skill.data.pp * 8 / 5
  else
    skill.ppmax += skill.data.pp * 1 / 5
  end
  skill.pp += 99
  scene.display_message_and_wait(parse_text(22, 117, PFM::Text::MOVE[0] => skill.name))
end
```

Pour le contexte de combat, `define_on_battle_move_use` suit la même forme avec les mêmes paramètres de bloc (`item, creature, skill, scene`).

:::note

Les deux définitions de combat remplissent le même emplacement du wrapper (`action_to_push`). Les objets vanilla de restauration de PP (`Studio::PPHealItem`) enregistrent d'ailleurs leur action de combat via `define_on_creature_battler_use` avec le même bloc à quatre paramètres ; le résultat est identique. Utilisez `define_on_battle_move_use` pour la lisibilité quand votre objet cible une capacité.

:::

## Les objets qui appellent un événement commun

Un `Studio::EventItem` appelle un événement commun à l'utilisation ; l'événement à appeler est de la **donnée** (sa propriété `event_id`, définie dans Pokémon Studio). Par défaut l'appel est inconditionnel ; `define_event_condition` ajoute une condition d'utilisabilité pour un événement donné. Notez qu'elle cible l'**ID de l'événement**, pas l'objet. La condition vanilla de la Bicyclette :

```ruby
PFM::ItemDescriptor.define_event_condition(11) do
  next false if $game_player.surfing?

  next $game_switches[Yuki::Sw::EV_Bicycle] ||
       $game_switches[Yuki::Sw::Env_CanFly] ||
       $game_switches[Yuki::Sw::Env_CanDig]
end
```

À lire dans les sources : tout le support des EventItem est lui-même construit avec l'API publique. C'est un `define_bag_use(Studio::EventItem, true)` qui vérifie la condition enregistrée et renvoie `:unused` quand elle refuse (`001 EventItem.rb`). Tout ce guide repose sur ces quelques briques.

## Un objet personnalisé de A à Z

Disons que vous voulez une Pomme Dorée qui soigne entièrement une créature, utilisable depuis le sac sur la carte.

1. Dans **Pokémon Studio**, créez l'objet avec le db_symbol `golden_apple`, activez son drapeau **utilisable sur la carte** (`is_map_usable`) et son drapeau **consommable** (`is_limited`) : la consommation, c'est de la donnée, pas du code.
2. Dans votre propre script, enregistrez l'utilisabilité et l'action :

```ruby
PFM::ItemDescriptor.define_on_creature_usability(:golden_apple) do |_item, creature|
  next false if creature.egg?

  next creature.hp < creature.max_hp
end

PFM::ItemDescriptor.define_on_creature_use(:golden_apple) do |_item, creature, scene|
  creature.hp = creature.max_hp
  scene.display_message_and_wait("#{creature.given_name} est entièrement soigné !")
end
```

C'est tout. Le sac voit `open_party` (levé automatiquement par la définition d'utilisabilité) et ouvre l'équipe, les œufs et les créatures aux PV pleins ne sont pas des cibles valides, et utiliser l'objet soigne puis affiche le message. Le drapeau `is_map_usable` posé dans Studio lève déjà `chen` en combat, et le sac gère la consommation grâce à `is_limited`.

Pour aller plus loin, lisez les définitions du moteur lui-même : chaque fichier sous `scripts/3 Studio/2 Data/0 Item/` associe une sous-classe de `Studio::Item` à ses définitions de descripteur (`003 HealingItem.rb`, `300 PPIncreaseItem.rb`...), et `000 ItemDescriptor.rb` contient les cas particuliers par db_symbol. Ce sont des recettes prêtes à l'emploi pour presque tous les comportements d'objets classiques.

## Ce que PSDK gère automatiquement

Vous n'avez pas tout à définir vous-même. En construisant le wrapper, `actions` remplit plusieurs choses toute seule :

- `chen` est levé automatiquement quand le drapeau `is_map_usable` ou `is_battle_usable` de l'objet (édité dans Pokémon Studio) ne correspond pas au contexte courant.
- `no_effect` est levé pour les objets inconnus (l'entité de remplacement `:__undef__`).
- `stone_evolve` est levé pour tout `Studio::StoneItem`, et `open_skill_learn` pour tout `Studio::TechItem`.
- En combat, les actions réservées à la carte sont neutralisées : un objet n'exécute jamais son comportement carte en plein combat.

:::note

Les ressources PSDK plus anciennes nomment ces fonctions `define_on_pokemon_usability`, `define_on_pokemon_use` et `define_on_pokemon_battler_use`. Elles ont été renommées avec `creature` dans les versions actuelles de PSDK, comme dans tous les exemples ci-dessus.

:::

## Conclusion

- `Studio::Item` porte les données ; `PFM::ItemDescriptor` porte le comportement. Les UI obtiennent les deux via le wrapper renvoyé par `PFM::ItemDescriptor.actions`.
- On enregistre ses définitions dans son propre script, en ciblant un db_symbol (un objet) ou une sous-classe de `Studio::Item` (une famille) ; le db_symbol gagne.
- Depuis le sac : `define_bag_use` ; quand l'objet peut échouer au moment de l'usage, `use_before_telling` fait du bloc un contrôle de dernière seconde et `:unused` refuse sans consommer.
- Sur une créature : `define_on_creature_usability`, puis `define_on_creature_use` (carte) et `define_on_creature_battler_use` (combat).
- Sur une capacité : ajouter `define_on_move_usability`, puis `define_on_move_use` (carte) et `define_on_battle_move_use` (combat).
- Les conditions « ce n'est pas le moment » passent par `define_chen_prevention` ; les objets à événement commun par `define_event_condition`.
- Les drapeaux `is_map_usable` et `is_battle_usable` de Pokémon Studio sont appliqués automatiquement, avant tout code à vous ; `is_limited` contrôle la consommation.
- Les blocs reçoivent des instances vivantes `PFM::Pokemon` et `PFM::Skill` ; leur méthode `data` fait le pont vers les enregistrements Studio.
- Les définitions vanilla sous `scripts/3 Studio/2 Data/0 Item/` sont des recettes prêtes à copier.
