import pollute, { advancesAndDifficultyRange } from '../lib/pollute';
import pollution, {
  advancesKnown,
  pollutionDivisor,
  populationPollution,
  productionPollution,
} from '../lib/pollution';
import Advance from '@civ-clone/core-science/Advance';
import Built from '@civ-clone/core-tile-improvement/Rules/Built';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import PollutionDivisor from '../Rules/PollutionDivisor';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Yield from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';

class Production extends Yield {}
class SupportProduction extends Production {}
class Other extends Yield {}
class Smelting extends Advance {}
class Engines extends Advance {}
class Plastic extends Advance {}
class Tram extends CityImprovement {}
class Smog extends TileImprovement {}

const player = {},
  standInCity = (tiles: Tile[] = [], centre: Tile = {} as Tile): City =>
    ({
      player: () => player,
      tile: () => centre,
      tiles: () => ({ entries: () => [centre, ...tiles] }),
    } as unknown as City),
  standInTile = (water = false): Tile =>
    ({ isWater: () => water } as unknown as Tile),
  research = (...known: (typeof Advance)[]) =>
    ({
      getByPlayer: (asked: unknown) => {
        expect(asked).to.equal(player);

        return {
          complete: () => known.map((Known) => new Known()),
          completed: (Asked: typeof Advance) => known.includes(Asked),
        };
      },
    } as any),
  improvements = (...built: (typeof CityImprovement)[]) =>
    ({
      getByCity: () =>
        built.map((Improvement) => Object.create(Improvement.prototype)),
    } as any),
  growth = (size: number) =>
    ({ getByCity: () => ({ size: () => size }) } as any),
  // Hands out `values` in turn and fails if asked for more.
  scripted = (...values: number[]): (() => number) & { calls: number } => {
    const rng = Object.assign(
      (): number => {
        expect(rng.calls).to.be.lessThan(values.length);

        return values[rng.calls++];
      },
      { calls: 0 }
    );

    return rng;
  };

