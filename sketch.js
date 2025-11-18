class SpriteCharacter {
  constructor(sheet, frameCount, frameHold, sizeRatio) {
    this.sheet = sheet;
    this.frameCount = frameCount;
    this.frameHold = frameHold;
    this.sizeRatio = sizeRatio; // fraction of viewport for scaling
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.currentFrame = 0;
    this.frameProgress = 0;
    this.x = 0;
    this.y = 0;
  }

  ensureFrameSize() {
    if (!this.frameWidth || !this.frameHeight) {
      this.frameWidth = this.sheet.width / this.frameCount;
      this.frameHeight = this.sheet.height;
    }
  }

  updateFrame() {
    // Default to a single frame's worth of time if no multiplier is provided.
    this.updateFrameWithSpeed(1);
  }

  updateFrameWithSpeed(speedMultiplier) {
    const step = max(speedMultiplier, 0);
    this.frameProgress += step;
    const threshold = this.frameHold;
    if (this.frameProgress >= threshold) {
      const framesAdvanced = floor(this.frameProgress / threshold);
      this.currentFrame = (this.currentFrame + framesAdvanced) % this.frameCount;
      this.frameProgress = this.frameProgress % threshold;
    }
  }

  draw(shouldAnimate = true, speedMultiplier = 1) {
    this.ensureFrameSize();
    if (shouldAnimate) {
      this.updateFrameWithSpeed(speedMultiplier);
    }

    const maxWidth = width * this.sizeRatio;
    const maxHeight = height * this.sizeRatio;
    const scale = min(maxWidth / this.frameWidth, maxHeight / this.frameHeight);
    const drawWidth = this.frameWidth * scale;
    const drawHeight = this.frameHeight * scale;

    image(
      this.sheet,
      this.x,
      this.y,
      drawWidth,
      drawHeight,
      this.currentFrame * this.frameWidth,
      0,
      this.frameWidth,
      this.frameHeight
    );

    return { drawWidth, drawHeight };
  }
}

let char1;
let char2;
let char3;
const MOVE_SPEED = 5;
let isAnimating = false;
const BGM_PATH = 'bgm.mp3'; // rename to your actual audio file
let bgm;
let amplitude;
let loadingFontSize = 48;
const TOTAL_ASSETS = 4; // 3 sprite sheets + 1 audio
let assetsLoaded = 0;

function preload() {
  const spriteSheet = loadImage('1/all.png', markAssetLoaded);
  const spriteSheet2 = loadImage('2/all.png', markAssetLoaded);
  const spriteSheet3 = loadImage('1-1/all.png', markAssetLoaded);
  bgm = loadSound(
    BGM_PATH,
    () => {
      // Once loaded, set up amplitude analyzer.
      amplitude = new p5.Amplitude(0.9);
      amplitude.setInput(bgm);
      markAssetLoaded();
    },
    () => {
      // If audio fails to load, still allow the sketch to start.
      markAssetLoaded();
    }
  );
  char1 = new SpriteCharacter(spriteSheet, 5, 8, 0.25);
  char2 = new SpriteCharacter(spriteSheet2, 10, 8, 0.2);
  char3 = new SpriteCharacter(spriteSheet3, 15, 8, 0.25);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  centerCharacters();
}

function draw() {
  background(204, 255, 204); // light green backdrop

  if (!assetsReady()) {
    drawLoading();
    return;
  }

  // Amplitude-driven speed multiplier: louder music -> faster animation.
  const level = amplitude ? amplitude.getLevel() : 0;
  const speedMultiplier = isAnimating ? map(level, 0, 0.3, 0.5, 4, true) : 0;

  // Handle horizontal movement via arrow keys.
  if (keyIsDown(LEFT_ARROW)) char1.x -= MOVE_SPEED;
  if (keyIsDown(RIGHT_ARROW)) char1.x += MOVE_SPEED;

  // Keep main character on screen based on its rendered width.
  const { drawWidth } = char1.draw(isAnimating, speedMultiplier);
  char1.x = constrain(char1.x, drawWidth / 2, width - drawWidth / 2);

  // Second character stays on the right.
  char2.draw(isAnimating, speedMultiplier);

  // Third character stays on the left.
  char3.draw(isAnimating, speedMultiplier);
}

function assetsReady() {
  // All assets loaded via callbacks.
  return assetsLoaded >= TOTAL_ASSETS;
}

function markAssetLoaded() {
  assetsLoaded += 1;
}

function drawLoading() {
  push();
  textAlign(CENTER, CENTER);
  textSize(loadingFontSize);
  fill(20, 80, 20);
  text('Loading...', width / 2, height / 2);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  centerCharacters();
}

function centerCharacters() {
  if (char1) {
    char1.x = width / 2;
    char1.y = height / 2;
  }
  if (char2) {
    char2.x = width * 0.75;
    char2.y = height / 2;
  }
  if (char3) {
    char3.x = width * 0.9;
    char3.y = height / 2;
  }
}

function mousePressed() {
  isAnimating = !isAnimating;
  // Start background music on first user interaction to satisfy autoplay policies.
  if (bgm && !bgm.isPlaying()) {
    bgm.loop();
  }
}
