/**
 * shareWorkoutImage.js
 * Parte destacável do compartilhamento: converte o canvas do card em um
 * Blob JPEG. Rejeita quando o canvas não está disponível ou o encode falha.
 */

export function canvasToJpegBlob(canvas, quality = 0.88) {
    return new Promise((resolve, reject) => {
        if (!canvas || !canvas.toBlob) {
            reject(new Error('Canvas não disponível para exportação.'));
            return;
        }
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falha gerar blob do canvas'));
        }, 'image/jpeg', quality);
    });
}
