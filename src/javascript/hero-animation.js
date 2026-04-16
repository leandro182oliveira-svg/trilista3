/**
 * Hero Background Animation (Automatic Loop)
 * Cycles through 40 JPEG frames using HTML5 Canvas for high performance.
 */

class HeroAnimation {
    constructor(canvasId, totalFrames, framePattern) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.totalFrames = totalFrames;
        this.framePattern = framePattern;
        this.images = [];
        this.currentFrame = 0;
        this.loadedCount = 0;
        this.fps = 6;
        this.lastTime = 0;
        this.frameInterval = 1000 / this.fps;

        this.isPlaying = false;
        this.timeoutId = null;
        this.observer = null;
        this.resizeObserver = null;

        this.init();
    }

    init() {
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('load', () => this.handleResize());
        this.setupResizeObserver();
        this.preloadImages();
    }

    setupResizeObserver() {
        if (!window.ResizeObserver || !this.canvas.parentElement) return;

        this.resizeObserver = new ResizeObserver(() => this.handleResize());
        this.resizeObserver.observe(this.canvas);
        this.resizeObserver.observe(this.canvas.parentElement);
    }

    handleResize() {
        const nextWidth = this.canvas.clientWidth;
        const nextHeight = this.canvas.clientHeight;

        if (!nextWidth || !nextHeight) return;

        if (this.canvas.width === nextWidth && this.canvas.height === nextHeight) {
            this.render();
            return;
        }

        this.canvas.width = nextWidth;
        this.canvas.height = nextHeight;
        this.render();
    }

    preloadImages() {
        for (let i = 1; i <= this.totalFrames; i++) {
            const img = new Image();
            const frameNumber = String(i).padStart(3, '0');
            img.src = `${this.framePattern}${frameNumber}.jpg`;
            img.onload = () => {
                this.loadedCount++;
                if (this.loadedCount === this.totalFrames) {
                    this.setupObserver();
                }
            };
            this.images.push(img);
        }
    }

    setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.currentFrame = 0;
                    this.render();

                    if (this.timeoutId) clearTimeout(this.timeoutId);

                    this.timeoutId = setTimeout(() => {
                        this.isPlaying = true;
                        this.lastTime = performance.now();
                        this.start();
                    }, 2000);
                } else {
                    this.isPlaying = false;
                    if (this.timeoutId) clearTimeout(this.timeoutId);
                }
            });
        }, { threshold: 0.1 });

        this.observer.observe(this.canvas);
    }

    start() {
        if (!this.isPlaying) return;
        requestAnimationFrame((time) => this.animate(time));
    }

    animate(time) {
        if (!this.isPlaying) return;

        const delta = time - this.lastTime;

        if (delta >= this.frameInterval) {
            if (this.currentFrame >= this.totalFrames - 1) {
                this.isPlaying = false;
                return;
            }

            this.currentFrame++;
            this.render();
            this.lastTime = time;
        }

        if (this.isPlaying) {
            requestAnimationFrame((t) => this.animate(t));
        }
    }

    render() {
        if (!this.images[this.currentFrame]) return;

        const img = this.images[this.currentFrame];
        const canvasAspect = this.canvas.width / this.canvas.height;
        const imgAspect = img.width / img.height;
        const viewportWidth = window.innerWidth;
        const isMobile = viewportWidth <= 768;
        const isNarrowDesktop = viewportWidth > 768 && viewportWidth <= 1100;

        let drawWidth;
        let drawHeight;
        let offsetX;
        let offsetY;

        // Desktop should always fill the whole hero using centered cover.
        if (canvasAspect > imgAspect) {
            drawWidth = this.canvas.width;
            drawHeight = drawWidth / imgAspect;
            offsetX = 0;
            offsetY = (this.canvas.height - drawHeight) / 2;
        } else {
            drawHeight = this.canvas.height;
            drawWidth = drawHeight * imgAspect;
            offsetX = (this.canvas.width - drawWidth) / 2;
            offsetY = 0;
        }

        if (isMobile) {
            const cropLeft = 0.3;
            const scale = 0.7;
            const offsetRight = 26;
            const offsetBottom = -180;

            const sourceX = img.width * cropLeft;
            const sourceWidth = img.width - sourceX;
            const mobileScale = (this.canvas.height / img.height) * scale;

            drawWidth = sourceWidth * mobileScale;
            drawHeight = img.height * mobileScale;

            offsetX = this.canvas.width - drawWidth + offsetRight;
            offsetY = this.canvas.height - drawHeight + offsetBottom;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(
                img,
                sourceX,
                0,
                sourceWidth,
                img.height,
                offsetX,
                offsetY,
                drawWidth,
                drawHeight
            );
            return;
        }

        if (isNarrowDesktop) {
            drawWidth *= 1.18;
            drawHeight *= 1.18;
            offsetX = (this.canvas.width - drawWidth) / 2;
            offsetY = (this.canvas.height - drawHeight) / 2;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.heroAnimationInstance = new HeroAnimation(
        'hero-bg-canvas',
        40,
        'src/img/landing page Celular/ezgif-frame-'
    );
});
