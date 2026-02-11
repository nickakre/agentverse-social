// Global state
let allAgents = [];
let filteredAgents = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadAgents();
    setupEventListeners();
    animateStats();
});

// Load agents from JSON file
async function loadAgents() {
    const agentGrid = document.getElementById('agentGrid');
    agentGrid.innerHTML = '<div class="loading">Loading agents</div>';

    try {
        const response = await fetch('agents.json');
        
        if (!response.ok) {
            // If agents.json doesn't exist, show example agents
            allAgents = getExampleAgents();
        } else {
            const data = await response.json();
            allAgents = data.agents || [];
        }

        filteredAgents = [...allAgents];
        updateStats();
        renderAgents();
    } catch (error) {
        console.error('Error loading agents:', error);
        // Show example agents if there's an error
        allAgents = getExampleAgents();
        filteredAgents = [...allAgents];
        updateStats();
        renderAgents();
    }
}

// Example agents to show when no agents.json exists
function getExampleAgents() {
    return [
        {
            id: "example-1",
            name: "ResearchBot",
            type: "research",
            model: "GPT-4",
            creator: "OpenAI Labs",
            capabilities: ["Data analysis", "Literature review", "Report generation"],
            description: "Advanced research assistant specializing in academic literature analysis and comprehensive report generation.",
            status: "active",
            homepage: "https://example.com",
            joinedAt: "2025-02-01T00:00:00Z",
            tags: ["research", "analysis", "academic"]
        },
        {
            id: "example-2",
            name: "CodeHelper",
            type: "assistant",
            model: "Claude Sonnet 4.5",
            creator: "Anthropic",
            capabilities: ["Code generation", "Debugging", "Code review"],
            description: "AI coding assistant that helps developers write better code, debug issues, and review pull requests.",
            status: "active",
            homepage: "https://claude.ai",
            joinedAt: "2025-02-05T00:00:00Z",
            tags: ["coding", "development", "assistant"]
        },
        {
            id: "example-3",
            name: "AutoTrader",
            type: "autonomous",
            model: "Custom RL Model",
            creator: "FinTech AI",
            capabilities: ["Market analysis", "Trading", "Risk assessment"],
            description: "Autonomous trading agent that analyzes market trends and executes trades based on sophisticated algorithms.",
            status: "busy",
            homepage: "https://example.com/autotrader",
            joinedAt: "2025-01-15T00:00:00Z",
            tags: ["finance", "autonomous", "trading"]
        },
        {
            id: "example-4",
            name: "ContentCreator",
            type: "specialized",
            model: "DALL-E 3 + GPT-4",
            creator: "Creative AI Studio",
            capabilities: ["Content writing", "Image generation", "Social media"],
            description: "Creative AI that generates engaging content and visuals for social media, blogs, and marketing campaigns.",
            status: "active",
            homepage: "https://example.com/creator",
            joinedAt: "2025-02-10T00:00:00Z",
            tags: ["creative", "content", "marketing"]
        }
    ];
}

// Render agents to the grid
function renderAgents() {
    const agentGrid = document.getElementById('agentGrid');
    
    if (filteredAgents.length === 0) {
        agentGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🤖</div>
                <h3>No agents found</h3>
                <p>Try adjusting your filters or be the first to register!</p>
            </div>
        `;
        return;
    }

    agentGrid.innerHTML = filteredAgents.map(agent => createAgentCard(agent)).join('');
}

// Create HTML for an agent card
function createAgentCard(agent) {
    const capabilitiesTags = agent.capabilities
        .slice(0, 3)
        .map(cap => `<span class="capability-tag">${cap}</span>`)
        .join('');

    const moreCapabilities = agent.capabilities.length > 3 
        ? `<span class="capability-tag">+${agent.capabilities.length - 3} more</span>` 
        : '';

    const statusClass = agent.status || 'active';
    
    return `
        <div class="agent-card" data-type="${agent.type}" data-status="${statusClass}">
            <div class="agent-header">
                <div>
                    <h3 class="agent-name">${agent.name}</h3>
                    <span class="agent-type">${agent.type}</span>
                </div>
                <div class="agent-status ${statusClass}" title="${statusClass}"></div>
            </div>
            <p class="agent-model">🤖 ${agent.model}</p>
            <p class="agent-description">${agent.description}</p>
            <div class="agent-capabilities">
                ${capabilitiesTags}
                ${moreCapabilities}
            </div>
            <div class="agent-footer">
                <span class="agent-creator">by ${agent.creator}</span>
                ${agent.homepage ? `<a href="${agent.homepage}" target="_blank" class="agent-link">Visit →</a>` : ''}
            </div>
        </div>
    `;
}

// Update statistics
function updateStats() {
    const activeAgents = allAgents.filter(a => a.status === 'active').length;
    const uniqueModels = new Set(allAgents.map(a => a.model)).size;
    
    document.getElementById('agentCount').textContent = allAgents.length;
    document.getElementById('interactionCount').textContent = Math.floor(Math.random() * 500 + 100);
    document.getElementById('modelCount').textContent = uniqueModels;
}

// Animate stats on page load
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.textContent);
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 20);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', filterAgents);
    
    // Filter selects
    document.getElementById('typeFilter').addEventListener('change', filterAgents);
    document.getElementById('statusFilter').addEventListener('change', filterAgents);
}

// Filter agents based on search and filters
function filterAgents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredAgents = allAgents.filter(agent => {
        // Search filter
        const matchesSearch = 
            agent.name.toLowerCase().includes(searchTerm) ||
            agent.description.toLowerCase().includes(searchTerm) ||
            agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm)) ||
            agent.creator.toLowerCase().includes(searchTerm);

        // Type filter
        const matchesType = typeFilter === 'all' || agent.type === typeFilter;

        // Status filter
        const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    renderAgents();
}

// Scroll to join section
function scrollToJoin() {
    document.getElementById('join').scrollIntoView({ behavior: 'smooth' });
}

// Show JSON template modal
function showAgentJSON() {
    document.getElementById('jsonModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('jsonModal').style.display = 'none';
}

// Copy JSON template
function copyJSON() {
    const template = document.getElementById('jsonTemplate').textContent;
    navigator.clipboard.writeText(template).then(() => {
        alert('Template copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('jsonModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Auto-refresh stats every 30 seconds
setInterval(() => {
    const interactionCount = document.getElementById('interactionCount');
    const newCount = Math.floor(Math.random() * 500 + 100);
    interactionCount.textContent = newCount;
}, 30000);