describe('base-city-pollution', (): void => {
  describe('pollution', (): void => {
    it('uses the largest divisor any rule gives, or 1', (): void => {
      const ruleRegistry = new RuleRegistry(),
        city = standInCity();

      expect(pollutionDivisor(city, ruleRegistry)).to.equal(1);

      ruleRegistry.register(
        new PollutionDivisor(new Effect((): number => 2)),
        new PollutionDivisor(new Effect((): number => 3)),
        new PollutionDivisor(
          new Criterion((): boolean => false),
          new Effect((): number => 9)
        )
      );

      expect(pollutionDivisor(city, ruleRegistry)).to.equal(3);
    });

    it('counts the production, less those excluded, over the divisor, rounded down', (): void => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(new PollutionDivisor(new Effect((): number => 2)));

      expect(
        productionPollution(
          standInCity(),
          [new Production(30), new SupportProduction(4), new Other(100)],
          Production,
          [SupportProduction],
          ruleRegistry
        )
      ).to.equal(15);
      expect(
        productionPollution(
          standInCity(),
          [new Production(31)],
          Production,
          [],
          ruleRegistry
        )
      ).to.equal(15);
      expect(
        productionPollution(
          standInCity(),
          [new Production(-5)],
          Production,
          [],
          ruleRegistry
        )
      ).to.equal(0);
    });

    it('counts the advances known, or none with a cleaning improvement', (): void => {
      const city = standInCity();

      expect(
        advancesKnown(
          [Smelting, Engines, Plastic],
          [Tram],
          research(Smelting, Plastic),
          improvements()
        )(city)
      ).to.equal(2);
      expect(
        advancesKnown(
          [Smelting, Engines, Plastic],
          [Tram],
          research(Smelting, Plastic),
          improvements(Tram)
        )(city)
      ).to.equal(0);
    });

    it('takes size times factor over the divisor, rounded down', (): void => {
      expect(populationPollution(standInCity(), 3, 4, growth(7))).to.equal(5);
    });

    it('adds the parts and takes off the tolerance', (): void => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(new PollutionDivisor(new Effect((): number => 2)));

      // 45 / 2 = 22, 10 × 3 / 4 = 7, less 20.
      expect(
        pollution(
          standInCity(),
          [new Production(45)],
          {
            Production,
            excluding: [],
            populationFactor: (): number => 3,
            populationDivisor: 4,
            tolerance: 20,
          },
          ruleRegistry,
          growth(10)
        )
      ).to.equal(9);
    });
  });

  describe('pollute', (): void => {
    const setUp = (
      tiles: Tile[],
      rng: () => number,
      { inCity = [] as Tile[], polluted = [] as Tile[] } = {}
    ) => {
      const ruleRegistry = new RuleRegistry(),
        built: Tile[] = [],
        emitted: unknown[][] = [];

      ruleRegistry.register(
        new Built(new Effect((tile: Tile): void => void built.push(tile)))
      );

      return {
        built,
        emitted,
        dependencies: {
          cityRegistry: {
            getByTile: (tile: Tile) => (inCity.includes(tile) ? {} : null),
          } as any,
          tileImprovementRegistry: {
            getByTile: (tile: Tile) =>
              polluted.includes(tile) ? [Object.create(Smog.prototype)] : [],
          } as any,
          ruleRegistry,
          engine: {
            emit: (...args: unknown[]) => emitted.push(args),
          } as any,
          randomNumberGenerator: rng,
        },
      };
    };

    it("doesn't roll without points", (): void => {
      const rng = scripted(),
        { built, dependencies } = setUp([standInTile()], rng);

      pollute(
        standInCity([standInTile()]),
        0,
        { Pollution: Smog, rollRange: (): number => 256 },
        dependencies
      );

      expect(rng.calls).to.equal(0);
      expect(built).to.have.length(0);
    });

    it('rolls once and stops when the roll is at least twice the points', (): void => {
      const rng = scripted(10 / 256),
        { built, dependencies } = setUp([], rng);

      pollute(
        standInCity([standInTile()]),
        5,
        { Pollution: Smog, rollRange: (): number => 256 },
        dependencies
      );

      expect(rng.calls).to.equal(1);
      expect(built).to.have.length(0);
    });

    it('then picks a square around the city, not the centre, and pollutes it', (): void => {
      const tiles = [standInTile(), standInTile(), standInTile()],
        city = standInCity(tiles),
        rng = scripted(9 / 256, 1.5 / 3),
        { built, emitted, dependencies } = setUp(tiles, rng);

      pollute(
        city,
        5,
        { Pollution: Smog, rollRange: (): number => 256 },
        dependencies
      );

      expect(rng.calls).to.equal(2);
      expect(built).to.deep.equal([tiles[1]]);
      expect(emitted).to.deep.equal([['city:polluted', city, tiles[1]]]);
    });

    (
      [
        ['water', [standInTile(true)], {}],
        ['a city', [standInTile()], { inCity: true }],
        ['already polluted', [standInTile()], { polluted: true }],
      ] as [string, Tile[], { inCity?: boolean; polluted?: boolean }][]
    ).forEach(([what, tiles, { inCity, polluted }]): void => {
      it(`doesn't pollute a square that's ${what}, or roll again`, (): void => {
        const rng = scripted(0, 0),
          { built, emitted, dependencies } = setUp(tiles, rng, {
            inCity: inCity ? tiles : [],
            polluted: polluted ? tiles : [],
          });

        pollute(
          standInCity(tiles),
          1,
          { Pollution: Smog, rollRange: (): number => 256 },
          dependencies
        );

        expect(rng.calls).to.equal(2);
        expect(built).to.have.length(0);
        expect(emitted).to.have.length(0);
      });
    });

    it('shrinks the roll with the advances known and the difficulty', (): void => {
      // (2 known + 1) × 3 / 2 = 4.5, rounded down.
      expect(
        advancesAndDifficultyRange(
          256,
          1,
          (): number => 3,
          research(Smelting, Engines)
        )(standInCity())
      ).to.equal(252);
    });
  });
});
