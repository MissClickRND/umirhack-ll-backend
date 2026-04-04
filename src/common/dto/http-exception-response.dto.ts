import { ApiProperty } from '@nestjs/swagger';

/** Формат ответа при HttpException из глобального AllExceptionFilter */
export class HttpExceptionResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    description:
      'Текст бизнес-ошибки или массив сообщений class-validator (валидация DTO)',
    example: 'User already exists',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({ example: 'HTTP_EXCEPTION' })
  code: string;

  @ApiProperty({
    description:
      'Исходный объект ответа Nest (message, error, statusCode) или null',
    nullable: true,
    type: 'object',
    additionalProperties: true,
    example: {
      message: 'User already exists',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  details: Record<string, unknown> | null;
}
