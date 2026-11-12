# base-city-pollution

City pollution as data, for a ruleset to give its own numbers, advances and improvements:

- `Rules/PollutionDivisor`: the rule a ruleset registers for what a city's production is divided by (the largest
  applies, or 1).
- `lib/pollution`: `pollution(city, cityYields, shape)`, where a `PollutionShape` names the production yield (and any to
  leave out), a `populationFactor`, the population divisor and the tolerance. Its parts are exported too:
  `pollutionDivisor`, `productionPollution`, `populationPollution`, and `advancesKnown(advances, cleanedBy)`, a
  `populationFactor` that counts the polluting advances the owner knows, or 0 with a cleaning improvement.
- `lib/pollute`: `pollute(city, points, roll)`, a city's turn's roll. When `2 × points` beats a roll of
  `0 .. rollRange(city) − 1`, a random square around the city that isn't water, a city or already polluted gets the
  ruleset's `Pollution` tile improvement and `city:polluted` is emitted. `advancesAndDifficultyRange` is a
  `rollRange` that shrinks with the advances known and the difficulty.

A library: it registers no rules. See `civ1-city-improvement` for Civilization's pollution.
