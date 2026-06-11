import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DeadLetterQueueService } from './dead-letter-queue.service';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'dead-letter' })],
  providers: [DeadLetterQueueService],
  exports: [DeadLetterQueueService],
})
export class DeadLetterQueueModule {}
