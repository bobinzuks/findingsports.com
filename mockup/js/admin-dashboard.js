// Admin Dashboard Management
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.init();
    }
    
    async init() {
        // Check if user is admin
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
            window.location.href = '/';
            return;
        }
        
        this.currentUser = JSON.parse(userData);
        
        if (this.currentUser.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = '/';
            return;
        }
        
        // Load users
        await this.loadUsers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize password validator
        if (window.PasswordValidator) {
            const validator = new PasswordValidator();
            const passwordInputs = document.querySelectorAll('#newUserPassword, #newModPassword');
            passwordInputs.forEach(input => {
                validator.createStrengthMeter(input);
            });
        }
    }
    
    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.users = data.users || [];
                this.renderUsersTable();
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            // Load demo data
            this.loadDemoUsers();
        }
    }
    
    loadDemoUsers() {
        this.users = [
            {
                id: '1',
                name: 'Admin User',
                email: 'admin@findingsports.com',
                role: 'admin',
                status: 'active',
                joined: '2024-01-15'
            },
            {
                id: '2',
                name: 'Moderator User',
                email: 'moderator@findingsports.com',
                role: 'moderator',
                status: 'active',
                joined: '2024-02-20'
            },
            {
                id: '3',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user',
                status: 'active',
                joined: '2024-03-10'
            },
            {
                id: '4',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'user',
                status: 'inactive',
                joined: '2024-03-15'
            }
        ];
        this.renderUsersTable();
    }
    
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge role-${user.role}">${user.role}</span>
                </td>
                <td>
                    <span class="status-badge status-${user.status}">${user.status}</span>
                </td>
                <td>${user.joined}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-edit" onclick="adminDashboard.editUser('${user.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn btn-delete" onclick="adminDashboard.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    setupEventListeners() {
        // Add User Form
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }
        
        // Add Moderator Form
        const addModForm = document.getElementById('addModeratorForm');
        if (addModForm) {
            addModForm.addEventListener('submit', (e) => this.handleAddModerator(e));
        }
        
        // Search
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterUsers(e.target.value));
        }
        
        // Filter
        const filterSelect = document.querySelector('.filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => this.filterByRole(e.target.value));
        }
        
        // Nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!item.href || item.href === '#') {
                    e.preventDefault();
                }
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
    
    async handleAddUser(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Validate password
        if (window.PasswordValidator) {
            const validator = new PasswordValidator();
            const password = formData.get('password');
            const result = validator.validate(password);
            
            if (!result.valid) {
                alert('Password requirements not met:\n' + result.errors.join('\n'));
                return;
            }
        }
        
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };
        
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(userData)
            });
            
            if (response.ok) {
                alert('User added successfully!');
                this.closeModal('addUserModal');
                await this.loadUsers();
            } else {
                const error = await response.json();
                alert('Failed to add user: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            // Demo mode
            const newUser = {
                id: Date.now().toString(),
                name: userData.name,
                email: userData.email,
                role: userData.role,
                status: 'active',
                joined: new Date().toISOString().split('T')[0]
            };
            
            this.users.push(newUser);
            this.renderUsersTable();
            alert('User added successfully! (Demo mode)');
            this.closeModal('addUserModal');
        }
        
        event.target.reset();
    }
    
    async handleAddModerator(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Validate password
        if (window.PasswordValidator) {
            const validator = new PasswordValidator();
            const password = formData.get('password');
            const result = validator.validate(password);
            
            if (!result.valid) {
                alert('Password requirements not met:\n' + result.errors.join('\n'));
                return;
            }
        }
        
        const permissions = Array.from(formData.getAll('permissions'));
        
        const modData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: 'moderator',
            permissions
        };
        
        try {
            const response = await fetch('/api/admin/moderators', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(modData)
            });
            
            if (response.ok) {
                alert('Moderator added successfully!');
                this.closeModal('addModeratorModal');
                await this.loadUsers();
            }
        } catch (error) {
            // Demo mode
            const newMod = {
                id: Date.now().toString(),
                name: modData.name,
                email: modData.email,
                role: 'moderator',
                status: 'active',
                joined: new Date().toISOString().split('T')[0],
                permissions
            };
            
            this.users.push(newMod);
            this.renderUsersTable();
            alert('Moderator added successfully! (Demo mode)\nPermissions: ' + permissions.join(', '));
            this.closeModal('addModeratorModal');
        }
        
        event.target.reset();
    }
    
    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            alert(`Edit user: ${user.name}\n(Feature coming soon)`);
        }
    }
    
    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                alert('User deleted successfully!');
                await this.loadUsers();
            }
        } catch (error) {
            // Demo mode
            this.users = this.users.filter(u => u.id !== userId);
            this.renderUsersTable();
            alert('User deleted successfully! (Demo mode)');
        }
    }
    
    filterUsers(searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = this.users.filter(user => 
            user.name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term)
        );
        this.renderFilteredUsers(filtered);
    }
    
    filterByRole(role) {
        let filtered = this.users;
        if (role !== 'All Roles') {
            const roleValue = role.toLowerCase().replace('s', '');
            filtered = this.users.filter(user => user.role === roleValue);
        }
        this.renderFilteredUsers(filtered);
    }
    
    renderFilteredUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge role-${user.role}">${user.role}</span>
                </td>
                <td>
                    <span class="status-badge status-${user.status}">${user.status}</span>
                </td>
                <td>${user.joined}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-edit" onclick="adminDashboard.editUser('${user.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn btn-delete" onclick="adminDashboard.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Global functions for HTML onclick
function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function showAddModeratorModal() {
    const modal = document.getElementById('addModeratorModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Initialize dashboard
const adminDashboard = new AdminDashboard();