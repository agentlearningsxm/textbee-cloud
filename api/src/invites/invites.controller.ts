import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AdminOnlyGuard } from './guards/admin-only.guard'
import { InvitesService } from './invites.service'
import { CreateInviteDto } from './dto/create-invite.dto'

@ApiTags('admin/invites')
@Controller('admin/invites')
@UseGuards(AuthGuard, AdminOnlyGuard)
@ApiBearerAuth()
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @ApiOperation({ summary: 'Generate a new invite code (Admin only)' })
  @Post()
  async createInvite(
    @Body() createInviteDto: CreateInviteDto,
    @Request() req,
  ) {
    const invite = await this.invitesService.createInvite(
      createInviteDto,
      req.user,
    )
    return { data: invite }
  }

  @ApiOperation({ summary: 'List all invite codes (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @Get()
  async listInvites(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const result = await this.invitesService.listInvites({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    })
    return { data: result.invites, total: result.total }
  }

  @ApiOperation({ summary: 'Get invite by ID (Admin only)' })
  @Get(':id')
  async getInvite(@Param('id') id: string) {
    const invite = await this.invitesService.getInviteById(id)
    return { data: invite }
  }

  @ApiOperation({ summary: 'Revoke an invite code (Admin only)' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/revoke')
  async revokeInvite(@Param('id') id: string) {
    await this.invitesService.revokeInvite(id)
    return { message: 'Invite revoked successfully' }
  }

  @ApiOperation({ summary: 'Delete an invite code (Admin only)' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async deleteInvite(@Param('id') id: string) {
    await this.invitesService.deleteInvite(id)
    return { message: 'Invite deleted successfully' }
  }
}
