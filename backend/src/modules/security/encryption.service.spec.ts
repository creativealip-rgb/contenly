import { EncryptionService } from './encryption.service';
import { ConfigService } from '@nestjs/config';

describe('EncryptionService', () => {
    let service: EncryptionService;
    let configService: ConfigService;

    beforeEach(async () => {
        configService = {
            get: jest.fn((key: string) => {
                if (key === 'ENCRYPTION_KEY') return 'test-key-32-chars-long-1234567890';
                return null;
            }),
        } as any;
        service = new EncryptionService(configService);
        await service.onModuleInit();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should encrypt and decrypt text correctly', () => {
        const originalText = 'Hello World';
        const encrypted = service.encrypt(originalText);

        expect(encrypted).toBeDefined();
        expect(encrypted).not.toEqual(originalText);
        expect(encrypted).toContain(':');

        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toEqual(originalText);
    });

    it('should throw error if decryption fails with invalid data', () => {
        expect(() => service.decrypt('invalid-format')).toThrow();
        expect(() => service.decrypt('hex1:hex2')).toThrow();
    });

    it('should produce different ciphertexts for the same plaintext (IV randomization)', () => {
        const text = 'Secret Message';
        const enc1 = service.encrypt(text);
        const enc2 = service.encrypt(text);

        expect(enc1).not.toEqual(enc2);
        expect(service.decrypt(enc1)).toEqual(text);
        expect(service.decrypt(enc2)).toEqual(text);
    });
});
