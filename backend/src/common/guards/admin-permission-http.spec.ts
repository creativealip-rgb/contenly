import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

jest.mock('./auth.guard', () => ({
  AuthGuard: class AuthGuard {},
}));

jest.mock('./session-auth.guard', () => ({
  SessionAuthGuard: class SessionAuthGuard {},
}));

jest.mock('../../modules/users/users.service', () => ({
  UsersService: class UsersService {},
}));

import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../../db/drizzle.service';
import { AdminSettingsController } from '../../modules/admin-settings/admin-settings.controller';
import { UsersController } from '../../modules/users/users.controller';
import { UsersService } from '../../modules/users/users.service';
import { AuthGuard } from './auth.guard';
import { SessionAuthGuard } from './session-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';

const setRegularAdminUser: CanActivate = {
  canActivate(context: ExecutionContext) {
    context.switchToHttp().getRequest().user = {
      id: 'admin-user',
      email: 'admin@example.com',
      role: 'admin',
    };
    return true;
  },
};

describe('Admin permission HTTP guards', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const usersServiceMock = {
      findAll: jest.fn(),
      createUser: jest.fn(),
      updateRole: jest.fn(),
      addTokens: jest.fn(),
      updateTier: jest.fn(),
      delete: jest.fn(),
    };

    const configServiceMock = {
      get: jest.fn().mockReturnValue(''),
    };

    const drizzleServiceMock = {
      db: {
        execute: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController, AdminSettingsController],
      providers: [
        SuperAdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: DrizzleService, useValue: drizzleServiceMock },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(setRegularAdminUser)
      .overrideGuard(SessionAuthGuard)
      .useValue(setRegularAdminUser)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 403 for regular admin on /users/admin/list', async () => {
    await request(app.getHttpServer()).get('/users/admin/list').expect(403);
  });

  it('returns 403 for regular admin on /admin/settings/providers/status', async () => {
    await request(app.getHttpServer()).get('/admin/settings/providers/status').expect(403);
  });
});
