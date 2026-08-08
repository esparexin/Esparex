const { execSync } = require('child_process');
const { ROOT } = require('../shared');

exports.meta = {
  id: 'UI-001',
  name: 'Design System Primitive Guard',
};

exports.run = (v) => {
  // Baseline counts (established at the start of Phase 2.4A)
  const baselines = {
    'space-y-': 355,
    'max-w-7xl': 15,
    'grid-cols-': 125
  };

  const countPattern = (pattern) => {
    try {
      const output = execSync(`git grep -c '${pattern}' -- 'apps/**/*.ts*' 'packages/**/*.ts*' || true`, {
        cwd: ROOT,
        encoding: 'utf8'
      });
      if (!output.trim()) return 0;
      
      // Output is lines of `path/to/file:count`
      return output.trim().split('\n').reduce((acc, line) => {
        const parts = line.split(':');
        const count = parseInt(parts[parts.length - 1], 10);
        return acc + count;
      }, 0);
    } catch (e) {
      return 0;
    }
  };

  const spaceY = countPattern('space-y-');
  const maxW = countPattern('max-w-7xl');
  const gridCols = countPattern('grid-cols-');

  // Verify against baselines
  if (spaceY > baselines['space-y-']) {
    v.error(`Primitive Guard Violation: 'space-y-*' usage increased to ${spaceY} (baseline ${baselines['space-y-']}). Please use <Stack gap="*"> from @esparex/ui instead.`);
  } else if (spaceY > 0) {
    v.info(`'space-y-*' legacy usages remaining: ${spaceY} (baseline ${baselines['space-y-']})`);
  }

  if (maxW > baselines['max-w-7xl']) {
    v.error(`Primitive Guard Violation: 'max-w-7xl' usage increased to ${maxW} (baseline ${baselines['max-w-7xl']}). Please use <Container variant="wide"> from @esparex/ui instead.`);
  } else if (maxW > 0) {
    v.info(`'max-w-7xl' legacy usages remaining: ${maxW} (baseline ${baselines['max-w-7xl']})`);
  }

  if (gridCols > baselines['grid-cols-']) {
    v.error(`Primitive Guard Violation: 'grid-cols-*' usage increased to ${gridCols} (baseline ${baselines['grid-cols-']}). Please use <Grid cols={*}> from @esparex/ui instead.`);
  } else if (gridCols > 0) {
    v.info(`'grid-cols-*' legacy usages remaining: ${gridCols} (baseline ${baselines['grid-cols-']})`);
  }
};
