/**
 * FunZone Arcade - Main Application Controller
 */

(function() {
  'use strict';

  // Game Catalog Definition
  const GAMES_CATALOG = [
    {
      id: 'cyber-dash',
      title: 'Cyber Dash',
      category: 'Racing',
      description: 'High-speed synthwave highway runner! Weave through traffic, grab fuel cells, and trigger nitro overdrive.',
      thumbnail: 'assets/thumbnails/cyber-dash.svg',
      rating: 4.9,
      plays: '142K',
      badge: 'POPULAR',
      tags: ['Highway', 'Synthwave', 'Speed', 'Nitro']
    },
    {
      id: 'galaxy-strike',
      title: 'Galaxy Strike',
      category: 'Action',
      description: 'Classic vertical space blaster! Defeat alien fleets, pick up multi-beam weapon upgrades, and battle massive bosses.',
      thumbnail: 'assets/thumbnails/galaxy-strike.svg',
      rating: 4.8,
      plays: '185K',
      badge: 'FEATURED',
      tags: ['Space', 'Shooter', 'Boss Fight', 'Retro']
    },
    {
      id: 'neon-breaker',
      title: 'Neon Breaker',
      category: 'Action',
      description: 'Next-gen cyberpunk brick breaker! Smash glowing bricks with multi-balls, explosive charges, and laser cannons.',
      thumbnail: 'assets/thumbnails/neon-breaker.svg',
      rating: 4.9,
      plays: '98K',
      badge: 'HOT',
      tags: ['Arkanoid', 'Breakout', 'Powerups', 'Action']
    },
    {
      id: 'neon-viper',
      title: 'Neon Viper',
      category: 'Casual',
      description: 'The iconic snake game reimagined with electric neon aesthetics, multiplier combos, and special time-freeze bugs.',
      thumbnail: 'assets/thumbnails/neon-viper.svg',
      rating: 4.7,
      plays: '210K',
      badge: 'CLASSIC',
      tags: ['Snake', 'Retro', 'Combos', 'Grid']
    },
    {
      id: 'meteor-strike',
      title: 'Meteor Strike',
      category: 'Action',
      description: 'Zero-gravity vector physics asteroid blaster! Rotate 360°, fire thrusters, fracture meteors, and dodge alien scouts.',
      thumbnail: 'assets/thumbnails/meteor-strike.svg',
      rating: 4.8,
      plays: '88K',
      badge: 'RETRO',
      tags: ['Physics', 'Asteroids', '360°', 'Space']
    },
    {
      id: 'cosmic-jetpack',
      title: 'Cosmic Jetpack',
      category: 'Casual',
      description: 'Propel your astronaut through space with an ion jetpack! Balance gravity, dodge laser gates, and collect nebula crystals.',
      thumbnail: 'assets/thumbnails/cosmic-jetpack.svg',
      rating: 4.7,
      plays: '165K',
      badge: 'ADDICTIVE',
      tags: ['Physics', 'Flapper', 'Jetpack', 'Skill']
    },
    {
      id: 'drift-rush',
      title: 'Drift Rush',
      category: 'Racing',
      description: 'Master the art of high-speed top-down drifting! Slide around hairpins, beat checkpoint clocks, and set lap records.',
      thumbnail: 'assets/thumbnails/drift-rush.svg',
      rating: 4.9,
      plays: '115K',
      badge: 'PRO',
      tags: ['Circuit', 'Drift', 'Time Attack', 'Car']
    },
    {
      id: 'jewel-fusion',
      title: 'Jewel Fusion',
      category: 'Puzzle',
      description: 'Luminous match-3 cascade puzzle! Connect vibrant crystals, trigger explosive bombs, and unleash cascading chain reactions.',
      thumbnail: 'assets/thumbnails/jewel-fusion.svg',
      rating: 4.8,
      plays: '130K',
      badge: 'PUZZLE',
      tags: ['Match 3', 'Gems', 'Cascades', 'Combos']
    },
    {
      id: 'memory-matrix',
      title: 'Memory Matrix',
      category: 'Puzzle',
      description: 'Hack the cyber core! Memorize complex cryptographic node flashes and replay the harmonic audio patterns.',
      thumbnail: 'assets/thumbnails/memory-matrix.svg',
      rating: 4.6,
      plays: '74K',
      badge: 'BRAIN',
      tags: ['Memory', 'Simon', 'Music', 'Hacker']
    },
    {
      id: 'tower-stack',
      title: 'Tower Stack',
      category: 'Casual',
      description: 'Precision timing cyber tower builder! Slice overhangs, align perfect combos with musical notes, and build into space.',
      thumbnail: 'assets/thumbnails/tower-stack.svg',
      rating: 4.9,
      plays: '192K',
      badge: 'ZEN',
      tags: ['Timing', 'Stack', 'Minimalist', 'Chime']
    }
  ];

  // Application State
  const state = {
    activeCategory: 'All',
    searchQuery: '',
    favorites: JSON.parse(localStorage.getItem('funzone_favorites') || '[]'),
    currentGame: null,
    isMuted: false,
    soundVolume: 0.3
  };

  // DOM Elements cache
  const elements = {};

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

    // Player Modal Elements
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

    // Game Over Overlay
    elements.gameOverOverlay = document.getElementById('game-over-overlay');
    elements.gameOverScore = document.getElementById('game-over-final-score');
    elements.gameOverHighScore = document.getElementById('game-over-best-score');
    elements.newRecordBanner = document.getElementById('new-record-banner');
    elements.btnPlayAgain = document.getElementById('btn-play-again');
    elements.btnExitGame = document.getElementById('btn-exit-game');

    // Navigation & Mobile menu
    elements.navMuteBtn = document.getElementById('nav-sound-toggle');
    elements.navMuteIcon = document.getElementById('nav-mute-icon');
    elements.navFavoritesBtn = document.getElementById('nav-favorites-btn');
    elements.navFavCount = document.getElementById('nav-fav-count');
    elements.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    elements.navLinks = document.getElementById('nav-links');

    // Modals for Privacy & Terms
    elements.policyModal = document.getElementById('policy-modal');
    elements.policyModalTitle = document.getElementById('policy-modal-title');
    elements.policyModalBody = document.getElementById('policy-modal-body');
    elements.policyModalClose = document.getElementById('policy-modal-close');

    // Contact Form
    elements.contactForm = document.getElementById('contact-form');
    elements.toastNotification = document.getElementById('toast-notification');
  }

  function setupEventListeners() {
    // Search input
    if (elements.searchBar) {
      elements.searchBar.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        if (elements.searchClearBtn) {
          elements.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
        }
        renderGameCards();
      });
    }

    if (elements.searchClearBtn) {
      elements.searchClearBtn.addEventListener('click', () => {
        elements.searchBar.value = '';
        state.searchQuery = '';
        elements.searchClearBtn.style.display = 'none';
        elements.searchBar.focus();
        renderGameCards();
      });
    }

    // Category pills
    elements.categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        elements.categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeCategory = pill.dataset.category;
        renderGameCards();
        window.ArcadeAudio.playClick();
      });
    });

    // Quick Play Random Game
    if (elements.quickPlayBtn) {
      elements.quickPlayBtn.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * GAMES_CATALOG.length);
        launchGame(GAMES_CATALOG[randomIndex].id);
      });
    }

    // Browse Games Smooth Scroll
    if (elements.browseGamesBtn) {
      elements.browseGamesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Master Sound Toggles
    if (elements.navMuteBtn) {
      elements.navMuteBtn.addEventListener('click', toggleMute);
    }
    if (elements.modalSoundBtn) {
      elements.modalSoundBtn.addEventListener('click', toggleMute);
    }

    // Favorites filter pill button from nav
    if (elements.navFavoritesBtn) {
      elements.navFavoritesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        elements.categoryPills.forEach(p => p.classList.remove('active'));
        const favPill = document.querySelector('.cat-pill[data-category="Favorites"]');
        if (favPill) favPill.classList.add('active');
        state.activeCategory = 'Favorites';
        renderGameCards();
        document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Modal Action Buttons
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

    // Mobile Hamburger Menu
    if (elements.mobileMenuToggle && elements.navLinks) {
      elements.mobileMenuToggle.addEventListener('click', () => {
        elements.navLinks.classList.toggle('open');
      });

      // Close menu on link click
      elements.navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          elements.navLinks.classList.remove('open');
        });
      });
    }

    // Mobile Gamepad On-Screen Controls
    setupMobileGamepad();

    // Keybindings: Esc to exit modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.gameModal.classList.contains('active')) {
        closeGameModal();
      }
    });

    // Legal Modals (Privacy & Terms)
    setupLegalModals();

    // Contact Form
    if (elements.contactForm) {
      elements.contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Thanks for your message! Our arcade team will get back to you soon.');
        elements.contactForm.reset();
        window.ArcadeAudio.playCoin();
      });
    }
  }

  function setupMobileGamepad() {
    const padButtons = document.querySelectorAll('.gamepad-btn');
    padButtons.forEach(btn => {
      const action = btn.dataset.action;

      const handleStart = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        if (state.currentGame && window.ArcadeGames[state.currentGame.id]) {
          window.ArcadeGames[state.currentGame.id].handleInput(action, true);
        }
      };

      const handleEnd = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        if (state.currentGame && window.ArcadeGames[state.currentGame.id]) {
          window.ArcadeGames[state.currentGame.id].handleInput(action, false);
        }
      };

      btn.addEventListener('touchstart', handleStart, { passive: false });
      btn.addEventListener('touchend', handleEnd, { passive: false });
      btn.addEventListener('mousedown', handleStart);
      btn.addEventListener('mouseup', handleEnd);
      btn.addEventListener('mouseleave', handleEnd);
    });
  }

  function getHighScore(gameId) {
    return parseInt(localStorage.getItem(`funzone_high_${gameId}`) || '0', 10);
  }

  function saveHighScore(gameId, score) {
    const prev = getHighScore(gameId);
    if (score > prev) {
      localStorage.setItem(`funzone_high_${gameId}`, score);
      return true;
    }
    return false;
  }

  function toggleFavorite(gameId) {
    const idx = state.favorites.indexOf(gameId);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
    } else {
      state.favorites.push(gameId);
      window.ArcadeAudio.playCoin();
    }
    localStorage.setItem('funzone_favorites', JSON.stringify(state.favorites));
    updateFavoritesBadge();
    renderGameCards();
  }

  function updateFavoritesBadge() {
    if (elements.navFavCount) {
      elements.navFavCount.textContent = state.favorites.length;
    }
  }

  function toggleMute() {
    const isMuted = window.ArcadeAudio.toggleMute();
    state.isMuted = isMuted;

    // Update icons
    const icon = isMuted ? '🔇' : '🔊';
    if (elements.navMuteIcon) elements.navMuteIcon.textContent = icon;
    if (elements.modalMuteIcon) elements.modalMuteIcon.textContent = icon;
  }

  function renderGameCards() {
    if (!elements.gamesGrid) return;

    let filtered = GAMES_CATALOG.filter(game => {
      // Category filter
      if (state.activeCategory === 'Favorites') {
        if (!state.favorites.includes(game.id)) return false;
      } else if (state.activeCategory !== 'All' && game.category !== state.activeCategory) {
        return false;
      }

      // Search query filter
      if (state.searchQuery) {
        const query = state.searchQuery;
        const matchesTitle = game.title.toLowerCase().includes(query);
        const matchesCategory = game.category.toLowerCase().includes(query);
        const matchesDesc = game.description.toLowerCase().includes(query);
        const matchesTags = game.tags.some(tag => tag.toLowerCase().includes(query));
        return matchesTitle || matchesCategory || matchesDesc || matchesTags;
      }

      return true;
    });

    if (elements.gamesCount) {
      elements.gamesCount.textContent = `Showing ${filtered.length} of ${GAMES_CATALOG.length} games`;
    }

    if (filtered.length === 0) {
      elements.gamesGrid.innerHTML = `
        <div class="no-games-found">
          <div class="empty-icon">🕹️</div>
          <h3>No games found</h3>
          <p>No games matched your search or category filter. Try clearing your search or browsing all games!</p>
          <button class="arcade-btn" onclick="document.getElementById('search-input').value=''; document.querySelector('.cat-pill[data-category=\\'All\\']').click();">
            Show All Games
          </button>
        </div>
      `;
      return;
    }

    elements.gamesGrid.innerHTML = filtered.map(game => {
      const isFav = state.favorites.includes(game.id);
      const highScore = getHighScore(game.id);
      const categoryColor = getCategoryColor(game.category);

      return `
        <div class="game-card" data-id="${game.id}" data-category="${game.category}">
          <div class="card-thumb-wrapper">
            <img src="${game.thumbnail}" alt="${game.title}" class="card-thumb" loading="lazy" />
            <span class="card-badge ${game.badge.toLowerCase()}">${game.badge}</span>
            <button class="fav-toggle-btn ${isFav ? 'favorited' : ''}" data-id="${game.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="cat-tag" style="background:${categoryColor.bg}; color:${categoryColor.text}; border-color:${categoryColor.border}">
                ${game.category}
              </span>
              <span class="rating-tag">⭐ ${game.rating}</span>
              <span class="plays-tag">👥 ${game.plays}</span>
            </div>
            <h3 class="card-title">${game.title}</h3>
            <p class="card-desc">${game.description}</p>
            <div class="card-tags">
              ${game.tags.map(t => `<span class="mini-tag">#${t}</span>`).join('')}
            </div>
            <div class="card-footer">
              <div class="card-highscore">
                <span class="hs-label">HIGH SCORE</span>
                <span class="hs-value">${highScore.toLocaleString()}</span>
              </div>
              <button class="play-btn" data-id="${game.id}">
                <span class="play-icon">▶</span> PLAY NOW
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners to newly rendered cards
    elements.gamesGrid.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameId = btn.dataset.id;
        launchGame(gameId);
      });
    });

    elements.gamesGrid.querySelectorAll('.card-thumb-wrapper').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        if (e.target.classList.contains('fav-toggle-btn')) return;
        const card = thumb.closest('.game-card');
        if (card) launchGame(card.dataset.id);
      });
    });

    elements.gamesGrid.querySelectorAll('.fav-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gameId = btn.dataset.id;
        toggleFavorite(gameId);
      });
    });
  }

  function getCategoryColor(category) {
    switch (category) {
      case 'Action':
        return { bg: 'rgba(255, 0, 127, 0.15)', text: '#ff007f', border: '#ff007f' };
      case 'Racing':
        return { bg: 'rgba(255, 119, 0, 0.15)', text: '#ff7700', border: '#ff7700' };
      case 'Puzzle':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: '#a855f7' };
      case 'Casual':
        return { bg: 'rgba(0, 255, 136, 0.15)', text: '#00ff88', border: '#00ff88' };
      default:
        return { bg: 'rgba(0, 240, 255, 0.15)', text: '#00f0ff', border: '#00f0ff' };
    }
  }

  function launchGame(gameId) {
    const gameDef = GAMES_CATALOG.find(g => g.id === gameId);
    const gameEngine = window.ArcadeGames && window.ArcadeGames[gameId];

    if (!gameDef || !gameEngine) {
      console.error(`Game not found: ${gameId}`);
      return;
    }

    // Stop currently running game if any
    if (state.currentGame && window.ArcadeGames[state.currentGame.id]) {
      window.ArcadeGames[state.currentGame.id].destroy();
    }

    state.currentGame = gameDef;

    // Update modal HUD info
    elements.modalTitle.textContent = gameDef.title;
    elements.modalCategory.textContent = gameDef.category;
    elements.modalInstructions.textContent = gameEngine.instructions || gameDef.description;
    elements.modalScore.textContent = '0';
    elements.modalHighScore.textContent = getHighScore(gameId).toLocaleString();
    elements.gameOverOverlay.classList.remove('active');
    elements.newRecordBanner.style.display = 'none';

    // Open modal
    elements.gameModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize audio on user interaction
    window.ArcadeAudio.init();

    // Callbacks passed to the game
    const callbacks = {
      onScore: (score) => {
        elements.modalScore.textContent = score.toLocaleString();
      },
      onLives: (lives) => {
        if (elements.modalLives) {
          elements.modalLives.textContent = lives;
        }
      },
      onGameOver: (finalScore) => {
        handleGameOver(gameId, finalScore);
      }
    };

    // Initialize and start game
    gameEngine.init(elements.gameCanvas, callbacks);
    gameEngine.start();
  }

  function handleGameOver(gameId, finalScore) {
    const isNewHigh = saveHighScore(gameId, finalScore);
    const bestScore = getHighScore(gameId);

    elements.gameOverScore.textContent = finalScore.toLocaleString();
    elements.gameOverHighScore.textContent = bestScore.toLocaleString();

    if (isNewHigh && finalScore > 0) {
      elements.newRecordBanner.style.display = 'block';
      window.ArcadeAudio.playLevelUp();
    } else {
      elements.newRecordBanner.style.display = 'none';
    }

    elements.gameOverOverlay.classList.add('active');
    renderGameCards(); // Update high score badges on card
  }

  function restartCurrentGame() {
    if (!state.currentGame) return;
    const gameEngine = window.ArcadeGames[state.currentGame.id];
    if (gameEngine) {
      elements.gameOverOverlay.classList.remove('active');
      gameEngine.restart();
    }
  }

  function closeGameModal() {
    if (state.currentGame && window.ArcadeGames[state.currentGame.id]) {
      window.ArcadeGames[state.currentGame.id].destroy();
    }
    state.currentGame = null;
    elements.gameModal.classList.remove('active');
    elements.gameOverOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function toggleFullscreen() {
    const modalContent = document.querySelector('.modal-arcade-stage');
    if (!document.fullscreenElement) {
      if (modalContent.requestFullscreen) {
        modalContent.requestFullscreen();
      } else if (modalContent.webkitRequestFullscreen) {
        modalContent.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function showToast(message) {
    if (!elements.toastNotification) return;
    elements.toastNotification.textContent = message;
    elements.toastNotification.classList.add('show');
    setTimeout(() => {
      elements.toastNotification.classList.remove('show');
    }, 3500);
  }

  function setupLegalModals() {
    const legalContents = {
      privacy: {
        title: 'Privacy Policy',
        html: `
          <p><strong>Last Updated: October 2026</strong></p>
          <p>Welcome to <strong>FunZone Arcade</strong>! We prioritize your privacy and are committed to keeping your online gaming experience 100% transparent and safe.</p>
          <h4>1. Zero Personal Data Collection</h4>
          <p>FunZone Arcade does not require registration, login, email addresses, phone numbers, or passwords. You can jump directly into any of our 10 browser games completely anonymously.</p>
          <h4>2. LocalStorage Data</h4>
          <p>We use your browser's local storage (<code>localStorage</code>) strictly to save your game high scores, favorite games list, and volume preferences. This data remains stored solely on your local device and is never transmitted to any external servers.</p>
          <h4>3. No Tracking Cookies</h4>
          <p>We do not use persistent tracking cookies, fingerprinting mechanisms, or commercial third-party trackers.</p>
          <h4>4. Children's Privacy</h4>
          <p>FunZone Arcade provides family-friendly, non-violent browser games accessible to users of all ages without harvesting personal data.</p>
        `
      },
      terms: {
        title: 'Terms of Service',
        html: `
          <p><strong>Effective Date: October 2026</strong></p>
          <p>By accessing or playing games on <strong>FunZone Arcade</strong>, you agree to the following terms:</p>
          <h4>1. Free Entertainment Use</h4>
          <p>All 10 games hosted on FunZone Arcade are provided completely free of charge for non-commercial personal entertainment directly within modern web browsers.</p>
          <h4>2. Browser Compatibility</h4>
          <p>Our games utilize HTML5 Canvas, JavaScript, and the Web Audio API. They work across Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, Opera, and modern mobile browsers.</p>
          <h4>3. Intellectual Property</h4>
          <p>All games, original artwork, audio synthesizers, and user interface designs are property of FunZone Arcade. You may not extract or re-host games without written permission.</p>
          <h4>4. Fair Play & Feedback</h4>
          <p>Have fun, beat your high scores, and enjoy retro-modern gaming!</p>
        `
      }
    };

    document.querySelectorAll('.open-policy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = btn.dataset.policy;
        const data = legalContents[type];
        if (data && elements.policyModal) {
          elements.policyModalTitle.textContent = data.title;
          elements.policyModalBody.innerHTML = data.html;
          elements.policyModal.classList.add('active');
        }
      });
    });

    if (elements.policyModalClose) {
      elements.policyModalClose.addEventListener('click', () => {
        elements.policyModal.classList.remove('active');
      });
    }

    if (elements.policyModal) {
      elements.policyModal.addEventListener('click', (e) => {
        if (e.target === elements.policyModal) {
          elements.policyModal.classList.remove('active');
        }
      });
    }
  }

  function checkURLHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.startsWith('game=')) {
      const gameId = hash.replace('game=', '');
      launchGame(gameId);
    }
  }

  // Hero Canvas Particle Simulation
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight * 0.7);

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight * 0.7;
    });

    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: Math.random() < 0.5 ? '#ff007f' : '#00f0ff'
      });
    }

    function renderHero() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      requestAnimationFrame(renderHero);
    }
    renderHero();
  }

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', initApp);
})();
