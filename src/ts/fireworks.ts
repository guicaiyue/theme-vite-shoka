import anime from "animejs";

// 烟花特效类
export class Fireworks {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private pointerX: number = 0;
  private pointerY: number = 0;
  private render: anime.AnimeInstance | null = null;

  constructor() {
    // 初始化 canvas
    this.canvas = document.createElement("canvas");
  }

  public init(): void {
    if (!window.CONFIG) {
      console.warn("CONFIG not initialized yet, waiting...");
      return;
    }
    this.createCanvas();
    this.setupCanvas();
    this.initRender();
    this.bindEvents();
  }

  // 创建画布
  private createCanvas(): void {
    this.canvas.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:9999999";
    document.body.appendChild(this.canvas);
    const context = this.canvas.getContext("2d");
    if (!context) {
      console.error("Failed to get canvas context");
      return;
    }
    this.ctx = context;
  }

  // 设置画布大小
  private setupCanvas(): void {
    if (!this.ctx) {
      console.error("Canvas context not initialized");
      return;
    }
    this.canvas.width = window.innerWidth * 2;
    this.canvas.height = window.innerHeight * 2;
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";
    this.ctx.scale(2, 2);
  }

  // 初始化渲染器
  private initRender(): void {
    if (!this.ctx) {
      console.error("Canvas context not initialized");
      return;
    }
    this.render = anime({
      duration: Infinity,
      update: () => {
        if (!this.ctx) {
          console.error("Canvas context not initialized");
          return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      },
    });
  }

  // 绑定事件
  private bindEvents(): void {
    const tap = "click"; // ('ontouchstart' in window || navigator.msMaxTouchPoints) ? 'touchstart' : 'mousedown'

    document.addEventListener(
      tap,
      (e: MouseEvent | TouchEvent) => {
        if (!this.ctx || !this.render) {
          console.error("Canvas context or render not initialized");
          return;
        }
        this.render.play();
        this.updateCoords(e);
        this.animateParticules(this.pointerX, this.pointerY);
      },
      false
    );

    window.addEventListener("resize", () => this.setupCanvas(), false);
  }

  // 更新坐标
  private updateCoords(e: MouseEvent | TouchEvent): void {
    this.pointerX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    this.pointerY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
  }

  // 设置粒子方向
  private setParticuleDirection(p: { x: number; y: number }): { x: number; y: number } {
    const angle = (anime.random(0, 360) * Math.PI) / 180;
    const value = anime.random(50, 180);
    const radius = [-1, 1][anime.random(0, 1)] * value;
    return {
      x: p.x + radius * Math.cos(angle),
      y: p.y + radius * Math.sin(angle),
    };
  }

  // 创建粒子
  private createParticule(
    x: number,
    y: number
  ): { x: number; y: number; color: string; radius: number; endPos: { x: number; y: number }; draw: () => void } {
    const p = {
      x,
      y,
      color: window.CONFIG.fireworks[anime.random(0, window.CONFIG.fireworks.length - 1)],
      radius: anime.random(16, 32),
      endPos: this.setParticuleDirection({ x, y }),
      draw: () => {
        if (!this.ctx) {
          console.error("Canvas context not initialized");
          return;
        }
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      },
    };
    return p;
  }

  // 创建圆形
  private createCircle(
    x: number,
    y: number
  ): { x: number; y: number; color: string; radius: number; alpha: number; lineWidth: number; draw: () => void } {
    const p = {
      x,
      y,
      color: "#FFF",
      radius: 0.1,
      alpha: 0.5,
      lineWidth: 6,
      draw: () => {
        if (!this.ctx) {
          console.error("Canvas context not initialized");
          return;
        }
        this.ctx.globalAlpha = p.alpha;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
        this.ctx.lineWidth = p.lineWidth;
        this.ctx.strokeStyle = p.color;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
      },
    };
    return p;
  }

  // 渲染粒子
  private renderParticule(anim: anime.AnimeAnimParams): void {
    for (let i = 0; i < anim.animatables.length; i++) {
      anim.animatables[i].target.draw();
    }
  }

  // 动画粒子散出
  private animateParticules(x: number, y: number): void {
    const circle = this.createCircle(x, y);
    const particules = [];
    for (let i = 0; i < 30; i++) {
      particules.push(this.createParticule(x, y));
    }

    anime
      .timeline()
      .add({
        targets: particules,
        x: (p: any) => p.endPos.x,
        y: (p: any) => p.endPos.y,
        radius: 0.1,
        duration: anime.random(1200, 1800),
        easing: "easeOutExpo",
        update: this.renderParticule.bind(this),
      })
      .add(
        {
          targets: circle,
          radius: anime.random(80, 160),
          lineWidth: 0,
          alpha: {
            value: 0,
            easing: "linear",
            duration: anime.random(600, 800),
          },
          duration: anime.random(1200, 1800),
          easing: "easeOutExpo",
          update: this.renderParticule.bind(this),
        },
        0
      );
  }
}

// 导出全局烟花实例
window.fireworks = new Fireworks();
