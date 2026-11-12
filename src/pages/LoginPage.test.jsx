import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';
import { authService } from '../services/authService';

// Testes de caracterização: descrevem o que a tela de login faz hoje, para a
// divisão em hooks (src/hooks/login/) não mudar nada. Passam antes e depois.
vi.mock('../services/authService', () => ({
    authService: {
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        resetPassword: vi.fn(),
        register: vi.fn()
    }
}));

const digitar = (rotulo, valor) => fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const botao = (nome) => screen.getByRole('button', { name: nome });

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('entrar com e-mail', () => {
        it('só libera Entrar com e-mail e senha de 6+ caracteres, e entra com o e-mail sem espaços', async () => {
            authService.login.mockResolvedValue({});
            render(<LoginPage />);

            expect(botao('Entrar')).toBeDisabled();
            digitar('E-mail', '  ana@exemplo.com  ');
            digitar('Senha', '12345');
            expect(botao('Entrar')).toBeDisabled();
            digitar('Senha', '123456');
            expect(botao('Entrar')).not.toBeDisabled();

            fireEvent.click(botao('Entrar'));
            await waitFor(() => expect(authService.login).toHaveBeenCalledWith('ana@exemplo.com', '123456'));
        });

        it('traduz credencial inválida e excesso de tentativas', async () => {
            authService.login.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
            render(<LoginPage />);
            digitar('E-mail', 'ana@exemplo.com');
            digitar('Senha', '123456');

            fireEvent.click(botao('Entrar'));
            expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument();

            authService.login.mockRejectedValueOnce({ code: 'auth/too-many-requests' });
            fireEvent.click(botao('Entrar'));
            expect(await screen.findByText('Muitas tentativas falhas. Tente novamente mais tarde.')).toBeInTheDocument();
        });
    });

    describe('entrar com Google', () => {
        it('chama o login do Google e mostra o erro genérico quando falha', async () => {
            authService.loginWithGoogle.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
            render(<LoginPage />);

            fireEvent.click(screen.getByText('Continue with Google'));
            await waitFor(() => expect(authService.loginWithGoogle).toHaveBeenCalledTimes(1));
            expect(await screen.findByText('Erro ao entrar com Google. Tente novamente.')).toBeInTheDocument();
        });
    });

    describe('esqueci a senha', () => {
        it('abre com o e-mail já digitado, envia o link e limpa o campo', async () => {
            authService.resetPassword.mockResolvedValue();
            render(<LoginPage />);
            digitar('E-mail', 'ana@exemplo.com');

            fireEvent.click(botao('Esqueci minha senha'));
            expect(screen.getByText('Redefinir senha')).toBeInTheDocument();
            expect(screen.getByLabelText('E-mail')).toHaveValue('ana@exemplo.com');

            fireEvent.click(botao('Enviar link'));
            await waitFor(() => expect(authService.resetPassword).toHaveBeenCalledWith('ana@exemplo.com'));
            expect(await screen.findByText(/E-mail de redefinição enviado com sucesso/)).toBeInTheDocument();
            expect(screen.getByLabelText('E-mail')).toHaveValue('');
        });

        it('traduz e-mail não cadastrado', async () => {
            authService.resetPassword.mockRejectedValue({ code: 'auth/user-not-found' });
            render(<LoginPage />);
            fireEvent.click(botao('Esqueci minha senha'));
            digitar('E-mail', 'nao@existe.com');
            fireEvent.click(botao('Enviar link'));
            expect(await screen.findByText('E-mail não cadastrado.')).toBeInTheDocument();
        });

        it('Voltar retorna ao login com os campos limpos', () => {
            render(<LoginPage />);
            digitar('E-mail', 'ana@exemplo.com');
            fireEvent.click(botao('Esqueci minha senha'));
            fireEvent.click(botao('Voltar'));
            expect(botao('Entrar')).toBeInTheDocument();
            expect(screen.getByLabelText('E-mail')).toHaveValue('');
        });
    });

    describe('cadastro', () => {
        function preencherPasso1() {
            digitar('Nome completo', 'Ana Souza');
            digitar('E-mail', 'ana@exemplo.com');
            digitar('Senha', 'Forte@123');
            digitar('Confirmar senha', 'Forte@123');
        }

        it('o passo 1 só avança com nome, e-mail, senha forte e confirmação iguais', () => {
            render(<LoginPage />);
            fireEvent.click(botao('Criar uma conta com e-mail'));
            expect(screen.getByText('Crie sua conta')).toBeInTheDocument();
            expect(botao('Próximo')).toBeDisabled();

            preencherPasso1();
            digitar('Confirmar senha', 'Outra@123');
            expect(botao('Próximo')).toBeDisabled();
            digitar('Confirmar senha', 'Forte@123');
            expect(botao('Próximo')).not.toBeDisabled();

            fireEvent.click(botao('Próximo'));
            expect(screen.getByLabelText('Gênero')).toBeInTheDocument();
        });

        it('cria a conta com os dados dos dois passos e marca o pop-up de boas-vindas', async () => {
            authService.register.mockResolvedValue({});
            render(<LoginPage />);
            fireEvent.click(botao('Criar uma conta com e-mail'));
            preencherPasso1();
            fireEvent.click(botao('Próximo'));

            fireEvent.change(screen.getByLabelText('Gênero'), { target: { value: 'feminino' } });
            fireEvent.change(screen.getByPlaceholderText('Dia'), { target: { value: '15' } });
            fireEvent.change(screen.getByPlaceholderText('Mês'), { target: { value: '6' } });
            fireEvent.change(screen.getByPlaceholderText('Ano'), { target: { value: '1990' } });
            digitar('Altura (cm)', '165');
            digitar('Peso (kg)', '60');
            expect(botao('Criar conta')).toBeDisabled();
            fireEvent.click(screen.getByRole('checkbox'));
            expect(botao('Criar conta')).not.toBeDisabled();

            fireEvent.click(botao('Criar conta'));
            await waitFor(() => expect(authService.register).toHaveBeenCalledWith(
                'ana@exemplo.com',
                'Forte@123',
                'Ana Souza',
                { gender: 'feminino', birthDate: { day: 15, month: 6, year: 1990 }, heightCm: 165, weightKg: 60 }
            ));
            await waitFor(() => expect(localStorage.getItem('welcomePending')).toBe('1'));
            expect(localStorage.getItem('welcomeFirstName')).toBe('Ana');
        });

        it('erro no cadastro desfaz o sinal de boas-vindas', async () => {
            authService.register.mockRejectedValue({ code: 'auth/email-already-in-use' });
            localStorage.setItem('welcomePending', '1');
            render(<LoginPage />);
            fireEvent.click(botao('Criar uma conta com e-mail'));
            preencherPasso1();
            fireEvent.click(botao('Próximo'));
            fireEvent.change(screen.getByLabelText('Gênero'), { target: { value: 'outro' } });
            fireEvent.change(screen.getByPlaceholderText('Dia'), { target: { value: '1' } });
            fireEvent.change(screen.getByPlaceholderText('Mês'), { target: { value: '1' } });
            fireEvent.change(screen.getByPlaceholderText('Ano'), { target: { value: '1995' } });
            digitar('Altura (cm)', '170');
            digitar('Peso (kg)', '70');
            fireEvent.click(screen.getByRole('checkbox'));
            fireEvent.click(botao('Criar conta'));

            expect(await screen.findByText(/Não foi possível criar sua conta/)).toBeInTheDocument();
            expect(localStorage.getItem('welcomePending')).toBeNull();
        });

        it('Voltar no passo 2 retorna ao passo 1 com os dados preservados', () => {
            render(<LoginPage />);
            fireEvent.click(botao('Criar uma conta com e-mail'));
            preencherPasso1();
            fireEvent.click(botao('Próximo'));
            fireEvent.click(botao('Voltar'));
            expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Souza');
        });

        it('Voltar ao login descarta o cadastro', () => {
            render(<LoginPage />);
            fireEvent.click(botao('Criar uma conta com e-mail'));
            digitar('Nome completo', 'Ana Souza');
            fireEvent.click(botao('Voltar ao login'));
            fireEvent.click(botao('Criar uma conta com e-mail'));
            expect(screen.getByLabelText('Nome completo')).toHaveValue('');
        });
    });
});
