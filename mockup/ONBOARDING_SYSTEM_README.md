# Finding Sports - First-Time User Onboarding System

## Overview

The Finding Sports onboarding system provides a comprehensive, progressive guidance experience for new users to quickly understand and engage with the social feed features. The system consists of multiple components working together to create a smooth first-time user experience.

## Components

### 1. Interactive Tour (`onboarding.js`)
- **Purpose**: Guided walkthrough of key features
- **Activation**: Automatically for first-time users or manually via help menu
- **Features**:
  - 9-step progressive tour
  - Contextual tooltips
  - Feature highlighting
  - Progress tracking
  - Skip/restart options

### 2. Quick Setup Wizard (`quick-setup-wizard.js`)
- **Purpose**: Rapid preference configuration
- **Activation**: First visit when no preferences are set
- **Collects**:
  - Location (with auto-detect)
  - Sport preferences
  - Availability times
  - Notification preferences

### 3. Sample Content Generator (`sample-content-generator.js`)
- **Purpose**: Show realistic content in empty states
- **Features**:
  - Dynamic sample messages
  - Marketplace listings
  - Game suggestions
  - Clear "SAMPLE" indicators
  - Dismissible content

### 4. Progressive Feature Disclosure
- **Purpose**: Unlock features as users engage
- **Features**:
  - Basic chat (default)
  - Reactions (3+ messages)
  - Marketplace (2+ days active)
  - Create listings (profile complete)
  - Private messages (5+ games joined)

### 5. Contextual Tooltips
- **Purpose**: Just-in-time guidance
- **Triggers**: 
  - Hover over UI elements
  - First-time actions
  - Feature unlocks
- **Auto-dismiss**: After 5 seconds

## User Journey

### First Visit Flow
1. **Quick Setup Wizard** (2 minutes)
   - Location selection
   - Sport preferences
   - Availability setup
   
2. **Interactive Tour** (optional, 3-5 minutes)
   - Channel navigation
   - Social features
   - Marketplace overview
   - Messaging basics

3. **Sample Content** (immediate value)
   - Pre-populated channels
   - Example conversations
   - Sample marketplace items

### Returning User Flow
1. **Feature Unlocks**
   - Progressive capabilities
   - Achievement notifications
   - Mini-tutorials

2. **Contextual Help**
   - Tooltips on new features
   - Help menu access
   - Keyboard shortcuts

## Implementation Details

### CSS Classes
```css
.onboarding-overlay      /* Tour overlay */
.onboarding-tooltip      /* Tour tooltips */
.onboarding-highlight    /* Highlighted elements */
.sample-content-banner   /* Sample content indicator */
.setup-wizard-modal      /* Quick setup modal */
.contextual-tooltip      /* Hover tooltips */
```

### JavaScript API
```javascript
// Onboarding Tour
window.OnboardingSystem.initialize()
window.OnboardingSystem.startTour()
window.OnboardingSystem.restartTour()

// Quick Setup
window.QuickSetupWizard.show()
window.QuickSetupWizard.shouldShow()

// Sample Content
window.SampleContentGenerator.initializeForChannel(channel)
window.SampleContentGenerator.shouldShowSampleContent()
```

### Local Storage Keys
- `onboardingCompleted` - Tour completion status
- `setupCompleted` - Setup wizard completion
- `hideSampleContent` - Sample content preference
- `messageCount` - Messages sent (for unlocks)
- `firstVisit` - First visit timestamp
- `userLocation` - User's location preference
- `preferredSports` - Selected sports
- `tooltip_[selector]` - Tooltip shown status

## Customization

### Tour Steps
Edit `tourSteps` array in `onboarding.js`:
```javascript
tourSteps: [
  {
    id: 'custom-step',
    target: '.element-selector',
    title: 'Step Title',
    content: 'Step description',
    position: 'bottom',
    highlight: true
  }
]
```

### Feature Gates
Modify `featureGates` in `onboarding.js`:
```javascript
featureGates: {
  customFeature: { 
    unlocked: false, 
    level: 5, 
    requirement: 'Custom requirement' 
  }
}
```

### Sample Content
Update arrays in `sample-content-generator.js`:
- `sampleUsers` - Demo user profiles
- `sampleMessages` - Channel-specific messages
- `sampleGames` - Example games

## Analytics Integration

The system tracks key events:
- `tour_started`
- `tour_completed`
- `tour_skipped`
- `step_viewed`
- `feature_unlocked`
- `setup_completed`

Integrate with your analytics provider in `trackEvent()` method.

## Best Practices

1. **Don't Overwhelm**
   - Show tour only on first visit
   - Allow skipping at any point
   - Use progressive disclosure

2. **Provide Value Immediately**
   - Sample content shows real use cases
   - Quick setup gets users started fast
   - Contextual help appears when needed

3. **Respect User Preferences**
   - Remember dismissal choices
   - Allow tour restart from help menu
   - Make sample content clearly marked

4. **Mobile Considerations**
   - Responsive tour positioning
   - Touch-friendly controls
   - Simplified mobile flow

## Testing

### Reset Onboarding
```javascript
// Clear all onboarding data
localStorage.removeItem('onboardingCompleted');
localStorage.removeItem('setupCompleted');
localStorage.removeItem('hideSampleContent');
localStorage.removeItem('firstVisit');
localStorage.removeItem('messageCount');
// Refresh page
```

### Force Show Components
```javascript
// Show tour
window.OnboardingSystem.startTour();

// Show setup wizard
window.QuickSetupWizard.show();

// Show sample content
localStorage.removeItem('hideSampleContent');
location.reload();
```

## Troubleshooting

### Tour Not Showing
- Check `localStorage.onboardingCompleted`
- Verify first visit detection
- Check browser console for errors

### Sample Content Issues
- Ensure scripts load in correct order
- Check `shouldShowSampleContent()` logic
- Verify sample data arrays

### Feature Unlocks Not Working
- Check localStorage counters
- Verify unlock conditions
- Test `checkFeatureProgress()` manually

## Future Enhancements

1. **A/B Testing**
   - Different tour flows
   - Varied sample content
   - Alternative unlock requirements

2. **Personalization**
   - Sport-specific tours
   - Location-based content
   - Skill level adaptation

3. **Gamification**
   - Achievement system
   - Progress badges
   - Onboarding rewards

4. **Analytics Dashboard**
   - Completion rates
   - Drop-off points
   - Feature adoption metrics