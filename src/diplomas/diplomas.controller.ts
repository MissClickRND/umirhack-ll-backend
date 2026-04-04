import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DiplomasService } from './diplomas.service';
import { CreateDiplomaBatchDto } from './dto/create-diplomas-batch.dto';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';

@ApiTags('diplomas')
@Controller('diplomas')
export class DiplomasController {
    constructor(private readonly diplomasService: DiplomasService) {}

    // 1. CREATE BATCH

    @Post('batch')
    @ApiOperation({ summary: 'Создать batch дипломов' })
    @ApiBody({ type: CreateDiplomaBatchDto })
    createBatch(@Body() dto: CreateDiplomaBatchDto) {
        return this.diplomasService.createBatch(dto);
    }

    // 2. GET BY UNIVERSITY

    @Get('university/:universityId')
    @ApiOperation({ summary: 'Получить дипломы по университету' })
    @ApiParam({ name: 'universityId', description: 'ID университета' })
    getByUniversity(@Param('universityId') universityId: string) {
        return this.diplomasService.findByUniversity(universityId);
    }

    // 3. GET BY USER

    @Get('user/:userId')
    @ApiOperation({ summary: 'Получить дипломы пользователя' })
    @ApiParam({ name: 'userId', description: 'ID пользователя' })
    getByUser(@Param('userId') userId: string) {
        return this.diplomasService.findByUser(userId);
    }

    // 4. GET BY ID

    @Get(':id')
    @ApiOperation({ summary: 'Получить диплом по ID' })
    @ApiParam({ name: 'id', description: 'ID диплома' })
    getById(@Param('id') id: string) {
        return this.diplomasService.findById(id);
    }

    // 5. UPDATE / REVOKE

    @Patch(':id')
    @ApiOperation({ summary: 'Обновить или отозвать диплом' })
    @ApiParam({ name: 'id', description: 'ID диплома' })
    update(@Param('id') id: string, @Body() dto: any) {
        return this.diplomasService.update(id, dto);
    }

    // 6. CREATE QR TOKEN

    @Post(':id/qr-token')
    @ApiOperation({ summary: 'Создать QR-токен для диплома' })
    @ApiParam({ name: 'id', description: 'ID диплома' })
    @ApiBody({ type: CreateQrTokenDto })
    createQrToken(
        @Param('id') id: string,
        @Body() dto: CreateQrTokenDto,
    ) {
        return this.diplomasService.createQrToken(id, dto);
    }

    // 7. GET BY QR TOKEN

    @Get('qr-token')
    @ApiOperation({ summary: 'Получить диплом по QR-токену' })
    @ApiQuery({ name: 'token', description: 'QR токен', required: true })
    getByQrToken(@Query('token') token: string) {
        return this.diplomasService.findByQrToken(token);
    }

    // 8. SEARCH BY NUMBER
    // GET /diplomas/search?number=...

    @Get('search')
    @ApiOperation({ summary: 'Поиск диплома по номеру' })
    @ApiQuery({ name: 'number', description: 'Номер диплома', required: true })
    search(@Query('number') number: string) {
        return this.diplomasService.searchByNumber(number);
    }
}