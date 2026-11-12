"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollutionDivisor = void 0;
const Rule_1 = require("@civ-clone/core-rule/Rule");
// What a city's production is divided by before it counts towards pollution. The largest divisor any rule gives
//  applies, or 1 when none does (`lib/pollution`'s `pollutionDivisor`).
class PollutionDivisor extends Rule_1.default {
}
exports.PollutionDivisor = PollutionDivisor;
exports.default = PollutionDivisor;
//# sourceMappingURL=PollutionDivisor.js.map