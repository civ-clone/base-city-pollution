"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollute = exports.advancesAndDifficultyRange = void 0;
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
/**
 * A `rollRange` that shrinks as the owner learns and the game gets harder: `ceiling` less half of the advances the
 * owner knows (plus `advancesOffset`, for a ruleset that counts them from 1) times `difficultyLevel()`, rounded down.
 */
const advancesAndDifficultyRange = (ceiling, advancesOffset, difficultyLevel, playerResearchRegistry = PlayerResearchRegistry_1.instance) => (city) => {
    const advancesKnown = playerResearchRegistry.getByPlayer(city.player()).complete().length +
        advancesOffset;
    return ceiling - Math.floor((advancesKnown * difficultyLevel()) / 2);
};
exports.advancesAndDifficultyRange = advancesAndDifficultyRange;
/**
 * A city's turn's roll for pollution, given its pollution `points` (`lib/pollution`). Nothing happens unless `points`
 * is above 0. When `2 × points` beats a roll of `0 .. rollRange(city) − 1`, a random one of the squares the city works
 * other than its own is polluted, unless it's water, a city or already polluted (no second roll), and `city:polluted`
 * is emitted with the city and the square. Which cities roll is the ruleset's rule's choice.
 */
const pollute = (city, points, { Pollution, rollRange }, { cityRegistry, tileImprovementRegistry, ruleRegistry, engine, randomNumberGenerator, }) => {
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
        .filter((tile) => tile !== city.tile()), tile = around[Math.floor(randomNumberGenerator() * around.length)];
    if (!tile ||
        tile.isWater() ||
        cityRegistry.getByTile(tile) !== null ||
        tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof Pollution)) {
        return;
    }
    // Building it processes `Built`, which puts it on the tile.
    new Pollution(tile, ruleRegistry);
    engine.emit('city:polluted', city, tile);
};
exports.pollute = pollute;
exports.default = exports.pollute;
//# sourceMappingURL=pollute.js.map