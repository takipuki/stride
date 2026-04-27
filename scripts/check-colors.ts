import { execSync } from 'node:child_process';

const colors = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'white',
  'black',
];

const prefixes = [
  'bg',
  'text',
  'border',
  'ring',
  'outline',
  'fill',
  'stroke',
  'decoration',
  'accent',
  'from',
  'via',
  'to',
  'shadow',
];

const colorPattern = `(${colors.join('|')})`;
const prefixPattern = `(${prefixes.join('|')})`;

// Matches things like text-red-500, bg-zinc-100/50, or bg-[#ff0000]
const regex = `\\b${prefixPattern}-(${colorPattern}(-[0-9]+)?(\\/[0-9]+)?|\\[#?[a-fA-F0-9]+\\])\\b`;

console.log('🔍 Checking for non-theme Tailwind colors...');

try {
  const output = execSync(`rg "${regex}" src --glob "!src/routes/layout.css" --line-number --color never`, {
    encoding: 'utf-8',
  });

  if (output) {
    console.log('\n❌ Found potential color violations:\n');
    console.log(output);
    console.log(
      '\n⚠️  Please use theme variables defined in src/routes/layout.css instead (e.g., text-primary, bg-background, border-border).',
    );
    process.exit(1);
  } else {
    console.log('\n✅ No color violations found!');
  }
} catch (error: unknown) {
  if (error && typeof error === 'object' && 'status' in error && error.status === 1) {
    console.log('\n✅ No color violations found!');
  } else {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error running check:', message);
    process.exit(1);
  }
}
