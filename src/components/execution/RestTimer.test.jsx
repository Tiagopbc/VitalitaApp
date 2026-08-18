/**
 * RestTimer.test.jsx
 * Cobre a coordenação entre o push de segundo plano e os alertas locais —
 * a lógica mais delicada do timer e, até aqui, a única verificável apenas à
 * mão num iPhone com a tela bloqueada.
 *
 * O ponto central: os dois mecanismos cobrem casos OPOSTOS, não redundantes.
 * O alerta local vive dentro do setInterval, que congela com o app suspenso;
 * o push cobre exatamente essa janela. Por isso cancelar um sem garantir o
 * outro deixa o descanso terminar em silêncio — é o que estes casos travam.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

vi.mock('../../services/restPushService', () => ({
    scheduleRestPush: vi.fn(),
    cancelRestPush: vi.fn(),
    warmRestPushSubscription: vi.fn().mockResolvedValue(true),
    MIN_PUSH_DELAY_SECONDS: 5
}));

vi.mock('../../services/pushDiagnostics', () => ({
    describePushContext: vi.fn()
}));

vi.mock('../../utils/restTimerAlerts', () => ({
    primeRestAudio: vi.fn(),
    playRestCompleteSound: vi.fn(),
    ensureNotificationPermission: vi.fn().mockResolvedValue(true),
    notifyRestComplete: vi.fn()
}));

import { RestTimer } from './RestTimer';
import { scheduleRestPush, cancelRestPush } from '../../services/restPushService';
import { describePushContext } from '../../services/pushDiagnostics';
import { primeRestAudio, playRestCompleteSound } from '../../utils/restTimerAlerts';

const agendado = (messageId = 'msg-1') => Promise.resolve({ messageId, reason: null });
const recusado = (reason) => Promise.resolve({ messageId: null, reason });

function setVisibility(state) {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state
    });
}

/** Renderiza o timer já rodando (o start real acontece num setTimeout(0)). */
async function renderRodando(props = {}) {
    const utils = render(
        <RestTimer
            initialTime={90}
            isOpen
            onComplete={vi.fn()}
            onClose={vi.fn()}
            {...props}
        />
    );
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    return utils;
}

describe('RestTimer — push de segundo plano', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        setVisibility('visible');
        scheduleRestPush.mockReturnValue(agendado());
        describePushContext.mockReturnValue({ isIOS: false, reason: null });
    });

    afterEach(() => {
        vi.useRealTimers();
        setVisibility('visible');
    });

    it('agenda o push com a duração do descanso ao iniciar', async () => {
        await renderRodando({ initialTime: 90 });

        expect(scheduleRestPush).toHaveBeenCalledWith(90);
    });

    // O backend recusa abaixo de MIN_DELAY_SECONDS; chamar seria garantir um
    // 400. Nesses descansos o alerta local basta, porque ninguém sai do app.
    it('não agenda push em descanso abaixo do piso do backend', async () => {
        await renderRodando({ initialTime: 3 });

        expect(scheduleRestPush).not.toHaveBeenCalled();
    });

    it('cancela o push ao pausar o descanso', async () => {
        await renderRodando();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Pausar descanso' }));
        });

        expect(cancelRestPush).toHaveBeenCalledWith('msg-1');
    });

    // Com o app à vista o alerta local cobre o fim, então o push é dispensado
    // com folga para não chegar duplicado.
    it('cancela o push nos últimos 5s quando o app está visível', async () => {
        await renderRodando({ initialTime: 90 });

        await act(async () => { await vi.advanceTimersByTimeAsync(85_500); });

        expect(cancelRestPush).toHaveBeenCalledWith('msg-1');
    });

    // Este é o caso que não pode regredir: com o app oculto o setInterval está
    // congelado e o push é o ÚNICO aviso possível. Cancelá-lo seria silêncio.
    it('não cancela o push nos últimos 5s quando o app está oculto', async () => {
        await renderRodando({ initialTime: 90 });
        setVisibility('hidden');

        await act(async () => { await vi.advanceTimersByTimeAsync(85_500); });

        expect(cancelRestPush).not.toHaveBeenCalled();
    });

    // Em descanso curto a janela de 5s comeria boa parte do tempo útil de sair
    // do app, então ali o push sobrevive até o fim.
    it('não aplica a janela de 5s em descanso abaixo de 30s', async () => {
        await renderRodando({ initialTime: 20 });

        await act(async () => { await vi.advanceTimersByTimeAsync(15_500); });

        expect(cancelRestPush).not.toHaveBeenCalled();
    });

    // O iOS pode congelar a requisição de agendamento e resolvê-la só quando o
    // app volta — depois de o timer já ter sido pausado. O messageId que chega
    // atrasado precisa se cancelar sozinho, senão dispara um push fantasma.
    it('cancela agendamento que só responde depois do cancelamento', async () => {
        let resolverAgendamento;
        scheduleRestPush.mockReturnValue(new Promise((resolve) => {
            resolverAgendamento = resolve;
        }));
        await renderRodando();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Pausar descanso' }));
        });
        await act(async () => {
            resolverAgendamento({ messageId: 'atrasado', reason: null });
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(cancelRestPush).toHaveBeenCalledWith('atrasado');
    });
});

