
/**
 * FunZone Arcade - Main Application Controller
 * 30 Games | 10 Categories
 */

(function () {
  'use strict';

  // ==========================================
  // GAME CATALOG - ALL 30 GAMES
  // ==========================================

  const GAMES_CATALOG = [
    {
      id: 'cyber-dash',
      title: 'Cyber Dash',
      category: 'Racing',
      description: 'High-speed synthwave highway runner! Weave through traffic, grab fuel cells, and trigger nitro overdrive.',
      thumbnail: 'assets/thumbnails/cyber-dash.svg',
      badge: 'POPULAR',
      tags: ['Highway', 'Synthwave', 'Speed', 'Nitro']
    },
    {
      id: 'galaxy-strike',
      title: 'Galaxy Strike',
      category: 'Action',
      description: 'Classic vertical space blaster! Defeat alien fleets, collect weapon upgrades, and battle massive bosses.',
      thumbnail: 'assets/thumbnails/galaxy-strike.svg',
      badge: 'FEATURED',
      tags: ['Space', 'Shooter', 'Boss Fight', 'Retro']
    },
    {
      id: 'neon-breaker',
      title: 'Neon Breaker',
      category: 'Action',
      description: 'Cyberpunk brick breaker! Smash glowing bricks with multi-balls, explosive charges, and laser cannons.',
      thumbnail: 'assets/thumbnails/neon-breaker.svg',
      badge: 'HOT',
      tags: ['Arkanoid', 'Breakout', 'Powerups', 'Action']
    },
    {
      id: 'neon-viper',
      title: 'Neon Viper',
      category: 'Casual',
      description: 'The iconic snake game reimagined with electric neon aesthetics, multiplier combos, and special time-freeze bugs.',
      thumbnail: 'assets/thumbnails/neon-viper.svg',
      badge: 'CLASSIC',
      tags: ['Snake', 'Retro', 'Combos', 'Grid']
    },
    {
      id: 'meteor-strike',
      title: 'Meteor Strike',
      category: 'Action',
      description: 'Asteroid blaster! Rotate, fire thrusters, fracture meteors, and dodge alien scouts.',
      thumbnail: 'assets/thumbnails/meteor-strike.svg',
      badge: 'RETRO',
      tags: ['Physics', 'Asteroids', 'Space']
    },
    {
      id: 'cosmic-jetpack',
      title: 'Cosmic Jetpack',
      category: 'Casual',
      description: 'Propel your astronaut through space with an ion jetpack! Dodge laser gates and collect nebula crystals.',
      thumbnail: 'assets/thumbnails/cosmic-jetpack.svg',
      badge: 'ADDICTIVE',
      tags: ['Physics', 'Flapper', 'Jetpack', 'Skill']
    },
    {
      id: 'drift-rush',
      title: 'Drift Rush',
      category: 'Racing',
      description: 'Master high-speed top-down drifting! Slide around corners, beat checkpoint clocks, and set lap records.',
      thumbnail: 'assets/thumbnails/drift-rush.svg',
      badge: 'PRO',
      tags: ['Circuit', 'Drift', 'Time Attack', 'Car']
    },
    {
      id: 'jewel-fusion',
      title: 'Jewel Fusion',
      category: 'Puzzle',
      description: 'Luminous match-3 puzzle! Connect crystals, trigger explosive bombs, and create cascading chain reactions.',
      thumbnail: 'assets/thumbnails/jewel-fusion.svg',
      badge: 'PUZZLE',
      tags: ['Match 3', 'Gems', 'Cascades', 'Combos']
    },
    {
      id: 'memory-matrix',
      title: 'Memory Matrix',
      category: 'Puzzle',
      description: 'Memorize glowing node patterns and replay the sequences to challenge your memory.',
      thumbnail: 'assets/thumbnails/memory-matrix.svg',
      badge: 'BRAIN',
      tags: ['Memory', 'Simon', 'Music', 'Hacker']
    },
    {
      id: 'tower-stack',
      title: 'Tower Stack',
      category: 'Casual',
      description: 'Build a towering structure with precise timing. Align each moving block and beat your best height.',
      thumbnail: 'assets/thumbnails/tower-stack.svg',
      badge: 'ZEN',
      tags: ['Timing', 'Stack', 'Minimalist']
    },
    {
      id: 'sudoku-master',
      title: 'Sudoku Master',
      category: 'Puzzle',
      description: 'Challenge your logic with number-placement puzzles.',
      thumbnail: 'assets/thumbnails/sudoku-master.svg',
      badge: 'NEW',
      tags: ['Numbers', 'Logic', 'Brain']
    },
    {
      id: 'nonogram-pixel-art',
      title: 'Nonogram Pixel Art',
      category: 'Puzzle',
      description: 'Solve number clues to reveal pixel pictures.',
      thumbnail: 'assets/thumbnails/nonogram-pixel-art.svg',
      badge: 'NEW',
      tags: ['Pixel Art', 'Logic', 'Puzzle']
    },
    {
      id: 'codebreaker',
      title: 'Codebreaker',
      category: 'Puzzle',
      description: 'Crack secret codes using logic and deduction.',
      thumbnail: 'assets/thumbnails/codebreaker.svg',
      badge: 'NEW',
      tags: ['Code', 'Logic', 'Strategy']
    },
    {
      id: 'word-search-quest',
      title: 'Word Search Quest',
      category: 'Puzzle',
      description: 'Find hidden words across challenging letter grids.',
      thumbnail: 'assets/thumbnails/word-search-quest.svg',
      badge: 'NEW',
      tags: ['Words', 'Vocabulary', 'Brain']
    },
    {
      id: 'math-24-challenge',
      title: 'Math 24 Challenge',
      category: 'Puzzle',
      description: 'Combine numbers and operations to make 24.',
      thumbnail: 'assets/thumbnails/math-24-challenge.svg',
      badge: 'NEW',
      tags: ['Math', 'Numbers', 'Challenge']
    },
    {
      id: 'unblock-escape',
      title: 'Unblock Escape',
      category: 'Puzzle',
      description: 'Slide blocks strategically to clear the exit.',
      thumbnail: 'assets/thumbnails/unblock-escape.svg',
      badge: 'NEW',
      tags: ['Blocks', 'Logic', 'Strategy']
    },
    {
      id: 'lights-out',
      title: 'Lights Out',
      category: 'Puzzle',
      description: 'Switch off every light using clever moves.',
      thumbnail: 'assets/thumbnails/lights-out.svg',
      badge: 'NEW',
      tags: ['Logic', 'Lights', 'Brain']
    },
    {
      id: 'circuit-connect',
      title: 'Circuit Connect',
      category: 'Puzzle',
      description: 'Connect circuit paths to complete each board.',
      thumbnail: 'assets/thumbnails/circuit-connect.svg',
      badge: 'NEW',
      tags: ['Circuits', 'Logic', 'Connection']
    },
    {
      id: 'tangram-builder',
      title: 'Tangram Builder',
      category: 'Puzzle',
      description: 'Arrange geometric pieces to complete shapes.',
      thumbnail: 'assets/thumbnails/tangram-builder.svg',
      badge: 'NEW',
      tags: ['Shapes', 'Geometry', 'Creative']
    },
    {
      id: 'balloon-pop-frenzy',
      title: 'Balloon Pop Frenzy',
      category: 'Casual',
      description: 'Pop colorful balloons before they float away! Tap quickly, collect bonuses, and protect your lives.',
      thumbnail: 'assets/thumbnails/balloon-pop-frenzy.svg',
      badge: 'NEW',
      tags: ['Reflex', 'Click & Tap', 'Fast-Paced']
    },
    {
      id: 'mini-tower-defense',
      title: 'Mini Tower Defense',
      category: 'Strategy',
      description: 'Build defenses and stop incoming enemy waves.',
      thumbnail: 'assets/thumbnails/mini-tower-defense.svg',
      badge: 'NEW',
      tags: ['Defense', 'Towers', 'Strategy']
    },
    {
      id: 'reversi-arena',
      title: 'Reversi Arena',
      category: 'Strategy',
      description: 'Outsmart your opponent in a classic board battle.',
      thumbnail: 'assets/thumbnails/reversi-arena.svg',
      badge: 'NEW',
      tags: ['Board Game', 'Strategy', 'AI']
    },
    {
      id: 'kingdom-tactics',
      title: 'Kingdom Tactics',
      category: 'Strategy',
      description: 'Command your units and plan tactical moves.',
      thumbnail: 'assets/thumbnails/kingdom-tactics.svg',
      badge: 'NEW',
      tags: ['Tactics', 'Kingdom', 'Strategy']
    },
    {
      id: 'factory-manager',
      title: 'Factory Manager',
      category: 'Simulation',
      description: 'Manage production and grow your factory.',
      thumbnail: 'assets/thumbnails/factory-manager.svg',
      badge: 'NEW',
      tags: ['Factory', 'Management', 'Simulation']
    },
    {
      id: 'mini-golf-worlds',
      title: 'Mini Golf Worlds',
      category: 'Sports',
      description: 'Aim carefully and complete fun mini golf courses.',
      thumbnail: 'assets/thumbnails/mini-golf-worlds.svg',
      badge: 'NEW',
      tags: ['Golf', 'Sports', 'Skill']
    },
    {
      id: 'pinball-galaxy',
      title: 'Pinball Galaxy',
      category: 'Arcade',
      description: 'Launch the ball and chase high scores.',
      thumbnail: 'assets/thumbnails/pinball-galaxy.svg',
      badge: 'NEW',
      tags: ['Pinball', 'Arcade', 'Reflex']
    },
    {
      id: 'rope-rescue',
      title: 'Rope Rescue',
      category: 'Puzzle',
      description: 'Cut ropes strategically to complete each rescue.',
      thumbnail: 'assets/thumbnails/rope-rescue.svg',
      badge: 'NEW',
      tags: ['Physics', 'Rescue', 'Puzzle']
    },
    {
      id: 'laser-bounce',
      title: 'Laser Bounce',
      category: 'Puzzle',
      description: 'Redirect laser beams using mirrors and angles.',
      thumbnail: 'assets/thumbnails/laser-bounce.svg',
      badge: 'NEW',
      tags: ['Laser', 'Mirrors', 'Logic']
    },
    {
      id: 'rhythm-reactor',
      title: 'Rhythm Reactor',
      category: 'Music',
      description: 'Follow the beat and hit notes with perfect timing.',
      thumbnail: 'assets/thumbnails/rhythm-reactor.svg',
      badge: 'NEW',
      tags: ['Music', 'Rhythm', 'Timing']
    },
    {
      id: 'precision-archery',
      title: 'Precision Archery',
      category: 'Skill',
      description: 'Aim, control your shot, and hit the target.',
      thumbnail: 'assets/thumbnails/precision-archery.svg',
      badge: 'NEW',
      tags: ['Archery', 'Aim', 'Precision']
    }
  ];

  // ==========================================
  // GAME TYPE LABELS
  // ==========================================

  const GAME_TYPES = {
    'cyber-dash': 'RACING',
    'galaxy-strike': 'SHOOTER',
    'neon-breaker': 'ARCADE',
    'neon-viper': 'ARCADE',
    'meteor-strike': 'ACTION',
    'cosmic-jetpack': 'SKILL',
    'drift-rush': 'RACING',
    'jewel-fusion': 'PUZZLE',
    'memory-matrix': 'MEMORY',
    'tower-stack': 'ZEN',
    'sudoku-master': 'PUZZLE',
    'nonogram-pixel-art': 'LOGIC',
    'codebreaker': 'LOGIC',
    'word-search-quest': 'WORD',
    'math-24-challenge': 'MATH',
    'unblock-escape': 'PUZZLE',
    'lights-out': 'LOGIC',
    'circuit-connect': 'LOGIC',
    'tangram-builder': 'CREATIVE',
    'balloon-pop-frenzy': 'REFLEX',
    'mini-tower-defense': 'STRATEGY',
    'reversi-arena': 'BOARD GAME',
    'kingdom-tactics': 'TACTICS',
    'factory-manager': 'SIMULATION',
    'mini-golf-worlds': 'SPORTS',
    'pinball-galaxy': 'ARCADE',
    'rope-rescue': 'PUZZLE',
    'laser-bounce': 'LOGIC',
    'rhythm-reactor': 'MUSIC',
    'precision-archery': 'SKILL'
  };

  function getGameType(game) {
    return GAME_TYPES[game.id] || game.category.toUpperCase();
  }

  // ==========================================
  // SAFE LOCAL STORAGE
  // ==========================================

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.warn(`Could not read localStorage key: ${key}`, error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Could not save localStorage key: ${key}`, error);
      return false;
    }
  }

  function readHighScore(gameId) {
    try {
      const value = parseInt(
        localStorage.getItem(`funzone_high_${gameId}`) || '0',
        10
      );
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch (error) {
      return 0;
    }
  }

  function saveHighScore(gameId, score) {
    const previous = readHighScore(gameId);
    const numericScore = Number(score) || 0;

    if (numericScore > previous) {
      try {
        localStorage.setItem(`funzone_high_${gameId}`, String(numericScore));
        return true;
      } catch (error) {
        console.warn('Could not save high score:', error);
      }
    }

    return false;
  }

  // ==========================================
  // APPLICATION STATE
  // ==========================================

  const savedFavorites = readStorage('funzone_favorites', []);

  const state = {
    activeCategory: 'All',
    searchQuery: '',
    favorites: Array.isArray(savedFavorites)
      ? savedFavorites.filter(id =>
          GAMES_CATALOG.some(game => game.id === id)
        )
      : [],
    currentGame: null,
    currentCallbacks: null,
    isMuted: false,
    soundVolume: 0.3,
    joystick: null
  };

  const elements = {};

  // ==========================================
  // INITIALIZATION
  // ==========================================

  function initApp() {
    cacheElements();
    setupEventListeners();
    renderGameCards();
    initHeroCanvas();
    updateFavoritesBadge();
    checkURLHash();
  }

  function cacheElements() {
    elements.gamesGrid = document.getElementById('games-grid');
    elements.searchBar = document.getElementById('search-input');
    elements.searchClearBtn = document.getElementById('search-clear');
    elements.categoryPills = document.querySelectorAll('.cat-pill');
    elements.gamesCount = document.getElementById('games-count');

    elements.quickPlayBtn = document.getElementById('quick-play-btn');
    elements.browseGamesBtn = document.getElementById('browse-games-btn');

    elements.gameModal = document.getElementById('game-modal');
    elements.gameCanvas = document.getElementById('game-canvas');
    elements.modalTitle = document.getElementById('modal-game-title');
    elements.modalCategory = document.getElementById('modal-game-category');
    elements.modalInstructions = document.getElementById('modal-game-instructions');
    elements.modalScore = document.getElementById('hud-score');
    elements.modalHighScore = document.getElementById('hud-high-score');
    elements.modalLives = document.getElementById('hud-lives');
    elements.modalLivesContainer = document.getElementById('hud-lives-container');
    elements.modalLivesLabel = document.getElementById('hud-lives-label');
    elements.modalCloseBtn = document.getElementById('modal-close-btn');
    elements.modalRestartBtn = document.getElementById('modal-restart-btn');
    elements.modalFullscreenBtn = document.getElementById('modal-fullscreen-btn');
    elements.modalSoundBtn = document.getElementById('modal-sound-btn');
    elements.modalMuteIcon = document.getElementById('modal-mute-icon');

    elements.gameOverOverlay = document.getElementById('game-over-overlay');
    elements.gameOverScore = document.getElementById('game-over-final-score');
    elements.gameOverHighScore = document.getElementById('game-over-best-score');
    elements.newRecordBanner = document.getElementById('new-record-banner');
    elements.btnPlayAgain = document.getElementById('btn-play-again');
    elements.btnExitGame = document.getElementById('btn-exit-game');

    elements.navMuteBtn = document.getElementById('nav-sound-toggle');
    elements.navMuteIcon = document.getElementById('nav-mute-icon');
    elements.navFavoritesBtn = document.getElementById('nav-favorites-btn');
    elements.navFavCount = document.getElementById('nav-fav-count');
    elements.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    elements.navLinks = document.getElementById('nav-links');

    elements.policyModal = document.getElementById('policy-modal');
    elements.policyModalTitle = document.getElementById('policy-modal-title');
    elements.policyModalBody = document.getElementById('policy-modal-body');
    elements.policyModalClose = document.getElementById('policy-modal-close');

    elements.contactForm = document.getElementById('contact-form');
    elements.toastNotification = document.getElementById('toast-notification');

    elements.mobileGamepad = document.getElementById('mobile-gamepad');
    elements.joystickWrapper = document.getElementById('joystick-wrapper');
    elements.joystickBase = document.getElementById('joystick-base');
    elements.joystickKnob = document.getElementById('joystick-knob');
    elements.joystickLabel = document.getElementById('joystick-label');
    elements.actionCluster = document.getElementById('action-cluster');
    elements.directTouchHint = document.getElementById('direct-touch-hint');
    elements.directTouchText = document.getElementById('direct-touch-text');
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  function setupEventListeners() {
    if (elements.searchBar) {
      elements.searchBar.addEventListener('input', event => {
        state.searchQuery = event.target.value.trim().toLowerCase();

        if (elements.searchClearBtn) {
          elements.searchClearBtn.style.display =
            state.searchQuery ? 'block' : 'none';
        }

        renderGameCards();
      });
    }

    if (elements.searchClearBtn) {
      elements.searchClearBtn.addEventListener('click', clearSearch);
    }

    elements.categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        setActiveCategory(pill.dataset.category || 'All');

        if (window.ArcadeAudio) {
          window.ArcadeAudio.playClick();
        }
      });
    });

    if (elements.quickPlayBtn) {
      elements.quickPlayBtn.addEventListener('click', () => {
        const availableGames = GAMES_CATALOG.filter(game =>
          window.ArcadeGames &&
          window.ArcadeGames[game.id]
        );

        if (!availableGames.length) {
          showToast('No playable games are currently available.');
          return;
        }

        const randomIndex = Math.floor(Math.random() * availableGames.length);
        launchGame(availableGames[randomIndex].id);
      });
    }

    if (elements.browseGamesBtn) {
      elements.browseGamesBtn.addEventListener('click', event => {
        event.preventDefault();
        scrollToGames();
      });
    }

    if (elements.navMuteBtn) {
      elements.navMuteBtn.addEventListener('click', toggleMute);
    }

    if (elements.modalSoundBtn) {
      elements.modalSoundBtn.addEventListener('click', toggleMute);
    }

    if (elements.navFavoritesBtn) {
      elements.navFavoritesBtn.addEventListener('click', event => {
        event.preventDefault();
        setActiveCategory('Favorites');
        scrollToGames();
      });
    }

    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener('click', closeGameModal);
    }

    if (elements.btnExitGame) {
      elements.btnExitGame.addEventListener('click', closeGameModal);
    }

    if (elements.modalRestartBtn) {
      elements.modalRestartBtn.addEventListener('click', restartCurrentGame);
    }

    if (elements.btnPlayAgain) {
      elements.btnPlayAgain.addEventListener('click', restartCurrentGame);
    }

    if (elements.modalFullscreenBtn) {
      elements.modalFullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    setupMobileMenu();
    setupMobileGamepad();
    setupKeyboardShortcuts();
    setupLegalModals();
    setupContactForm();
  }

  function setupMobileMenu() {
    if (!elements.mobileMenuToggle || !elements.navLinks) return;

    elements.mobileMenuToggle.addEventListener('click', () => {
      elements.navLinks.classList.toggle('open');
    });

    elements.navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        elements.navLinks.classList.remove('open');
      });
    });
  }

  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', event => {
      if (
        event.key === 'Escape' &&
        elements.gameModal &&
        elements.gameModal.classList.contains('active')
      ) {
        closeGameModal();
      }
    });
  }

  function clearSearch() {
    if (elements.searchBar) {
      elements.searchBar.value = '';
      elements.searchBar.focus();
    }

    state.searchQuery = '';

    if (elements.searchClearBtn) {
      elements.searchClearBtn.style.display = 'none';
    }

    renderGameCards();
  }

  function setActiveCategory(category) {
    state.activeCategory = category;

    elements.categoryPills.forEach(pill => {
      pill.classList.toggle(
        'active',
        pill.dataset.category === category
      );
    });

    renderGameCards();
  }

  function scrollToGames() {
    const gamesSection = document.getElementById('games');

    if (gamesSection) {
      gamesSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ==========================================
  // MOBILE GAME CONTROLS
  // ==========================================

  const GAME_CONTROLS = {
    'cyber-dash': {
      hasJoystick: true,
      joystickLabel: 'STEER / BOOST',
      buttons: [
        { action: 'actionA', label: 'NITRO', icon: '⚡', color: 'cyan' },
        { action: 'actionB', label: 'BRAKE', icon: '🛑', color: 'pink' }
      ]
    },

    'galaxy-strike': {
      hasJoystick: true,
      joystickLabel: 'MOVE SHIP',
      buttons: [
        { action: 'actionA', label: 'SHOOT', icon: '🚀', color: 'cyan', autoRepeat: true },
        { action: 'actionB', label: 'BOMB', icon: '💣', color: 'pink' }
      ]
    },

    'neon-breaker': {
      hasJoystick: true,
      joystickLabel: 'PADDLE',
      buttons: [
        { action: 'actionA', label: 'LAUNCH', icon: '🚀', color: 'cyan' }
      ]
    },

    'neon-viper': {
      hasJoystick: true,
      joystickLabel: 'STEER VIPER',
      buttons: [
        { action: 'actionA', label: 'BOOST', icon: '⚡', color: 'green' }
      ]
    },

    'meteor-strike': {
      hasJoystick: true,
      joystickLabel: 'ROTATE / THRUST',
      buttons: [
        { action: 'actionA', label: 'FIRE', icon: '⚡', color: 'cyan', autoRepeat: true },
        { action: 'up', label: 'THRUST', icon: '🚀', color: 'gold' },
        { action: 'actionB', label: 'WARP', icon: '🌀', color: 'purple' }
      ]
    },

    'cosmic-jetpack': {
      hasJoystick: false,
      buttons: [
        { action: 'actionA', label: 'THRUST', icon: '🚀', color: 'cyan', isLarge: true }
      ]
    },

    'drift-rush': {
      hasJoystick: true,
      joystickLabel: 'STEER CAR',
      buttons: [
        { action: 'actionA', label: 'DRIFT', icon: '💨', color: 'pink' },
        { action: 'up', label: 'GAS', icon: '⚡', color: 'cyan' },
        { action: 'down', label: 'BRAKE', icon: '🛑', color: 'orange' }
      ]
    },

    'jewel-fusion': {
      hasJoystick: false,
      buttons: [],
      hintText: 'Touch & swipe gems directly on the grid to create match-3 chains!'
    },

    'memory-matrix': {
      hasJoystick: false,
      buttons: [],
      hintText: 'Watch the pattern flash, then tap the glowing cyber nodes!'
    },

    'tower-stack': {
      hasJoystick: false,
      buttons: [
        { action: 'actionA', label: 'DROP', icon: '🔽', color: 'cyan', isLarge: true }
      ]
    }
  };

  function setupMobileGamepad() {
    if (
      !elements.joystickBase ||
      !elements.joystickKnob ||
      typeof VirtualJoystick === 'undefined'
    ) {
      return;
    }

    state.joystick = new VirtualJoystick(
      elements.joystickBase,
      elements.joystickKnob,
      {
        maxRadius: 42,
        deadzone: 0.16,

        onMove: data => {
          const game = getCurrentGameEngine();
          if (!game || typeof game.handleInput !== 'function') return;

          game.handleInput('vector', true, data);
          game.handleInput('left', data.left);
          game.handleInput('right', data.right);
          game.handleInput('up', data.up);
          game.handleInput('down', data.down);
        },

        onEnd: () => {
          const game = getCurrentGameEngine();
          if (!game || typeof game.handleInput !== 'function') return;

          game.handleInput('vector', false, {
            vx: 0,
            vy: 0,
            left: false,
            right: false,
            up: false,
            down: false
          });

          game.handleInput('left', false);
          game.handleInput('right', false);
          game.handleInput('up', false);
          game.handleInput('down', false);
        }
      }
    );
  }

  function getCurrentGameEngine() {
    if (!state.currentGame || !window.ArcadeGames) return null;
    return window.ArcadeGames[state.currentGame.id] || null;
  }

  function configureControlsForGame(gameId) {
    const config = GAME_CONTROLS[gameId] || {
      hasJoystick: false,
      buttons: [],
      hintText: 'Touch or tap directly on the game screen to play!'
    };

    if (elements.joystickWrapper) {
      if (config.hasJoystick) {
        elements.joystickWrapper.style.display = 'flex';

        if (elements.joystickLabel) {
          elements.joystickLabel.textContent =
            config.joystickLabel || 'STEER / MOVE';
        }
      } else {
        elements.joystickWrapper.style.display = 'none';

        if (state.joystick) {
          state.joystick.reset();
        }
      }
    }

    if (elements.actionCluster) {
      elements.actionCluster.innerHTML = '';

      if (config.buttons && config.buttons.length) {
        elements.actionCluster.style.display = 'flex';

        config.buttons.forEach(buttonDefinition => {
          const button = document.createElement('button');

          button.type = 'button';
          button.className =
            `action-touch-btn color-${buttonDefinition.color || 'cyan'} ` +
            `${buttonDefinition.isLarge ? 'large-btn' : ''}`;

          button.dataset.action = buttonDefinition.action;
          button.setAttribute('aria-label', buttonDefinition.label);

          button.innerHTML = `
            <span class="btn-icon">${buttonDefinition.icon || '⚡'}</span>
            <span class="btn-label">${buttonDefinition.label}</span>
          `;

          let repeatInterval = null;
          let isPressed = false;

          const handleStart = event => {
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();

            if (isPressed) return;
            isPressed = true;

            button.classList.add('pressed');

            const game = getCurrentGameEngine();

            if (game && typeof game.handleInput === 'function') {
              game.handleInput(buttonDefinition.action, true);
            }

            if (buttonDefinition.autoRepeat) {
              repeatInterval = setInterval(() => {
                const activeGame = getCurrentGameEngine();

                if (
                  activeGame &&
                  typeof activeGame.handleInput === 'function'
                ) {
                  activeGame.handleInput(buttonDefinition.action, true);
                }
              }, 160);
            }
          };

          const handleEnd = event => {
            if (event && event.cancelable) event.preventDefault();
            if (event) event.stopPropagation();

            if (!isPressed) return;
            isPressed = false;

            button.classList.remove('pressed');

            if (repeatInterval) {
              clearInterval(repeatInterval);
              repeatInterval = null;
            }

            const game = getCurrentGameEngine();

            if (game && typeof game.handleInput === 'function') {
              game.handleInput(buttonDefinition.action, false);
            }
          };

          button.addEventListener('pointerdown', handleStart);
          button.addEventListener('pointerup', handleEnd);
          button.addEventListener('pointercancel', handleEnd);
          button.addEventListener('pointerleave', handleEnd);
          button.addEventListener('contextmenu', event => event.preventDefault());

          elements.actionCluster.appendChild(button);
        });
      } else {
        elements.actionCluster.style.display = 'none';
      }
    }

    if (elements.directTouchHint) {
      if (!config.hasJoystick && (!config.buttons || !config.buttons.length)) {
        elements.directTouchHint.style.display = 'flex';

        if (elements.directTouchText) {
          elements.directTouchText.textContent =
            config.hintText ||
            'Touch & tap directly on the screen to play!';
        }
      } else {
        elements.directTouchHint.style.display = 'none';
      }
    }
  }

  // ==========================================
  // FAVORITES
  // ==========================================

  function toggleFavorite(gameId) {
    const index = state.favorites.indexOf(gameId);

    if (index >= 0) {
      state.favorites.splice(index, 1);
    } else {
      state.favorites.push(gameId);

      if (window.ArcadeAudio) {
        window.ArcadeAudio.playCoin();
      }
    }

    writeStorage('funzone_favorites', state.favorites);
    updateFavoritesBadge();
    renderGameCards();
  }

  function updateFavoritesBadge() {
    if (elements.navFavCount) {
      elements.navFavCount.textContent = state.favorites.length;
    }
  }

  // ==========================================
  // SOUND
  // ==========================================

  function toggleMute() {
    if (!window.ArcadeAudio) return;

    state.isMuted = window.ArcadeAudio.toggleMute();

    const icon = state.isMuted ? '🔇' : '🔊';

    if (elements.navMuteIcon) {
      elements.navMuteIcon.textContent = icon;
    }

    if (elements.modalMuteIcon) {
      elements.modalMuteIcon.textContent = icon;
    }
  }

  // ==========================================
  // GAME FILTERING AND RENDERING
  // ==========================================

  function renderGameCards() {
    if (!elements.gamesGrid) return;

    const filteredGames = GAMES_CATALOG.filter(game => {
      if (
        state.activeCategory === 'Favorites' &&
        !state.favorites.includes(game.id)
      ) {
        return false;
      }

      if (
        state.activeCategory !== 'All' &&
        state.activeCategory !== 'Favorites' &&
        game.category !== state.activeCategory
      ) {
        return false;
      }

      if (!state.searchQuery) return true;

      const query = state.searchQuery;

      return (
        game.title.toLowerCase().includes(query) ||
        game.category.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        game.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });

    if (elements.gamesCount) {
      elements.gamesCount.textContent =
        `Showing ${filteredGames.length} of ${GAMES_CATALOG.length} games`;
    }

    if (!filteredGames.length) {
      elements.gamesGrid.innerHTML = `
        <div class="no-games-found">
          <div class="empty-icon">🕹️</div>
          <h3>No games found</h3>
          <p>No games matched your search or category filter. Try another search or browse all games.</p>
          <button class="arcade-btn" type="button" data-show-all>
            Show All Games
          </button>
        </div>
      `;

      const showAllButton =
        elements.gamesGrid.querySelector('[data-show-all]');

      if (showAllButton) {
        showAllButton.addEventListener('click', () => {
          clearSearch();
          setActiveCategory('All');
        });
      }

      return;
    }

    elements.gamesGrid.innerHTML = filteredGames.map(game => {
      const isFavorite = state.favorites.includes(game.id);
      const highScore = readHighScore(game.id);
      const categoryColor = getCategoryColor(game.category);
      const gameType = getGameType(game);

      return `
        <div class="game-card"
             data-id="${game.id}"
             data-category="${game.category}">

          <div class="card-thumb-wrapper">
            <img
              src="${game.thumbnail}"
              alt="${game.title}"
              class="card-thumb"
              loading="lazy"
            />

            <span class="card-badge">${gameType}</span>

            <button
              class="fav-toggle-btn ${isFavorite ? 'favorited' : ''}"
              data-id="${game.id}"
              type="button"
              title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
              aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
              aria-pressed="${isFavorite}"
            >
              ${isFavorite ? '❤️' : '🤍'}
            </button>
          </div>

          <div class="card-body">
            <div class="card-meta">
              <span
                class="cat-tag"
                style="
                  background:${categoryColor.bg};
                  color:${categoryColor.text};
                  border-color:${categoryColor.border};
                "
              >
                ${game.category}
              </span>
            </div>

            <h3 class="card-title">${game.title}</h3>
            <p class="card-desc">${game.description}</p>

            <div class="card-tags">
              ${game.tags.map(tag =>
                `<span class="mini-tag">#${tag}</span>`
              ).join('')}
            </div>

            <div class="card-footer">
              <div class="card-highscore">
                <span class="hs-label">HIGH SCORE</span>
                <span class="hs-value">${highScore.toLocaleString()}</span>
              </div>

              <button
                class="play-btn"
                data-id="${game.id}"
                type="button"
              >
                <span class="play-icon">▶</span> PLAY NOW
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    attachGameCardListeners();
  }

  function attachGameCardListeners() {
    elements.gamesGrid.querySelectorAll('.play-btn').forEach(button => {
      button.addEventListener('click', () => {
        launchGame(button.dataset.id);
      });
    });

    elements.gamesGrid.querySelectorAll('.card-thumb-wrapper').forEach(thumb => {
      thumb.addEventListener('click', event => {
        if (event.target.closest('.fav-toggle-btn')) return;

        const card = thumb.closest('.game-card');

        if (card) {
          launchGame(card.dataset.id);
        }
      });
    });

    elements.gamesGrid.querySelectorAll('.fav-toggle-btn').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(button.dataset.id);
      });
    });
  }

  // ==========================================
  // CATEGORY COLORS
  // ==========================================

  function getCategoryColor(category) {
    const colors = {
      Action: {
        bg: 'rgba(255, 0, 127, 0.15)',
        text: '#ff007f',
        border: '#ff007f'
      },
      Racing: {
        bg: 'rgba(255, 119, 0, 0.15)',
        text: '#ff7700',
        border: '#ff7700'
      },
      Puzzle: {
        bg: 'rgba(168, 85, 247, 0.15)',
        text: '#c084fc',
        border: '#a855f7'
      },
      Casual: {
        bg: 'rgba(0, 255, 136, 0.15)',
        text: '#00ff88',
        border: '#00ff88'
      },
      Strategy: {
        bg: 'rgba(255, 215, 0, 0.15)',
        text: '#ffd700',
        border: '#ffd700'
      },
      Simulation: {
        bg: 'rgba(0, 240, 255, 0.15)',
        text: '#00f0ff',
        border: '#00f0ff'
      },
      Sports: {
        bg: 'rgba(34, 197, 94, 0.15)',
        text: '#4ade80',
        border: '#22c55e'
      },
      Arcade: {
        bg: 'rgba(249, 115, 22, 0.15)',
        text: '#fb923c',
        border: '#f97316'
      },
      Music: {
        bg: 'rgba(236, 72, 153, 0.15)',
        text: '#f472b6',
        border: '#ec4899'
      },
      Skill: {
        bg: 'rgba(59, 130, 246, 0.15)',
        text: '#60a5fa',
        border: '#3b82f6'
      }
    };

    return colors[category] || {
      bg: 'rgba(0, 240, 255, 0.15)',
      text: '#00f0ff',
      border: '#00f0ff'
    };
  }

  // ==========================================
  // GAME LAUNCH
  // ==========================================

  function launchGame(gameId) {
    const gameDefinition = GAMES_CATALOG.find(game => game.id === gameId);
    const gameEngine =
      window.ArcadeGames && window.ArcadeGames[gameId];

    if (!gameDefinition || !gameEngine) {
      console.error(`Game not found or not loaded: ${gameId}`);
      showToast('This game could not be loaded. Please refresh and try again.');
      return;
    }

    if (
      !elements.gameModal ||
      !elements.gameCanvas ||
      !elements.modalTitle
    ) {
      console.error('Game modal elements are missing.');
      return;
    }

    if (state.currentGame) {
      const previousEngine = getCurrentGameEngine();

      if (previousEngine && typeof previousEngine.destroy === 'function') {
        try {
          previousEngine.destroy();
        } catch (error) {
          console.warn('Previous game cleanup issue:', error);
        }
      }
    }

    state.currentGame = gameDefinition;

    elements.modalTitle.textContent = gameDefinition.title;

    if (elements.modalCategory) {
      elements.modalCategory.textContent = gameDefinition.category;
    }

    if (elements.modalInstructions) {
      elements.modalInstructions.textContent =
        gameEngine.instructions || gameDefinition.description;
    }

    if (elements.modalScore) {
      elements.modalScore.textContent = '0';
    }

    if (elements.modalHighScore) {
      elements.modalHighScore.textContent =
        readHighScore(gameId).toLocaleString();
    }

    if (elements.gameOverOverlay) {
      elements.gameOverOverlay.classList.remove('active');
    }

    if (elements.newRecordBanner) {
      elements.newRecordBanner.style.display = 'none';
    }

    if (elements.modalLivesContainer) {
      elements.modalLivesContainer.style.display = 'none';
    }

    configureControlsForGame(gameId);

    elements.gameModal.classList.add('active');
    document.body.classList.add('game-active');
    document.body.style.overflow = 'hidden';

    if (window.ArcadeAudio) {
      window.ArcadeAudio.init();
    }

    const callbacks = {
      onScore: score => {
        if (elements.modalScore) {
          elements.modalScore.textContent =
            (Number(score) || 0).toLocaleString();
        }
      },

      onLives: lives => {
        if (elements.modalLives) {
          elements.modalLives.textContent = lives;
        }

        if (elements.modalLivesContainer) {
          elements.modalLivesContainer.style.display = '';
        }
      },

      onGameOver: finalScore => {
        handleGameOver(gameId, finalScore);
      }
    };

    state.currentCallbacks = callbacks;

    try {
      gameEngine.init(elements.gameCanvas, callbacks);
      gameEngine.start();
    } catch (error) {
      console.error(`Could not start ${gameDefinition.title}:`, error);
      showToast('Game could not start. Please close and try again.');
    }
  }

  // ==========================================
  // GAME OVER AND HIGH SCORES
  // ==========================================

  function handleGameOver(gameId, finalScore) {
    const score = Number(finalScore) || 0;
    const isNewHighScore = saveHighScore(gameId, score);
    const bestScore = readHighScore(gameId);

    if (elements.gameOverScore) {
      elements.gameOverScore.textContent = score.toLocaleString();
    }

    if (elements.gameOverHighScore) {
      elements.gameOverHighScore.textContent = bestScore.toLocaleString();
    }

    if (elements.newRecordBanner) {
      elements.newRecordBanner.style.display =
        isNewHighScore && score > 0 ? 'block' : 'none';
    }

    if (isNewHighScore && score > 0 && window.ArcadeAudio) {
      window.ArcadeAudio.playLevelUp();
    }

    if (elements.gameOverOverlay) {
      elements.gameOverOverlay.classList.add('active');
    }

    renderGameCards();
  }

  function restartCurrentGame() {
    if (!state.currentGame) return;

    const gameEngine = getCurrentGameEngine();

    if (!gameEngine) {
      showToast('Game restart is unavailable. Please close and reopen the game.');
      return;
    }

    if (elements.gameOverOverlay) {
      elements.gameOverOverlay.classList.remove('active');
    }

    if (elements.modalScore) {
      elements.modalScore.textContent = '0';
    }

    if (elements.modalHighScore) {
      elements.modalHighScore.textContent =
        readHighScore(state.currentGame.id).toLocaleString();
    }

    if (elements.newRecordBanner) {
      elements.newRecordBanner.style.display = 'none';
    }

    try {
      if (typeof gameEngine.restart === 'function') {
        gameEngine.restart();
      } else if (
        typeof gameEngine.destroy === 'function' &&
        typeof gameEngine.init === 'function' &&
        typeof gameEngine.start === 'function'
      ) {
        gameEngine.destroy();
        gameEngine.init(elements.gameCanvas, state.currentCallbacks);
        gameEngine.start();
      } else {
        showToast('This game does not support restarting. Please reopen it.');
      }
    } catch (error) {
      console.error('Game restart error:', error);
      showToast('Restart failed. Please close and reopen the game.');
    }
  }

  // ==========================================
  // CLOSE GAME
  // ==========================================

  function closeGameModal() {
    const gameEngine = getCurrentGameEngine();

    if (gameEngine && typeof gameEngine.destroy === 'function') {
      try {
        gameEngine.destroy();
      } catch (error) {
        console.warn('Game cleanup issue:', error);
      }
    }

    if (state.joystick) {
      state.joystick.reset();
    }

    state.currentGame = null;
    state.currentCallbacks = null;

    if (elements.gameModal) {
      elements.gameModal.classList.remove('active');
    }

    if (elements.gameOverOverlay) {
      elements.gameOverOverlay.classList.remove('active');
    }

    document.body.classList.remove('game-active');
    document.body.style.overflow = '';

    if (elements.actionCluster) {
      elements.actionCluster.innerHTML = '';
    }

    if (elements.joystickWrapper) {
      elements.joystickWrapper.style.display = 'none';
    }

    if (elements.directTouchHint) {
      elements.directTouchHint.style.display = 'none';
    }
  }

  // ==========================================
  // FULLSCREEN
  // ==========================================

  function toggleFullscreen() {
    const modalContent = document.querySelector('.modal-arcade-stage');

    if (!modalContent) return;

    if (!document.fullscreenElement) {
      if (modalContent.requestFullscreen) {
        modalContent.requestFullscreen().catch(error => {
          console.warn('Fullscreen request failed:', error);
        });
      } else if (modalContent.webkitRequestFullscreen) {
        modalContent.webkitRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  // ==========================================
  // TOAST NOTIFICATION
  // ==========================================

  function showToast(message) {
    if (!elements.toastNotification) return;

    elements.toastNotification.textContent = message;
    elements.toastNotification.classList.add('show');

    if (state.toastTimeout) {
      clearTimeout(state.toastTimeout);
    }

    state.toastTimeout = setTimeout(() => {
      elements.toastNotification.classList.remove('show');
    }, 3500);
  }

  // ==========================================
  // LEGAL MODALS
  // ==========================================

  function setupLegalModals() {
    const legalContents = {
      privacy: {
        title: 'Privacy Policy',
        html: `
          <p><strong>Last Updated: November 11, 2026</strong></p>
          <p>FunZone Arcade uses limited browser storage to remember preferences and high scores. Contact form messages are processed through Formspree. Advertising services, including Google AdSense, may use cookies or similar technologies as described in our full Privacy Policy.</p>
          <p>Please read our complete <a href="privacy-policy.html">Privacy Policy</a> for details about data, advertising, third-party services and your choices.</p>
        `
      },

      terms: {
        title: 'Terms of Service',
        html: `
          <p><strong>Last Updated: November 11, 2026</strong></p>
          <p>FunZone Arcade provides browser-based games for entertainment. Please use the website responsibly and respect applicable laws and third-party rights.</p>
          <p>Please read our complete <a href="terms-of-service.html">Terms of Service</a> for the full conditions of using this website.
          </p>
        `
      }
    };

    document.querySelectorAll('.open-policy-btn').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();

        const type = button.dataset.policy;
        const content = legalContents[type];

        if (
          content &&
          elements.policyModal &&
          elements.policyModalTitle &&
          elements.policyModalBody
        ) {
          elements.policyModalTitle.textContent = content.title;
          elements.policyModalBody.innerHTML = content.html;
          elements.policyModal.classList.add('active');
        }
      });
    });

    if (elements.policyModalClose && elements.policyModal) {
      elements.policyModalClose.addEventListener('click', () => {
        elements.policyModal.classList.remove('active');
      });
    }

    if (elements.policyModal) {
      elements.policyModal.addEventListener('click', event => {
        if (event.target === elements.policyModal) {
          elements.policyModal.classList.remove('active');
        }
      });
    }
  }

  // ==========================================
  // CONTACT FORM
  // ==========================================

  function setupContactForm() {
    if (!elements.contactForm) return;

    elements.contactForm.addEventListener('submit', async event => {
      event.preventDefault();

      const submitButton = elements.contactForm.querySelector(
        'button[type="submit"]'
      );

      const originalButtonHTML = submitButton
        ? submitButton.innerHTML
        : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'SENDING...';
      }

      try {
        const response = await fetch(
          'https://formspree.io/f/mqppvqzl',
          {
            method: 'POST',
            body: new FormData(elements.contactForm),
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (response.ok) {
          showToast('Message sent successfully! Thank you for contacting us.');
          elements.contactForm.reset();

          if (window.ArcadeAudio) {
            window.ArcadeAudio.playCoin();
          }
        } else {
          showToast('Message could not be sent. Please try again.');
        }
      } catch (error) {
        console.error('Contact form error:', error);
        showToast('Network error. Please check your connection and try again.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonHTML;
        }
      }
    });
  }

  // ==========================================
  // URL HASH
  // ==========================================

  function checkURLHash() {
    const hash = window.location.hash.replace(/^#/, '');

    if (hash.startsWith('game=')) {
      const gameId = hash.slice(5);

      if (GAMES_CATALOG.some(game => game.id === gameId)) {
        launchGame(gameId);
      }
    }
  }

  // ==========================================
  // HERO CANVAS PARTICLES
  // ==========================================

  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');

    if (!canvas || typeof canvas.getContext !== 'function') return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0;
    let height = 0;
    let animationFrame = null;

    const particles = [];
    const particleCount = 45;

    function resizeCanvas() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = Math.max(window.innerHeight * 0.7, 300);

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    resizeCanvas();

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: Math.random() < 0.5 ? '#ff007f' : '#00f0ff'
      });
    }

    function renderHero() {
      context.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2
        );
        context.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const distance = Math.hypot(
            particle.x - other.x,
            particle.y - other.y
          );

          if (distance < 130) {
            context.strokeStyle = particle.color;
            context.globalAlpha = (1 - distance / 130) * 0.18;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.stroke();
            context.globalAlpha = 1;
          }
        }
      }

      animationFrame = requestAnimationFrame(renderHero);
    }

    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion) {
      renderHero();
    }

    window.addEventListener('resize', () => {
      resizeCanvas();
    });
  }

  // ==========================================
  // START APPLICATION
  // ==========================================

  document.addEventListener('DOMContentLoaded', initApp);

})();
