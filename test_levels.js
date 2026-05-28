const g = require('./services/gamificationService');

console.log('Level thresholds:');
for (let i = 1; i <= 10; i++) {
  console.log('  L' + i + ': ' + g.getXpForLevel(i) + ' XP');
}

console.log('\nXP to Level mapping:');
[0, 500, 999, 1000, 1500, 2999, 3000, 5000, 6999, 7000, 10000, 15000, 31000].forEach(xp => {
  const p = g.getProgression(xp);
  console.log('  Rs ' + xp + ' donated -> Level ' + p.level + ' (' + p.title + '), ' + p.xpRemaining + ' XP to next');
});
