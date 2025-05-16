// Serviço para autenticação
class AuthService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro no início de sessão');
            }

            const data = await response.json();
            // Armazenar token no sessionStorage
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error) {
            console.error('Erro na autenticação:', error);
            throw error;
        }
    }

    logout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!sessionStorage.getItem('token');
    }

    getToken() {
        return sessionStorage.getItem('token');
    }

    redirectToSuccess() {
        const token = this.getToken();
        if (!token) {
            window.location.href = '/';
            return;
        }
        window.location.href = `/success?token=${encodeURIComponent(token)}`;
    }
}

// Classe para gerir a interface
class UI {
    constructor() {
        this.authService = new AuthService();
        this.setupEventListeners();
        this.checkAuth();
    }

    checkAuth() {
        if (this.authService.isAuthenticated()) {
            this.authService.redirectToSuccess();
        }
    }

    setupEventListeners() {
        // Formulário de início de sessão
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');

            try {
                await this.authService.login(username, password);
                this.authService.redirectToSuccess();
            } catch (error) {
                errorDiv.textContent = error.message;
            }
        });
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new UI();
}); 