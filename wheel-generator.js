import { createCanvas } from '@napi-rs/canvas';
import GIFEncoder from 'gif-encoder-2';

const COLORS = [
  '#1e3a5f', '#2c5282', '#243b55', '#1a365d',
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
  const radius = Math.min(width, height) / 2 - 42;
  const sliceAngle = (2 * Math.PI) / choices.length;

  const totalRotation = (spinRevolutions * 2 * Math.PI) + Math.random() * Math.PI * 2;

  let finalAngle = (totalRotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  let normalized = (Math.PI * 1.5 - finalAngle + Math.PI * 2) % (Math.PI * 2);
  const winnerIndex = Math.floor(normalized / sliceAngle) % choices.length;
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
    ctx.arc(centerX, centerY, radius + 38, 0, Math.PI * 2);
    ctx.fillStyle = '#5c4033';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 32, 0, Math.PI * 2);
    ctx.fillStyle = '#3e2723';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 32, 0, Math.PI * 2);
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Wheel
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    for (let i = 0; i < choices.length; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      let fontSize = 18;
      if (choices.length <= 2) fontSize = 28;
      else if (choices.length === 3) fontSize = 24;
      else if (choices.length <= 5) fontSize = 20;

      ctx.font = `bold ${fontSize}px "DejaVu Sans"`;

      let text = choices[i];
      if (text.length > 12) text = text.substring(0, 11) + '…';

      const textX = radius - 22;

      // Text background
      const metrics = ctx.measureText(text);
      const padding = 6;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(
        textX - metrics.width - padding,
        -fontSize / 2 - padding / 2,
        metrics.width + padding * 2,
        fontSize + padding
      );

      // Text
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(text, textX, 0);
      ctx.fillStyle = '#f5e6c8';
      ctx.fillText(text, textX, 0);

      ctx.restore();
    }

    // Center
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fillStyle = '#8b6914';
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#1c2833';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();

    ctx.restore();

    // Pointer
    ctx.beginPath();
    ctx.moveTo(centerX, 12);
    ctx.lineTo(centerX - 14, 48);
    ctx.lineTo(centerX - 4, 42);
    ctx.lineTo(centerX, 56);
    ctx.lineTo(centerX + 4, 42);
    ctx.lineTo(centerX + 14, 48);
    ctx.closePath();
    ctx.fillStyle = '#9b1b1b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Center pin
    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();

    encoder.addFrame(ctx);
  }

  for (let i = 0; i < fps; i++) {
    encoder.addFrame(ctx);
  }

  encoder.finish();

  return {
    buffer: encoder.out.getData(),
    winner
  };
}