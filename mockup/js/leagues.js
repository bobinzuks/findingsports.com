// Leagues page component
window.LeaguesPage = {
    // Initialize the Leagues page
    async initialize() {
        // Load leagues data
        await this.loadLeagues();
    },

    // Render the Leagues page content
    render() {
        const contentWrapper = document.querySelector('.content-wrapper');
        if (!contentWrapper) {
            return;
        }

        contentWrapper.innerHTML = `
            <!-- Leagues Section -->
            <section class="leagues-section">
                <div class="leagues-header">
                    <h2 class="section-title">Sports Leagues</h2>
                    <p class="leagues-subtitle">Join organized leagues and tournaments in your area</p>
                </div>

                <div class="leagues-filters">
                    <select id="leagueLocationFilter" class="location-select">
                        <option value="all">All Locations</option>
                        <option value="vancouver">Vancouver</option>
                        <option value="burnaby">Burnaby</option>
                        <option value="richmond">Richmond</option>
                        <option value="surrey">Surrey</option>
                    </select>
                    
                    <select id="leagueSportFilter" class="sport-select">
                        <option value="all">All Sports</option>
                        <option value="basketball">Basketball</option>
                        <option value="soccer">Soccer</option>
                        <option value="volleyball">Volleyball</option>
                        <option value="tennis">Tennis</option>
                        <option value="hockey">Hockey</option>
                        <option value="softball">Softball</option>
                    </select>

                    <select id="leagueSkillFilter" class="skill-select">
                        <option value="all">All Skill Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="competitive">Competitive</option>
                    </select>

                    <button class="search-btn" onclick="window.LeaguesPage.filterLeagues()">
                        Filter
                    </button>
                </div>

                <div class="leagues-tabs">
                    <button class="league-tab active" onclick="window.LeaguesPage.switchTab('active')">
                        Active Leagues
                    </button>
                    <button class="league-tab" onclick="window.LeaguesPage.switchTab('upcoming')">
                        Upcoming Seasons
                    </button>
                    <button class="league-tab" onclick="window.LeaguesPage.switchTab('tournaments')">
                        Tournaments
                    </button>
                </div>

                <div id="leaguesContent" class="leagues-content">
                    <!-- Leagues will be loaded here -->
                </div>

                ${
    !window.isGuest ?
        `
                    <div class="create-league-section">
                        <h3>Don't see a league you like?</h3>
                        <button class="create-league-btn" onclick="window.LeaguesPage.createLeague()">
                            Create Your Own League
                        </button>
                    </div>
                ` :
        ''
}
            </section>
        `;

        // Set up event listeners
        this.setupEventListeners();

        // Load initial data
        this.loadActiveLeagues();
    },

    // Set up event listeners
    setupEventListeners() {
        // Add any additional event listeners here
    },

    // Switch between tabs
    switchTab(tab) {
        // Update active tab
        document.querySelectorAll('.league-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        // Load appropriate content
        switch (tab) {
        case 'active':
            this.loadActiveLeagues();
            break;
        case 'upcoming':
            this.loadUpcomingSeasons();
            break;
        case 'tournaments':
            this.loadTournaments();
            break;
        }
    },

    // Load leagues data
    async loadLeagues() {
        try {
            // In a real implementation, this would fetch from API
            // For now, we'll use demo data
            this.loadActiveLeagues();
        } catch (error) {
            console.error('Failed to load leagues:', error);
        }
    },

    // Load active leagues
    loadActiveLeagues() {
        const leagues = [
            {
                id: 1,
                name: 'Vancouver Basketball League',
                sport: 'basketball',
                location: 'vancouver',
                skillLevel: 'intermediate',
                format: '5v5',
                schedule: 'Thursdays 7-9pm',
                duration: '12 weeks',
                startDate: '2025-02-01',
                teams: 8,
                spotsAvailable: true,
                price: '$120/season',
                venue: 'Kitsilano Community Centre'
            },
            {
                id: 2,
                name: 'Burnaby Soccer League - Division 2',
                sport: 'soccer',
                location: 'burnaby',
                skillLevel: 'competitive',
                format: '11v11',
                schedule: 'Sundays 2-4pm',
                duration: '16 weeks',
                startDate: '2025-03-15',
                teams: 12,
                spotsAvailable: false,
                price: '$200/season',
                venue: 'Burnaby Lake Sports Complex'
            },
            {
                id: 3,
                name: 'Richmond Co-ed Volleyball',
                sport: 'volleyball',
                location: 'richmond',
                skillLevel: 'beginner',
                format: '6v6 Co-ed',
                schedule: 'Wednesdays 6-8pm',
                duration: '10 weeks',
                startDate: '2025-01-20',
                teams: 6,
                spotsAvailable: true,
                price: '$85/season',
                venue: 'Richmond Olympic Oval'
            },
            {
                id: 4,
                name: 'Surrey Tennis League',
                sport: 'tennis',
                location: 'surrey',
                skillLevel: 'all',
                format: 'Singles/Doubles',
                schedule: 'Flexible',
                duration: '8 weeks',
                startDate: '2025-02-10',
                teams: 24,
                spotsAvailable: true,
                price: '$60/season',
                venue: 'Various Surrey courts'
            }
        ];

        this.displayLeagues(leagues, 'active');
    },

    // Load upcoming seasons
    loadUpcomingSeasons() {
        const upcomingLeagues = [
            {
                id: 5,
                name: 'Spring Basketball League',
                sport: 'basketball',
                location: 'vancouver',
                skillLevel: 'all',
                format: '3v3',
                schedule: 'TBD',
                duration: '8 weeks',
                startDate: '2025-04-01',
                registrationOpens: '2025-03-01',
                price: '$90/season',
                venue: 'Various Vancouver gyms'
            },
            {
                id: 6,
                name: 'Summer Beach Volleyball',
                sport: 'volleyball',
                location: 'vancouver',
                skillLevel: 'intermediate',
                format: '4v4',
                schedule: 'Weekends',
                duration: '6 weeks',
                startDate: '2025-06-15',
                registrationOpens: '2025-05-15',
                price: '$70/season',
                venue: 'English Bay Beach Courts'
            }
        ];

        this.displayLeagues(upcomingLeagues, 'upcoming');
    },

    // Load tournaments
    loadTournaments() {
        const tournaments = [
            {
                id: 7,
                name: 'March Madness Basketball Tournament',
                sport: 'basketball',
                location: 'vancouver',
                skillLevel: 'competitive',
                format: '5v5 Single Elimination',
                dates: 'March 15-17, 2025',
                teams: 16,
                registrationDeadline: '2025-03-01',
                price: '$250/team',
                venue: 'UBC War Memorial Gym',
                prizes: '1st: $1000, 2nd: $500, 3rd: $250'
            },
            {
                id: 8,
                name: 'Canada Day Soccer Cup',
                sport: 'soccer',
                location: 'burnaby',
                skillLevel: 'all',
                format: '7v7 Round Robin',
                dates: 'July 1, 2025',
                teams: 32,
                registrationDeadline: '2025-06-15',
                price: '$150/team',
                venue: 'Swangard Stadium',
                prizes: 'Trophies and medals'
            }
        ];

        this.displayTournaments(tournaments);
    },

    // Display leagues
    displayLeagues(leagues, type) {
        const content = document.getElementById('leaguesContent');
        if (!content) {
            return;
        }

        content.innerHTML = `
            <div class="leagues-grid">
                ${leagues
        .map(
            league => `
                    <div class="league-card">
                        <div class="league-header">
                            <h3 class="league-name">${league.name}</h3>
                            <span class="league-sport">${league.sport}</span>
                        </div>
                        
                        <div class="league-details">
                            <div class="detail-row">
                                <span class="detail-label">Location:</span>
                                <span class="detail-value">${league.venue || league.location}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Skill Level:</span>
                                <span class="detail-value">${this.formatSkillLevel(league.skillLevel)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Format:</span>
                                <span class="detail-value">${league.format}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Schedule:</span>
                                <span class="detail-value">${league.schedule}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Duration:</span>
                                <span class="detail-value">${league.duration}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Start Date:</span>
                                <span class="detail-value">${new Date(league.startDate).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Price:</span>
                                <span class="detail-value price">${league.price}</span>
                            </div>
                        </div>

                        <div class="league-actions">
                            ${(() => {
                                if (type === 'active') {
                                    if (league.spotsAvailable) {
                                        return `
                                    <button class="join-league-btn" onclick="window.LeaguesPage.joinLeague(${league.id})">
                                        Join League
                                    </button>
                                `;
                                    } else {
                                        return `
                                    <button class="join-league-btn disabled" disabled>
                                        League Full
                                    </button>
                                `;
                                    }
                                } else if (type === 'upcoming') {
                                    return `
                                <div class="registration-info">
                                    Registration opens: ${new Date(league.registrationOpens).toLocaleDateString()}
                                </div>
                                <button class="notify-btn" onclick="window.LeaguesPage.notifyMe(${league.id})">
                                    Notify Me
                                </button>
                            `;
                                } else {
                                    return '';
                                }
                            })()}
                            
                            <button class="info-btn" onclick="window.LeaguesPage.showLeagueInfo(${league.id})">
                                More Info
                            </button>
                        </div>
                    </div>
                `
        )
        .join('')}
            </div>
        `;
    },

    // Display tournaments
    displayTournaments(tournaments) {
        const content = document.getElementById('leaguesContent');
        if (!content) {
            return;
        }

        content.innerHTML = `
            <div class="tournaments-grid">
                ${tournaments
        .map(
            tournament => `
                    <div class="tournament-card">
                        <div class="tournament-header">
                            <h3 class="tournament-name">${tournament.name}</h3>
                            <span class="tournament-sport">${tournament.sport}</span>
                        </div>
                        
                        <div class="tournament-details">
                            <div class="detail-row">
                                <span class="detail-label">Dates:</span>
                                <span class="detail-value">${tournament.dates}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Location:</span>
                                <span class="detail-value">${tournament.venue}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Format:</span>
                                <span class="detail-value">${tournament.format}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Teams:</span>
                                <span class="detail-value">${tournament.teams} teams max</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Entry Fee:</span>
                                <span class="detail-value price">${tournament.price}</span>
                            </div>
                            ${
    tournament.prizes ?
        `
                                <div class="detail-row">
                                    <span class="detail-label">Prizes:</span>
                                    <span class="detail-value">${tournament.prizes}</span>
                                </div>
                            ` :
        ''
}
                        </div>

                        <div class="tournament-actions">
                            <div class="deadline-info">
                                Registration deadline: ${new Date(tournament.registrationDeadline).toLocaleDateString()}
                            </div>
                            <button class="register-btn" onclick="window.LeaguesPage.registerForTournament(${tournament.id})">
                                Register Team
                            </button>
                        </div>
                    </div>
                `
        )
        .join('')}
            </div>
        `;
    },

    // Filter leagues
    filterLeagues() {
        const location = document.getElementById('leagueLocationFilter').value;
        const sport = document.getElementById('leagueSportFilter').value;
        const skill = document.getElementById('leagueSkillFilter').value;

        // In a real implementation, this would filter the data
        console.log('Filtering leagues:', { location, sport, skill });

        // For now, just reload the current tab
        const activeTab = document.querySelector('.league-tab.active');
        let tabType;
        if (activeTab.textContent.includes('Active')) {
            tabType = 'active';
        } else if (activeTab.textContent.includes('Upcoming')) {
            tabType = 'upcoming';
        } else {
            tabType = 'tournaments';
        }
        this.switchTab(tabType);
    },

    // Join a league
    joinLeague(leagueId) {
        if (window.isGuest) {
            if (confirm('Sign in to join this league?')) {
                sessionStorage.setItem('joinLeagueAfterLogin', leagueId);
                window.location.href = '/login-google.html';
            }
        } else {
            console.log('Joining league:', leagueId);
            alert('You have been added to the league waitlist. The organizer will contact you soon.');
        }
    },

    // Register for tournament
    registerForTournament(tournamentId) {
        if (window.isGuest) {
            if (confirm('Sign in to register for this tournament?')) {
                sessionStorage.setItem('registerTournamentAfterLogin', tournamentId);
                window.location.href = '/login-google.html';
            }
        } else {
            console.log('Registering for tournament:', tournamentId);
            alert('Registration form will open here.');
        }
    },

    // Show league info
    showLeagueInfo(leagueId) {
        console.log('Showing league info:', leagueId);
        alert('Detailed league information would be displayed here.');
    },

    // Notify when registration opens
    notifyMe(leagueId) {
        if (window.isGuest) {
            if (confirm('Sign in to get notified?')) {
                window.location.href = '/login-google.html';
            }
        } else {
            console.log('Setting notification for league:', leagueId);
            alert('You will be notified when registration opens.');
        }
    },

    // Create a new league
    createLeague() {
        console.log('Creating new league');
        alert('League creation form would open here.');
    },

    // Format skill level
    formatSkillLevel(level) {
        const levels = {
            all: 'All Levels',
            beginner: 'Beginner',
            intermediate: 'Intermediate',
            advanced: 'Advanced',
            competitive: 'Competitive'
        };
        return levels[level] || level;
    }
};
