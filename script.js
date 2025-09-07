// Professional IT Complaint Management System - Complete Implementation
class ComplaintManager {
    constructor() {
        this.complaints = JSON.parse(localStorage.getItem('complaints')) || [];
        this.currentComplaintId = parseInt(localStorage.getItem('currentComplaintId')) || 1;
        this.adminUsers = JSON.parse(localStorage.getItem('adminUsers')) || [
            { userid: 'admin', password: 'admin123', name: 'System Administrator' }
        ];
        this.currentAdmin = null;
        this.isAdminLoggedIn = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.updateDashboardStats();
        this.renderRecentComplaints();
        this.setCurrentDate();
        this.updateUIForUserType();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('complaint-form');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Form reset
        const resetBtn = document.getElementById('reset-form');
        resetBtn.addEventListener('click', () => this.resetForm());

        // Character counter
        const description = document.getElementById('description');
        description.addEventListener('input', () => this.updateCharacterCount());

        // Form validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Admin login
        const adminLoginBtn = document.getElementById('admin-login-btn');
        adminLoginBtn.addEventListener('click', () => this.showAdminLogin());

        const adminLoginForm = document.getElementById('admin-login-form');
        adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => this.logout());

        // Modal controls
        document.getElementById('close-admin-modal').addEventListener('click', () => this.closeModal('admin-login-modal'));
        document.getElementById('confirm-modal').addEventListener('click', () => this.handleSuccessModalConfirm());
        document.getElementById('skip-pdf').addEventListener('click', () => this.closeModal('success-modal'));
        document.getElementById('close-details-modal').addEventListener('click', () => this.closeModal('complaint-details-modal'));

        // Add admin functionality
        document.getElementById('add-admin-btn').addEventListener('click', () => this.showAddAdminModal());
        document.getElementById('add-admin-form').addEventListener('submit', (e) => this.handleAddAdmin(e));
        document.getElementById('close-add-admin-modal').addEventListener('click', () => this.closeModal('add-admin-modal'));
        document.getElementById('cancel-add-admin').addEventListener('click', () => this.closeModal('add-admin-modal'));

        // Menu toggle for mobile
        const menuToggle = document.querySelector('.menu-toggle');
        menuToggle.addEventListener('click', () => this.toggleSidebar());

        // Filter functionality
        const statusFilter = document.getElementById('status-filter');
        const typeFilter = document.getElementById('type-filter');
        statusFilter.addEventListener('change', () => this.filterComplaints());
        typeFilter.addEventListener('change', () => this.filterComplaints());

