import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { DiplomasService } from './diplomas.service';
import { CreateDiplomaBatchDto } from './dto/create-diplomas-batch.dto';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';

@Controller('diplomas')
export class DiplomasController {
    constructor(private readonly diplomasService: DiplomasService) {}

    // =========================
    // 1. CREATE BATCH
    // POST /diplomas/batch
    // roles: UNIVERSITY | ADMIN
    // =========================
    @Post('batch')
    createBatch(@Body() dto: CreateDiplomaBatchDto) {
        return this.diplomasService.createBatch(dto);
    }

    // =========================
    // 2. GET BY UNIVERSITY
    // GET /diplomas/university/:universityId
    // roles: UNIVERSITY | ADMIN
    // =========================
    @Get('university/:universityId')
    getByUniversity(@Param('universityId') universityId: string) {
        return this.diplomasService.findByUniversity(universityId);
    }

    // =========================
    // 3. GET BY USER
    // GET /diplomas/user/:userId
    // roles: OWNER | UNIVERSITY | ADMIN
    // =========================
    @Get('user/:userId')
    getByUser(@Param('userId') userId: string) {
        return this.diplomasService.findByUser(userId);
    }

    // =========================
    // 4. GET BY ID
    // GET /diplomas/:id
    // roles: OWNER | UNIVERSITY | ADMIN
    // =========================
    @Get(':id')
    getById(@Param('id') id: string) {
        return this.diplomasService.findById(id);
    }

    // =========================
    // 5. UPDATE / REVOKE
    // PATCH /diplomas/:id
    // roles: UNIVERSITY | ADMIN
    // =========================
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: any) {
        return this.diplomasService.update(id, dto);
    }

    // =========================
    // 6. CREATE QR TOKEN
    // POST /diplomas/:id/qr-token
    // roles: UNIVERSITY | ADMIN
    // =========================
    @Post(':id/qr-token')
    createQrToken(
        @Param('id') id: string,
        @Body() dto: CreateQrTokenDto,
    ) {
        return this.diplomasService.createQrToken(id, dto);
    }

    // =========================
    // 7. GET BY QR TOKEN
    // GET /diplomas/qr-token?token=...
    // public endpoint
    // =========================
    @Get('qr-token')
    getByQrToken(@Query('token') token: string) {
        return this.diplomasService.findByQrToken(token);
    }

    // =========================
    // 8. SEARCH BY NUMBER
    // GET /diplomas/search?number=...
    // roles: UNIVERSITY | ADMIN
    // =========================
    @Get('search')
    search(@Query('number') number: string) {
        return this.diplomasService.searchByNumber(number);
    }
}