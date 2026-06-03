import { Module, forwardRef } from '@nestjs/common';
import { BillingService } from './billing.service';
import { MidtransService } from './midtrans.service';
import { BillingController } from './billing.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [BillingController],
  providers: [BillingService, MidtransService],
  exports: [BillingService, MidtransService],
})
export class BillingModule {}
