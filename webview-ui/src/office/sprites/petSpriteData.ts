type SpriteData = string[][];

export interface PetSpriteFrames {
  walkDown: [SpriteData, SpriteData, SpriteData];
  idleDown: SpriteData;
  walkUp: [SpriteData, SpriteData, SpriteData];
  idleUp: SpriteData;
  walkRight: [SpriteData, SpriteData];
  walkLeft: [SpriteData, SpriteData];
  idleRight: SpriteData;
  idleLeft: SpriteData;
}

function flipHorizontal(sprite: SpriteData): SpriteData {
  return sprite.map((row) => [...row].reverse());
}

export interface PetManifest {
  id: string;
  name: string;
}

let loadedPets: PetSpriteFrames[] | null = null;
let loadedPetManifests: PetManifest[] = [];

export function setPetTemplates(
  data: Array<{
    walkDown: string[][][];
    idleDown: string[][];
    walkUp: string[][][];
    idleUp: string[][];
    walkRight: string[][][];
  }>,
  manifests?: PetManifest[],
): void {
  loadedPets = data
    .filter(
      (raw) =>
        raw.walkDown?.length >= 3 &&
        raw.walkUp?.length >= 3 &&
        raw.walkRight?.length >= 2 &&
        raw.idleDown &&
        raw.idleUp,
    )
    .map((raw) => ({
      walkDown: raw.walkDown as [SpriteData, SpriteData, SpriteData],
      idleDown: raw.idleDown,
      walkUp: raw.walkUp as [SpriteData, SpriteData, SpriteData],
      idleUp: raw.idleUp,
      walkRight: raw.walkRight as [SpriteData, SpriteData],
      walkLeft: [flipHorizontal(raw.walkRight[0]), flipHorizontal(raw.walkRight[1])] as [
        SpriteData,
        SpriteData,
      ],
      idleRight: raw.idleUp,
      idleLeft: raw.idleDown,
    }));
  loadedPetManifests = manifests ?? [];
}

export function getPetSprites(petIndex: number): PetSpriteFrames | null {
  return loadedPets?.[petIndex] ?? null;
}

export function getPetCount(): number {
  return loadedPets?.length ?? 0;
}

export function getPetName(petIndex: number): string {
  return loadedPetManifests[petIndex]?.name ?? `Pet ${petIndex}`;
}
