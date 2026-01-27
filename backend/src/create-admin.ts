import { auth } from './auth/auth.config';

async function main() {
    console.log('🚀 Creating admin user...');

    try {
        const user = await auth.api.signUpEmail({
            body: {
                email: 'adminalip@camedia.com',
                password: 'password123',
                name: 'adminalip',
            }
        });

        console.log('✅ Admin user created successfully:', user);
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create admin user:', error);
        process.exit(1);
    }
}

main();
