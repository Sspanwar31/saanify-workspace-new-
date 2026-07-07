'use client';

export interface ChristmasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  type: 'snow' | 'gold' | 'ice' | 'burst' | 'smoke';
  life: number;
  maxLife: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default class ChristmasParticles {
  particles: ChristmasParticle[] = [];

  /* ------------------------------------------------ */
  /* SNOW                                              */
  /* ------------------------------------------------ */

  spawnSnow(width: number) {
    this.particles.push({
      x: Math.random() * width,
      y: -20,
      vx: rand(-0.2, 0.2),
      vy: rand(0.6, 1.4),
      size: rand(1, 3),
      alpha: rand(0.4, 1),
      color: '#ffffff',
      type: 'snow',
      life: 0,
      maxLife: 700,
    });
  }

  /* ------------------------------------------------ */
  /* REINDEER BREATH                                  */
  /* ------------------------------------------------ */

  spawnSmoke(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x,
        y,
        vx: rand(0.2, 0.6),
        vy: rand(-0.25, 0.1),
        size: rand(4, 8),
        alpha: 0.3,
        color: '#eef6ff',
        type: 'smoke',
        life: 0,
        maxLife: 70,
      });
    }
  }

  /* ------------------------------------------------ */
  /* GOLD MAGIC                                       */
  /* ------------------------------------------------ */

  spawnGold(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(0.8, 2.2);

      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        size: rand(2, 4),
        alpha: 1,
        color: '#fbbf24',
        type: 'gold',
        life: 0,
        maxLife: 90,
      });
    }
  }

  /* ------------------------------------------------ */
  /* ICE MAGIC                                        */
  /* ------------------------------------------------ */

  spawnIce(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(0.8, 2.2);

      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        size: rand(2, 4),
        alpha: 1,
        color: '#7dd3fc',
        type: 'ice',
        life: 0,
        maxLife: 90,
      });
    }
  }

  /* ------------------------------------------------ */
  /* MAGIC EXPLOSION                                  */
  /* ------------------------------------------------ */

  explode(cx: number, cy: number) {
    const colors = [
      '#ffffff',
      '#fbbf24',
      '#fde68a',
      '#7dd3fc',
      '#38bdf8',
    ];

    for (let i = 0; i < 700; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(2, 12);

      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        size: rand(1, 4),
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'burst',
        life: 0,
        maxLife: rand(100, 180),
      });
    }
  }

  /* ------------------------------------------------ */
  /* UPDATE                                            */
  /* ------------------------------------------------ */

  update(ctx: CanvasRenderingContext2D, w: number, h: number) {
    this.particles = this.particles.filter((p) => {
      p.life++;

      switch (p.type) {
        case 'snow':
          p.y += p.vy;
          p.x += p.vx + Math.sin(p.life * 0.03) * 0.15;
          break;

        case 'smoke':
          p.x += p.vx;
          p.y += p.vy;
          p.size += 0.12;
          break;

        case 'gold':
        case 'ice':
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          break;

        case 'burst':
          p.x += p.vx;
          p.y += p.vy;

          p.vx *= 0.985;
          p.vy *= 0.985;

          p.vy += 0.02;
          break;
      }

      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (
        p.alpha <= 0 ||
        p.y > h + 50 ||
        p.x < -50 ||
        p.x > w + 50
      ) {
        return false;
      }

      ctx.save();

      ctx.globalAlpha = p.alpha;

      if (p.type !== 'snow') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 18;
        ctx.shadowColor = p.color;
      }

      ctx.fillStyle = p.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      return true;
    });
  }
}
