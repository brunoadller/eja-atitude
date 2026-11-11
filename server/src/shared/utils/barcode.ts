export function generateBarcodeLine(): string {
  const groups: string[] = [];
  for (let i = 0; i < 5; i++) {
    let g = '';
    for (let j = 0; j < 11; j++) g += Math.floor(Math.random() * 10);
    groups.push(g);
  }
  return groups.join(' ');
}
