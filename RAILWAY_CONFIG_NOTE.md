# Railway Configuration Priority

Railway is now using railway.json as the primary configuration.
The railway.toml has been backed up to railway.toml.backup to avoid conflicts.

Fixed issues:
1. Changed invalid 'always' value to 'on-failure' in mockup/railway.toml
2. Removed conflicting railway.toml from root (backed up)
3. Ensured all restartPolicyType values are valid across all config files
