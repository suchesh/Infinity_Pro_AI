// ==============================
// DOM ELEMENTS
// ==============================
const backButton = document.getElementById('backButton');
const getCodeBtn = document.getElementById('getCodeBtn');
const logoutBtn = document.getElementById('logoutBtn');
const codeModal = document.getElementById('codeModal');
const closeCodeModal = document.getElementById('closeCodeModal');
const copyCodeBtn = document.getElementById('copyCodeBtn');

const profileUsername = document.getElementById('profileUsername');
const profileEmail = document.getElementById('profileEmail');
const profileAvatar = document.getElementById('profileAvatar');
const avatarInitials = document.getElementById('avatarInitials');

const toolsGrid = document.getElementById('toolsGrid');
const toastBox = document.querySelector('.toastalert');

const API_BASE_URL = window.location.origin;

// Store user tools globally
let userTools = [];


// ==============================
// TOAST NOTIFICATIONS
// ==============================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastBox.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}


// ==============================
// HELPERS
// ==============================
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

// Get icon emoji based on tool type
function getToolIcon(selectedOption) {
    const iconMap = {
        'Text-to-Text': '📝',
        'Image Agents': '🖼️',
        'RAG Applications': '📚',
        'Excel Sheet Analyzer': '📊',
        'Multi Purpose Agent': '🤖'
    };
    return iconMap[selectedOption] || '⚙️';
}


// ==============================
// LOAD PROFILE (FROM API)
// ==============================
async function loadProfileData() {
    try {
        console.log('Loading profile data from API...');
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            credentials: 'include'  // Include cookies for authentication
        });

        console.log('Profile API Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status}`);
        }

        const userData = await response.json();
        console.log('User Data Received:', userData);
        
        const userName = userData.name || userData.email.split('@')[0];

        console.log('Setting profile - Name:', userName, 'Email:', userData.email);
        profileUsername.textContent = userName;
        profileEmail.textContent = userData.email;
        avatarInitials.textContent = getInitials(userName);

        profileAvatar.style.background =
            'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)';

    } catch (error) {
        console.error('Profile load error:', error);
        showToast('Failed to load profile data', 'error');
    }
}


// ==============================
// LOAD USER TOOLS FROM DATABASE
// ==============================
async function loadUserTools() {
    try {
        console.log('📥 [loadUserTools] Fetching user tools from database...');
        const response = await fetch(`${API_BASE_URL}/user_tools`, {
            method: 'GET',
            credentials: 'include'
        });

        console.log('📥 [loadUserTools] Response status:', response.status);

        if (!response.ok) {
            console.error('❌ [loadUserTools] Failed to fetch tools, status:', response.status);
            const errorText = await response.text();
            console.error('❌ [loadUserTools] Error response:', errorText);
            userTools = [];
            return;
        }

        const data = await response.json();
        console.log('📥 [loadUserTools] Response data:', data);
        
        userTools = data.tools || [];
        console.log('✅ [loadUserTools] User Tools Loaded:', userTools);
        console.log('✅ [loadUserTools] Total tools:', userTools.length);
        
    } catch (error) {
        console.error('❌ [loadUserTools] Error loading user tools:', error);
        userTools = [];
    }
}


// ==============================
// RENDER TOOLS (DYNAMIC)
// ==============================
function renderTools() {
    console.log('🎨 renderTools() called');
    console.log('userTools:', userTools);
    console.log('userTools length:', userTools ? userTools.length : 'undefined');
    console.log('toolsGrid element:', toolsGrid);
    
    if (!userTools || userTools.length === 0) {
        console.log('❌ No tools found, showing empty message');
        toolsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">No custom tools yet. Create one in Parameters page!</p>';
        return;
    }

    console.log('✅ Rendering', userTools.length, 'tools');
    
    toolsGrid.innerHTML = userTools.map(tool => {
        console.log('Rendering tool:', tool);
        return `
        <div class="tool-card" data-tool-id="${tool.id}">
            <div class="tool-img">${getToolIcon(tool.selectedOption)}</div>
            <div class="tool-info">
                <h3>${tool.modelname}</h3>
                <p>${tool.oneline}</p>
                <p style="font-size: 0.85rem; color: #888; margin-top: 5px;">Type: ${tool.selectedOption}</p>
                <button class="tool-btn" data-tool-id="${tool.id}">
                    Use Tool
                </button>
            </div>
        </div>
    `;
    }).join('');

    console.log('✅ HTML rendered to toolsGrid');

    // Add click handlers to tool buttons
    const buttons = document.querySelectorAll('.tool-btn');
    console.log('Found', buttons.length, 'tool buttons');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const toolId = btn.dataset.toolId;
            console.log('🔘 Tool button clicked, toolId:', toolId);
            await openTool(toolId);
        });
    });
    console.log('✅ Click handlers attached to', buttons.length, 'buttons');
}


// ==============================
// OPEN TOOL
// ==============================
async function openTool(toolId) {
    try {
        showToast('Loading tool...', 'info');
        
        // Call load_tool endpoint to populate session
        const response = await fetch(`${API_BASE_URL}/load_tool/${toolId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to load tool');
        }

        const data = await response.json();
        console.log('Tool loaded:', data);
        
        // Navigate to ai_tool page
        window.location.href = `${API_BASE_URL}/ai_tool`;
        
    } catch (error) {
        console.error('Error opening tool:', error);
        showToast('Failed to open tool', 'error');
    }
}


// ==============================
// MODAL CONTROLS
// ==============================
getCodeBtn?.addEventListener('click', () => {
    codeModal.classList.add('show');
});

closeCodeModal?.addEventListener('click', () => {
    codeModal.classList.remove('show');
});

codeModal?.addEventListener('click', (e) => {
    if (e.target === codeModal) {
        codeModal.classList.remove('show');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        codeModal.classList.remove('show');
    }
});

copyCodeBtn?.addEventListener('click', async () => {
    try {
        const codeText = document.getElementById('codeDisplay')?.textContent || '';
        await navigator.clipboard.writeText(codeText);
        showToast('Code copied to clipboard!', 'success');
    } catch {
        showToast('Failed to copy code', 'error');
    }
});


// ==============================
// NAVIGATION & LOGOUT
// ==============================
backButton?.addEventListener('click', () => {
    window.location.href = `${API_BASE_URL}/second_page`;
});

logoutBtn?.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            // Clear localStorage
            localStorage.removeItem('user');
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = `${API_BASE_URL}/`;
            }, 1000);
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error(error);
        showToast('Logout error', 'error');
    }
});


// ==============================
// INIT
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfileData();
    await loadUserTools();
    renderTools();
});
