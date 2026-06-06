const passthrough = (value: string) => value;

const chalk = {
  red: passthrough,
  yellow: passthrough,
  blue: passthrough,
  gray: passthrough,
  cyan: passthrough,
  magenta: passthrough,
};

export default chalk;
export const red = chalk.red;
export const yellow = chalk.yellow;
export const blue = chalk.blue;
export const gray = chalk.gray;
export const cyan = chalk.cyan;
export const magenta = chalk.magenta;
