import { readFileSync } from 'fs';
import { join } from 'path';

const srcRoot = join(__dirname, '..', '..');

function readSource(relativePath: string) {
  return readFileSync(join(srcRoot, relativePath), 'utf8');
}

describe('admin permission coverage', () => {
  it('protects admin settings controller with session and super-admin guards', () => {
    const source = readSource('modules/admin-settings/admin-settings.controller.ts');

    expect(source).toContain("@Controller('admin/settings')");
    expect(source).toContain('@UseGuards(SessionAuthGuard, SuperAdminGuard)');
  });

  it('protects users controller with auth guard', () => {
    const source = readSource('modules/users/users.controller.ts');

    expect(source).toContain("@Controller('users')");
    expect(source).toContain('@UseGuards(AuthGuard)');
  });

  it.each([
    'listUsers',
    'createUser',
    'updateRole',
    'addTokens',
    'updateTier',
    'deleteUser',
  ])('protects UsersController.%s with super-admin guard', (methodName) => {
    const source = readSource('modules/users/users.controller.ts');
    const methodIndex = source.indexOf(`async ${methodName}`);

    expect(methodIndex).toBeGreaterThan(0);
    const decoratorBlock = source.slice(Math.max(0, methodIndex - 220), methodIndex);
    expect(decoratorBlock).toContain('@UseGuards(SuperAdminGuard)');
  });
});
