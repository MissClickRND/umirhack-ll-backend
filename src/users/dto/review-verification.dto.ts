import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum VerificationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ReviewVerificationDto {
  @ApiProperty({ enum: VerificationAction, example: VerificationAction.APPROVE })
  @IsEnum(VerificationAction)
  action: VerificationAction;
}
