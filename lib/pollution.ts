import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Advance from '@civ-clone/core-science/Advance';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import PollutionDivisor from '../Rules/PollutionDivisor';
import Yield from '@civ-clone/core-yield/Yield';

/** A yield class, whatever its constructor takes. */
export type YieldType = abstract new (...args: any[]) => Yield;

/**
 * How a ruleset works out a city's pollution each turn: its production (`Production`, less any yield in `excluding`, such as
 * the production that goes on unit support) over its `PollutionDivisor`, plus its size times `populationFactor` over
 * `populationDivisor`, less `tolerance`. Each part is rounded down. Only a value above 0 risks pollution.
 */
export type PollutionShape = {
  Production: YieldType;
  excluding: YieldType[];
  populationFactor: (city: City) => number;
  populationDivisor: number;
  tolerance: number;
};

/** What a city's production is divided by: the largest `PollutionDivisor` any rule gives, or 1. */
export const pollutionDivisor = (
  city: City,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): number => Math.max(1, ...ruleRegistry.process(PollutionDivisor, city));

/** The city's `Production`, less any of the types in `excluding`, never below 0, over its `pollutionDivisor`, rounded down. */
export const productionPollution = (
  city: City,
  cityYields: Yield[],
  Production: YieldType,
  excluding: YieldType[] = [],
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): number => {
  const production = cityYields
      .filter(
        (cityYield: Yield): boolean =>
          cityYield instanceof Production &&
          !excluding.some(
            (Excluded: YieldType): boolean => cityYield instanceof Excluded
          )
      )
      .reduce(
        (total: number, cityYield: Yield) => total + cityYield.value(),
        0
      ),
    divisor = pollutionDivisor(city, ruleRegistry);

  return Math.floor(Math.max(0, production) / divisor);
};

/**
 * A `populationFactor`: how many of `advances` the city's owner knows, one step each, or 0 when the city has any of the
 * improvements in `cleanedBy`.
 */
export const advancesKnown =
  (
    advances: (typeof Advance)[],
    cleanedBy: (typeof CityImprovement)[] = [],
    playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance,
    cityImprovementRegistry: CityImprovementRegistry = cityImprovementRegistryInstance
  ): ((city: City) => number) =>
  (city: City): number => {
    const playerResearch = playerResearchRegistry.getByPlayer(city.player());

    return cityImprovementRegistry
      .getByCity(city)
      .some((cityImprovement: CityImprovement): boolean =>
        cleanedBy.some(
          (Improvement: typeof CityImprovement): boolean =>
            cityImprovement instanceof Improvement
        )
      )
      ? 0
      : advances.filter((Known: typeof Advance): boolean =>
          playerResearch.completed(Known)
        ).length;
  };

/** The city's size times `factor` over `divisor`, rounded down. */
export const populationPollution = (
  city: City,
  factor: number,
  divisor: number,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance
): number =>
  Math.floor((cityGrowthRegistry.getByCity(city).size() * factor) / divisor);

/** A city's pollution in `shape`: production and population pollution, less the tolerance. */
export const pollution = (
  city: City,
  cityYields: Yield[],
  {
    Production,
    excluding,
    populationFactor,
    populationDivisor,
    tolerance,
  }: PollutionShape,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance
): number =>
  productionPollution(city, cityYields, Production, excluding, ruleRegistry) +
  populationPollution(
    city,
    populationFactor(city),
    populationDivisor,
    cityGrowthRegistry
  ) -
  tolerance;

export default pollution;
