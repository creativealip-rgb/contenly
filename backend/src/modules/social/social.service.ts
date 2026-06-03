import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { schema } from '../../db/schema';

export interface InstagramPostData {
  imageUrl: string;
  caption: string;
  hashtags?: string[];
}

export interface InstagramPublishResult {
  id: string;
  permalink: string;
}

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);
  
  private readonly IG_API_URL = 'https://graph.instagram.com';

  constructor(private readonly drizzle: DrizzleService) {}

  async connectInstagram(userId: string, accessToken: string, accountId: string, username?: string) {
    try {
      // Validate token by making a test API call
      const testResponse = await fetch(
        `${this.IG_API_URL}/${accountId}?fields=id,username,account_type&access_token=${accessToken}`
      );

      if (!testResponse.ok) {
        throw new BadRequestException('Invalid Instagram access token');
      }

      const accountData = await testResponse.json();

      // Check if already connected
      const existing = await this.drizzle.db
        .select()
        .from(schema.socialAccount)
        .where(
          eq(schema.socialAccount.userId, userId)
        );

      // Find existing Instagram account
      const existingInstagram = existing.find(
        acc => acc.platform === 'instagram' && acc.isActive
      );

      if (existingInstagram) {
        // Update existing
        await this.drizzle.db
          .update(schema.socialAccount)
          .set({
            accessToken,
            accountId: accountData.id,
            username: accountData.username,
            tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            updatedAt: new Date(),
          })
          .where(eq(schema.socialAccount.id, existingInstagram.id));

        return { success: true, message: 'Instagram account updated' };
      }

      // Create new
      await this.drizzle.db
        .insert(schema.socialAccount)
        .values({
          userId,
          platform: 'instagram',
          accountId: accountData.id,
          accessToken,
          username: accountData.username,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
        });

      return { success: true, message: 'Instagram account connected' };
    } catch (error) {
      this.logger.error(`Failed to connect Instagram: ${error.message}`);
      throw new BadRequestException(`Failed to connect Instagram: ${error.message}`);
    }
  }

  async disconnectInstagram(userId: string) {
    await this.drizzle.db
      .update(schema.socialAccount)
      .set({ isActive: false })
      .where(
        eq(schema.socialAccount.userId, userId)
      );

    return { success: true, message: 'Instagram account disconnected' };
  }

  async getConnectedAccounts(userId: string) {
    const accounts = await this.drizzle.db
      .select({
        id: schema.socialAccount.id,
        platform: schema.socialAccount.platform,
        username: schema.socialAccount.username,
        profileUrl: schema.socialAccount.profileUrl,
        isActive: schema.socialAccount.isActive,
        createdAt: schema.socialAccount.createdAt,
      })
      .from(schema.socialAccount)
      .where(eq(schema.socialAccount.userId, userId));

    return accounts;
  }

  async isInstagramConnected(userId: string): Promise<boolean> {
    const account = await this.drizzle.db
      .select()
      .from(schema.socialAccount)
      .where(
        eq(schema.socialAccount.userId, userId)
      );

    return account.some(acc => acc.platform === 'instagram' && acc.isActive);
  }

  async getInstagramAccount(userId: string) {
    const account = await this.drizzle.db
      .select()
      .from(schema.socialAccount)
      .where(
        eq(schema.socialAccount.userId, userId)
      );

    return account.find(acc => acc.platform === 'instagram' && acc.isActive);
  }

  async postToInstagram(userId: string, data: InstagramPostData): Promise<InstagramPublishResult> {
    const account = await this.getInstagramAccount(userId);

    if (!account || !account.accessToken) {
      throw new BadRequestException(
        'Instagram account not connected. Please connect your Instagram account first.'
      );
    }

    try {
      const container = await this.createMediaContainer(account.accessToken, data);
      this.logger.log(`Created media container: ${container.id}`);

      await this.waitForMediaReady(account.accessToken, container.id);

      const published = await this.publishMedia(account.accessToken, container.id);
      this.logger.log(`Published to Instagram: ${published.permalink}`);

      return published;
    } catch (error) {
      this.logger.error(`Instagram posting failed: ${error.message}`);
      throw new BadRequestException(`Failed to post to Instagram: ${error.message}`);
    }
  }

  private async createMediaContainer(accessToken: string, data: InstagramPostData): Promise<{ id: string }> {
    const caption = this.buildCaption(data.caption, data.hashtags);
    
    const params = new URLSearchParams({
      image_url: data.imageUrl,
      caption: caption,
      access_token: accessToken,
    });

    const response = await fetch(`${this.IG_API_URL}/me/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create media container: ${error}`);
    }

    return await response.json();
  }

  private async waitForMediaReady(accessToken: string, containerId: string): Promise<void> {
    const maxAttempts = 10;
    const delayMs = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      const params = new URLSearchParams({
        fields: 'status_code',
        access_token: accessToken,
      });

      const response = await fetch(`${this.IG_API_URL}/${containerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to check media status: ${error}`);
      }

      const result = await response.json();
      
      if (result.status_code === 'READY') {
        return;
      }

      if (result.status_code === 'ERROR') {
        throw new Error('Media processing failed');
      }

      this.logger.log(`Waiting for media to be ready... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Media processing timeout');
  }

  private async publishMedia(accessToken: string, containerId: string): Promise<InstagramPublishResult> {
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });

    const response = await fetch(`${this.IG_API_URL}/me/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to publish media: ${error}`);
    }

    const result = await response.json();

    const permalinkResponse = await fetch(
      `${this.IG_API_URL}/${result.id}?fields=permalink&access_token=${accessToken}`
    );
    const permalinkData = await permalinkResponse.json();

    return {
      id: result.id,
      permalink: permalinkData.permalink,
    };
  }

  private buildCaption(caption: string, hashtags?: string[]): string {
    let fullCaption = caption;
    
    if (hashtags && hashtags.length > 0) {
      fullCaption += '\n\n' + hashtags.join(' ');
    }

    fullCaption += '\n\n#ContentCreatedWithContenly';

    return fullCaption;
  }

  async postCarousel(userId: string, images: string[], caption: string, hashtags?: string[]): Promise<InstagramPublishResult> {
    const account = await this.getInstagramAccount(userId);

    if (!account || !account.accessToken) {
      throw new BadRequestException(
        'Instagram account not connected. Please connect your Instagram account first.'
      );
    }

    try {
      const childrenIds: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const params = new URLSearchParams({
          image_url: images[i],
          is_carousel_item: 'true',
          access_token: account.accessToken,
        });

        const response = await fetch(`${this.IG_API_URL}/me/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const child = await response.json();
        childrenIds.push(child.id);
        
        this.logger.log(`Created carousel child ${i + 1}/${images.length}`);
      }

      const carouselParams = new URLSearchParams({
        media_type: 'CAROUSEL',
        caption: this.buildCaption(caption, hashtags),
        children: childrenIds.join(','),
        access_token: account.accessToken,
      });

      const carouselResponse = await fetch(`${this.IG_API_URL}/me/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: carouselParams.toString(),
      });

      const carousel = await carouselResponse.json();
      
      await this.waitForMediaReady(account.accessToken, carousel.id);
      const published = await this.publishMedia(account.accessToken, carousel.id);

      return published;
    } catch (error) {
      this.logger.error(`Carousel posting failed: ${error.message}`);
      throw new BadRequestException(`Failed to post carousel: ${error.message}`);
    }
  }
}
