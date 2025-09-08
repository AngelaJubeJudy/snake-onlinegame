/**
 * Snake Game Core Logic
 */

class SnakeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameSpeed = 150; // Default speed (medium difficulty)
        this.gameRunning = false;
        this.isPaused = false;
        this.gameLoop = null;
        
        // Initialize difficulty settings
        this.difficultySpeeds = {
            easy: 200,
            medium: 150,
            hard: 100
        };
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Draw initial game state
        this.initGame();
        this.draw();
        this.drawWelcomeMessage();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Difficulty change
        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.setDifficulty(e.target.value);
        });
        
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // Determine swipe direction
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                } else if (dx < 0 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
            } else {
                // Vertical swipe
                if (dy > 0 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                } else if (dy < 0 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
            }
            
            e.preventDefault();
        }, { passive: false });
    }
    
    handleKeyPress(e) {
        // Arrow key controls
        switch(e.key) {
            case 'ArrowUp':
                if (this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
                break;
            case 'ArrowDown':
                if (this.direction !== 'up') {
                    this.nextDirection = 'down';
                }
                break;
            case 'ArrowLeft':
                if (this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
                break;
            case 'ArrowRight':
                if (this.direction !== 'left') {
                    this.nextDirection = 'right';
                }
                break;
            case ' ': // Space bar for pause
            case 'p': // p key for pause
                this.togglePause();
                break;
        }
    }
    
    initGame() {
        // Reset game state
        this.snake = [
            {x: 5 * this.gridSize, y: 5 * this.gridSize},
            {x: 4 * this.gridSize, y: 5 * this.gridSize},
            {x: 3 * this.gridSize, y: 5 * this.gridSize}
        ];
        
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.updateScore();
        this.generateFood();
        
        // Set difficulty from select element
        const difficultySelect = document.getElementById('difficulty-select');
        this.setDifficulty(difficultySelect.value);
        
        // Draw welcome screen with animation
        this.drawWelcomeMessage();
        this.startWelcomeAnimation();
    }
    
    // Start welcome screen animation
    startWelcomeAnimation() {
        // Clear any existing animation
        if (this.welcomeAnimationId) {
            cancelAnimationFrame(this.welcomeAnimationId);
        }
        
        // Animation function
        const animate = () => {
            if (!this.gameRunning) {
                this.drawWelcomeMessage();
                this.welcomeAnimationId = requestAnimationFrame(animate);
            }
        };
        
        // Start animation loop
        this.welcomeAnimationId = requestAnimationFrame(animate);
    }
    
    setDifficulty(level) {
        this.gameSpeed = this.difficultySpeeds[level];
        
        // If game is already running, restart the loop with new speed
        if (this.gameRunning) {
            clearInterval(this.gameLoop);
            this.startGameLoop();
        }
    }
    
    startGame() {
        if (!this.gameRunning) {
            // Cancel welcome animation if running
            if (this.welcomeAnimationId) {
                cancelAnimationFrame(this.welcomeAnimationId);
                this.welcomeAnimationId = null;
            }
            
            this.initGame();
            this.gameRunning = true;
            this.isPaused = false;
            this.startGameLoop();
            
            // Show pause button when game starts
            document.getElementById('pauseBtn').style.display = 'inline-block';
        }
    }
    
    startGameLoop() {
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, this.gameSpeed);
    }
    
    stopGame() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
    }
    
    update() {
        if (!this.gameRunning || this.isPaused) return;
        
        // Update direction
        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = {x: this.snake[0].x, y: this.snake[0].y};
        
        switch(this.direction) {
            case 'up':
                head.y -= this.gridSize;
                break;
            case 'down':
                head.y += this.gridSize;
                break;
            case 'left':
                head.x -= this.gridSize;
                break;
            case 'right':
                head.x += this.gridSize;
                break;
        }
        
        // Check for collisions
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check if food is eaten
        if (head.x === this.food.x && head.y === this.food.y) {
            // Increase score
            this.score += 10;
            this.updateScore();
            
            // Generate new food
            this.generateFood();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }
    
    checkCollision(head) {
        // Check wall collision
        if (head.x < 0 || head.y < 0 || 
            head.x >= this.canvas.width || 
            head.y >= this.canvas.height) {
            return true;
        }
        
        // Check self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    generateFood() {
        // Generate food at random position
        const gridWidth = this.canvas.width / this.gridSize;
        const gridHeight = this.canvas.height / this.gridSize;
        
        let foodPosition;
        let validPosition = false;
        
        // Keep generating until we find a valid position
        while (!validPosition) {
            foodPosition = {
                x: Math.floor(Math.random() * gridWidth) * this.gridSize,
                y: Math.floor(Math.random() * gridHeight) * this.gridSize
            };
            
            validPosition = true;
            
            // Check if food is on snake
            for (let i = 0; i < this.snake.length; i++) {
                if (foodPosition.x === this.snake[i].x && 
                    foodPosition.y === this.snake[i].y) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        this.food = foodPosition;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid background
        this.drawGrid();
        
        // Draw snake
        for (let i = 0; i < this.snake.length; i++) {
            this.ctx.fillStyle = i === 0 ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') : getComputedStyle(document.documentElement).getPropertyValue('--snake-color');
            this.ctx.fillRect(this.snake[i].x, this.snake[i].y, this.gridSize, this.gridSize);
            
            // Draw border
            this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg');
            this.ctx.strokeRect(this.snake[i].x, this.snake[i].y, this.gridSize, this.gridSize);
        }
        
        // Draw food
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--food-color');
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x + this.gridSize / 2,
            this.food.y + this.gridSize / 2,
            this.gridSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw pause indicator if game is paused
        if (this.isPaused && this.gameRunning) {
            this.drawPauseOverlay();
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        // Update high score if needed
        if (this.score > this.highScore) {
            this.highScore = this.score;
            document.getElementById('highScore').textContent = this.highScore;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
    }
    
    gameOver() {
        this.stopGame();
        
        // Show game over modal
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        document.getElementById('gameOverModal').style.display = 'block';
        
        // Draw game over state on canvas
        this.drawGameOverState();
        
        // Setup share button functionality
        document.getElementById('shareScoreBtn').onclick = () => this.shareScore();
    }
    
    // Share score via Web Share API if available
    shareScore() {
        const lang = localStorage.getItem('language') || 'en';
        const shareText = lang === 'en' 
            ? `I scored ${this.score} points in Snake Game!` 
            : `我在贪吃蛇游戏中获得了 ${this.score} 分！`;
            
        if (navigator.share) {
            navigator.share({
                title: lang === 'en' ? 'My Snake Game Score' : '我的贪吃蛇游戏分数',
                text: shareText,
                url: window.location.href
            })
            .catch(error => console.log('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            alert(shareText);
        }
    }
    
    resetGame() {
        document.getElementById('gameOverModal').style.display = 'none';
        this.startGame();
    }

    
    // Draw grid background
    drawGrid() { 
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // Draw welcome message on initial load
    drawWelcomeMessage() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid background
        this.drawGrid();
        
        const lang = localStorage.getItem('language') || 'en';
        const title = lang === 'en' ? 'SNAKE GAME' : '贪吃蛇游戏';
        const message = lang === 'en' ? 'Press Start to Play!' : '按开始游戏按钮开始!';
        
        // Draw title with shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 3);
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        
        // Draw subtitle
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
        
        // Draw animated snake
        this.drawAnimatedSnake();
        
        // Draw food icon
        this.drawFoodIcon(this.canvas.width / 2 + 60, this.canvas.height / 2 + 60, 15);
    }
    
    // Draw animated snake on welcome screen
    drawAnimatedSnake() {
        const time = new Date().getTime() / 1000;
        const waveAmplitude = 20;
        const waveFrequency = 2;
        
        // Snake body segments
        const segments = 8;
        const segmentSize = this.gridSize * 0.8;
        const startX = this.canvas.width / 2 - 100;
        const baseY = this.canvas.height / 2 + 60;
        
        // Draw snake body segments with wave effect
        for (let i = 0; i < segments; i++) {
            const offsetX = i * segmentSize * 1.2;
            const waveOffset = Math.sin(time * waveFrequency + i * 0.5) * waveAmplitude;
            
            // Gradient color from head to tail
            const greenValue = 200 - (i * 10);
            this.ctx.fillStyle = `rgb(0, ${greenValue}, 0)`;
            
            // Draw segment
            this.ctx.beginPath();
            this.ctx.arc(startX + offsetX, baseY + waveOffset, segmentSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw eyes on head
            if (i === segments - 1) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(startX + offsetX + segmentSize/4, baseY + waveOffset - segmentSize/4, segmentSize/6, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(startX + offsetX + segmentSize/4, baseY + waveOffset - segmentSize/4, segmentSize/10, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    // Draw food icon
    drawFoodIcon(x, y, size) {
        // Draw apple-like food
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--food-color');
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw stem
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--snake-color');
        this.ctx.fillRect(x - 2, y - size - 5, 4, 5);
        
        // Draw leaf
        this.ctx.beginPath();
        this.ctx.ellipse(x + 5, y - size - 3, 6, 4, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(x - size/3, y - size/3, size/3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Draw pause overlay
    drawPauseOverlay() {
        const lang = localStorage.getItem('language') || 'en';
        const message = lang === 'en' ? 'PAUSED' : '已暂停';
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
        
        const resumeMsg = lang === 'en' ? 'Press SPACE to resume' : '按空格键继续';
        this.ctx.font = '18px Arial';
        this.ctx.fillText(resumeMsg, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    // Draw game over state
    drawGameOverState() {
        const lang = localStorage.getItem('language') || 'en';
        const message = lang === 'en' ? 'GAME OVER' : '游戏结束';
        
        // Semi-transparent overlay with gradient
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, 
            this.canvas.height / 2, 
            50, 
            this.canvas.width / 2, 
            this.canvas.height / 2, 
            this.canvas.width / 2
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game over text with shadow
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#FF5252';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 40);
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        
        // Score text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        const scoreMsg = lang === 'en' ? `Score: ${this.score}` : `得分: ${this.score}`;
        this.ctx.fillText(scoreMsg, this.canvas.width / 2, this.canvas.height / 2);
        
        // High score text
        const highScoreMsg = lang === 'en' ? `High Score: ${this.highScore}` : `最高分: ${this.highScore}`;
        this.ctx.fillStyle = '#FFD700'; // Gold color
        this.ctx.fillText(highScoreMsg, this.canvas.width / 2, this.canvas.height / 2 + 30);
        
        // Draw trophy icon if score is high
        if (this.score >= this.highScore && this.score > 0) {
            this.drawTrophy(this.canvas.width / 2 - 100, this.canvas.height / 2 + 60, 30);
        }
    }
    
    // Draw trophy icon
    drawTrophy(x, y, size) {
        // Trophy cup
        this.ctx.fillStyle = '#FFD700'; // Gold color
        
        // Cup body
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.lineTo(x + size/2, y - size/2);
        this.ctx.lineTo(x + size/3, y + size/3);
        this.ctx.lineTo(x - size/3, y + size/3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Cup handles
        this.ctx.beginPath();
        this.ctx.arc(x - size/2, y - size/4, size/4, Math.PI / 2, 3 * Math.PI / 2, false);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y - size/4, size/4, -Math.PI / 2, Math.PI / 2, false);
        this.ctx.fill();
        
        // Cup base
        this.ctx.fillRect(x - size/6, y + size/3, size/3, size/3);
        this.ctx.fillRect(x - size/3, y + size/3 + size/3, size/1.5, size/6);
    }
    
    // Toggle pause state
    togglePause() {
        if (!this.gameRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Update UI for paused state
            document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-play"></i>';
            this.drawPauseOverlay();
        } else {
            // Update UI for resumed state
            document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
            this.draw();
        }
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    // Display high score from localStorage
    const highScore = localStorage.getItem('snakeHighScore') || 0;
    document.getElementById('highScore').textContent = highScore;
});