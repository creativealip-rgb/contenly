import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import * as crypto from 'crypto';

interface MidtransSnapRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name: string;
    last_name?: string;
    email: string;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
}

interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

interface MidtransNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly isProduction: boolean;
  private readonly serverKey: string;
  private readonly clientKey: string;

  constructor(
    private configService: ConfigService,
    private billingService: BillingService,
  ) {
    this.serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY', '');
    this.clientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY', '');
    this.isProduction = this.configService.get<string>('MIDTRANS_ENV', 'sandbox') === 'production';

    if (!this.serverKey) {
      this.logger.warn('MIDTRANS_SERVER_KEY not set - Midtrans integration disabled');
    } else {
      this.logger.log(`Midtrans initialized (${this.isProduction ? 'production' : 'sandbox'})`);
    }
  }

  /**
   * Create Snap token for checkout
   */
  async createSnapToken(
    userId: string,
    email: string,
    name: string,
    plan: 'STARTER' | 'PRO' | 'BUSINESS',
  ): Promise<{ token: string; redirect_url: string; order_id: string }> {
    if (!this.serverKey) {
      throw new BadRequestException('Midtrans not configured');
    }

    const planPrices: Record<string, { price: number; name: string }> = {
      STARTER: { price: 99000, name: 'Contenly Starter - 1 Bulan' },
      PRO: { price: 399000, name: 'Contenly Pro - 1 Bulan' },
      BUSINESS: { price: 999000, name: 'Contenly Business - 1 Bulan' },
    };

    const planDetails = planPrices[plan];
    if (!planDetails) {
      throw new BadRequestException('Invalid plan');
    }

    const orderId = `CLY-${plan}-${Date.now()}-${userId.substring(0, 6)}`;

    const payload: MidtransSnapRequest = {
      transaction_details: {
        order_id: orderId,
        gross_amount: planDetails.price,
      },
      customer_details: {
        first_name: name.split(' ')[0] || 'User',
        last_name: name.split(' ').slice(1).join(' ') || undefined,
        email,
      },
      item_details: [
        {
          id: plan,
          price: planDetails.price,
          quantity: 1,
          name: planDetails.name,
        },
      ],
      callbacks: {
        finish: `${this.configService.get('FRONTEND_URL', 'https://contenly.app')}/dashboard/billing?payment=success`,
        error: `${this.configService.get('FRONTEND_URL', 'https://contenly.app')}/dashboard/billing?payment=failed`,
        pending: `${this.configService.get('FRONTEND_URL', 'https://contenly.app')}/dashboard/billing?payment=pending`,
      },
    };

    // Create pending transaction in DB
    await this.billingService.createPendingTransaction(userId, orderId, plan, planDetails.price);

    // Call Midtrans Snap API
    const auth = Buffer.from(`${this.serverKey}:`).toString('base64');
    const baseUrl = this.isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Midtrans API error: ${error}`);
        throw new BadRequestException('Failed to create payment session');
      }

      const data: MidtransSnapResponse = await response.json();
      this.logger.log(`Midtrans Snap token created: ${orderId}`);

      return {
        token: data.token,
        redirect_url: data.redirect_url,
        order_id: orderId,
      };
    } catch (error: any) {
      this.logger.error(`Midtrans error: ${error.message}`);
      throw new BadRequestException('Failed to create payment session');
    }
  }

  /**
   * Handle Midtrans notification (webhook)
   */
  async handleNotification(notification: MidtransNotification): Promise<{ status: string; order_id: string }> {
    if (!this.serverKey) {
      throw new BadRequestException('Midtrans not configured');
    }

    // Verify signature
    const signatureInput = notification.order_id + notification.status_code + notification.gross_amount + this.serverKey;
    const expectedSignature = crypto.createHash('sha512').update(signatureInput).digest('hex');

    if (notification.signature_key !== expectedSignature) {
      this.logger.error('Invalid Midtrans signature');
      throw new BadRequestException('Invalid signature');
    }

    const { order_id, transaction_status, fraud_status } = notification;
    this.logger.log(`Midtrans notification: ${order_id} - ${transaction_status}`);

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (!fraud_status || fraud_status === 'accept') {
        await this.billingService.handleMidtransSuccess(order_id);
        return { status: 'success', order_id };
      } else {
        await this.billingService.handleMidtransFailure(order_id, 'Fraud detected');
        return { status: 'fraud', order_id };
      }
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      await this.billingService.handleMidtransFailure(order_id, transaction_status);
      return { status: 'failed', order_id };
    }

    return { status: 'pending', order_id };
  }

  getClientKey(): string {
    return this.clientKey;
  }

  isConfigured(): boolean {
    return !!this.serverKey;
  }
}
