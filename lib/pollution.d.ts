import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Advance from '@civ-clone/core-science/Advance';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
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
export declare const pollutionDivisor: (
  city: City,
  ruleRegistry?: RuleRegistry
) => number;
/** The city's `Production`, less any of the types in `excluding`, never below 0, over its `pollutionDivisor`, rounded down. */
export declare const productionPollution: (
  city: City,
  cityYields: Yield[],
  Production: YieldType,
  excluding?: YieldType[],
  ruleRegistry?: RuleRegistry
) => number;
/**
 * A `populationFactor`: how many of `advances` the city's owner knows, one step each, or 0 when the city has any of the
 * improvements in `cleanedBy`.
 */
export declare const advancesKnown: (
  advances: (typeof Advance)[],
  cleanedBy?: (typeof CityImprovement)[],
  playerResearchRegistry?: PlayerResearchRegistry,
  cityImprovementRegistry?: CityImprovementRegistry
) => (city: City) => number;
/** The city's size times `factor` over `divisor`, rounded down. */
export declare const populationPollution: (
  city: City,
  factor: number,
  divisor: number,
  cityGrowthRegistry?: CityGrowthRegistry
) => number;
/** A city's pollution in `shape`: production and population pollution, less the tolerance. */
export declare const pollution: (
  city: City,
  cityYields: Yield[],
  {
    Production,
    excluding,
    populationFactor,
    populationDivisor,
    tolerance,
  }: PollutionShape,
  ruleRegistry?: RuleRegistry,
  cityGrowthRegistry?: CityGrowthRegistry
) => number;
export default pollution;
