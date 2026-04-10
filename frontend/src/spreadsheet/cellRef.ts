export function colLetter(col: number): string {
  let result = "";
  let n = col;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export function cellRef(row: number, col: number): string {
  return `${colLetter(col)}${row + 1}`;
}
