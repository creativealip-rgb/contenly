import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
    private readonly logger = new Logger(EncryptionService.name);
    private readonly algorithm = 'aes-256-cbc';
    private key: Buffer;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const rawKey = this.configService.get<string>('ENCRYPTION_KEY');

        if (!rawKey) {
            this.logger.error('CRITICAL: ENCRYPTION_KEY is missing from environment variables!');
            throw new Error('ENCRYPTION_KEY is required for the application to function securely.');
        }

        if (rawKey.length < 32) {
            this.logger.error('CRITICAL: ENCRYPTION_KEY must be at least 32 characters long!');
            throw new Error('Insecure ENCRYPTION_KEY detected.');
        }

        // Use the first 32 bytes of the provided key
        this.key = Buffer.from(rawKey.substring(0, 32));
    }

    encrypt(text: string): string {
        if (!text) return '';

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Format: iv:encryptedData
        return `${iv.toString('hex')}:${encrypted}`;
    }

    decrypt(encryptedText: string): string {
        if (!encryptedText) return '';

        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted text format. Expected iv:data');
        }

        const [ivHex, dataHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedData = Buffer.from(dataHex, 'hex');

        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

        let decrypted = decipher.update(encryptedData, undefined, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
