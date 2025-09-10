// Centralized animation configuration for all onboarding screens
export const ONBOARDING_ANIMATIONS = {
  // Core animation durations
  durations: {
    ashFadeIn: 800,           // Ash mascot fade in
    textBoxFadeIn: 600,       // Text box fade in
    buttonFadeIn: 600,        // Button fade in
    elementFadeIn: 600,       // General element fade in
    welcomeSlide: 800,        // Welcome screen SLAKR drop animation
    welcomeTagline: 600,      // Welcome screen tagline animations
    featureSlide: 600,        // Feature list slide animations
    timerFadeIn: 600,         // Timer card fade in
  },

  // Animation delays and timing
  delays: {
    textBoxAfterAsh: 0,       // Delay before text box appears after Ash
    buttonAfterText: 800,     // Delay before buttons appear after text
    featureStagger: 400,      // Stagger between feature animations
    phraseTransition: 600,    // Delay between typing phrases
    postAnimation: 500,       // General post-animation delay
    confettiDelay: 2000,      // Delay before post-confetti text
    welcomeSequence: 500,     // Welcome screen sequence delays
  },

  // Typing animation settings
  typing: {
    speed: {
      instant: 0,             // Instant typing (most screens)
      fast: 5,               // Fast typing (demo page)
      smooth: 30,             // Smooth typing (notifications page)
    },
    hapticInterval: 3,        // Haptic feedback every N characters
  },

  // Slide animation values
  slides: {
    welcome: {
      slakrDropDistance: -200,    // SLAKR drops from this Y position
      studySlideDistance: -150,   // "Study" slides from left
      streakSlideDistance: 0,     // "Streak" appears in place
      succeedSlideDistance: 150,  // "Succeed" slides from right
    },
    features: {
      leftSlideDistance: -100,    // Features sliding from left
      rightSlideDistance: 100,    // Features sliding from right
    },
  },

  // Fade animation values
  fades: {
    hidden: 0,                // Initial opacity for fade in animations
    visible: 1,               // Final opacity for fade in animations
  },

  // Native driver usage (performance)
  useNativeDriver: true,

  // Timer specific settings (demo page)
  timer: {
    updateInterval: 1000,     // Timer update interval in ms
  },
} as const;

// Helper functions for common animation patterns
export const createFadeInAnimation = (animatedValue: any, duration?: number) => ({
  toValue: ONBOARDING_ANIMATIONS.fades.visible,
  duration: duration || ONBOARDING_ANIMATIONS.durations.elementFadeIn,
  useNativeDriver: ONBOARDING_ANIMATIONS.useNativeDriver,
});

export const createSlideInAnimation = (animatedValue: any, toValue: number, duration?: number) => ({
  toValue,
  duration: duration || ONBOARDING_ANIMATIONS.durations.elementFadeIn,
  useNativeDriver: ONBOARDING_ANIMATIONS.useNativeDriver,
});

// Common animation sequences
export const ANIMATION_SEQUENCES = {
  // Standard Ash introduction sequence
  ashIntroSequence: {
    ashFadeIn: ONBOARDING_ANIMATIONS.durations.ashFadeIn,
    textBoxDelay: ONBOARDING_ANIMATIONS.delays.textBoxAfterAsh,
    textBoxFadeIn: ONBOARDING_ANIMATIONS.durations.textBoxFadeIn,
    buttonDelay: ONBOARDING_ANIMATIONS.delays.buttonAfterText,
    buttonFadeIn: ONBOARDING_ANIMATIONS.durations.buttonFadeIn,
    phraseTransition: ONBOARDING_ANIMATIONS.delays.phraseTransition,
    postAnimation: ONBOARDING_ANIMATIONS.delays.postAnimation,
  },
  
  // Feature animation sequence (solution page)
  featureSequence: {
    staggerDelay: ONBOARDING_ANIMATIONS.delays.featureStagger,
    leftSlideDistance: ONBOARDING_ANIMATIONS.slides.features.leftSlideDistance,
    rightSlideDistance: ONBOARDING_ANIMATIONS.slides.features.rightSlideDistance,
    duration: ONBOARDING_ANIMATIONS.durations.featureSlide,
  },
  
  // Welcome screen sequence
  welcomeSequence: {
    slakrDuration: ONBOARDING_ANIMATIONS.durations.welcomeSlide,
    taglineDuration: ONBOARDING_ANIMATIONS.durations.welcomeTagline,
    sequenceDelay: ONBOARDING_ANIMATIONS.delays.welcomeSequence,
    buttonDelay: ONBOARDING_ANIMATIONS.delays.buttonAfterText,
  },
};

// Screen-specific configurations
export const SCREEN_CONFIGS = {
  welcome: {
    typingSpeed: ONBOARDING_ANIMATIONS.typing.speed.instant,
    animations: ANIMATION_SEQUENCES.welcomeSequence,
    slides: ONBOARDING_ANIMATIONS.slides.welcome,
  },
  
  ashIntro: {
    typingSpeed: ONBOARDING_ANIMATIONS.typing.speed.instant,
    animations: ANIMATION_SEQUENCES.ashIntroSequence,
  },
  
  studyStruggle: {
    typingSpeed: ONBOARDING_ANIMATIONS.typing.speed.instant,
    animations: ANIMATION_SEQUENCES.ashIntroSequence,
  },
  
  solution: {
    typingSpeed: ONBOARDING_ANIMATIONS.typing.speed.instant,
    animations: ANIMATION_SEQUENCES.ashIntroSequence,
    features: ANIMATION_SEQUENCES.featureSequence,
  },
  
  appBlocking: {
    typingSpeed: ONBOARDING_ANIMATIONS.typing.speed.instant,
    animations: ANIMATION_SEQUENCES.ashIntroSequence,
  },
  
  demo: {
    typingSpeed: ONBOARDING_ANIMATIONS.typing.speed.fast,
    animations: ANIMATION_SEQUENCES.ashIntroSequence,
    timer: ONBOARDING_ANIMATIONS.timer,
    confettiDelay: ONBOARDING_ANIMATIONS.delays.confettiDelay,
  },
  
  notifications: {
    typingSpeed: ONBOARDING_ANIMATIONS.typing.speed.smooth,
    animations: ANIMATION_SEQUENCES.ashIntroSequence,
  },
} as const;
