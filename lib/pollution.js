"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollution = exports.populationPollution = exports.advancesKnown = exports.productionPollution = exports.pollutionDivisor = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const PollutionDivisor_1 = require("../Rules/PollutionDivisor");
/** What a city's production is divided by: the largest `PollutionDivisor` any rule gives, or 1. */
const pollutionDivisor = (city, ruleRegistry = RuleRegistry_1.instance) => Math.max(1, ...ruleRegistry.process(PollutionDivisor_1.default, city));
exports.pollutionDivisor = pollutionDivisor;
/** The city's `Production`, less any of the types in `excluding`, never below 0, over its `pollutionDivisor`, rounded down. */
const productionPollution = (city, cityYields, Production, excluding = [], ruleRegistry = RuleRegistry_1.instance) => {
    const production = cityYields
        .filter((cityYield) => cityYield instanceof Production &&
        !excluding.some((Excluded) => cityYield instanceof Excluded))
        .reduce((total, cityYield) => total + cityYield.value(), 0), divisor = (0, exports.pollutionDivisor)(city, ruleRegistry);
    return Math.floor(Math.max(0, production) / divisor);
};
exports.productionPollution = productionPollution;
/**
 * A `populationFactor`: how many of `advances` the city's owner knows, one step each, or 0 when the city has any of the
 * improvements in `cleanedBy`.
 */
const advancesKnown = (advances, cleanedBy = [], playerResearchRegistry = PlayerResearchRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance) => (city) => {
    const playerResearch = playerResearchRegistry.getByPlayer(city.player());
    return cityImprovementRegistry
        .getByCity(city)
        .some((cityImprovement) => cleanedBy.some((Improvement) => cityImprovement instanceof Improvement))
        ? 0
        : advances.filter((Known) => playerResearch.completed(Known)).length;
};
exports.advancesKnown = advancesKnown;
/** The city's size times `factor` over `divisor`, rounded down. */
const populationPollution = (city, factor, divisor, cityGrowthRegistry = CityGrowthRegistry_1.instance) => Math.floor((cityGrowthRegistry.getByCity(city).size() * factor) / divisor);
exports.populationPollution = populationPollution;
/** A city's pollution in `shape`: production and population pollution, less the tolerance. */
const pollution = (city, cityYields, { Production, excluding, populationFactor, populationDivisor, tolerance, }, ruleRegistry = RuleRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance) => (0, exports.productionPollution)(city, cityYields, Production, excluding, ruleRegistry) +
    (0, exports.populationPollution)(city, populationFactor(city), populationDivisor, cityGrowthRegistry) -
    tolerance;
exports.pollution = pollution;
exports.default = exports.pollution;
//# sourceMappingURL=pollution.js.map