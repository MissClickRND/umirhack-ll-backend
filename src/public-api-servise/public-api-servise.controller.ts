import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PublicApiServiseService } from './public-api-servise.service';
import { BulkVerifyDiplomasDto } from './dto/bulk-verify-diplomas.dto';
import {
  BulkVerifyDiplomaResponseDto,
  PublicDiplomaDetailDto,
  PublicDiplomaUniversityDto,
  PublicDiplomaUserDto,
} from './dto/bulk-verify-diploma-response.dto';

@ApiTags('Public API Servise')
@ApiExtraModels(
  BulkVerifyDiplomaResponseDto,
  PublicDiplomaUserDto,
  PublicDiplomaDetailDto,
  PublicDiplomaUniversityDto,
)
@Controller('employer')
export class PublicApiServiseController {
  constructor(
    private readonly publicApiServiseService: PublicApiServiseService,
  ) {}

  @Public()
  @Post('public/verify')
  @ApiOperation({
    summary:
      'Проверка диплома(ов): принимает либо один номер, либо массив номеров',
  })
  @ApiOkResponse({
    description:
      'Если передан diplomaNumber — возвращает один объект. Если передан diplomaNumbers — возвращает массив объектов в том же порядке.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(BulkVerifyDiplomaResponseDto) },
        {
          type: 'array',
          items: { $ref: getSchemaPath(BulkVerifyDiplomaResponseDto) },
        },
      ],
    },
  })
  verify(@Body() dto: BulkVerifyDiplomasDto) {
    return this.publicApiServiseService.verify(dto);
  }

  @Public()
  @Get('public/verify/:diplomaNumber')
  @ApiOperation({ summary: 'Проверка одного диплома по номеру (13 цифр)' })
  @ApiParam({
    name: 'diplomaNumber',
    description: 'Номер диплома, строка из 13 цифр',
    example: '1234567890123',
  })
  @ApiOkResponse({
    type: PublicDiplomaDetailDto,
    description: 'Детальная информация о дипломе',
  })
  verifyOne(@Param('diplomaNumber') diplomaNumber: string) {
    return this.publicApiServiseService.getDiplomaByNumber(diplomaNumber);
  }
}
