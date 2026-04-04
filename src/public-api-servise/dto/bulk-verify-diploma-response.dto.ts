import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiplomaStatus } from '@prisma/client';

export class PublicDiplomaUniversityDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Донской Государственный Технический Университет' })
  name!: string;

  @ApiPropertyOptional({ example: 'ДГТУ', nullable: true })
  shortName!: string | null;
}

export class PublicDiplomaDetailDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'Кукареков Кукаречкич Кукарекович' })
  fullNameAuthor!: string;

  @ApiProperty({ example: '1111111111111' })
  registrationNumber!: string;

  @ApiProperty({ example: 'ИиВТ' })
  specialty!: string;

  @ApiProperty({ example: 'BACHELOR' })
  degreeLevel!: string;

  @ApiProperty({ enum: DiplomaStatus, example: DiplomaStatus.REVOKED })
  status!: DiplomaStatus;

  @ApiProperty({ type: PublicDiplomaUniversityDto })
  university!: PublicDiplomaUniversityDto;
}

export class PublicDiplomaUserDto {
  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'ID пользователя, если диплом привязан к аккаунту',
  })
  id!: number | null;

  @ApiPropertyOptional({
    example: 'student@example.com',
    nullable: true,
    description: 'Email пользователя, если диплом привязан к аккаунту',
  })
  email!: string | null;

  @ApiPropertyOptional({
    example: 'Иванов Иван Сергеевич',
    nullable: true,
    description: 'ФИО владельца диплома',
  })
  fullName!: string | null;
}

export class BulkVerifyDiplomaResponseDto {
  @ApiProperty({ example: '1234567890123' })
  diplomaNumber!: string;

  @ApiProperty({ enum: DiplomaStatus, example: DiplomaStatus.VALID })
  status!: DiplomaStatus;

  @ApiProperty({
    type: PublicDiplomaUserDto,
    nullable: true,
    description:
      'Информация о пользователе/владельце диплома. Может быть null, если диплом не найден или не привязан.',
  })
  user!: PublicDiplomaUserDto | null;
}
