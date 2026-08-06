import { createCanvas } from '@napi-rs/canvas';
import GIFEncoder from 'gif-encoder-2';

const COLORS = [
  '#1e3a5f', '#243b55', '#2c5282', '#1a365d',
  '#2a4365', '#2b6cb0', '#2c3e50', '#1a202c'
];

export async function generateWheelGIF(choices, options = {}) {
  const {
    width = 500,
    height = 500,
    duration = 4200,
    fps = 20,
    spinRevolutions = 5
  } = options;

  const totalFrames = Math.floor((duration / 1000) * fps);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  const sliceAngle = (2 * Math.PI) / choices.length;

  // Random final rotation
  const totalRotation = (spinRevolutions * 2 * Math.PI) + Math.random() * Math.PI * 2;

  // Calculate winner
  let angle = (-Math.PI / 2 - (totalRotation % (Math.PI * 2))) % (Math.PI * 2);
  if (angle < 0) angle += Math.PI * 2;
  const winnerIndex = Math.floor(angle / sliceAngle) % choices.length;
  const winner = choices[winnerIndex];

  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  encoder.setDelay(Math.floor(1000 / fps));
  encoder.setRepeat(-1);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let frame = 0; frame < totalFrames; frame++) {
    const progress = frame / (totalFrames - 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const rotation = totalRotation * eased;

    // Background
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, width, height);

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 36, 0, Math.PI * 2);
    ctx.fillStyle = '#5c4033';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 30, 0, Math.PI * 2);
    ctx.fillStyle = '#3e2723';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 30, 0, Math.PI * 2);
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Wheel slices
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    for (let i = 0; i < choices.length; i++) {
      const start = i * sliceAngle;
      const end = start + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // ===== Draw text (horizontal, more reliable) =====
    for (let i = 0; i < choices.length; i++) {
      const midAngle = rotation + i * sliceAngle + sliceAngle / 2;
      const textRadius = radius * 0.62;

      const x = centerX + Math.cos(midAngle) * textRadius;
      const y = centerY + Math.sin(midAngle) * textRadius;

      ctx.save();
      ctx.translate(x, y);

      // Make text upright
      let textRotation = midAngle + Math.PI / 2;
      // Flip text if it's upside down
      if (midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5) {
        textRotation += Math.PI;
      }
      ctx.rotate(textRotation);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let fontSize = 16;
      if (choices.length <= 2) fontSize = 24;
      else if (choices.length <= 4) fontSize = 20;
      else fontSize = 15;

      ctx.font = `bold ${fontSize}px Georgia, serif`;

      let name = choices[i];
      if (name.length > 12) name = name.slice(0, 11) + '…';

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(name, 0, 0);
      ctx.fillStyle = '#f5e6c8';
      ctx.fillText(name, 0, 0);
      ctx.restore();
    }

    // Center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 44, 0, Math.PI * 2);
    ctx.fillStyle = '#8b6914';
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#1c2833';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();

    // Pointer
    ctx.beginPath();
    ctx.moveTo(centerX, 12);
    ctx.lineTo(centerX - 14, 46);
    ctx.lineTo(centerX - 4, 40);
    ctx.lineTo(centerX, 54);
    ctx.lineTo(centerX + 4, 40);
    ctx.lineTo(centerX + 14, 46);
    ctx.closePath();
    ctx.fillStyle = '#9b1b1b';
    ctx.fill();
    ctx.strokeStyle = '#f8f1e3';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Center pin
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();

    encoder.addFrame(ctx);
  }

  // Hold final frame
  for (let i = 0; i < fps; i++) {
    encoder.addFrame(ctx);
  }

  encoder.finish();

  return {
    buffer: encoder.out.getData(),
    winner
  };
}