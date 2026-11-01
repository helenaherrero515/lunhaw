export const lunhawContent = {
  brand: {
    name: "LUNHAW",
    tagline: "Public spaces & green mobility.",
    mascotAlt: "Lunhaw grasshopper mascot",
  },
  nav: {
    about: "About",
    createAccount: "Create Account",
    logIn: "Log in",
  },
  hero: {
    pill: "Public Spaces & Green Mobility",
    titleLines: [
      "Discover your space.",
      "Explore your city.",
      "Go greener.",
    ],
    lead: "Find parks and libraries near you, and how to get there.",
    ctaExplore: "Explore green spaces near you",
    ctaCompare: "Compare ways to get there",
    chips: {
      study: "Find a quiet place to study.",
      hopping: "Hopping across Metro Manila",
    },
  },
  ticker: [
    "Find your green space",
    "Discover a place to pause",
    "Find your way there",
  ],
  why: {
    eyebrow: "Why Lunhaw",
    statement: "The city is more than a place to pass through.",
    sub: "Parks, quiet corners and libraries are all around us, but hard to find.",
    payoff: "Lunhaw brings them closer.",
  },
  journey: {
    eyebrow: "How it works",
    title: "Discover it. Understand it. Get there.",
    lead: "Three steps from your front door to a green space or quiet desk.",
    steps: [
      {
        id: "step-1",
        num: "1",
        title: "Discover",
        desc: "Find pocket parks, libraries and reading centers near your barangay.",
      },
      {
        id: "step-2",
        num: "2",
        title: "Understand",
        desc: "See shade ratings, verified opening hours and available amenities.",
      },
      {
        id: "step-3",
        num: "3",
        title: "Get there",
        desc: "Follow walking and transit routes with readable boarding points.",
      },
    ],
  },
  features: {
    eyebrow: "Features",
    title: "Find a place. Reach it.",
    lead: "Everything you need to discover, understand, and get to green public spaces.",
    items: [
      {
        id: "explore",
        title: "Explore",
        desc: "Search parks, gardens, and reading centers with interactive map previews and category filters.",
        tag: "Directory",
      },
      {
        id: "commute",
        title: "Commute",
        desc: "Follow walking and public transit routes with readable steps, transfer points, and transparent estimates.",
        tag: "Transit",
      },
      {
        id: "green-index",
        title: "Green Index",
        desc: "See tree canopy cover and shade scores for any street or neighborhood before stepping outside.",
        tag: "Canopy",
      },
      {
        id: "libraries",
        title: "Libraries",
        desc: "Directory of public libraries and barangay reading centers with study desks, power outlets, and Wi-Fi.",
        tag: "Study",
      },
      {
        id: "saved",
        title: "Saved",
        desc: "Bookmark favorite study corners, picnic spots, and daily commute paths for quick reference.",
        tag: "Bookmarks",
      },
    ],
  },
  greenIndex: {
    eyebrow: "Green Index",
    title: "See what shade does to a street.",
    lead: "A street with trees is up to 6°C cooler and easier to walk. Slide to see.",
    sliderLabel: "Trees planted along the street",
    hint: "Drag to rotate street view",
    presets: [
      { count: 0, label: "Bare street", desc: "No trees, high heat" },
      { count: 6, label: "Some shade", desc: "Pocket shade, cooler walk" },
      { count: 12, label: "Tree-lined", desc: "Full canopy, comfortable" },
    ],
  },
  faq: {
    eyebrow: "FAQs",
    title: "Good to know.",
    items: [
      {
        question: "What is Lunhaw?",
        answer: "A guide to parks, gardens, libraries and reading centers in Metro Manila, and how to get there.",
        openByDefault: true,
      },
      {
        question: "How do I get to a place?",
        answer: "Compare walking and public transport options, step by step.",
        openByDefault: false,
      },
      {
        question: "What is the Green Index?",
        answer: "A score for the green space and shade around a place, with a note on how it was worked out.",
        openByDefault: false,
      },
      {
        question: "Can I trust the details?",
        answer: "Every detail is labelled Verified, Estimate or Not available yet. We never invent routes, fares or opening hours.",
        openByDefault: false,
      },
      {
        question: "How do I save places?",
        answer: "Create an account and add places to your Saved list.",
        openByDefault: false,
      },
    ],
  },
  libraries: {
    eyebrow: "Libraries",
    title: "As easy to find as a park.",
    lead: "Free places to study, in one directory.",
    replayBtn: "Drop the books again",
    hint: "Drag to rotate",
  },
  cta: {
    title: "Discover your space. Explore your city. Go greener.",
    ctaExplore: "Explore green spaces near you",
    ctaManual: "Enter your area manually",
  },
  footer: {
    brandTagline: "Public spaces & green mobility.",
    pagesTitle: "Pages",
    pages: [
      { label: "Lunhaw", href: "#top" },
      { label: "About Us", href: "#about" },
      { label: "Blog", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
    legalTitle: "Legal",
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
    newsletterTitle: "Stay in the loop",
    newsletterPlaceholder: "Your email",
    newsletterSuccess: "Thanks! We'll keep you posted.",
    newsletterError: "Please enter a valid email.",
    copyright: "© 2026 Lunhaw. Developed by HLN.",
    subtext: "Public spaces, made easier to find.",
  },
  auth: {
    signupTitle: "Create your account",
    signupSub: "Find your green space.",
    loginTitle: "Welcome back",
    loginSub: "Log in to continue.",
    doneSignupTitle: "Welcome to Lunhaw!",
    doneSignupSub: "Your green space is waiting.",
    doneLoginTitle: "Welcome back!",
    doneLoginSub: "You're logged in.",
    fields: {
      name: {
        label: "Name",
        placeholder: "Your name",
        error: "Please enter your name.",
      },
      email: {
        label: "Email",
        placeholder: "you@email.com",
        error: "Please enter a valid email.",
      },
      password: {
        label: "Password",
        placeholderSignup: "At least 8 characters",
        placeholderLogin: "Your password",
        errorShort: "Use at least 8 characters.",
        errorRequired: "Please enter your password.",
      },
    },
    buttons: {
      signup: "Create account",
      login: "Log in",
      done: "Done",
      showPassword: "Show",
      hidePassword: "Hide",
    },
    switch: {
      hasAccount: "Already have an account?",
      toLogin: "Log in",
      noAccount: "New to Lunhaw?",
      toSignup: "Sign up",
    },
  },
} as const;

export type LunhawContent = typeof lunhawContent;
