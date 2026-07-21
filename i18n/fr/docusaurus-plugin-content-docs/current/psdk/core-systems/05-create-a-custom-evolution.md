---
title: "Créer une évolution personnalisée"
slug: creer-une-evolution-personnalisee
sidebar_position: 5
description: "L'éditeur d'évolutions de Pokémon Studio couvre les conditions classiques, mais un fangame a régulièrement besoin d'une condition qu'il ne sait pas exprimer. Le champ Selon une fonction de Studio est la porte de sortie : il appelle une méthode Ruby qu'on écrit soi-même, et comme cette méthode est du Ruby arbitraire, elle peut exprimer n'importe quelle condition. Ce guide montre comment en écrire une, comment alimenter une évolution à compteur avec evolve_var, et comment déclencher une évolution à la main."
---

L'éditeur d'évolutions de **Pokémon Studio** couvre les conditions classiques, mais un fangame a régulièrement besoin d'une condition qu'il ne sait pas exprimer. Le champ **Selon une fonction** de Studio est la porte de sortie : il appelle une méthode Ruby qu'on écrit soi-même, et comme cette méthode est du Ruby arbitraire, elle peut exprimer n'importe quelle condition. Ce guide montre comment en écrire une, comment alimenter une évolution à compteur avec `evolve_var`, et comment déclencher une évolution à la main.

## Le problème : une condition que l'éditeur ne sait pas exprimer

Imaginons un starter qui ne doit évoluer qu'une fois qu'il a fait ses preuves au combat : il encaisse cinquante coups, puis il évolue. On ouvre l'éditeur d'évolutions et rien ne convient. Il y a un niveau minimum, un objet tenu, un moment de la journée, une carte, mais rien qui compte quoi que ce soit. La condition n'existe tout simplement pas dans la liste.

C'est le cas normal plutôt que l'exception. Les conditions natives décrivent les jeux officiels, et un fangame invente des règles que les jeux officiels n'ont jamais eues.

La réponse de PSDK n'est pas d'étendre l'éditeur, mais de laisser la condition s'échapper vers Ruby. Studio continue de stocker l'évolution, avec sa cible et ses autres conditions, et la partie qu'il ne sait pas exprimer devient une méthode dans ses propres scripts. Le moteur appelle cette méthode au moment où il teste l'évolution.

