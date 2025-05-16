const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const authMiddleware = require('./middleware/auth');
const User = require('./models/User');
const app = express();
const port = 3000;

// Secret key para JWT
const JWT_SECRET = 'grupo-7';

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://gabriel:12345@cluster0.lqcifjt.mongodb.net/base_dados?retryWrites=true&w=majority&appName=Cluster0';

// Função para inicializar utilizadores apenas se a coleção estiver vazia
async function initializeUsersIfEmpty() {
    try {
        // Verificar se existem utilizadores
        const userCount = await User.countDocuments();
        
        if (userCount === 0) {
            console.log('Coleção de utilizadores vazia. Inicializando utilizadores...');
            
            // Ler utilizadores do arquivo JSON
            const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
            const testUsers = usersData.users;

            // Criar novos utilizadores
            const createdUsers = await User.create(testUsers);
            console.log(`${createdUsers.length} utilizadores criados com sucesso:`);
            
            // Mostrar utilizadores criados
            createdUsers.forEach(user => {
                console.log(`- ${user.name} (${user.username}) - Função: ${user.role}`);
            });
        } else {
            console.log(`Já existem ${userCount} utilizadores na base de dados.`);
        }
    } catch (error) {
        console.error('Erro ao inicializar utilizadores:', error);
    }
}

// Conectar ao MongoDB Atlas
console.log('Tentando conectar ao MongoDB Atlas...');
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('CONECTADO COM SUCESSO ao MongoDB Atlas!');
    console.log('Database: base_dados');
    console.log('URL: cluster0.lqcifjt.mongodb.net');
    
    // Inicializar utilizadores se necessário
    await initializeUsersIfEmpty();
}).catch(err => {
    console.error('ERRO ao conectar ao MongoDB Atlas:', err.message);
});

// Middleware para permitir CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Middleware para processar JSON
app.use(express.json());

// Rota protegida para success
app.get('/success', (req, res, next) => {
    // Verificar se o token está na query string
    const token = req.query.token;
    if (token) {
        // Adicionar o token ao header de autorização
        req.headers.authorization = `Bearer ${token}`;
    }
    next();
}, authMiddleware, (req, res) => {
    // Ler o arquivo de template
    const template = fs.readFileSync(path.join(__dirname, 'views', 'success.html'), 'utf8');
    
    // Substituir as variáveis no template
    const html = template
        .replace('{{name}}', req.user.name)
        .replace('{{username}}', req.user.username)
        .replace('{{email}}', req.user.email)
        .replace('{{role}}', req.user.role);
    
    res.send(html);
});

// Endpoint para verificar token
app.get('/api/verify-token', authMiddleware, (req, res) => {
    res.json({ 
        success: true, 
        user: req.user 
    });
});

// Servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));

// Endpoint de login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Verificar se username e password foram fornecidos
    if (!username || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Username e password são obrigatórios' 
        });
    }

    try {
        // Buscar utilizador no MongoDB
        const user = await User.findOne({ username });
        
        // Se utilizador não encontrado
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Credenciais inválidas' 
            });
        }

        // Verificar senha
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Credenciais inválidas' 
            });
        }

        // Criar payload do token com informações do utilizador
        const payload = {
            userId: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role
        };

        // Gerar token JWT
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // Retornar token e informações do utilizador
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor' 
        });
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor a rodar em http://localhost:${port}`);
}); 