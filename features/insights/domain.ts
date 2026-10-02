export function canonicalConnectionPair(firstId: string, secondId: string) {
  if (firstId === secondId) throw new Error("An insight cannot connect to itself.");
  return firstId < secondId ? [firstId, secondId] as const : [secondId, firstId] as const;
}
