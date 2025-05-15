const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');
const app = express();
const port = 3000;

// Secret key para JWT
const JWT_SECRET = 'grupo-7';

// Dados de exemplo de usuários (em produção, isso viria de um banco de dados)
const users = [
    {
        id: "1",
        username: "admin",
        password: "admin123",
        email: "admin@example.com",
        name: "Administrador"
    }
];

// Middleware para permitir CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Middleware para processar JSON
app.use(express.json());

// Servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));

// Endpoint de login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Verificar se username e password foram fornecidos
    if (!username || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Username e password são obrigatórios' 
        });
    }

    // Buscar usuário
    const user = users.find(u => u.username === username && u.password === password);

    // Se usuário não encontrado ou senha incorreta
    if (!user) {
        return res.status(401).json({ 
            success: false,
            message: 'Credenciais inválidas' 
        });
    }

    // Criar payload do token com informações do usuário
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        name: user.name
    };

    // Gerar token JWT
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // Retornar token e informações do usuário
    res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name
        }
    });
});

// Rota protegida para obter dados do cliente
app.get('/api/consumo/:clienteId', authMiddleware, (req, res) => {
    const clienteId = req.params.clienteId;
    console.log('Buscando cliente:', clienteId);
    
    // Ler o arquivo JSON
    fs.readFile(path.join(__dirname, 'dados.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
            return res.status(500).json({ error: 'Erro ao ler os dados' });
        }

        try {
            const jsonData = JSON.parse(data);
            console.log('Dados encontrados:', jsonData);
            
            // Verificar se o ID do cliente corresponde
            if (jsonData.clienteId === clienteId){
                res.json(jsonData);
            } else {
                console.log('Cliente não encontrado');
                res.status(404).json({ error: 'Cliente não encontrado' });
            }
        } catch (error){
            console.error('Erro ao processar JSON:', error);
            res.status(500).json({ error: 'Erro ao processar os dados' });
        }
    });
});

// Rota protegida de exemplo para perfil do usuário
app.get('/api/profile', authMiddleware, (req, res) => {
    // O usuário autenticado está disponível em req.user
    res.json({ 
        success: true,
        message: 'Perfil do usuário',
        user: req.user 
    });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor a rodar em http://localhost:${port}`);
}); 