// Sport Rules Management System
class SportRulesManager {
    constructor() {
        this.sportsData = {
            soccer: {
                name: 'Soccer',
                description: 'The world\'s most popular sport played with feet and a ball',
                variations: {
                    '11v11': {
                        name: 'Standard Soccer (11v11)',
                        players: '11 players per team (10 outfield + 1 goalkeeper)',
                        duration: '90 minutes (2 halves of 45 minutes)',
                        field: 'Full-size field (100-130 yards long, 50-100 yards wide)',
                        equipment: 'Soccer ball, goals, corner flags, jerseys, shorts, socks, shin guards, boots',
                        objective: 'Score more goals than the opponent by getting the ball into the opposing goal',
                        rules: [
                            'No hands/arms except for goalkeepers in their penalty area',
                            'Offside rule applies',
                            'Free kicks awarded for fouls',
                            'Yellow and red cards for misconduct',
                            'Throw-ins when ball goes out of bounds on sideline',
                            'Corner kicks when defending team last touches ball over goal line',
                            'Goal kicks when attacking team last touches ball over goal line'
                        ],
                        fouls: [
                            'Kicking, tripping, or pushing an opponent',
                            'Holding or grabbing an opponent',
                            'Dangerous play',
                            'Impeding an opponent',
                            'Handball (except goalkeeper in penalty area)'
                        ]
                    },
                    '7v7': {
                        name: '7-a-side Soccer',
                        players: '7 players per team (6 outfield + 1 goalkeeper)',
                        duration: '60 minutes (2 halves of 30 minutes)',
                        field: 'Smaller field (50-70 yards long, 30-50 yards wide)',
                        equipment: 'Soccer ball, smaller goals, jerseys, shorts, socks, shin guards, boots',
                        objective: 'Score more goals than the opponent',
                        rules: [
                            'Same basic rules as 11v11 but adapted for smaller field',
                            'Offside rule typically applies',
                            'Substitutions may be unlimited',
                            'Shorter game duration'
                        ],
                        fouls: 'Same as standard soccer'
                    },
                    '5v5': {
                        name: '5-a-side Soccer',
                        players: '5 players per team (4 outfield + 1 goalkeeper)',
                        duration: '40-50 minutes (2 halves of 20-25 minutes)',
                        field: 'Small field (30-40 yards long, 20-30 yards wide)',
                        equipment: 'Soccer ball, small goals, jerseys, shorts, socks, shin guards, boots',
                        objective: 'Score more goals than the opponent',
                        rules: [
                            'No offside rule in most variations',
                            'Unlimited substitutions',
                            'Kick-ins instead of throw-ins',
                            'No slide tackles in some leagues',
                            'Goalkeeper cannot handle back-passes'
                        ],
                        fouls: 'Limited contact, emphasis on skill over physicality'
                    },
                    '3v3': {
                        name: '3-a-side Soccer',
                        players: '3 players per team (no dedicated goalkeeper)',
                        duration: '30 minutes (2 halves of 15 minutes)',
                        field: 'Very small field (20-30 yards long, 15-25 yards wide)',
                        equipment: 'Soccer ball, small goals, jerseys, shorts, socks, shin guards, boots',
                        objective: 'Score more goals than the opponent',
                        rules: [
                            'No offside rule',
                            'No goalkeepers',
                            'Unlimited substitutions',
                            'Kick-ins instead of throw-ins',
                            'Emphasis on quick passing and movement'
                        ],
                        fouls: 'Minimal contact allowed'
                    },
                    futsal: {
                        name: 'Futsal',
                        players: '5 players per team (4 outfield + 1 goalkeeper)',
                        duration: '40 minutes (2 halves of 20 minutes)',
                        field: 'Indoor court (25-42 meters long, 16-25 meters wide)',
                        equipment: 'Futsal ball (smaller, heavier), futsal goals, jerseys, shorts, socks, futsal shoes',
                        objective: 'Score more goals than the opponent using futsal-specific rules',
                        rules: [
                            'No offside rule',
                            'Limited substitutions',
                            'Kick-ins instead of throw-ins',
                            'Accumulated fouls rule (6th foul = direct free kick)',
                            'Goalkeeper has 4 seconds to release ball',
                            'No slide tackles allowed'
                        ],
                        fouls: [
                            'Same as soccer but with accumulated foul system',
                            'Direct and indirect free kicks',
                            'After 5 accumulated fouls, 10-meter penalty kick awarded'
                        ]
                    }
                }
            },
            basketball: {
                name: 'Basketball',
                description: 'Fast-paced game played with hands and a ball on a court with hoops',
                variations: {
                    '5v5': {
                        name: 'Full Court Basketball (5v5)',
                        players: '5 players per team on court',
                        duration: '48 minutes (4 quarters of 12 minutes in NBA)',
                        field: 'Full basketball court (94 feet long, 50 feet wide)',
                        equipment: 'Basketball, two hoops (10 feet high), jerseys, shorts, basketball shoes',
                        objective: 'Score more points by shooting the ball through the opponent\'s hoop',
                        rules: [
                            'Dribble to move with the ball',
                            'Cannot double dribble or travel',
                            '24-second shot clock (varies by league)',
                            'Fouls result in free throws or possession',
                            '3-point line for long-distance shots',
                            'Substitutions allowed during dead balls'
                        ],
                        scoring: [
                            'Field goal: 2 points (3 points if beyond 3-point line)',
                            'Free throw: 1 point',
                            'Technical foul free throw: 1 point'
                        ],
                        fouls: [
                            'Personal fouls: illegal contact',
                            'Technical fouls: unsportsmanlike conduct',
                            'Flagrant fouls: excessive contact',
                            'Team fouls lead to bonus free throw situations'
                        ]
                    },
                    '3v3': {
                        name: '3-on-3 Basketball',
                        players: '3 players per team',
                        duration: '10 minutes or first to 21 points',
                        field: 'Half court',
                        equipment: 'Basketball, one hoop, jerseys',
                        objective: 'First team to 21 points (win by 2) or leading after 10 minutes',
                        rules: [
                            'Must clear the ball behind 3-point line after defensive rebound',
                            'No shot clock in casual play',
                            'Make-it-take-it or alternating possession',
                            'Fouls result in possession or free throws'
                        ],
                        scoring: ['Inside arc: 1 point', 'Beyond arc: 2 points', 'Free throw: 1 point'],
                        fouls: 'Simplified foul system, usually call your own fouls'
                    },
                    horse: {
                        name: 'HORSE',
                        players: '2-10 players',
                        duration: 'Until all but one player eliminated',
                        field: 'Any court with hoop',
                        equipment: 'Basketball, hoop',
                        objective: 'Be the last player remaining by not spelling H-O-R-S-E',
                        rules: [
                            'First player creates a shot',
                            'If made, all other players must make the same shot',
                            'Missing a shot earns a letter (H, then O, then R, etc.)',
                            'Player spelling H-O-R-S-E is eliminated',
                            'Last player standing wins'
                        ],
                        fouls: 'None - pure shooting game'
                    },
                    21: {
                        name: '21 (Basketball)',
                        players: '3-8 players',
                        duration: 'Until someone reaches 21 points',
                        field: 'Half court',
                        equipment: 'Basketball, hoop',
                        objective: 'First player to exactly 21 points wins',
                        rules: [
                            'All players compete individually',
                            'Shooter keeps shooting until they miss',
                            'Other players rebound and can score',
                            'Going over 21 resets to previous score or 15',
                            'Must win by making a shot (not free throw)'
                        ],
                        scoring: ['Regular shot: 2 points', '3-pointer: 3 points', 'Free throw after foul: 1 point'],
                        fouls: 'Fouled shooter gets free throws'
                    },
                    lightning: {
                        name: 'Lightning',
                        players: '5-15 players',
                        duration: 'Until all but one eliminated',
                        field: 'Free throw line area',
                        equipment: 'Basketball, hoop',
                        objective: 'Be the last player remaining',
                        rules: [
                            'Players line up at free throw line',
                            'First two players get basketballs',
                            'Must make basket before player behind you',
                            'If caught, you\'re eliminated',
                            'Can knock away opponent\'s ball'
                        ],
                        fouls: 'No fouls - elimination game'
                    },
                    knockout: {
                        name: 'Knockout',
                        players: '5-20 players',
                        duration: 'Until one player remains',
                        field: 'Free throw line and surrounding area',
                        equipment: 'Basketball, hoop',
                        objective: 'Be the last player not eliminated',
                        rules: [
                            'Players line up at free throw line',
                            'First player shoots, gets rebound if missed',
                            'Must make basket before next player makes theirs',
                            'Eliminated if next player scores first',
                            'Winner of each round goes to back of line'
                        ],
                        fouls: 'No fouls - elimination format'
                    }
                }
            },
            tennis: {
                name: 'Tennis',
                description: 'Racquet sport played on a court with a net',
                variations: {
                    singles: {
                        name: 'Singles Tennis',
                        players: '2 players (1 vs 1)',
                        duration: 'Best of 3 or 5 sets',
                        field: 'Tennis court (78 feet long, 27 feet wide for singles)',
                        equipment: 'Tennis racquet, tennis balls, net, court lines',
                        objective: 'Win more sets than opponent',
                        rules: [
                            'Serve alternates every game',
                            'Ball must land in service box on serve',
                            'Ball can only bounce once before being hit',
                            'Cannot hit ball into net or out of bounds',
                            'Serve gets two attempts per point'
                        ],
                        scoring: [
                            'Point progression: 0 (love), 15, 30, 40, game',
                            'Must win by 2 points if tied at 40-40 (deuce)',
                            'Win 6 games to win set (must win by 2)',
                            'Tiebreaker at 6-6 in most formats'
                        ],
                        fouls: [
                            'Double fault (two missed serves)',
                            'Foot fault (stepping on/over baseline while serving)',
                            'Hitting ball into net or out of bounds',
                            'Hitting ball before it crosses the net'
                        ]
                    },
                    doubles: {
                        name: 'Doubles Tennis',
                        players: '4 players (2 vs 2)',
                        duration: 'Best of 3 sets typically',
                        field: 'Full tennis court (78 feet long, 36 feet wide)',
                        equipment: 'Tennis racquets, tennis balls, net',
                        objective: 'Win more sets than opposing team',
                        rules: [
                            'Partners alternate serving games',
                            'Must serve to designated service box',
                            'Both players can hit the ball during rally',
                            'Alleys (side corridors) are in play',
                            'Same scoring as singles'
                        ],
                        scoring: 'Same as singles tennis',
                        fouls: 'Same as singles tennis'
                    },
                    mixedDoubles: {
                        name: 'Mixed Doubles',
                        players: '4 players (1 male, 1 female per team)',
                        duration: 'Best of 3 sets',
                        field: 'Full tennis court',
                        equipment: 'Tennis racquets, tennis balls, net',
                        objective: 'Win more sets than opposing team',
                        rules: [
                            'Same rules as regular doubles',
                            'Traditional serving order often alternates male/female',
                            'Strategy often involves targeting weaker player',
                            'No special rules for gender differences'
                        ],
                        scoring: 'Same as doubles tennis',
                        fouls: 'Same as doubles tennis'
                    },
                    kingOfCourt: {
                        name: 'King of the Court',
                        players: '6-12 players',
                        duration: 'Time-based or point-based',
                        field: 'One tennis court',
                        equipment: 'Tennis racquets, tennis balls, net',
                        objective: 'Stay on the "king" side of court longest',
                        rules: [
                            'Winners stay, losers rotate out',
                            'Challengers line up to play winners',
                            'Points played to 7 or 11 typically',
                            'King side gets to serve',
                            'Fast-paced rotation keeps everyone active'
                        ],
                        scoring: 'Simplified scoring: 1, 2, 3, 4, 5, 6, 7',
                        fouls: 'Standard tennis rules apply'
                    }
                }
            },
            badminton: {
                name: 'Badminton',
                description: 'Racquet sport played with a shuttlecock over a high net',
                variations: {
                    singles: {
                        name: 'Singles Badminton',
                        players: '2 players (1 vs 1)',
                        duration: 'Best of 3 games to 21 points',
                        field: 'Badminton court (44 feet long, 17 feet wide)',
                        equipment: 'Badminton racquet, shuttlecock, net (5 feet high)',
                        objective: 'Win 2 out of 3 games to 21 points',
                        rules: [
                            'Shuttlecock cannot touch the ground',
                            'Must hit shuttlecock before it hits your side',
                            'Serve underhand and diagonally across',
                            'Serve alternates with each point',
                            'Cannot hit shuttlecock twice in succession'
                        ],
                        scoring: [
                            'Rally point system: every rally awards a point',
                            'Games to 21 points (must win by 2)',
                            'If tied 20-20, play continues until 2-point lead',
                            'Maximum 30 points (30-29 wins)'
                        ],
                        fouls: [
                            'Shuttlecock hits net or goes out of bounds',
                            'Double hit by same player',
                            'Player touches net with racquet or body',
                            'Serves above waist height or overhand'
                        ]
                    },
                    doubles: {
                        name: 'Doubles Badminton',
                        players: '4 players (2 vs 2)',
                        duration: 'Best of 3 games to 21 points',
                        field: 'Full badminton court (44 feet long, 20 feet wide)',
                        equipment: 'Badminton racquets, shuttlecock, net',
                        objective: 'Win 2 out of 3 games to 21 points',
                        rules: [
                            'Partners alternate serving when their team wins points',
                            'Both players can hit shuttlecock during rally',
                            'Serving team changes positions when they lose service',
                            'Short service line in effect for doubles',
                            'Back boundary line is longer for doubles'
                        ],
                        scoring: 'Same as singles badminton',
                        fouls: 'Same as singles badminton'
                    },
                    mixedDoubles: {
                        name: 'Mixed Doubles',
                        players: '4 players (1 male, 1 female per team)',
                        duration: 'Best of 3 games to 21 points',
                        field: 'Full badminton court',
                        equipment: 'Badminton racquets, shuttlecock, net',
                        objective: 'Win 2 out of 3 games to 21 points',
                        rules: [
                            'Same rules as regular doubles',
                            'Often strategic gender-based positioning',
                            'Males typically play back court, females front court',
                            'No rule differences based on gender'
                        ],
                        scoring: 'Same as doubles badminton',
                        fouls: 'Same as doubles badminton'
                    }
                }
            },
            volleyball: {
                name: 'Volleyball',
                description: 'Team sport played by hitting a ball over a net without letting it touch the ground',
                variations: {
                    '6v6': {
                        name: 'Indoor Volleyball (6v6)',
                        players: '6 players per team',
                        duration: 'Best of 5 sets (first to 25 points, 5th set to 15)',
                        field: 'Indoor court (59 feet long, 29.5 feet wide)',
                        equipment: 'Volleyball, net (7 feet 11.6 inches high for men)',
                        objective: 'Win 3 out of 5 sets',
                        rules: [
                            'Maximum 3 hits per side before sending over net',
                            'Cannot hit ball twice in succession',
                            'Rotate positions clockwise when winning serve',
                            'Ball cannot touch ground on your side',
                            'Cannot reach over net to hit ball'
                        ],
                        scoring: [
                            'Rally point system',
                            'Sets to 25 points (must win by 2)',
                            'Deciding set (5th) to 15 points',
                            'No maximum point limit'
                        ],
                        fouls: [
                            'Ball hits ground, goes out of bounds, or hits net',
                            'Player touches net',
                            'Four hits on one side',
                            'Double hit by same player',
                            'Foot fault on serve'
                        ]
                    },
                    '4v4': {
                        name: '4-on-4 Volleyball',
                        players: '4 players per team',
                        duration: 'Best of 3 sets to 25 points',
                        field: 'Smaller court or modified indoor court',
                        equipment: 'Volleyball, net',
                        objective: 'Win 2 out of 3 sets',
                        rules: [
                            'Same basic rules as 6v6',
                            'Modified rotations for 4 players',
                            'Often more lenient on positioning',
                            'Faster-paced due to fewer players'
                        ],
                        scoring: 'Same as indoor volleyball',
                        fouls: 'Same as indoor volleyball'
                    },
                    beach: {
                        name: 'Beach Volleyball',
                        players: '2 players per team',
                        duration: 'Best of 3 sets (first 2 to 21, 3rd to 15)',
                        field: 'Sand court (52.5 feet long, 26.25 feet wide)',
                        equipment: 'Volleyball, net (lower than indoor), no shoes',
                        objective: 'Win 2 out of 3 sets',
                        rules: [
                            'No rotation - players can switch sides',
                            'Must alternate who serves',
                            'Wind and sun are factors',
                            'No open-hand tips allowed',
                            'Harder to spike due to sand'
                        ],
                        scoring: [
                            'Sets to 21 points (must win by 2)',
                            'Third set to 15 points if needed',
                            'Rally point scoring'
                        ],
                        fouls: [
                            'Same as indoor plus open-hand attacking',
                            'Ball hits sand or goes out',
                            'Net violations'
                        ]
                    },
                    wallyball: {
                        name: 'Wallyball',
                        players: '2-4 players per team',
                        duration: 'Best of 3 games to 15 points',
                        field: 'Racquetball court with volleyball net',
                        equipment: 'Volleyball, net, enclosed court',
                        objective: 'Win 2 out of 3 games',
                        rules: [
                            'Ball can be played off walls',
                            'Ceiling is out of bounds',
                            'Same hitting rules as volleyball',
                            'Walls add strategic element',
                            'Fast-paced due to wall play'
                        ],
                        scoring: 'Games to 15 points (must win by 2)',
                        fouls: ['Ball hits ceiling', 'Standard volleyball violations', 'Ball hits floor']
                    }
                }
            },
            hockey: {
                name: 'Hockey',
                description: 'Fast-paced sport played with sticks and a puck/ball',
                variations: {
                    ice: {
                        name: 'Ice Hockey',
                        players: '6 players per team (including goalie)',
                        duration: '60 minutes (3 periods of 20 minutes)',
                        field: 'Ice rink (200 feet long, 85 feet wide)',
                        equipment: 'Skates, stick, puck, helmet, pads, gloves, jersey',
                        objective: 'Score more goals than opponent',
                        rules: [
                            'Offside rule when entering attacking zone',
                            'Icing when puck shot from own half crosses goal line',
                            'Body checking allowed',
                            'Power plays for penalties',
                            'Face-offs to restart play'
                        ],
                        scoring: 'Goals (1 point) and assists (1 point each)',
                        fouls: [
                            'Slashing, tripping, boarding',
                            'High-sticking, interference',
                            'Fighting (major penalty)',
                            'Checking from behind'
                        ]
                    },
                    ball: {
                        name: 'Ball Hockey',
                        players: '5-6 players per team',
                        duration: '2-3 periods of 15-20 minutes',
                        field: 'Gymnasium or outdoor court',
                        equipment: 'Stick, ball, net, sneakers, protective gear',
                        objective: 'Score more goals than opponent',
                        rules: [
                            'No body checking typically',
                            'Offside rules often simplified',
                            'No icing in most recreational leagues',
                            'Running instead of skating',
                            'Ball instead of puck'
                        ],
                        scoring: 'Goals and assists',
                        fouls: ['Slashing, tripping', 'High-sticking', 'Interference, roughing']
                    },
                    roller: {
                        name: 'Roller Hockey',
                        players: '4-5 players per team (including goalie)',
                        duration: '2-3 periods of 12-15 minutes',
                        field: 'Roller rink or basketball court',
                        equipment: 'Roller skates, stick, puck/ball, helmet, pads',
                        objective: 'Score more goals than opponent',
                        rules: [
                            'Similar to ice hockey but on wheels',
                            'Usually no body checking',
                            'Modified offside rules',
                            'Faster substitutions',
                            'Less physical contact'
                        ],
                        scoring: 'Goals and assists',
                        fouls: ['Slashing, tripping', 'High-sticking', 'Interference']
                    }
                }
            },
            football: {
                name: 'Football',
                description: 'Strategic team sport combining running, passing, and physical play',
                variations: {
                    '11v11': {
                        name: 'Standard Football (11v11)',
                        players: '11 players per team',
                        duration: '60 minutes (4 quarters of 15 minutes)',
                        field: '120 yards long, 53 yards wide (including end zones)',
                        equipment: 'Football, helmets, pads, cleats, jerseys',
                        objective: 'Score more points than opponent',
                        rules: [
                            '4 downs to advance 10 yards',
                            'Forward pass only behind line of scrimmage',
                            'Clock stops for incomplete passes, out of bounds',
                            'Touchdowns worth 6 points',
                            'Field goals worth 3 points'
                        ],
                        scoring: [
                            'Touchdown: 6 points',
                            'Extra point: 1 point',
                            'Two-point conversion: 2 points',
                            'Field goal: 3 points',
                            'Safety: 2 points'
                        ],
                        fouls: [
                            'Holding, false start, offside',
                            'Pass interference',
                            'Roughing the passer',
                            'Illegal formation'
                        ]
                    },
                    '7v7': {
                        name: '7-on-7 Football',
                        players: '7 players per team',
                        duration: '40 minutes (2 halves of 20 minutes)',
                        field: 'Shortened field (80 yards long)',
                        equipment: 'Football, jerseys, cleats (minimal padding)',
                        objective: 'Score more points than opponent',
                        rules: [
                            'No offensive/defensive line',
                            'No running plays - passing only',
                            'No kicking plays',
                            'Simplified down system',
                            'No tackling to ground'
                        ],
                        scoring: 'Touchdowns worth 6 points, no extra points/field goals',
                        fouls: 'Pass interference, illegal contact, false start'
                    },
                    flag: {
                        name: 'Flag Football',
                        players: '5-8 players per team',
                        duration: '40 minutes (2 halves of 20 minutes)',
                        field: 'Shortened field (50-80 yards)',
                        equipment: 'Football, flag belts, jerseys',
                        objective: 'Score more points than opponent',
                        rules: [
                            'Pull flags instead of tackling',
                            'No contact allowed',
                            'Running and passing plays allowed',
                            'All players eligible receivers',
                            '4 downs to score or get first down'
                        ],
                        scoring: [
                            'Touchdown: 6 points',
                            'Extra point: 1 point (from 5 yards)',
                            'Two-point conversion: 2 points (from 10 yards)'
                        ],
                        fouls: ['Flag guarding', 'Illegal contact', 'Offensive pass interference']
                    },
                    touch: {
                        name: 'Touch Football',
                        players: '6-9 players per team',
                        duration: '40 minutes (2 halves of 20 minutes)',
                        field: 'Variable size field',
                        equipment: 'Football, jerseys',
                        objective: 'Score more points than opponent',
                        rules: [
                            'Two-hand touch to stop play',
                            'No rushing the quarterback (count system)',
                            'All players eligible receivers',
                            'No kicking plays typically',
                            'Simplified rules for casual play'
                        ],
                        scoring: 'Touchdowns worth 6 points',
                        fouls: 'Illegal contact, rushing early'
                    }
                }
            },
            baseball: {
                name: 'Baseball',
                description: 'Bat and ball sport played between two teams taking turns batting and fielding',
                variations: {
                    '9v9': {
                        name: 'Standard Baseball (9v9)',
                        players: '9 players per team',
                        duration: '9 innings (or time limit)',
                        field: 'Baseball diamond with 90-foot basepaths',
                        equipment: 'Baseball, bats, gloves, helmets, bases, pitcher\'s mound',
                        objective: 'Score more runs than opponent',
                        rules: [
                            '3 strikes = out, 4 balls = walk',
                            '3 outs per half-inning',
                            'Run by touching all bases in order',
                            'Force outs and tag outs',
                            'Innings continue until 3 outs recorded'
                        ],
                        scoring: [
                            'Run: 1 point for crossing home plate',
                            'Home run: automatic run plus any runners on base',
                            'RBI: runs batted in statistic'
                        ],
                        fouls: ['Balks by pitcher', 'Interference by batter or fielder', 'Base running violations']
                    },
                    softball: {
                        name: 'Softball',
                        players: '9-10 players per team',
                        duration: '7 innings',
                        field: 'Softball diamond with 60-foot basepaths',
                        equipment: 'Softball, bats, gloves, bases',
                        objective: 'Score more runs than opponent',
                        rules: [
                            'Underhand pitching',
                            'Larger ball than baseball',
                            'Same basic rules as baseball',
                            'Shorter distances',
                            'Often co-ed with special rules'
                        ],
                        scoring: 'Same as baseball',
                        fouls: 'Same as baseball with underhand pitching rules'
                    },
                    tball: {
                        name: 'T-Ball',
                        players: '9 players per team',
                        duration: '6 innings or time limit',
                        field: 'Smaller diamond (45-60 foot basepaths)',
                        equipment: 'Tee, softball/baseball, bats, gloves',
                        objective: 'Score runs and learn fundamentals',
                        rules: [
                            'Hit ball off tee instead of pitched ball',
                            'No strikeouts',
                            'All players bat each inning',
                            'Simplified rules for young players',
                            'Equal playing time emphasis'
                        ],
                        scoring: 'Runs scored, often with maximum per inning',
                        fouls: 'Minimal penalties, focus on learning'
                    },
                    slowPitch: {
                        name: 'Slow Pitch Softball',
                        players: '10 players per team',
                        duration: '7 innings',
                        field: 'Softball diamond',
                        equipment: 'Softball, bats, gloves',
                        objective: 'Score more runs than opponent',
                        rules: [
                            'Slow underhand pitch with arc',
                            'No stealing bases',
                            'No bunting typically',
                            'Extra fielder (10th player)',
                            'More hitting-focused game'
                        ],
                        scoring: 'Same as softball',
                        fouls: 'Limited base running violations'
                    }
                }
            },
            pingPong: {
                name: 'Ping Pong (Table Tennis)',
                description: 'Fast-paced racquet sport played on a table with small paddles and ball',
                variations: {
                    singles: {
                        name: 'Singles Table Tennis',
                        players: '2 players (1 vs 1)',
                        duration: 'Best of 5 or 7 games to 11 points',
                        field: 'Table tennis table (9 feet long, 5 feet wide)',
                        equipment: 'Ping pong paddle, ball, table, net',
                        objective: 'Win majority of games',
                        rules: [
                            'Serve must bounce once on each side',
                            'Alternate serves every 2 points',
                            'Ball must be hit after one bounce',
                            'Cannot hit ball on the volley',
                            'Serve must be diagonal in doubles'
                        ],
                        scoring: [
                            'Games to 11 points (must win by 2)',
                            'If tied 10-10, alternate serves until 2-point lead',
                            'Match is best of odd number of games'
                        ],
                        fouls: [
                            'Ball hits net or goes off table',
                            'Double hit',
                            'Ball hits player or clothing',
                            'Illegal serve'
                        ]
                    },
                    doubles: {
                        name: 'Doubles Table Tennis',
                        players: '4 players (2 vs 2)',
                        duration: 'Best of 5 games to 11 points',
                        field: 'Table tennis table with center line',
                        equipment: 'Ping pong paddles, ball, table, net',
                        objective: 'Win majority of games',
                        rules: [
                            'Partners alternate hitting the ball',
                            'Serve must be diagonal cross-court',
                            'Partners switch positions after each game',
                            'Receiving team chooses who receives first',
                            'Same scoring as singles'
                        ],
                        scoring: 'Same as singles table tennis',
                        fouls: ['Out of turn hitting', 'Same as singles fouls', 'Wrong partner hitting ball']
                    },
                    aroundWorld: {
                        name: 'Around the World',
                        players: '4-12 players',
                        duration: 'Until one player remains or time limit',
                        field: 'Table tennis table',
                        equipment: 'Ping pong paddles, ball, table',
                        objective: 'Be the last player remaining',
                        rules: [
                            'Players line up around table',
                            'Hit ball and run to opposite side',
                            'Miss the ball and you\'re eliminated',
                            'Last two players play normal singles',
                            'Fast-paced elimination game'
                        ],
                        fouls: 'Missing the ball eliminates player'
                    }
                }
            },
            frisbee: {
                name: 'Frisbee',
                description: 'Disc-based sports emphasizing throwing, catching, and teamwork',
                variations: {
                    ultimate: {
                        name: 'Ultimate Frisbee',
                        players: '7 players per team',
                        duration: 'First to 15 points or 90 minutes',
                        field: '120 yards long, 40 yards wide with end zones',
                        equipment: 'Ultimate disc, cones for field marking',
                        objective: 'Score points by catching disc in opponent\'s end zone',
                        rules: [
                            'No running with the disc',
                            'Cannot be taken from your hands',
                            'Self-officiated with "Spirit of the Game"',
                            'Unlimited substitutions on any stoppage',
                            'Stall count of 10 seconds to throw'
                        ],
                        scoring: '1 point per goal (catch in end zone)',
                        fouls: ['Contact fouls', 'Pick violations', 'Travel violations', 'Stall count violations']
                    },
                    discGolf: {
                        name: 'Disc Golf',
                        players: '1-4 players per group',
                        duration: '18 holes (2-4 hours)',
                        field: 'Disc golf course with baskets/targets',
                        equipment: 'Various discs (drivers, mid-range, putters), scorecard',
                        objective: 'Complete course in fewest throws',
                        rules: [
                            'Throw from tee to basket',
                            'Play from where disc lands',
                            'Count every throw',
                            'Different discs for different shots',
                            'Follow course etiquette'
                        ],
                        scoring: [
                            'Par scoring (under par is better)',
                            'Eagle: 2 under par',
                            'Birdie: 1 under par',
                            'Bogey: 1 over par'
                        ],
                        fouls: ['Out of bounds penalties', 'Water hazard penalties', 'Mandatory route violations']
                    },
                    freestyle: {
                        name: 'Freestyle Frisbee',
                        players: '1-3 players',
                        duration: 'Routine length (2-5 minutes)',
                        field: 'Open field or court',
                        equipment: 'Freestyle disc (lighter than ultimate disc)',
                        objective: 'Perform artistic routine with technical skill',
                        rules: [
                            'Judged on difficulty, execution, and artistic impression',
                            'Combination of throws, catches, and body movements',
                            'Can be individual or team routines',
                            'Set to music in competitions',
                            'Variety of moves required'
                        ],
                        scoring: 'Judged scoring based on technical and artistic merit',
                        fouls: 'Dropped disc or incomplete moves reduce score'
                    }
                }
            },
            rugby: {
                name: 'Rugby',
                description: 'Full-contact team sport emphasizing continuous play and ball handling',
                variations: {
                    '15v15': {
                        name: 'Rugby Union (15v15)',
                        players: '15 players per team',
                        duration: '80 minutes (2 halves of 40 minutes)',
                        field: '144 meters long, 70 meters wide',
                        equipment: 'Rugby ball, jerseys, shorts, socks, boots, mouthguard',
                        objective: 'Score more points than opponent',
                        rules: [
                            'Can only pass ball backwards or sideways',
                            'Can run with ball in any direction',
                            'Tackle player to stop forward progress',
                            'Scrums and lineouts restart play',
                            'Offside rule prevents players being ahead of ball'
                        ],
                        scoring: [
                            'Try: 5 points (grounding ball in end zone)',
                            'Conversion: 2 points (kick after try)',
                            'Penalty kick: 3 points',
                            'Drop goal: 3 points'
                        ],
                        fouls: ['Forward pass or knock-on', 'Offside infractions', 'High tackles', 'Dangerous play']
                    },
                    '7v7': {
                        name: 'Rugby Sevens (7v7)',
                        players: '7 players per team',
                        duration: '14 minutes (2 halves of 7 minutes)',
                        field: 'Full rugby field',
                        equipment: 'Same as rugby union',
                        objective: 'Score more points than opponent',
                        rules: [
                            'Same basic rules as rugby union',
                            'Faster pace due to fewer players',
                            'More space on field',
                            'Shorter game duration',
                            'Popular tournament format'
                        ],
                        scoring: 'Same as rugby union',
                        fouls: 'Same as rugby union'
                    },
                    touch: {
                        name: 'Touch Rugby',
                        players: '6-8 players per team',
                        duration: '40 minutes (2 halves of 20 minutes)',
                        field: 'Smaller field than full rugby',
                        equipment: 'Rugby ball, jerseys',
                        objective: 'Score more tries than opponent',
                        rules: [
                            'Light touch replaces tackle',
                            'No contact or scrums',
                            'All players can handle ball',
                            '6 touches before turnover',
                            'Mixed gender teams common'
                        ],
                        scoring: 'Tries worth 1 point each, no conversions',
                        fouls: ['Forward pass', 'Offside', 'Excessive contact']
                    },
                    tag: {
                        name: 'Tag Rugby',
                        players: '7-9 players per team',
                        duration: '40 minutes (2 halves of 20 minutes)',
                        field: 'Modified rugby field',
                        equipment: 'Rugby ball, tag belts with velcro tags',
                        objective: 'Score more tries than opponent',
                        rules: [
                            'Remove tag instead of tackling',
                            'No contact allowed',
                            'Mixed gender play encouraged',
                            '6 tags before turnover',
                            'All players wear tag belts'
                        ],
                        scoring: 'Tries worth 1 point, no conversions typically',
                        fouls: ['Contact play', 'Tag interference', 'Forward pass']
                    }
                }
            },
            tag: {
                name: 'Tag',
                description: 'Classic playground games involving chasing and avoiding being caught',
                variations: {
                    freeze: {
                        name: 'Freeze Tag',
                        players: '5-20 players',
                        duration: '10-15 minutes per round',
                        field: 'Open area with defined boundaries',
                        equipment: 'None required',
                        objective: 'Taggers freeze all players or avoid being frozen',
                        rules: [
                            'Tagged players must freeze in place',
                            'Frozen players can be unfrozen by free players',
                            'Game ends when all players frozen',
                            'Safe zones may be designated',
                            'Rotate who is "it"'
                        ],
                        fouls: ['Leaving designated play area', 'Not freezing when tagged', 'Rough play or pushing']
                    },
                    tv: {
                        name: 'TV Tag',
                        players: '6-15 players',
                        duration: '10-15 minutes per round',
                        field: 'Open area',
                        equipment: 'None required',
                        objective: 'Avoid being tagged or tag all players',
                        rules: [
                            'Players are safe when they sit down and name a TV show',
                            'Cannot use same show twice in a row',
                            'Must get up and run after a few seconds',
                            'Tagger tries to catch players while moving',
                            'Rotate tagger regularly'
                        ],
                        fouls: ['Staying down too long', 'Repeating TV shows', 'Rough physical contact']
                    },
                    flashlight: {
                        name: 'Flashlight Tag',
                        players: '6-20 players',
                        duration: '15-20 minutes per round',
                        field: 'Outdoor area or large indoor space (dark)',
                        equipment: 'Flashlight for tagger',
                        objective: 'Tag players with flashlight beam or avoid being caught',
                        rules: [
                            'Played in the dark',
                            'Tagger uses flashlight to "tag" players',
                            'Shining light on player counts as tag',
                            'Tagged players may become additional taggers',
                            'Boundaries must be clearly defined'
                        ],
                        fouls: ['Leaving play area', 'Interfering with flashlight', 'Unsafe running in dark']
                    }
                }
            },
            kabaddi: {
                name: 'Kabaddi',
                description: 'Contact sport combining wrestling and tag, popular in South Asia',
                variations: {
                    circle: {
                        name: 'Circle Style Kabaddi',
                        players: '8-10 players per team',
                        duration: '40 minutes (2 halves of 20 minutes)',
                        field: 'Circular court with 22-meter diameter',
                        equipment: 'None required, just playing area markings',
                        objective: 'Score more points by raiding and defending',
                        rules: [
                            'Raiders enter opponent circle while chanting "kabaddi"',
                            'Must tag defenders and return without being tackled',
                            'Raiders cannot take breath during raid',
                            'Defenders try to prevent raider\'s return',
                            'Teams alternate between raiding and defending'
                        ],
                        scoring: [
                            '1 point per successful tag',
                            '1 point for stopping raider',
                            'Bonus points for multiple tags',
                            'Points for forcing opponent to leave circle'
                        ],
                        fouls: [
                            'Taking breath during raid',
                            'Stepping outside boundaries',
                            'Dangerous play or illegal holds'
                        ]
                    },
                    standard: {
                        name: 'Standard Kabaddi',
                        players: '7 players per team',
                        duration: '40 minutes (2 halves of 20 minutes)',
                        field: 'Rectangular court (13m x 10m)',
                        equipment: 'Court with center line and boundary markings',
                        objective: 'Score more points than opponent',
                        rules: [
                            'Raiders cross center line while chanting "kabaddi"',
                            'Tag defenders and return to own half',
                            'Cannot stop chanting or take breath',
                            'Defenders try to tackle and prevent return',
                            'Teams switch between raiding and defending each turn'
                        ],
                        scoring: [
                            'Touch point: 1 point per defender tagged',
                            'Tackle point: 1 point for stopping raider',
                            'Bonus point: 1 point if all defenders tagged',
                            'Technical point: 1 point for violations'
                        ],
                        fouls: [
                            'Stopping chant or taking breath',
                            'Stepping out of bounds',
                            'Illegal tackles or dangerous play',
                            'Time violations'
                        ]
                    }
                }
            }
        };
        this.currentSport = null;
        this.currentVariation = null;
        this.searchTerms = [];
        this.init();
    }

