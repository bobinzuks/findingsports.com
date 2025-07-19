#!/usr/bin/env node

// Script to create test users with different roles
// Run with: node create-test-users.js

const bcrypt = require('bcrypt');

async function createTestUsers() {
    console.log('Creating test users...\n');
    
    const testUsers = [
        {
            email: 'admin@findingsports.com',
            password: 'admin123',
            name: 'Admin User',
            username: 'admin',
            role: 'admin'
        },
        {
            email: 'mod@findingsports.com',
            password: 'mod123',
            name: 'Moderator User',
            username: 'moderator',
            role: 'moderator'
        },
        {
            email: 'user@findingsports.com',
            password: 'user123',
            name: 'Regular User',
            username: 'regularuser',
            role: 'user'
        }
    ];
    
    console.log('Test Users Created:\n');
    
    for (const user of testUsers) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        console.log(`Email: ${user.email}`);
        console.log(`Password: ${user.password}`);
        console.log(`Role: ${user.role}`);
        console.log(`Password Hash: ${passwordHash}`);
        console.log('---');
    }
    
    console.log('\nTo use these users:');
    console.log('1. Add them to the users Map in server.js');
    console.log('2. Or create them through the registration endpoint');
    console.log('3. Update their role in the database after creation');
    
    console.log('\nExample user object for server.js:');
    const adminUser = testUsers[0];
    const adminHash = await bcrypt.hash(adminUser.password, 10);
    console.log(`
users.set('admin-test-id', {
    id: 'admin-test-id',
    email: '${adminUser.email}',
    username: '${adminUser.username}',
    name: '${adminUser.name}',
    passwordHash: '${adminHash}',
    provider: 'local',
    role: '${adminUser.role}',
    permissions: {},
    bannedUntil: null,
    banReason: null,
    warningCount: 0,
    createdAt: new Date().toISOString(),
    onboarded: true,
    preferences: {}
});`);
}

createTestUsers().catch(console.error);