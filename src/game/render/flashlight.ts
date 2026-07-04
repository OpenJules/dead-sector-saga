import type { GameState } from "../types";

const FLASHLIGHT_CONE_ANGLE = Math.PI / 3; // 60 degrees
const FLASHLIGHT_LENGTH = 400;
const DARKNESS_ALPHA = 0.92;

export function drawFlashlight(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: GameState) {
  if (!s.selectedMap || s.selectedMap !== "hospital") return;
  if (s.powerOn) return;
  if (!s.flashlightOn) return;

  const p = s.player.pos;
  const cam = s.camera;
  
  // Player position in screen coordinates
  const screenX = p.x - cam.x;
  const screenY = p.y - cam.y;
  
  // Aim angle
  const aim = s.player.aim;
  
  ctx.save();
  
  // Draw 4 dark rectangles around the cone to create darkness
  // We'll draw the cone as a "clear" area by filling everything else with darkness
  
  const leftAngle = aim - FLASHLIGHT_CONE_ANGLE / 2;
  const rightAngle = aim + FLASHLIGHT_CONE_ANGLE / 2;
  
  // Calculate cone edge points
  const leftX = screenX + Math.cos(leftAngle) * FLASHLIGHT_LENGTH;
  const leftY = screenY + Math.sin(leftAngle) * FLASHLIGHT_LENGTH;
  const rightX = screenX + Math.cos(rightAngle) * FLASHLIGHT_LENGTH;
  const rightY = screenY + Math.sin(rightAngle) * FLASHLIGHT_LENGTH;
  
  ctx.fillStyle = `rgba(0, 0, 0, ${DARKNESS_ALPHA})`;
  
  // Draw darkness as a path that covers everything EXCEPT the cone
  // We do this by drawing a full-screen rect, then cutting out the cone
  ctx.beginPath();
  
  // Start from top-left, go around the screen
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  
  // Now cut out the cone shape (counter-clockwise to subtract)
  ctx.moveTo(screenX, screenY);
  ctx.arc(screenX, screenY, FLASHLIGHT_LENGTH, rightAngle, leftAngle, true);
  ctx.closePath();
  
  ctx.fill();
  
  // Add a soft gradient at the cone edges for smoother transition
  const edgeGradient = ctx.createRadialGradient(
    screenX, screenY, FLASHLIGHT_LENGTH * 0.6,
    screenX, screenY, FLASHLIGHT_LENGTH
  );
  edgeGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  edgeGradient.addColorStop(1, `rgba(0, 0, 0, ${DARKNESS_ALPHA})`);
  
  ctx.fillStyle = edgeGradient;
  ctx.beginPath();
  ctx.arc(screenX, screenY, FLASHLIGHT_LENGTH, leftAngle, rightAngle);
  ctx.lineTo(screenX, screenY);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

export function drawGenerator(ctx: CanvasRenderingContext2D, s: GameState) {
  if (!s.generator) return;
  
  const gen = s.generator;
  const cam = s.camera;
  
  // Generator position in screen coordinates
  const screenX = gen.pos.x - cam.x;
  const screenY = gen.pos.y - cam.y;
  
  ctx.save();
  
  // Generator body
  ctx.fillStyle = gen.active ? "#2a4a2a" : "#3a3a3a";
  ctx.fillRect(screenX - 30, screenY - 20, 60, 40);
  
  // Border
  ctx.strokeStyle = gen.active ? "#4a8a4a" : "#5a5a5a";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX - 30, screenY - 20, 60, 40);
  
  // Indicator light
  ctx.fillStyle = gen.active ? "#00ff00" : "#ff0000";
  ctx.beginPath();
  ctx.arc(screenX + 20, screenY - 10, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Pulsing glow when player is nearby
  const dist = Math.hypot(s.player.pos.x - gen.pos.x, s.player.pos.y - gen.pos.y);
  if (dist < 100 && !gen.active) {
    const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
    ctx.shadowBlur = 20 * pulse;
    ctx.shadowColor = "#ff6600";
    ctx.fillStyle = `rgba(255, 102, 0, ${0.3 * pulse})`;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  // Label
  ctx.fillStyle = "#ffffff";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GENERATOR", screenX, screenY + 35);
  
  ctx.restore();
}
