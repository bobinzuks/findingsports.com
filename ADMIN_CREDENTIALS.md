# 🔐 Finding Sports - Admin & Moderator Credentials

## 👤 Admin Account
- **Email:** admin@findingsports.com
- **Password:** admin123
- **Username:** admin
- **Role:** Administrator
- **Access Level:** Full system access

### Admin Capabilities:
- ✅ Access admin panel at `/admin-panel.html`
- ✅ Manage all users (ban, unban, role changes)
- ✅ View system statistics
- ✅ Create test users
- ✅ Moderate all content
- ✅ Access all API endpoints
- ✅ Manage venue requests
- ✅ Configure system settings

---

## 👮 Moderator Account
- **Email:** mod@findingsports.com
- **Password:** mod123
- **Username:** moderator
- **Role:** Moderator
- **Access Level:** Content moderation

### Moderator Capabilities:
- ✅ Access moderator dashboard at `/moderator-dashboard.html`
- ✅ Delete inappropriate content
- ✅ Warn/mute users
- ✅ View moderation logs
- ✅ Resolve user reports
- ✅ Search users
- ✅ Cannot ban users (admin only)
- ✅ Cannot change user roles (admin only)

---

## 🧪 Test User Account
- **Email:** user@findingsports.com
- **Password:** user123
- **Username:** regularuser
- **Role:** Regular User
- **Access Level:** Standard user features

---

## 🚀 How to Login

### Via the Website:
1. Go to https://findingsports.com
2. Click the "Login" button in the top right
3. Enter email and password
4. Click "Sign In"

### Creating Test Users:
If the users don't exist yet, you can create them by:

1. First login as admin (if admin exists)
2. Go to `/admin-panel.html`
3. Click "Create Test Users" button

OR via API:
```bash
curl -X POST https://findingsports.com/api/admin/create-test-users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔑 Important Security Notes

⚠️ **CHANGE THESE PASSWORDS IN PRODUCTION!**

These are development/test credentials and should be changed immediately when the site goes live:

1. Update passwords in the database
2. Use strong, unique passwords
3. Enable 2FA for admin accounts
4. Consider using OAuth providers (Google Sign-In is already configured)
5. Rotate credentials regularly

---

## 📱 API Authentication

For API access, after logging in you'll receive a JWT token. Use it in headers:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

---

## 🛠️ Admin Panel Features

Once logged in as admin, you can access:

- **User Management**: View, edit, ban/unban users
- **Role Management**: Promote users to moderator
- **Statistics**: View site usage stats
- **Reports**: See user reports and moderation logs
- **Content Control**: Delete posts, manage games
- **System Settings**: Configure site-wide settings

---

## 📞 Support

If you have issues logging in:
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Check if the server is running
4. Verify the backend is responding at `/api/health`

---

*Last Updated: August 17, 2025*
*Version: 1.0*