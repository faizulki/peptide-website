import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/user.dto';
import { User } from '../entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  // Lets the admin panel show the client the URL + secret to paste into
  // Soro's webhook config once they have an account — nothing about Soro's
  // actual payload format is known yet, so this is the one thing we can
  // hand over ahead of time.
  @Get('integrations/soro')
  getSoroIntegrationConfig() {
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    return {
      webhookUrl: `${appUrl}/api/articles/webhook/soro`,
      secret: this.configService.get<string>('ARTICLES_WEBHOOK_SECRET') || '',
    };
  }

  @Get('dashboard')
  async getDashboardMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('logs')
  async getActivityLogs(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.adminService.getActivityLogs(limitNum);
  }

  @Get('users')
  async getUsers() {
    const users = await this.adminService.getStaffUsers();
    return users.map((u) => this.formatUser(u));
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateAdminUserDto) {
    const user = await this.adminService.createStaffUser(createUserDto);
    return this.formatUser(user);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateAdminUserDto) {
    const user = await this.adminService.updateStaffUser(id, updateUserDto);
    return this.formatUser(user);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.adminService.deleteStaffUser(id);
    return { message: 'User deleted successfully' };
  }

  // Never return the password hash to the client.
  private formatUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  }
}