describe('RestTimer — aviso de falha silenciosa', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        setVisibility('visible');
        scheduleRestPush.mockReturnValue(agendado());
        describePushContext.mockReturnValue({ isIOS: false, reason: null });
    });

    afterEach(() => {
        vi.useRealTimers();
        setVisibility('visible');
    });

    it('não mostra aviso nenhum quando o agendamento dá certo', async () => {
        await renderRodando();

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Backend fora, QStash recusando ou sem rede: o descanso vai terminar sem
    // aviso se o usuário sair do app, e ele precisa saber disso ANTES.
    it('orienta a manter a tela aberta quando o agendamento falha no servidor', async () => {
        scheduleRestPush.mockReturnValue(recusado('server'));

        await renderRodando();

        expect(screen.getByRole('status')).toHaveTextContent(/Mantenha esta tela aberta/i);
    });

    it('orienta a manter a tela aberta quando a requisição não completa', async () => {
        scheduleRestPush.mockReturnValue(recusado('network'));

        await renderRodando();

        expect(screen.getByRole('status')).toHaveTextContent(/Mantenha esta tela aberta/i);
    });

    it('aponta a permissão de notificação quando é ela que falta', async () => {
        scheduleRestPush.mockReturnValue(recusado('permission'));

        await renderRodando();

        expect(screen.getByRole('status')).toHaveTextContent(/notificações estão bloqueadas/i);
    });

    // 'below-min-delay' é resultado esperado, não falha: avisar aqui treinaria
    // o usuário a ignorar o banner.
    it('fica calado quando o motivo é o descanso ser curto demais', async () => {
        scheduleRestPush.mockReturnValue(recusado('below-min-delay'));

        await renderRodando();

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Sem o PWA instalado nenhum agendamento vai funcionar: essa mensagem
    // descreve a causa raiz e é acionável, então não pode ser sobrescrita.
    it('preserva o aviso de instalação do iOS mesmo com falha de agendamento', async () => {
        describePushContext.mockReturnValue({ isIOS: true, reason: 'ios-not-standalone' });
        scheduleRestPush.mockReturnValue(recusado('permission'));

        await renderRodando();

        expect(screen.getByRole('status')).toHaveTextContent(/Adicionar à Tela de Início/i);
    });
});

describe('RestTimer — alertas locais', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        setVisibility('visible');
        scheduleRestPush.mockReturnValue(agendado());
        describePushContext.mockReturnValue({ isIOS: false, reason: null });
    });

    afterEach(() => {
        vi.useRealTimers();
        setVisibility('visible');
    });

    // O iOS suspende o AudioContext em segundo plano e não o retoma sozinho:
    // sem este retorno, o bipe de fim de descanso ficava mudo para sempre
    // depois da primeira saída do app.
    it('retoma o áudio ao voltar do segundo plano', async () => {
        await renderRodando();
        primeRestAudio.mockClear();

        setVisibility('hidden');
        await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
        expect(primeRestAudio).not.toHaveBeenCalled();

        setVisibility('visible');
        await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
        expect(primeRestAudio).toHaveBeenCalled();
    });

    it('toca o alerta local ao fim do descanso', async () => {
        await renderRodando({ initialTime: 20 });

        await act(async () => { await vi.advanceTimersByTimeAsync(20_100); });

        expect(playRestCompleteSound).toHaveBeenCalled();
    });
});