Ce guide suppose que l'on sait déjà remplir une évolution dans l'éditeur. Sinon, commencer par [Configurer les évolutions d'un Pokémon](/pokemon-studio/configurer-les-evolutions). Les exemples ci-dessous vivent dans ses propres scripts, jamais dans les fichiers du moteur, et le premier ne demande rien de plus qu'une méthode neuve.

## La condition `func`

Quand on saisit un nom de méthode dans le champ **Selon une fonction** de Studio, le moteur appelle cette méthode sur le Pokémon au moment où il teste l'évolution. La méthode ne prend aucun argument et renvoie `true` ou `false`. Rien de plus, et c'est tout le mécanisme.

Le moteur lui-même s'en sert pour une vingtaine de cas spéciaux officiels, qui sont les meilleurs exemples possibles puisqu'ils sont réels. Kicklee compare deux statistiques :

```ruby
def elv_kicklee
  atk > dfe
end
```

Nymphali parcourt la liste des capacités :

```ruby
def elv_nymphali
  return @skills_set.any? { |skill| skill&.type?(data_type(:fairy).id) }
end
```

Toutes sont nommées `elv_*` par convention. Rien n'impose ce préfixe, mais le respecter garde ses méthodes reconnaissables à côté de celles du moteur.

Pour ajouter la sienne, on rouvre `PFM::Pokemon` et on définit la méthode. Il n'y a pas de `super` ici, puisqu'on ajoute une méthode au lieu d'en redéfinir une :

```ruby
module PFM
  class Pokemon
    # Evolve once the creature has taken 50 hits in battle
    # @return [Boolean] if the condition is valid
    def elv_battle_scarred
      return (@evolve_var || 0) >= 50
    end
  end
end
```

Il reste à saisir `elv_battle_scarred` dans le champ **Selon une fonction** de l'évolution. Studio ne vérifie pas l'existence de la méthode, donc une faute de frappe fait planter le jeu avec une erreur appelée `NoMethodError` dès que le moteur teste l'évolution.

À l'intérieur de la méthode, on a tout le Pokémon sous la main : son niveau, ses statistiques, ses capacités, l'équipe, l'état du jeu. Tout ce qui se lit depuis Ruby peut devenir une condition d'évolution. Le compteur que lit cet exemple précis est le seul cas qui demande un peu de préparation, et c'est la section suivante.

:::note[Si votre évolution ne se déclenche jamais]
Deux règles du moteur sont indépendantes de la méthode qu'on écrit. Un Pokémon qui tient une **Pierre Stase** n'évolue jamais, le moteur s'arrête avant de tester la moindre condition. Et quand un Pokémon a plusieurs évolutions, le moteur retient la **première de la liste dont toutes les conditions passent**, donc une évolution plus large placée au-dessus de la vôtre peut la masquer. L'ordre est traité dans [Configurer les évolutions d'un Pokémon](/pokemon-studio/configurer-les-evolutions).
:::

:::warning[Ne pas modifier les fichiers du projet à la main]
Le moteur connaît quelques types de condition supplémentaires que l'éditeur n'affiche pas, mais Studio ne sait pas les régler et ne les reconnaît pas. En ajouter un en modifiant à la main les fichiers dans `Data/Studio` empêche **le projet entier de s'ouvrir**, avec pour seule information une erreur générique renvoyant vers les logs. C'est inutile : **Selon une fonction** couvre déjà tout ce que ceux-ci pourraient faire.
:::

## Les évolutions à compteur avec `evolve_var`

`@evolve_var` est le compteur générique derrière toute évolution qui compte. `increase_evolve_var` l'augmente, `reset_evolve_var` le remet à zéro, et le moteur compte déjà plusieurs choses dedans.

Une règle gouverne tout ce qui suit :

:::danger[Le comptage est lié au nom de la fonction]
Chaque endroit où le moteur augmente `evolve_var` est verrouillé sur le nom `func` exact déclaré dans Studio : le compteur de pas agit sur les créatures dont l'évolution utilise `elv_1000steps`, le compteur de coups critiques sur `elv_sirfetchd`, et ainsi de suite. Déclarer un de ces noms, et le comptage est déjà fait. Inventer un nom neuf, et rien ne le compte, c'est à soi de fournir la plomberie.
:::

### Réutiliser un compteur du moteur sur son propre Pokémon (sans code)

L'évolution à compteur la plus simple n'écrit aucun Ruby : dans Studio, on donne à l'évolution de sa créature un des noms de fonction que le moteur compte déjà. Ses compteurs bouclent sur chaque créature dont l'évolution déclare ce nom, donc la sienne est prise dans le lot.

Les pas sont comptés hors combat. `step_evolution_update` s'exécute à chaque pas et incrémente chaque membre de l'équipe dont l'évolution utilise `elv_1000steps` :

```ruby
def step_evolution_update
  return unless $game_switches[Yuki::Sw::FM_Enabled]

  if $game_switches[Yuki::Sw::FollowMe_LetsGoMode]
    return unless $storage.lets_go_follower&.evolution_condition_function?(:elv_1000steps)

    $storage.lets_go_follower.increase_evolve_var
  else
    return if $game_variables[Yuki::Var::FM_N_Pokem] <= 0

    $actors.each_with_index do |creature, index|
      break if index >= $game_variables[Yuki::Var::FM_N_Pokem]
      next unless creature.evolution_condition_function?(:elv_1000steps)

      creature.increase_evolve_var
    end
  end
end
```

On n'écrit jamais cette méthode, le moteur l'appelle. Déclarer `elv_1000steps` sur l'évolution de sa créature est ce qui l'inscrit dans cette boucle, et la fonction fait évoluer à mille :

```ruby
def elv_1000steps
  return (@evolve_var || 0) >= 1000
end
```

Les événements de combat fonctionnent pareil. `handle_elv_sirfetchd_event` s'exécute après les dégâts et incrémente l'attaquant quand il place un coup critique et que son évolution utilise `elv_sirfetchd` :

```ruby
def handle_elv_sirfetchd_event(hp, target, launcher, skill)
  return if launcher.nil?
  return unless launcher.evolution_condition_function?(:elv_sirfetchd)
  return unless skill&.critical_hit?

  launcher.increase_evolve_var
end
```

Le moteur reporte aussi la valeur sur le vrai Pokémon à la fin du combat, donc déclarer `elv_sirfetchd` donne une évolution « après trois coups critiques » qui marche, sans code. Les noms qui valent le coup d'être empruntés ainsi sont `elv_1000steps` (les pas), `elv_sirfetchd` (les coups critiques) et `elv_basculin` (les dégâts de recul, à 294).

### Changer les valeurs (patcher la fonction)

Pour garder un déclencheur du moteur mais un seuil différent, on patche la méthode `elv_*`. Comme cela remplace une méthode existante au lieu d'en ajouter une neuve, on le met dans un module `prepend`, la convention de [monkey-patch](/getting-started/customize-psdk/monkey-patch-dans-psdk), jamais un `alias`. Celui-ci fait évoluer au pas cinq cents au lieu de mille :

```ruby
module PFM
  class Pokemon
    module HalfStepEvolution
      def elv_1000steps
        return (@evolve_var || 0) >= 500
      end
    end
    prepend HalfStepEvolution
  end
end
```

Le nom est partagé avec l'espèce du moteur, donc cela déplace aussi son seuil. C'est acceptable dans un fangame qui ne comporte pas cette espèce ; s'il la comporte, ou s'il faut compter tout autre chose, on donne à son évolution un nom neuf et sa propre plomberie.

### Compter ce que le moteur ne compte pas (sa propre plomberie), avancé

Si un déclencheur existant du moteur correspond déjà au besoin, on peut s'arrêter ici : cette section ne sert qu'à compter quelque chose que le moteur ne suit jamais, les coups encaissés par exemple. C'est l'évolution aux cinquante coups du début du guide, et sa méthode `elv_battle_scarred` est déjà écrite, il ne reste que le comptage.

Hors combat, aucune difficulté : on appelle `increase_evolve_var` sur la créature partout où la règle compte, depuis un événement ou une récompense de quête. En combat, le moteur travaille sur un `PFM::PokemonBattler` temporaire, un brouillon de la créature utilisé seulement pendant le combat, donc le comptage doit se faire sur ce brouillon. Ce premier patch additionne chaque coup encaissé, en imitant le `handle_elv_sirfetchd_event` du moteur, et ne touche que les créatures dont l'évolution utilise sa fonction :

```ruby
module Battle
  class Logic
    class DamageHandler
      # Counts every hit taken by a creature whose evolution uses elv_battle_scarred
      module BattleScarredCounter
        def handle_post_damage_events(hp, target, launcher, skill)
          target.increase_evolve_var if target.evolution_condition_function?(:elv_battle_scarred)

          super
        end
      end
      prepend BattleScarredCounter
    end
  end
end
```

Cela suffit déjà à faire évoluer. Le moteur recopie le compteur sur le vrai Pokémon à la fin de chaque combat et le recharge au début du suivant, donc les coups s'additionnent d'un combat à l'autre, et une fois cinquante atteint la créature évolue à sa prochaine montée de niveau.

Pour qu'elle évolue à l'instant où se termine le combat de son cinquantième coup, au lieu d'attendre cette montée de niveau, on ajoute un second patch qui demande au moteur de vérifier tout de suite, exactement comme le moteur le fait pour ses propres espèces. Pousser la créature dans `logic.evolve_request` est cette demande :

```ruby
module Battle
  class Logic
    class BattleEndHandler
      # Asks the engine to check the evolution as soon as the battle ends
      module BattleScarredPersistence
        def handle_battle_end_events(players_creatures)
          super

          players_creatures.each do |creature|
            next unless creature.evolution_condition_function?(:elv_battle_scarred)

            creature.original.evolve_var = creature.evolve_var || 0
            logic.evolve_request << creature
          end
        end
      end
      prepend BattleScarredPersistence
    end
  end
end
```

## Déclencher une évolution manuellement

Il arrive que l'évolution doive se produire à un moment que le moteur ne teste pas, à la fin d'une quête ou après un dialogue. On demande la cible à `evolve_check`, puis on la confie à la scène d'évolution :

```ruby
pokemon = $actors.first
id, form = pokemon.evolve_check(:level_up)
GamePlay.make_pokemon_evolve(pokemon, id, form, true) if id
```

`evolve_check` applique toujours toutes les conditions, ce qui déclenche donc l'évolution décrite par les données plutôt que d'en forcer une arbitraire, et il renvoie `false` quand rien ne correspond, d'où la garde `if id`.

Le dernier argument de `make_pokemon_evolve` est `forced`. Laissé à `false`, le joueur peut annuler l'évolution en appuyant sur B, ce qui est le comportement de la montée de niveau. Mis à `true`, l'évolution ne peut pas être refusée, ce que le moteur fait pour les pierres et les échanges.

## Conclusion

- **`func`** est la voie : une méthode qui renvoie `true` ou `false`, qu'on écrit sur `PFM::Pokemon`, nommée `elv_*` par convention, choisie dans Studio via **Selon une fonction**. Étant du Ruby ordinaire, elle peut exprimer n'importe quelle condition.
- Une évolution ne se déclenche que si aucune **Pierre Stase** n'est tenue et si c'est la **première** de la liste dont toutes les conditions passent, donc attention à l'ordre.
- Ne pas modifier les fichiers du projet à la main pour ajouter des types de condition que l'éditeur n'affiche pas : Studio les rejette et le projet ne s'ouvre plus. **Selon une fonction** les couvre déjà.
- **`evolve_var`** alimente les évolutions à compteur de trois façons : réutiliser un nom du moteur (`elv_1000steps`, `elv_sirfetchd`) pour son comptage sans code, patcher cette méthode pour changer les valeurs, ou écrire sa propre plomberie pour un déclencheur que le moteur n'a pas.
- **`GamePlay.make_pokemon_evolve(pokemon, id, form, forced)`** déclenche une évolution à la main, `forced` décidant si le joueur peut annuler avec B.
