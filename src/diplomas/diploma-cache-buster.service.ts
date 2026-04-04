import { Injectable } from '@nestjs/common';

/**
 * In-memory версии списков дипломов: при инкременте старые ключи кэша перестают использоваться.
 */
@Injectable()
export class DiplomaCacheBusterService {
  private readonly uniVer = new Map<number, number>();
  private readonly userVer = new Map<number, number>();

  universityListVersion(universityId: number): number {
    return this.uniVer.get(universityId) ?? 0;
  }

  userListVersion(userId: number): number {
    return this.userVer.get(userId) ?? 0;
  }

  bumpUniversityList(universityId: number): void {
    this.uniVer.set(
      universityId,
      (this.uniVer.get(universityId) ?? 0) + 1,
    );
  }

  bumpUserList(userId: number): void {
    this.userVer.set(userId, (this.userVer.get(userId) ?? 0) + 1);
  }

  bumpUniversities(universityIds: Iterable<number>): void {
    for (const id of universityIds) {
      this.bumpUniversityList(id);
    }
  }

  bumpUsers(userIds: Iterable<number>): void {
    for (const id of userIds) {
      this.bumpUserList(id);
    }
  }
}
