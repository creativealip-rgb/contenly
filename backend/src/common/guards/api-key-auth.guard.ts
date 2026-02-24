import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { DrizzleService } from '../../db/drizzle.service';
import { apiKey } from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
    constructor(private drizzle: DrizzleService) {}

    get db() {
        return this.drizzle.db;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        
        // Extract API key from headers
        const apiKeyValue = this.extractApiKey(request);
        
        if (!apiKeyValue) {
            throw new UnauthorizedException('API key required');
        }

        // Validate API key
        const keyRecord = await this.validateApiKey(apiKeyValue);
        
        if (!keyRecord) {
            throw new UnauthorizedException('Invalid API key');
        }

        // Check if expired
        if (keyRecord.expiresAt && new Date() > new Date(keyRecord.expiresAt)) {
            throw new UnauthorizedException('API key expired');
        }

        // Update last used
        await this.db
            .update(apiKey)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKey.id, keyRecord.id));

        // Attach user to request
        (request as any).user = { id: keyRecord.userId };
        (request as any).apiKeyId = keyRecord.id;

        return true;
    }

    private extractApiKey(request: Request): string | null {
        // Check Authorization: Bearer <key>
        const authHeader = request.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Check X-API-Key header
        const apiKeyHeader = request.headers['x-api-key'];
        if (apiKeyHeader) {
            return apiKeyHeader as string;
        }

        // Check query param ?api_key=...
        const queryKey = request.query.api_key;
        if (queryKey) {
            return queryKey as string;
        }

        return null;
    }

    private async validateApiKey(keyValue: string): Promise<any> {
        // Get prefix from key (first 12 chars: cam_ + 8 chars)
        const keyPrefix = keyValue.substring(0, 12);

        // Find keys with matching prefix
        const keys = await this.db.query.apiKey.findMany({
            where: eq(apiKey.keyPrefix, keyPrefix),
        });

        // Check each key with bcrypt
        for (const key of keys) {
            const isValid = await bcrypt.compare(keyValue, key.keyHash);
            if (isValid) {
                return key;
            }
        }

        return null;
    }
}
