/**
 * UI Interactions and Game Controls
 */

// DOM Elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const instructionsModal = document.getElementById('instructionsModal');
const gameOverModal = document.getElementById('gameOverModal');
const closeBtn = document.querySelector('.close');
const themeToggle = document.getElementById('themeToggle');
const langToggle = document.getElementById('langToggle');
const currentLang = document.getElementById('currentLang');
const adSide = document.getElementById('ad-side');

// Initialize the game
let game;

// Create game instance when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Wait for game.js to load
        setTimeout(() => {
            // Initialize game
            game = new SnakeGame('game');
        }, 500);
    
        // Initialize UI settings
        initTheme();
        initLanguage();
    } catch(error) {
        console.error('Error initializing game:', error);
    }
    
    // Display high score from localStorage
    const highScore = localStorage.getItem('snakeHighScore') || 0;
    document.getElementById('highScore').textContent = highScore;
    
    // Add mobile touch controls
    addMobileTouchControls();
    
    // Hide pause button initially
    pauseBtn.style.display = 'none';
    
    // Handle responsive ads
    handleResponsiveAds();
    
    // Add event listeners
    startBtn.addEventListener('click', () => {
        game.startGame();
        startBtn.textContent = getCurrentLanguage() === 'en' ? 'Restart Game' : '重新开始';
        pauseBtn.style.display = 'inline-flex';
    });
    
    pauseBtn.addEventListener('click', () => {
        if (game.gameRunning) {
            game.pauseGame();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            game.resumeGame();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    });
    
    instructionsBtn.addEventListener('click', () => {
        instructionsModal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
    });
    
    playAgainBtn.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        game.resetGame();
        game.startGame();
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === instructionsModal) {
            instructionsModal.style.display = 'none';
        }
        if (event.target === gameOverModal) {
            gameOverModal.style.display = 'none';
        }
    });
    
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Language Toggle
    langToggle.addEventListener('click', toggleLanguage);
    
    // Handle window resize for responsive canvas
    window.addEventListener('resize', () => {
        // Redraw the game if it's running
        if (game && game.gameRunning) {
            game.draw();
        }
        
        // Update responsive ad display
        handleResponsiveAds();
    });
});


// Theme Toggle function declaration

function toggleTheme() {
    const body = document.body;
    const icon = themeToggle.querySelector('i');
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    }
    
    // Redraw the game if it's running
    if (game && game.gameRunning) {
        game.draw();
    }
}

// Language Toggle function declaration

function toggleLanguage() {
    const currentLanguage = getCurrentLanguage();
    const newLanguage = currentLanguage === 'en' ? 'zh' : 'en';
    
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
}

function getCurrentLanguage() {
    return localStorage.getItem('language') || 'en';
}

function setLanguage(lang) {
    currentLang.textContent = lang === 'en' ? 'EN' : '中文';
    
    // Update all text elements based on translations
    const elements = document.querySelectorAll('[id]');
    elements.forEach(element => {
        const key = element.id;
        if (translations[key] && translations[key][lang]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[key][lang];
            } else {
                element.textContent = translations[key][lang];
            }
        }
    });
    
    // Update button text based on game state
    if (game && game.gameRunning) {
        startBtn.textContent = lang === 'en' ? 'Restart Game' : '重新开始';
    } else {
        startBtn.textContent = lang === 'en' ? 'Start Game' : '开始游戏';
    }
    
    // Update option elements separately
    document.getElementById('easy-option').textContent = lang === 'en' ? 'Easy' : '简单';
    document.getElementById('medium-option').textContent = lang === 'en' ? 'Medium' : '中等';
    document.getElementById('hard-option').textContent = lang === 'en' ? 'Hard' : '困难';
}

// Initialize theme from localStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const icon = themeToggle.querySelector('i');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Initialize language from localStorage
function initLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
}

// Move initialization code to DOMContentLoaded event

// Add mobile touch controls for better mobile experience
function addMobileTouchControls() {
    // Only add touch controls if on mobile device
    if (window.innerWidth <= 768) {
        const gameContainer = document.querySelector('.game-container');
        const touchControls = document.createElement('div');
        touchControls.className = 'touch-controls';
        touchControls.innerHTML = `
            <div class="touch-row">
                <button id="upBtn" class="touch-btn"><i class="fas fa-arrow-up"></i></button>
            </div>
            <div class="touch-row">
                <button id="leftBtn" class="touch-btn"><i class="fas fa-arrow-left"></i></button>
                <button id="downBtn" class="touch-btn"><i class="fas fa-arrow-down"></i></button>
                <button id="rightBtn" class="touch-btn"><i class="fas fa-arrow-right"></i></button>
            </div>
        `;
        
        gameContainer.appendChild(touchControls);
        
        // Add event listeners to touch buttons
        document.getElementById('upBtn').addEventListener('click', () => {
            if (game.direction !== 'down') {
                game.nextDirection = 'up';
            }
        });
        
        document.getElementById('downBtn').addEventListener('click', () => {
            if (game.direction !== 'up') {
                game.nextDirection = 'down';
            }
        });
        
        document.getElementById('leftBtn').addEventListener('click', () => {
            if (game.direction !== 'right') {
                game.nextDirection = 'left';
            }
        });
        
        document.getElementById('rightBtn').addEventListener('click', () => {
            if (game.direction !== 'left') {
                game.nextDirection = 'right';
            }
        });
        
        // Add CSS for touch controls
        const style = document.createElement('style');
        style.textContent = `
            .touch-controls {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-top: 20px;
            }
            
            .touch-row {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin: 5px 0;
            }
            
            .touch-btn {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: var(--primary-color);
                color: white;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                cursor: pointer;
            }
            
            .touch-btn:active {
                transform: scale(0.95);
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
    }
}

// Move resize handler to DOMContentLoaded event

// Handle responsive ad display
function handleResponsiveAds() {
    // Show side ad only on larger screens
    if (window.innerWidth >= 1200) {
        adSide.style.display = 'block';
    } else {
        adSide.style.display = 'none';
    }
}