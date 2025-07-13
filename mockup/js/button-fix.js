// Button Fix - Expose all button functions to global scope
console.log('Loading button fix...');

// Wait for DOM and other scripts to load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Expose search functionality
        if (!window.searchGames) {
            window.searchGames = async function() {
                console.log('Search games clicked');
                // Call the existing search functionality
                if (window.switchPage) {
                    window.switchPage('drop-in');
                }
                // Trigger search
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.value) {
                    // Filter games based on search
                    const games = document.querySelectorAll('.game-card');
                    games.forEach(game => {
                        const text = game.textContent.toLowerCase();
                        if (text.includes(searchInput.value.toLowerCase())) {
                            game.style.display = 'block';
                        } else {
                            game.style.display = 'none';
                        }
                    });
                }
            };
        }

        // Expose Play Now functionality
        if (!window.playNow) {
            window.playNow = function() {
                console.log('Play Now clicked');
                // Switch to play-now page
                if (window.switchPage) {
                    window.switchPage('play-now');
                } else {
                    // Fallback - show play now section
                    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
                    const playNowSection = document.getElementById('play-now');
                    if (playNowSection) {
                        playNowSection.style.display = 'block';
                    }
                }
            };
        }

        // Expose tab switching
        if (!window.switchTab) {
            window.switchTab = function(tab) {
                console.log('Switch tab:', tab);
                // Hide all tab contents
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => {
                    content.style.display = 'none';
                });
                
                // Show selected tab
                const selectedContent = document.getElementById(tab);
                if (selectedContent) {
                    selectedContent.style.display = 'block';
                }
                
                // Update active tab button
                document.querySelectorAll('.tab').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.textContent.toLowerCase().includes(tab)) {
                        btn.classList.add('active');
                    }
                });
            };
        }

        // Expose rules page functionality
        if (!window.showRulesPage) {
            window.showRulesPage = function() {
                console.log('Show rules page');
                // Hide all content
                document.querySelectorAll('.page-content, .hero-section, .search-filters').forEach(el => {
                    el.style.display = 'none';
                });
                
                // Show rules content
                let rulesSection = document.getElementById('sport-rules');
                if (!rulesSection) {
                    // Create rules section if it doesn't exist
                    rulesSection = document.createElement('div');
                    rulesSection.id = 'sport-rules';
                    rulesSection.className = 'page-content';
                    rulesSection.innerHTML = `
                        <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
                            <h2>Sport Rules & Guidelines</h2>
                            
                            <div class="sport-rule-card" style="margin: 1rem 0; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <h3>🏀 Basketball</h3>
                                <ul>
                                    <li>Games are typically 3v3 or 5v5</li>
                                    <li>First to 21 points wins (must win by 2)</li>
                                    <li>Call your own fouls</li>
                                    <li>Winners stay on court</li>
                                </ul>
                            </div>
                            
                            <div class="sport-rule-card" style="margin: 1rem 0; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <h3>⚽ Soccer</h3>
                                <ul>
                                    <li>Small-sided games (5v5 or 7v7)</li>
                                    <li>No slide tackles in casual games</li>
                                    <li>Rotate goalkeepers every 10 minutes</li>
                                    <li>Respect all skill levels</li>
                                </ul>
                            </div>
                            
                            <div class="sport-rule-card" style="margin: 1rem 0; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <h3>🏐 Volleyball</h3>
                                <ul>
                                    <li>Recreational rules (3 hits per side)</li>
                                    <li>Rotate positions after each point</li>
                                    <li>Net serves are allowed</li>
                                    <li>Keep it friendly and fun!</li>
                                </ul>
                            </div>
                            
                            <div class="sport-rule-card" style="margin: 1rem 0; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <h3>🏒 Hockey (Ball/Street)</h3>
                                <ul>
                                    <li>No body checking</li>
                                    <li>Slap shots only when safe</li>
                                    <li>Must wear appropriate footwear</li>
                                    <li>Goalies get extra protection</li>
                                </ul>
                            </div>
                            
                            <button onclick="window.location.reload()" style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                Back to Games
                            </button>
                        </div>
                    `;
                    document.body.appendChild(rulesSection);
                }
                rulesSection.style.display = 'block';
                
                // Update active tab
                document.querySelectorAll('.tab').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.textContent.includes('Rules')) {
                        btn.classList.add('active');
                    }
                });
            };
        }

        console.log('Button functions exposed:', {
            searchGames: !!window.searchGames,
            playNow: !!window.playNow,
            switchTab: !!window.switchTab,
            showRulesPage: !!window.showRulesPage
        });
    }, 100); // Small delay to ensure other scripts load first
});