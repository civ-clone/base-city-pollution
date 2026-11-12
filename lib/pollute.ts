import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import City from '@civ-clone/core-city/City';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';

/**
 * How a ruleset rolls for pollution: `rollRange(city)` is the size of the roll (0 up to one less), and `Pollution` is
 * the tile improvement a polluted square gets.
 */
export type PollutionRoll = {
  Pollution: typeof TileImprovement;
  rollRange: (city: City) => number;
};

export type PollutionRollDependencies = {
  cityRegistry: CityRegistry;
  tileImprovementRegistry: TileImprovementRegistry;
  ruleRegistry: RuleRegistry;
  engine: Engine;
  randomNumberGenerator: () => number;
};

/**
 * A `rollRange` that shrinks as the owner learns and the game gets harder: `ceiling` less half of the advances the
 * owner knows (plus `advancesOffset`, for a ruleset that counts them from 1) times `difficultyLevel()`, rounded down.
 */
export const advancesAndDifficultyRange =
  (
    ceiling: number,
    advancesOffset: number,
    difficultyLevel: () => number,
    playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance
  ): ((city: City) => number) =>
  (city: City): number => {
    const advancesKnown =
      playerResearchRegistry.getByPlayer(city.player()).complete().length +
      advancesOffset;

    return ceiling - Math.floor((advancesKnown * difficultyLevel()) / 2);
  };

/**
 * A city's turn's roll for pollution, given its pollution `points` (`lib/pollution`). Nothing happens unless `points`
 * is above 0. When `2 × points` beats a roll of `0 .. rollRange(city) − 1`, a random one of the squares the city works
 * other than its own is polluted, unless it's water, a city or already polluted (no second roll), and `city:polluted`
 * is emitted with the city and the square. Which cities roll is the ruleset's rule's choice.
 */
export const pollute = (
  city: City,
  points: number,
  { Pollution, rollRange }: PollutionRoll,
  {
    cityRegistry,
    tileImprovementRegistry,
    ruleRegistry,
    engine,
    randomNumberGenerator,
  }: PollutionRollDependencies
): void => {
  if (points <= 0) {
    return;
  }

  const range = rollRange(city);

  if (2 * points <= Math.floor(randomNumberGenerator() * range)) {
    return;
  }

  const around = city
      .tiles()
      .entries()
      .filter((tile: Tile): boolean => tile !== city.tile()),
    tile = around[Math.floor(randomNumberGenerator() * around.length)];

  if (
    !tile ||
    tile.isWater() ||
    cityRegistry.getByTile(tile) !== null ||
    tileImprovementRegistry
      .getByTile(tile)
      .some(
        (improvement: TileImprovement): boolean =>
          improvement instanceof Pollution
      )
  ) {
    return;
  }

  // Building it processes `Built`, which puts it on the tile.
  new Pollution(tile, ruleRegistry);

  engine.emit('city:polluted', city, tile);
};

export default pollute;
