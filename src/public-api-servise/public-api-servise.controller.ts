import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PublicApiServiseService } from './public-api-servise.service';
import { BulkVerifyDiplomasDto } from './dto/bulk-verify-diplomas.dto';
import {
  BulkVerifyDiplomaShortDto,
  BulkVerifyDiplomaSuccessDto,
} from './dto/bulk-verify-diploma-response.dto';

@ApiTags('Public API Servise')
@ApiExtraModels(BulkVerifyDiplomaSuccessDto, BulkVerifyDiplomaShortDto)
@Controller('employer')
export class PublicApiServiseController {
  constructor(private readonly publicApiServiseService: PublicApiServiseService) {}

  @Public()
  @Post('public/verify')
  @ApiOkResponse({
    description:
      'Массив результатов в том же порядке, что и diplomaNumbers. Элемент либо полный (успех), либо короткий.',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(BulkVerifyDiplomaSuccessDto) },
          { $ref: getSchemaPath(BulkVerifyDiplomaShortDto) },
        ],
      },
    },
  })
  verifyBatch(@Body() dto: BulkVerifyDiplomasDto) {
    return this.publicApiServiseService.verifyBatch(dto);
  }
}
