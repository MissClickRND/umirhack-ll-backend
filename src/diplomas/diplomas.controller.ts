import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DiplomasService } from './diplomas.service';
import { CreateDiplomaBatchDto } from './dto/create-diplomas-batch.dto';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { UpdateDiplomaStatusDto } from './dto/update-diploma-status.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/auth/types/auth-user.type';

@ApiTags('diplomas')
@Controller('diplomas')
export class DiplomasController {
  constructor(private readonly diplomasService: DiplomasService) {}

  // 1. CREATE BATCH

  @Roles('UNIVERSITY')
  @Post('batch')
  @ApiOperation({ summary: 'Создать batch дипломов' })
  @ApiBody({ type: CreateDiplomaBatchDto })
  createBatch(
    @Body() dto: CreateDiplomaBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.diplomasService.createBatch(dto, user.id);
  }

  // 2. GET BY UNIVERSITY

  @Roles('UNIVERSITY', 'ADMIN')
  @Get('university/:universityId')
  @ApiOperation({ summary: 'Получить дипломы по университету' })
  @ApiParam({ name: 'universityId', description: 'ID университета' })
  getByUniversity(
    @Param('universityId', ParseIntPipe) universityId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.diplomasService.findByUniversity(universityId, user.id);
  }

  // 3. GET BY USER

  @Roles('STUDENT')
  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить дипломы пользователя' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  getByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.diplomasService.findByUser(userId);
  }

  // 4. REVOKE

  @Roles('UNIVERSITY', 'ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Отозвать диплом' })
  @ApiParam({ name: 'id', description: 'ID диплома' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiplomaStatusDto,
  ) {
    return this.diplomasService.update(id, dto);
  }

  // 5. CREATE QR TOKEN

  @Roles('STUDENT')
  @Post(':id/qr-token')
  @ApiOperation({ summary: 'Создать QR-токен для диплома' })
  @ApiParam({ name: 'id', description: 'ID диплома' })
  @ApiBody({ type: CreateQrTokenDto })
  createQrToken(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateQrTokenDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.diplomasService.createQrToken(id, dto, user.id);
  }

  // 6. GET BY QR TOKEN

  @Public()
  @Get('qr-token')
  @ApiOperation({ summary: 'Получить диплом по QR-токену' })
  @ApiQuery({ name: 'token', description: 'QR токен', required: true })
  getByQrToken(@Query('token') token: string) {
    return this.diplomasService.findByQrToken(token);
  }

  // 7. SEARCH BY NUMBER
  // GET /diplomas/search?number=...

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Поиск диплома по номеру' })
  @ApiQuery({ name: 'number', description: 'Номер диплома', required: true })
  search(@Query('number') number: string) {
    return this.diplomasService.searchByNumber(number);
  }

  // 8. GET BY ID

  @Get(':id')
  @ApiOperation({ summary: 'Получить диплом по ID' })
  @ApiParam({ name: 'id', description: 'ID диплома' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.diplomasService.findById(id);
  }
}
