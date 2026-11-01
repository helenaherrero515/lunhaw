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
    title: "The city is more than a place to pass through.",
    paragraph: "Parks, quiet corners and libraries are all around us, but hard to find.",
    big: "Lunhaw brings them closer.",
    stats: [
      {
        target: 17,
        suffix: "",
        label: "Cities & municipalities across Metro Manila",
      },
      {
        target: 3,
        suffix: "",
        label: "Tiers of data integrity: Verified, Estimate, or Not available yet",
      },
      {
        target: 100,
        suffix: "%",
        label: "Transparent calculation for every Green Index score",
      },
    ],
  },
  journey: {
    eyebrow: "How it works",
    title: "Discover it. Understand it. Get there.",
    lead: "Three steps from your front door to a green space or quiet desk.",
    steps: [
      {
        id: "step-1",
        num: "01",
        title: "Discover",
        desc: "Find pocket parks, libraries and reading centers near your barangay.",
        tag: "Nearby",
      },
      {
        id: "step-2",
        num: "02",
        title: "Understand",
        desc: "See shade ratings, verified opening hours and available amenities.",
        tag: "Green Index",
      },
      {
        id: "step-3",
        num: "03",
        title: "Get there",
        desc: "Follow walking and transit routes with readable boarding points.",
        tag: "Commute",
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
  transparency: {
    eyebrow: "Data Integrity",
    title: "Honest about what we know.",
    lead: "We never invent routes, fares, opening hours or amenities. Every detail is clearly labelled.",
    disclaimer:
      "Please verify operating hours directly with the facility before visiting, as local barangay schedules may change without notice.",
    cards: [
      {
        id: "verified",
        label: "Verified",
        status: "VERIFIED",
        badge: "Official source + date",
        desc: "Confirmed directly with official LGU notices, municipal websites, or transit authorities with a timestamp.",
      },
      {
        id: "estimate",
        label: "Estimate",
        status: "ESTIMATE",
        badge: "Calculation explained",
        desc: "Clearly labelled with a short note explaining how it was calculated (e.g. standard walking pace or per-km fare).",
      },
      {
        id: "not-available",
        label: "Not available yet",
        status: "NOT_AVAILABLE",
        badge: "We say so instead of guessing",
        desc: "We explicitly say so instead of guessing or hallucinating missing details.",
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
