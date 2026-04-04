type DiplomaSigningPayloadInput = {
  fullNameAuthor: string;
  registrationNumber: string;
  issuedAtIso: string;
  universityId: number;
};

export function buildDiplomaSigningPayload(
  input: DiplomaSigningPayloadInput,
): string {
  return JSON.stringify({
    fullName: input.fullNameAuthor,
    registrationNumber: input.registrationNumber,
    issuedAt: input.issuedAtIso,
    universityId: input.universityId,
  });
}
