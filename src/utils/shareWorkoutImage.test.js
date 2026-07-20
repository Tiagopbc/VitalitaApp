import { describe, expect, it, vi } from 'vitest';
import { canvasToJpegBlob } from './shareWorkoutImage';

describe('shareWorkoutImage', () => {
    describe('canvasToJpegBlob', () => {
        it('resolves with the blob produced by canvas.toBlob', async () => {
            const fakeBlob = new Blob(['x'], { type: 'image/jpeg' });
            const canvas = {
                toBlob: vi.fn((cb, type, quality) => {
                    expect(type).toBe('image/jpeg');
                    expect(quality).toBe(0.88);
                    cb(fakeBlob);
                })
            };

            await expect(canvasToJpegBlob(canvas)).resolves.toBe(fakeBlob);
        });

        it('passes through a custom quality', async () => {
            const canvas = { toBlob: vi.fn((cb) => cb(new Blob())) };
            await canvasToJpegBlob(canvas, 0.5);
            expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.5);
        });

        it('rejects when the canvas is missing or lacks toBlob', async () => {
            await expect(canvasToJpegBlob(null)).rejects.toThrow('Canvas não disponível');
            await expect(canvasToJpegBlob({})).rejects.toThrow('Canvas não disponível');
        });

        it('rejects when toBlob yields no blob', async () => {
            const canvas = { toBlob: (cb) => cb(null) };
            await expect(canvasToJpegBlob(canvas)).rejects.toThrow('Falha gerar blob');
        });
    });
});