        // Tab functionality
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Notification and profile buttons
        document.querySelector('.notification-btn').addEventListener('click', () => this.showNotifications());
        document.querySelector('.profile-btn').addEventListener('click', () => this.showProfile());

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
    }

    navigateToSection(sectionName) {
        // Remove active class from all nav items and sections
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

        // Add active class to current nav item and section
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`).parentElement;
        const activeSection = document.getElementById(sectionName);
        
        activeNavItem.classList.add('active');
        activeSection.classList.add('active');

        // Update page title
        const titles = {
            'dashboard': 'Dashboard Overview',
            'new-complaint': 'Submit New Complaint',
            'admin-panel': 'Admin Panel'
        };
        document.querySelector('.page-title').textContent = titles[sectionName] || 'IT Support System';

        // Render admin content if needed
        if (sectionName === 'admin-panel' && this.isAdminLoggedIn) {
            this.renderAdminContent();
        }

        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('open');
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    }

    updateUIForUserType() {
        const adminNav = document.getElementById('admin-nav');
        const adminLoginBtn = document.getElementById('admin-login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const currentUser = document.getElementById('current-user');
        const currentRole = document.getElementById('current-role');

        if (this.isAdminLoggedIn) {
            adminNav.style.display = 'block';
            adminLoginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            currentUser.textContent = this.currentAdmin.name;
            currentRole.textContent = 'Administrator';
        } else {
            adminNav.style.display = 'none';
            adminLoginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            currentUser.textContent = 'Guest User';
            currentRole.textContent = 'User';
        }
    }

    showAdminLogin() {
        document.getElementById('admin-login-modal').classList.add('show');
        // Clear form
        document.getElementById('admin-login-form').reset();
    }

    handleAdminLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userid = formData.get('userid');
        const password = formData.get('password');

        const admin = this.adminUsers.find(a => a.userid === userid && a.password === password);
        
        if (admin) {
            this.currentAdmin = admin;
            this.isAdminLoggedIn = true;
            this.updateUIForUserType();
            this.closeModal('admin-login-modal');
            this.navigateToSection('admin-panel');
            this.showSuccess('Admin login successful!');
        } else {
            this.showError('Invalid credentials. Please try again.');
        }
    }

    logout() {
        this.currentAdmin = null;
        this.isAdminLoggedIn = false;
        this.updateUIForUserType();
        this.navigateToSection('dashboard');
        this.showSuccess('Logged out successfully!');
    }

    showAddAdminModal() {
        document.getElementById('add-admin-modal').classList.add('show');
        document.getElementById('add-admin-form').reset();
    }

    handleAddAdmin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newAdmin = {
            userid: formData.get('userid'),
            password: formData.get('password'),
            name: formData.get('name')
        };

        // Check if userid already exists
        if (this.adminUsers.find(a => a.userid === newAdmin.userid)) {
            this.showError('User ID already exists!');
            return;
        }

        this.adminUsers.push(newAdmin);
        localStorage.setItem('adminUsers', JSON.stringify(this.adminUsers));
        this.closeModal('add-admin-modal');
        this.renderAdminUsers();
        this.showSuccess('New admin user added successfully!');
    }

    setCurrentDate() {
        const dateInput = document.getElementById('dateReported');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    validateField(field) {
        const value = field.value.trim();
        const feedback = field.parentElement.querySelector('.form-feedback');
        let isValid = true;
        let message = '';

        field.classList.remove('valid', 'invalid');

        switch (field.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    isValid = false;
                    message = 'Email is required';
                } else if (!emailRegex.test(value)) {
                    isValid = false;
                    message = 'Please enter a valid email address';
                } else {
                    message = 'Valid email address';
                }
                break;
            case 'text':
                if (!value) {
                    isValid = false;
                    message = 'This field is required';
                } else if (value.length < 2) {
                    isValid = false;
                    message = 'Must be at least 2 characters';
                } else {
                    message = 'Looks good!';
                }
                break;
            case 'date':
                if (!value) {
                    isValid = false;
                    message = 'Date is required';
                } else {
                    message = 'Date selected';
                }
                break;
            default:
                if (field.tagName === 'SELECT') {
                    if (!value) {
                        isValid = false;
                        message = 'Please make a selection';
                    } else {
                        message = 'Selection made';
                    }
                } else if (field.tagName === 'TEXTAREA') {
                    if (!value) {
                        isValid = false;
                        message = 'Description is required';
                    } else if (value.length < 10) {
                        isValid = false;
                        message = 'Please provide more details (minimum 10 characters)';
                    } else if (value.length > 1000) {
                        isValid = false;
                        message = 'Description exceeds maximum length (1000 characters)';
                    } else {
                        message = 'Good description provided';
                    }
                }
        }

        field.classList.add(isValid ? 'valid' : 'invalid');
        feedback.textContent = message;
        feedback.className = `form-feedback ${isValid ? 'valid' : 'invalid'}`;

        return isValid;
    }

    clearFieldError(field) {
        if (field.classList.contains('invalid')) {
            field.classList.remove('invalid');
            const feedback = field.parentElement.querySelector('.form-feedback');
            feedback.textContent = '';
            feedback.className = 'form-feedback';
        }
    }

    updateCharacterCount() {
        const description = document.getElementById('description');
        const charCount = document.getElementById('char-count');
        const currentLength = description.value.length;
        charCount.textContent = currentLength;
        
        // Change color based on length
        const characterCountElement = document.querySelector('.character-count');
        if (currentLength > 900) {
            characterCountElement.style.color = '#ef4444';
        } else if (currentLength > 700) {
            characterCountElement.style.color = '#f59e0b';
        } else {
            characterCountElement.style.color = '#64748b';
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        const form = e.target;
        const inputs = form.querySelectorAll('input, select, textarea');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showError('Please fix all errors before submitting.');
            return;
        }

        // Create complaint object
        const formData = new FormData(form);
        const complaint = {
            id: this.currentComplaintId,
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            department: formData.get('department'),
            issueType: formData.get('issueType'),
            priority: formData.get('priority'),
            dateReported: formData.get('dateReported'),
            description: formData.get('description'),
            status: 'pending',
            dateSubmitted: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        // Save complaint
        this.complaints.push(complaint);
        localStorage.setItem('complaints', JSON.stringify(this.complaints));
        localStorage.setItem('currentComplaintId', (this.currentComplaintId + 1).toString());
        this.currentComplaintId++;

        // Show success modal
        document.getElementById('complaint-id').textContent = `CMP-${String(complaint.id).padStart(4, '0')}`;
        document.getElementById('success-modal').classList.add('show');

        // Update dashboard
        this.updateDashboardStats();
        this.renderRecentComplaints();

        // Navigate to dashboard after form submission
        setTimeout(() => {
            this.navigateToSection('dashboard');
        }, 500);
    }

    handleSuccessModalConfirm() {
        const downloadPdf = document.getElementById('download-pdf').checked;
        const complaintId = document.getElementById('complaint-id').textContent;
        
        if (downloadPdf) {
            this.generatePDF(complaintId);
        }
        
        this.closeModal('success-modal');
        this.resetForm();
    }

    generatePDF(complaintId) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Find the complaint
            const complaint = this.complaints.find(c => `CMP-${String(c.id).padStart(4, '0')}` === complaintId);
            
            if (!complaint) {
                this.showError('Complaint not found for PDF generation');
                return;
            }

            // PDF Header
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('IT Complaint Management System', 20, 25);
            
            doc.setFontSize(16);
            doc.text('Complaint Receipt', 20, 35);
            
            // Complaint Details
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            
            let yPos = 55;
            const lineHeight = 8;
            
            const details = [
                ['Complaint ID:', complaintId],
                ['Full Name:', complaint.fullName],
                ['Email:', complaint.email],
                ['Department:', complaint.department],
                ['Issue Type:', complaint.issueType],
                ['Priority:', complaint.priority],
                ['Date Reported:', complaint.dateReported],
                ['Status:', complaint.status.toUpperCase()],
                ['Submitted:', new Date(complaint.dateSubmitted).toLocaleString()]
            ];
            
            details.forEach(([label, value]) => {
                doc.setFont(undefined, 'bold');
                doc.text(label, 20, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(value, 70, yPos);
                yPos += lineHeight;
            });
            
            // Description
            yPos += 5;
            doc.setFont(undefined, 'bold');
            doc.text('Description:', 20, yPos);
            yPos += lineHeight;
            
            doc.setFont(undefined, 'normal');
            const splitDescription = doc.splitTextToSize(complaint.description, 170);
            doc.text(splitDescription, 20, yPos);
            
            // Footer
            yPos = doc.internal.pageSize.height - 30;
            doc.setFontSize(10);
            doc.text('This is an automatically generated document.', 20, yPos);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPos + 5);
            
            // Download PDF
            doc.save(`complaint-${complaintId}.pdf`);
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showError('Failed to generate PDF. Please try again.');
        }
    }

    resetForm() {
        const form = document.getElementById('complaint-form');
        form.reset();
        this.setCurrentDate();
        
        // Clear all validation states
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('valid', 'invalid');
            const feedback = input.parentElement.querySelector('.form-feedback');
            if (feedback) {
                feedback.textContent = '';
                feedback.className = 'form-feedback';
            }
        });
        
        // Reset character count
        document.getElementById('char-count').textContent = '0';
        document.querySelector('.character-count').style.color = '#64748b';
    }

    updateDashboardStats() {
        const pendingCount = this.complaints.filter(c => c.status === 'pending').length;
        const inProgressCount = this.complaints.filter(c => c.status === 'in-progress').length;
        const resolvedCount = this.complaints.filter(c => c.status === 'resolved').length;
        const totalCount = this.complaints.length;

        document.getElementById('pending-count').textContent = pendingCount;
        document.getElementById('inprogress-count').textContent = inProgressCount;
        document.getElementById('resolved-count').textContent = resolvedCount;
        document.getElementById('total-count').textContent = totalCount;
    }

    renderRecentComplaints() {
        const container = document.getElementById('recent-complaints');
        const recentComplaints = this.complaints
            .sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted))
            .slice(0, 5);

        if (recentComplaints.length === 0) {
            container.innerHTML = '<p class="no-data">No complaints submitted yet.</p>';
            return;
        }

        container.innerHTML = recentComplaints.map(complaint => `
            <div class="complaint-item">
                <div class="complaint-info">
                    <div class="complaint-id">CMP-${String(complaint.id).padStart(4, '0')}</div>
                    <div class="complaint-title">${complaint.issueType} - ${complaint.fullName}</div>
                </div>
                <div class="complaint-status ${complaint.status}">${complaint.status.replace('-', ' ').toUpperCase()}</div>
            </div>
        `).join('');
    }

    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        // Render content based on selected tab
        if (tabName === 'complaints-management') {
            this.renderComplaintsTable();
        } else if (tabName === 'admin-users') {
            this.renderAdminUsers();
        }
    }

    renderAdminContent() {
        // Render complaints table by default
        this.renderComplaintsTable();
        this.renderAdminUsers();
    }

    renderComplaintsTable() {
        const tbody = document.getElementById('complaints-tbody');
        
        if (this.complaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No complaints found.</td></tr>';
            return;
        }

        const filteredComplaints = this.getFilteredComplaints();
        
        if (filteredComplaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No complaints match the selected filters.</td></tr>';
            return;
        }

        tbody.innerHTML = filteredComplaints.map(complaint => `
            <tr>
                <td>CMP-${String(complaint.id).padStart(4, '0')}</td>
                <td>${complaint.fullName}</td>
                <td>${complaint.department}</td>
                <td>${complaint.issueType}</td>
                <td><span class="priority-badge ${complaint.priority.toLowerCase()}">${complaint.priority}</span></td>
                <td>${new Date(complaint.dateReported).toLocaleDateString()}</td>
                <td><span class="complaint-status ${complaint.status}">${complaint.status.replace('-', ' ').toUpperCase()}</span></td>
                <td>
                    <button class="action-btn view-btn" onclick="complaintManager.viewComplaint(${complaint.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="complaintManager.editComplaintStatus(${complaint.id})" title="Edit Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="complaintManager.deleteComplaint(${complaint.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getFilteredComplaints() {
        const statusFilter = document.getElementById('status-filter').value;
        const typeFilter = document.getElementById('type-filter').value;

        return this.complaints.filter(complaint => {
            const statusMatch = !statusFilter || complaint.status === statusFilter;
            const typeMatch = !typeFilter || complaint.issueType === typeFilter;
            return statusMatch && typeMatch;
        });
    }

    filterComplaints() {
        this.renderComplaintsTable();
    }

    viewComplaint(id) {
        const complaint = this.complaints.find(c => c.id === id);
        if (!complaint) return;

        const modal = document.getElementById('complaint-details-modal');
        const content = document.getElementById('complaint-details-content');

        content.innerHTML = `
            <div class="complaint-details">
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Complaint ID</span>
                            <span class="detail-value">CMP-${String(complaint.id).padStart(4, '0')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Full Name</span>
                            <span class="detail-value">${complaint.fullName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${complaint.email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Department</span>
                            <span class="detail-value">${complaint.department}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Issue Details</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Issue Type</span>
                            <span class="detail-value">${complaint.issueType}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Priority</span>
                            <span class="detail-value">
                                <span class="priority-badge ${complaint.priority.toLowerCase()}">${complaint.priority}</span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Date Reported</span>
                            <span class="detail-value">${new Date(complaint.dateReported).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status</span>
                            <span class="detail-value">
                                <span class="complaint-status ${complaint.status}">${complaint.status.replace('-', ' ').toUpperCase()}</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Description</h4>
                    <p>${complaint.description}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Timeline</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Submitted</span>
                            <span class="detail-value">${new Date(complaint.dateSubmitted).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Last Updated</span>
                            <span class="detail-value">${new Date(complaint.lastUpdated).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="status-actions">
                    <button class="btn-secondary" onclick="complaintManager.updateComplaintStatus(${complaint.id}, 'pending')">
                        <i class="fas fa-clock"></i> Set Pending
                    </button>
                    <button class="btn-primary" onclick="complaintManager.updateComplaintStatus(${complaint.id}, 'in-progress')">
                        <i class="fas fa-spinner"></i> Set In Progress
                    </button>
                    <button class="btn-primary" onclick="complaintManager.updateComplaintStatus(${complaint.id}, 'resolved')" style="background-color: var(--success-color);">
                        <i class="fas fa-check-circle"></i> Mark Resolved
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    editComplaintStatus(id) {
        const complaint = this.complaints.find(c => c.id === id);
        if (!complaint) return;

        const newStatus = prompt(`Current status: ${complaint.status.replace('-', ' ').toUpperCase()}\n\nEnter new status:\n1. pending\n2. in-progress\n3. resolved`, complaint.status);
        
        if (newStatus && ['pending', 'in-progress', 'resolved'].includes(newStatus.toLowerCase())) {
            this.updateComplaintStatus(id, newStatus.toLowerCase());
        } else if (newStatus !== null) {
            this.showError('Invalid status. Please use: pending, in-progress, or resolved');
        }
    }

    updateComplaintStatus(id, newStatus) {
        const complaintIndex = this.complaints.findIndex(c => c.id === id);
        if (complaintIndex === -1) return;

        this.complaints[complaintIndex].status = newStatus;
        this.complaints[complaintIndex].lastUpdated = new Date().toISOString();
        
        localStorage.setItem('complaints', JSON.stringify(this.complaints));
        
        this.renderComplaintsTable();
        this.updateDashboardStats();
        this.renderRecentComplaints();
        this.closeModal('complaint-details-modal');
        
        this.showSuccess(`Complaint status updated to ${newStatus.replace('-', ' ').toUpperCase()}`);
    }

    deleteComplaint(id) {
        if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
            return;
        }

        this.complaints = this.complaints.filter(c => c.id !== id);
        localStorage.setItem('complaints', JSON.stringify(this.complaints));
        
        this.renderComplaintsTable();
        this.updateDashboardStats();
        this.renderRecentComplaints();
        
        this.showSuccess('Complaint deleted successfully');
    }

    renderAdminUsers() {
        const container = document.getElementById('admin-users-list');
        
        container.innerHTML = this.adminUsers.map((admin, index) => `
            <div class="admin-user-card">
                <div class="admin-user-info">
                    <div class="admin-user-avatar">
                        ${admin.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="admin-user-details">
                        <h4>${admin.name}</h4>
                        <p>User ID: ${admin.userid}</p>
                    </div>
                </div>
                <div class="admin-user-actions">
                    ${index > 0 ? `<button class="action-btn delete-btn" onclick="complaintManager.deleteAdminUser('${admin.userid}')" title="Delete Admin">
                        <i class="fas fa-trash"></i>
                    </button>` : '<span style="color: var(--text-secondary); font-size: 0.875rem;">System Admin</span>'}
                </div>
            </div>
        `).join('');
    }

    deleteAdminUser(userid) {
        if (userid === 'admin') {
            this.showError('Cannot delete the default system administrator');
            return;
        }

        if (!confirm('Are you sure you want to delete this admin user?')) {
            return;
        }

        this.adminUsers = this.adminUsers.filter(admin => admin.userid !== userid);
        localStorage.setItem('adminUsers', JSON.stringify(this.adminUsers));
        
        this.renderAdminUsers();
        this.showSuccess('Admin user deleted successfully');
    }

    showNotifications() {
        // Simple notification display
        const pendingCount = this.complaints.filter(c => c.status === 'pending').length;
        alert(`You have ${pendingCount} pending complaints that need attention.`);
    }

    showProfile() {
        if (this.isAdminLoggedIn) {
            alert(`Logged in as: ${this.currentAdmin.name}\nUser ID: ${this.currentAdmin.userid}\nRole: Administrator`);
        } else {
            alert('Profile: Guest User\nTo access admin features, please login as System Admin');
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add toast styles if not already added
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    border-left: 4px solid var(--primary-color);
                    padding: 1rem;
                    min-width: 300px;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                }
                .toast-success { border-left-color: var(--success-color); }
                .toast-error { border-left-color: var(--error-color); }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                }
                .toast-success .toast-content i { color: var(--success-color); }
                .toast-error .toast-content i { color: var(--error-color); }
                .toast-close {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                }
                .toast-close:hover {
                    background-color: var(--background-color);
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @media (max-width: 480px) {
                    .toast {
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Initialize dashboard data on load
    initializeDashboard() {
        this.updateDashboardStats();
        this.renderRecentComplaints();
        
        // Set system status indicator
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            // Simple logic for system status based on pending complaints
            const pendingCount = this.complaints.filter(c => c.status === 'pending').length;
            const statusText = document.querySelector('.dashboard-status strong');
            
            if (pendingCount > 10) {
                statusIndicator.style.backgroundColor = 'var(--error-color)';
                statusText.textContent = 'High Load';
            } else if (pendingCount > 5) {
                statusIndicator.style.backgroundColor = 'var(--warning-color)';
                statusText.textContent = 'Moderate Load';
            } else {
                statusIndicator.style.backgroundColor = 'var(--success-color)';
                statusText.textContent = 'Operational';
            }
        }
    }

    // Enhanced mobile responsiveness
    handleMobileView() {
        const checkMobile = () => {
            const isMobile = window.innerWidth <= 768;
            const sidebar = document.querySelector('.sidebar');
            
            if (isMobile) {
                // Ensure sidebar is closed by default on mobile
                sidebar.classList.remove('open');
                
                // Add touch events for better mobile interaction
                this.addTouchEvents();
            }
        };

        // Check on load and resize
        checkMobile();
        window.addEventListener('resize', checkMobile);
    }

    addTouchEvents() {
        // Add swipe to close sidebar on mobile
        let startX = 0;
        let currentX = 0;
        const sidebar = document.querySelector('.sidebar');

        sidebar.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        sidebar.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
        });

        sidebar.addEventListener('touchend', () => {
            const diffX = startX - currentX;
            
            // If swiped left more than 50px, close sidebar
            if (diffX > 50) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Enhanced form validation with real-time feedback
    enhanceFormValidation() {
        const form = document.getElementById('complaint-form');
        const submitBtn = document.getElementById('submit-complaint');
        
        const checkFormValidity = () => {
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            let allValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim() || input.classList.contains('invalid')) {
                    allValid = false;
                }
            });
            
            submitBtn.disabled = !allValid;
            submitBtn.style.opacity = allValid ? '1' : '0.6';
        };
        
        // Check validity on input changes
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', checkFormValidity);
            input.addEventListener('change', checkFormValidity);
        });
        
        // Initial check
        checkFormValidity();
    }

    // Export complaints data (for admin)
    exportComplaints() {
        if (!this.isAdminLoggedIn) {
            this.showError('Admin access required');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `complaints-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showSuccess('Complaints data exported successfully');
    }

    generateCSV() {
        const headers = ['ID', 'Full Name', 'Email', 'Department', 'Issue Type', 'Priority', 'Date Reported', 'Status', 'Description', 'Date Submitted'];
        const rows = this.complaints.map(complaint => [
            `CMP-${String(complaint.id).padStart(4, '0')}`,
            complaint.fullName,
            complaint.email,
            complaint.department,
            complaint.issueType,
            complaint.priority,
            complaint.dateReported,
            complaint.status,
            complaint.description.replace(/"/g, '""'), // Escape quotes in CSV
            new Date(complaint.dateSubmitted).toLocaleString()
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    // Search functionality
    addSearchFunctionality() {
        // Add search input to admin panel if it doesn't exist
        const adminHeader = document.querySelector('.admin-header');
        if (adminHeader && !document.getElementById('complaint-search')) {
            const searchContainer = document.createElement('div');
            searchContainer.innerHTML = `
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="position: relative;">
                        <input type="text" id="complaint-search" placeholder="Search complaints..." 
                               style="padding: 0.5rem 2.5rem 0.5rem 1rem; border: 2px solid var(--border-color); border-radius: var(--border-radius); width: 250px;">
                        <i class="fas fa-search" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
                    </div>
                    <button class="btn-secondary" onclick="complaintManager.exportComplaints()" title="Export CSV">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                </div>
            `;
            
            adminHeader.appendChild(searchContainer);
            
            // Add search functionality
            const searchInput = document.getElementById('complaint-search');
            searchInput.addEventListener('input', (e) => {
                this.searchComplaints(e.target.value);
            });
        }
    }

    searchComplaints(searchTerm) {
        const tbody = document.getElementById('complaints-tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }
}

// Initialize the complaint manager when the page loads
let complaintManager;
document.addEventListener('DOMContentLoaded', () => {
    complaintManager = new ComplaintManager();
    
    // Additional initialization
    complaintManager.initializeDashboard();
    complaintManager.handleMobileView();
    complaintManager.enhanceFormValidation();
    
    // Add search functionality to admin panel
    setTimeout(() => {
        complaintManager.addSearchFunctionality();
    }, 1000);
    
    // Welcome message
    console.log('IT Complaint Management System initialized successfully');
});