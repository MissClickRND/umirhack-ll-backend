import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PublicApiServiseService } from './public-api-servise.service';
import { BulkVerifyDiplomasDto } from './dto/bulk-verify-diplomas.dto';
import {
  PublicDiplomaDetailDto,
  PublicDiplomaUniversityDto,
} from './dto/bulk-verify-diploma-response.dto';

@ApiTags('Public API')
@Controller('employer')
@ApiExtraModels(PublicDiplomaDetailDto, PublicDiplomaUniversityDto)
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
      'Всегда возвращает массив детальных объектов дипломов (для одного номера — массив из одного элемента).',
    type: PublicDiplomaDetailDto,
    isArray: true,
  })
  @ApiBody({
    type: BulkVerifyDiplomasDto,
    examples: {
      single: {
        summary: 'Проверка одного номера',
        value: { diplomaNumber: '1234567890123' },
      },
      batch: {
        summary: 'Проверка списка номеров',
        value: {
          diplomaNumbers: ['1234567890123', '9876543210987'],
        },
      },
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
