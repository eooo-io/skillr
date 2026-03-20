const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

const states = {
  ready:    `${colors.green}(• •)${colors.reset}`,
  working:  `${colors.blue}(• -)${colors.reset}`,
  thinking: `${colors.yellow}(• ~)${colors.reset}`,
  error:    `${colors.red}(x x)${colors.reset}`,
  judging:  `${colors.gray}(¬ ¬)${colors.reset}`,
  success:  `${colors.brightGreen}(^ ^)${colors.reset}`,
  confused: `${colors.magenta}(° °)${colors.reset}`,
};

export { states, colors };

export function ready(msg: string): void {
  console.log(`${states.ready}  ${msg}`);
}

export function working(msg: string): void {
  console.log(`${states.working}  ${msg}`);
}

export function thinking(msg: string): void {
  console.log(`${states.thinking}  ${msg}`);
}

export function error(msg: string): void {
  console.log(`${states.error}  ${colors.red}${msg}${colors.reset}`);
}

export function judging(msg: string): void {
  console.log(`${states.judging}  ${msg}`);
}

export function success(msg: string): void {
  console.log(`${states.success}  ${colors.brightGreen}${msg}${colors.reset}`);
}

export function confused(msg: string): void {
  console.log(`${states.confused}  ${colors.magenta}${msg}${colors.reset}`);
}

export function info(msg: string): void {
  console.log(`      ${colors.dim}${msg}${colors.reset}`);
}

export function blank(): void {
  console.log();
}
