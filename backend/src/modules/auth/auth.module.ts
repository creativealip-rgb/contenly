import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { BillingModule } from '../billing/billing.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [UsersModule, BillingModule],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }
