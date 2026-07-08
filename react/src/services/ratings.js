export function clampRating(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}

export function calculateSoccerRating(stats = {}, position = "mid") {
    const roleBase = { gk: 62, def: 64, mid: 66, att: 65 }[position] || 66;
    const minutesFactor = Math.min(Number(stats.minutes || 0), 90) / 90;
    const positive =
        Number(stats.passes || 0) * 0.38 +
        Number(stats.shots || 0) * 1.8 +
        Number(stats.duels || 0) * 1.25 +
        Number(stats.goals || 0) * 8 +
        Number(stats.assists || 0) * 6;
    const negative = Number(stats.turnovers || 0) * 1.7;

    return Math.max(1, Math.min(100, Math.round(roleBase + positive * minutesFactor - negative)));
}

export function calculateBasketballRating(game = {}) {
    const minutes = Math.max(game.minutes || 1, 1);
    const points = ((game.points || 0) / minutes) * 40;
    const assists = ((game.assists || 0) / minutes) * 30;
    const rebounds = ((game.rebounds || 0) / minutes) * 20;
    const steals = ((game.steals || 0) / minutes) * 25;
    const blocks = ((game.blocks || 0) / minutes) * 25;
    const turnovers = ((game.turnovers || 0) / minutes) * -20;
    const fieldGoal = game.fga > 0 ? ((game.fgm || 0) / game.fga) * 20 : 10;
    const plusMinus = clampRating((game.plusMinus || 0) * 0.5, -10, 10);
    const raw = 50 + points + assists + rebounds + steals + blocks + turnovers + fieldGoal + plusMinus;

    return Math.round(clampRating(raw, 0, 100));
}


export function calculateFootballRating(stats = {}, position = "qb") {
    const roleBase = { qb: 66, rb: 64, wr: 65, te: 64, ol: 63, dl: 63, lb: 64, db: 64, k: 62 }[position] || 64;
    const snaps = Math.max(Number(stats.snaps || stats.minutes || 1), 1);

    const passing =
        ((stats.passingYards || 0) / snaps) * 0.4 +
        (stats.touchdowns || 0) * 8 +
        (stats.interceptions || 0) * -6 +
        (stats.completions || 0) * 0.5;

    const rushing =
        ((stats.rushingYards || 0) / snaps) * 0.5 +
        (stats.rushingTDs || 0) * 8;

    const receiving =
        ((stats.receivingYards || 0) / snaps) * 0.5 +
        (stats.receptions || 0) * 1.5 +
        (stats.receivingTDs || 0) * 8;

    const defense =
        (stats.tackles || 0) * 1.5 +
        (stats.sacks || 0) * 6 +
        (stats.forcedFumbles || 0) * 5 +
        (stats.defensiveTDs || 0) * 10;

    return Math.round(clampRating(roleBase + passing + rushing + receiving + defense, 1, 100));
}
