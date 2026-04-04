import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DiplomasService } from './diplomas.service';
import { CreateDiplomaBatchDto } from './dto/create-diplomas-batch.dto';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { UpdateDiplomaStatusDto } from './dto/update-diploma-status.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/auth/types/auth-user.type';
import type { Request } from 'express';

@ApiTags('diplomas')
@Controller('diplomas')
@Throttle({ default: { limit: 15, ttl: 60_000 } })
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
  @Get('university')
  @ApiOperation({ summary: 'Получить дипломы по университету' })
  @ApiQuery({ name: 'universityId', required: true, example: 1 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getByUniversity(
    @Query('universityId', ParseIntPipe) universityId: number,
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.diplomasService.findByUniversity(
      universityId,
      user?.id,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  // 3. GET BY USER

  @Roles('STUDENT')
  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить дипломы пользователя' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  getByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.diplomasService.findByUser(userId, user.id);
  }

  // 4. UPDATE DIPLOMA STATUS

  @Roles('UNIVERSITY', 'ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Отозвать диплом' })
  @ApiParam({ name: 'id', description: 'ID диплома' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiplomaStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.diplomasService.update(id, dto, user.id, user.role);
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

  // 6. DELETE QR TOKEN

  @Roles('STUDENT')
  @Delete('qr-token/:tokenId')
  @ApiOperation({ summary: 'Отозвать QR-токен по ID' })
  @ApiParam({ name: 'tokenId', description: 'ID QR-токена' })
  revokeQrToken(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.diplomasService.revokeQrTokenById(tokenId, user.id);
  }

  // 7. GET BY QR TOKEN

  @Public()
  @Get('qr-token')
  @ApiOperation({ summary: 'Получить диплом по QR-токену' })
  @ApiQuery({ name: 'token', description: 'QR токен', required: true })
  getByQrToken(@Query('token') token: string) {
    return this.diplomasService.findByQrToken(token);
  }

  // 8. SEARCH BY NUMBER
  // GET /diplomas/search?number=...

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Поиск диплома по номеру' })
  @ApiQuery({ name: 'number', description: 'Номер диплома', required: true })
  search(@Query('number') number: string, @Req() req: Request) {
    return this.diplomasService.searchByNumber(number, req.ip ?? 'unknown');
  }

  // 9. GET BY ID

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Получить диплом по ID' })
  @ApiParam({ name: 'id', description: 'ID диплома' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.diplomasService.findById(id);
  }

  // 10. GET USER TOKENS

  @Roles('STUDENT')
  @Get(':userId/list')
  @ApiOperation({ summary: 'Получить токены пользователя' })
  getUserTokens(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.diplomasService.getUserTokens(userId, user.id);
  }
}