    init() {
        this.createRulesInterface();
        this.bindEvents();
        this.loadDefaultSport();
    }

    createRulesInterface() {
        const rulesContainer = document.createElement('div');
        rulesContainer.id = 'sport-rules-container';
        rulesContainer.innerHTML = `
            <div class="rules-header">
                <h1 class="rules-title">Sport Rules Guide</h1>
                <div class="rules-search">
                    <input type="text" id="rules-search-input" placeholder="Search rules..." />
                    <button id="rules-search-btn">Search</button>
                    <button id="rules-clear-search">Clear</button>
                </div>
            </div>
            
            <div class="rules-controls">
                <div class="sport-selector">
                    <label for="sport-dropdown">Select Sport:</label>
                    <select id="sport-dropdown">
                        <option value="">Choose a sport...</option>
                        ${Object.keys(this.sportsData)
        .map(key => `<option value="${key}">${this.sportsData[key].name}</option>`)
        .join('')}
                    </select>
                </div>
                
                <div class="variation-selector" id="variation-selector" style="display: none;">
                    <label for="variation-dropdown">Select Variation:</label>
                    <select id="variation-dropdown">
                        <option value="">Choose a variation...</option>
                    </select>
                </div>
                
                <div class="rules-actions">
                    <button id="print-rules">Print Rules</button>
                    <button id="back-to-main">Back to Main</button>
                </div>
            </div>
            
            <div id="rules-content" class="rules-content">
                <div class="welcome-message">
                    <h2>Welcome to the Sport Rules Guide</h2>
                    <p>Select a sport from the dropdown above to view comprehensive rules and variations.</p>
                    <div class="sports-grid">
                        ${Object.keys(this.sportsData)
        .map(
            key => `
                            <div class="sport-card" data-sport="${key}">
                                <h3>${this.sportsData[key].name}</h3>
                                <p>${this.sportsData[key].description}</p>
                                <small>${Object.keys(this.sportsData[key].variations).length} variations</small>
                            </div>
                        `
        )
        .join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(rulesContainer);
    }

    bindEvents() {
        // Sport selection
        document.getElementById('sport-dropdown').addEventListener('change', e => {
            this.selectSport(e.target.value);
        });

        // Variation selection
        document.getElementById('variation-dropdown').addEventListener('change', e => {
            this.selectVariation(e.target.value);
        });

        // Search functionality
        document.getElementById('rules-search-btn').addEventListener('click', () => {
            this.searchRules();
        });

        document.getElementById('rules-search-input').addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                this.searchRules();
            }
        });

        document.getElementById('rules-clear-search').addEventListener('click', () => {
            this.clearSearch();
        });

        // Print functionality
        document.getElementById('print-rules').addEventListener('click', () => {
            this.printRules();
        });

        // Back to main
        document.getElementById('back-to-main').addEventListener('click', () => {
            this.backToMain();
        });

        // Sport card clicks
        document.addEventListener('click', e => {
            if (e.target.closest('.sport-card')) {
                const sportKey = e.target.closest('.sport-card').dataset.sport;
                document.getElementById('sport-dropdown').value = sportKey;
                this.selectSport(sportKey);
            }
        });
    }

    selectSport(sportKey) {
        if (!sportKey) {
            this.currentSport = null;
            this.currentVariation = null;
            document.getElementById('variation-selector').style.display = 'none';
            this.showWelcomeMessage();
            return;
        }

        this.currentSport = sportKey;
        this.currentVariation = null;
        const sport = this.sportsData[sportKey];

        // Update variation dropdown
        const variationDropdown = document.getElementById('variation-dropdown');
        variationDropdown.innerHTML = '<option value="">Choose a variation...</option>';

        Object.keys(sport.variations).forEach(varKey => {
            const option = document.createElement('option');
            option.value = varKey;
            option.textContent = sport.variations[varKey].name;
            variationDropdown.appendChild(option);
        });

        document.getElementById('variation-selector').style.display = 'block';
        this.displaySportOverview(sport);
    }

    selectVariation(variationKey) {
        if (!this.currentSport || !variationKey) {
            if (this.currentSport) {
                this.displaySportOverview(this.sportsData[this.currentSport]);
            }
            return;
        }

        this.currentVariation = variationKey;
        const variation = this.sportsData[this.currentSport].variations[variationKey];
        this.displayVariationRules(variation);
    }

    displaySportOverview(sport) {
        const content = document.getElementById('rules-content');
        content.innerHTML = `
            <div class="sport-overview">
                <h2>${sport.name}</h2>
                <p class="sport-description">${sport.description}</p>
                
                <h3>Available Variations</h3>
                <div class="variations-grid">
                    ${Object.keys(sport.variations)
        .map(varKey => {
            const variation = sport.variations[varKey];
            return `
                            <div class="variation-card" data-variation="${varKey}">
                                <h4>${variation.name}</h4>
                                <div class="variation-quick-info">
                                    <span><strong>Players:</strong> ${variation.players}</span>
                                    <span><strong>Duration:</strong> ${variation.duration}</span>
                                </div>
                                <button class="select-variation-btn" 
                                    data-sport="${this.currentSport}" 
                                    data-variation="${varKey}">
                                    View Rules
                                </button>
                            </div>
                        `;
        })
        .join('')}
                </div>
            </div>
        `;

        // Bind variation card events
        content.addEventListener('click', e => {
            if (e.target.classList.contains('select-variation-btn')) {
                const variationKey = e.target.dataset.variation;
                document.getElementById('variation-dropdown').value = variationKey;
                this.selectVariation(variationKey);
            }
        });
    }

    displayVariationRules(variation) {
        const content = document.getElementById('rules-content');

        let rulesHtml;
        if (Array.isArray(variation.rules)) {
            rulesHtml = variation.rules.map(rule => `<li>${rule}</li>`).join('');
        } else if (typeof variation.rules === 'string') {
            rulesHtml = `<li>${variation.rules}</li>`;
        } else {
            rulesHtml = '<li>Standard rules apply</li>';
        }

        let foulsHtml;
        if (Array.isArray(variation.fouls)) {
            foulsHtml = variation.fouls.map(foul => `<li>${foul}</li>`).join('');
        } else if (typeof variation.fouls === 'string') {
            foulsHtml = `<li>${variation.fouls}</li>`;
        } else {
            foulsHtml = '<li>Standard fouls apply</li>';
        }

        let scoringHtml;
        if (Array.isArray(variation.scoring)) {
            scoringHtml = variation.scoring.map(score => `<li>${score}</li>`).join('');
        } else if (typeof variation.scoring === 'string') {
            scoringHtml = `<li>${variation.scoring}</li>`;
        } else {
            scoringHtml = '<li>Standard scoring applies</li>';
        }

        content.innerHTML = `
            <div class="variation-rules">
                <div class="rules-header-section">
                    <h2>${variation.name}</h2>
                    <div class="quick-stats">
                        <div class="stat">
                            <strong>Players:</strong> ${variation.players}
                        </div>
                        <div class="stat">
                            <strong>Duration:</strong> ${variation.duration}
                        </div>
                        <div class="stat">
                            <strong>Field/Court:</strong> ${variation.field}
                        </div>
                    </div>
                </div>

                <div class="rules-sections">
                    <div class="rules-section collapsible">
                        <h3 class="section-header" data-section="objective">
                            <span class="toggle-icon">▼</span> Objective
                        </h3>
                        <div class="section-content" id="objective">
                            <p>${variation.objective}</p>
                        </div>
                    </div>

                    <div class="rules-section collapsible">
                        <h3 class="section-header" data-section="equipment">
                            <span class="toggle-icon">▼</span> Equipment Needed
                        </h3>
                        <div class="section-content" id="equipment">
                            <p>${variation.equipment}</p>
                        </div>
                    </div>

                    <div class="rules-section collapsible">
                        <h3 class="section-header" data-section="rules">
                            <span class="toggle-icon">▼</span> Game Rules
                        </h3>
                        <div class="section-content" id="rules">
                            <ul>${rulesHtml}</ul>
                        </div>
                    </div>

                    <div class="rules-section collapsible">
                        <h3 class="section-header" data-section="scoring">
                            <span class="toggle-icon">▼</span> Scoring System
                        </h3>
                        <div class="section-content" id="scoring">
                            <ul>${scoringHtml}</ul>
                        </div>
                    </div>

                    <div class="rules-section collapsible">
                        <h3 class="section-header" data-section="fouls">
                            <span class="toggle-icon">▼</span> Fouls & Violations
                        </h3>
                        <div class="section-content" id="fouls">
                            <ul>${foulsHtml}</ul>
                        </div>
                    </div>
                </div>

                <div class="rules-footer">
                    <button id="toggle-all-sections" class="toggle-all-btn">Collapse All</button>
                    <button id="share-rules" class="share-btn">Share Rules</button>
                </div>
            </div>
        `;

        this.bindSectionEvents();
    }

    bindSectionEvents() {
        // Collapsible sections
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', e => {
                const sectionId = e.target.dataset.section || e.target.parentElement.dataset.section;
                const section = document.getElementById(sectionId);
                const icon = header.querySelector('.toggle-icon');

                if (section.style.display === 'none') {
                    section.style.display = 'block';
                    icon.textContent = '▼';
                } else {
                    section.style.display = 'none';
                    icon.textContent = '▶';
                }
            });
        });

        // Toggle all sections
        const toggleAllBtn = document.getElementById('toggle-all-sections');
        if (toggleAllBtn) {
            toggleAllBtn.addEventListener('click', () => {
                const sections = document.querySelectorAll('.section-content');
                const icons = document.querySelectorAll('.toggle-icon');
                const isExpanded = toggleAllBtn.textContent === 'Collapse All';

                sections.forEach(section => {
                    section.style.display = isExpanded ? 'none' : 'block';
                });

                icons.forEach(icon => {
                    icon.textContent = isExpanded ? '▶' : '▼';
                });

                toggleAllBtn.textContent = isExpanded ? 'Expand All' : 'Collapse All';
            });
        }

        // Share rules
        const shareBtn = document.getElementById('share-rules');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareRules();
            });
        }
    }

    showWelcomeMessage() {
        const content = document.getElementById('rules-content');
        content.innerHTML = `
            <div class="welcome-message">
                <h2>Welcome to the Sport Rules Guide</h2>
                <p>Select a sport from the dropdown above to view comprehensive rules and variations.</p>
                <div class="sports-grid">
                    ${Object.keys(this.sportsData)
        .map(
            key => `
                        <div class="sport-card" data-sport="${key}">
                            <h3>${this.sportsData[key].name}</h3>
                            <p>${this.sportsData[key].description}</p>
                            <small>${Object.keys(this.sportsData[key].variations).length} variations</small>
                        </div>
                    `
        )
        .join('')}
                </div>
            </div>
        `;
    }

    searchRules() {
        const searchTerm = document.getElementById('rules-search-input').value.toLowerCase();
        if (!searchTerm) {
            return;
        }

        const results = [];

        Object.keys(this.sportsData).forEach(sportKey => {
            const sport = this.sportsData[sportKey];

            // Search sport name and description
            if (sport.name.toLowerCase().includes(searchTerm) || sport.description.toLowerCase().includes(searchTerm)) {
                results.push({
                    type: 'sport',
                    sport: sportKey,
                    name: sport.name,
                    description: sport.description
                });
            }

            // Search variations
            Object.keys(sport.variations).forEach(varKey => {
                const variation = sport.variations[varKey];
                const searchableText = [
                    variation.name,
                    variation.objective,
                    variation.equipment,
                    Array.isArray(variation.rules) ? variation.rules.join(' ') : variation.rules,
                    Array.isArray(variation.fouls) ? variation.fouls.join(' ') : variation.fouls,
                    Array.isArray(variation.scoring) ? variation.scoring.join(' ') : variation.scoring
                ]
                    .join(' ')
                    .toLowerCase();

                if (searchableText.includes(searchTerm)) {
                    results.push({
                        type: 'variation',
                        sport: sportKey,
                        sportName: sport.name,
                        variation: varKey,
                        name: variation.name,
                        context: this.getSearchContext(searchableText, searchTerm)
                    });
                }
            });
        });

        this.displaySearchResults(results, searchTerm);
    }

    getSearchContext(text, searchTerm) {
        const index = text.indexOf(searchTerm);
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + searchTerm.length + 50);
        const context = text.substring(start, end);
        return `...${context}...`;
    }

    displaySearchResults(results, searchTerm) {
        const content = document.getElementById('rules-content');

        if (results.length === 0) {
            content.innerHTML = `
                <div class="search-results">
                    <h2>Search Results for "${searchTerm}"</h2>
                    <p>No results found. Try a different search term.</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="search-results">
                <h2>Search Results for "${searchTerm}" (${results.length} found)</h2>
                <div class="search-results-list">
                    ${results
        .map(
            result => `
                        <div class="search-result-item" 
                            data-sport="${result.sport}" 
                            data-variation="${result.variation || ''}">
                            <h3>${result.name}</h3>
                            <p class="result-type">${
    result.type === 'sport' ? 'Sport' : `${result.sportName} - Variation`
}</p>
                            ${result.description ? `<p class="result-description">${result.description}</p>` : ''}
                            ${result.context ? `<p class="result-context">${result.context}</p>` : ''}
                            <button class="view-result-btn">View ${result.type === 'sport' ? 'Sport' : 'Rules'}</button>
                        </div>
                    `
        )
        .join('')}
                </div>
            </div>
        `;

        // Bind search result events
        content.addEventListener('click', e => {
            if (e.target.classList.contains('view-result-btn')) {
                const item = e.target.closest('.search-result-item');
                const { sport } = item.dataset;
                const { variation } = item.dataset;

                document.getElementById('sport-dropdown').value = sport;
                this.selectSport(sport);

                if (variation) {
                    setTimeout(() => {
                        document.getElementById('variation-dropdown').value = variation;
                        this.selectVariation(variation);
                    }, 100);
                }
            }
        });
    }

    clearSearch() {
        document.getElementById('rules-search-input').value = '';
        this.showWelcomeMessage();
    }

    printRules() {
        const printContent = document.getElementById('rules-content').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Sport Rules - Finding Sports</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        h1, h2, h3 { color: #333; }
                        .section-content { display: block !important; }
                        .toggle-icon, button { display: none !important; }
                        .rules-section { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                        .quick-stats { display: flex; gap: 20px; margin: 10px 0; }
                        .stat { padding: 5px 10px; background: #f5f5f5; border-radius: 5px; }
                        ul { margin: 10px 0 10px 20px; }
                        li { margin: 5px 0; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Finding Sports - Rules Guide</h1>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    shareRules() {
        if (navigator.share && this.currentSport && this.currentVariation) {
            const sport = this.sportsData[this.currentSport];
            const variation = sport.variations[this.currentVariation];

            navigator
                .share({
                    title: `${variation.name} Rules - Finding Sports`,
                    text: `Check out the rules for ${variation.name}: ${variation.objective}`,
                    url: window.location.href
                })
                .catch(() => {
                    // Silently handle sharing error
                });
        } else {
            // Fallback: copy to clipboard
            const currentUrl = window.location.href;
            navigator.clipboard
                .writeText(currentUrl)
                .then(() => {
                    alert('Link copied to clipboard!');
                })
                .catch(() => {
                    alert('Unable to copy link. Please copy the URL manually.');
                });
        }
    }

    backToMain() {
        window.location.href = 'index.html';
    }

    loadDefaultSport() {
        // Load basketball as default sport for demonstration
        document.getElementById('sport-dropdown').value = 'basketball';
        this.selectSport('basketball');
    }
}

// Initialize the Sport Rules Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sportRulesManager = new SportRulesManager();
});

// Show/hide rules page functions for navigation
window.showRulesPage = function () {
    document.querySelector('.app-container').style.display = 'none';
    document.getElementById('sport-rules-container').style.display = 'block';
};

window.hideRulesPage = function () {
    document.querySelector('.app-container').style.display = 'block';
    document.getElementById('sport-rules-container').style.display = 'none';
};
