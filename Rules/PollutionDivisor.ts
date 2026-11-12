import City from '@civ-clone/core-city/City';
import Rule from '@civ-clone/core-rule/Rule';

// What a city's production is divided by before it counts towards pollution. The largest divisor any rule gives
//  applies, or 1 when none does (`lib/pollution`'s `pollutionDivisor`).
export class PollutionDivisor extends Rule<[City], number> {}

export default PollutionDivisor;
