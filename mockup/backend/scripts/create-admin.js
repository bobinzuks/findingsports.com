#!/usr/bin/env node

const bcrypt = require('bcrypt');

// This script creates an admin user for testing
// In production, this should be done through a secure admin panel

async function createAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@findingsports.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123!@#';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    
    console.log('Creating admin user...');
    console.log(`Email: ${adminEmail}`);
    console.log(`Username: ${adminUsername}`);
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Create admin user object
    const adminUser = {
        id: `user_admin_${Date.now()}`,
        email: adminEmail,
        username: adminUsername,
        name: 'Administrator',
        passwordHash,
        provider: 'local',
        role: 'admin',
        permissions: {},
        bannedUntil: null,
        banReason: null,
        warningCount: 0,
        createdAt: new Date().toISOString(),
        onboarded: true,
        preferences: {},
        emailVerified: true
    };
    
    console.log('\nAdmin user created successfully!');
    console.log('Add this user to your database or in-memory store.');
    console.log('\nUser object:');
    console.log(JSON.stringify(adminUser, null, 2));
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\nTest login credentials:`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
    }
}

createAdmin().catch(console.error);