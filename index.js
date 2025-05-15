// Serviço para consultar consumos energéticos
class ConsumoService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
    }

    async getConsumoCliente(clienteId) {
        try {
            const response = await fetch(`${this.baseUrl}/consumo/${clienteId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Cliente não encontrado');
                } else if (response.status === 0) {
                    throw new Error('Não foi possível conectar ao servidor. Verifique se o servidor está rodando.');
                } else {
                    throw new Error(`Erro do servidor: ${response.status}`);
                }
            }
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }
}

// Classe para gerenciar a interface
class ConsumoUI {
    constructor() {
        this.service = new ConsumoService();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('searchForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clienteId = document.getElementById('clienteId').value;
            if (!clienteId) {
                alert('Por favor, digite o ID do cliente');
                return;
            }
            try {
                const data = await this.service.getConsumoCliente(clienteId);
                this.displayData(data);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    displayData(data) {
        // Informações básicas
        document.getElementById('clienteIdResult').textContent = data.clienteId;
        document.getElementById('nomeResult').textContent = data.nome;

        // Endereço
        document.getElementById('ruaResult').textContent = data.endereco.rua;
        document.getElementById('numeroResult').textContent = data.endereco.numero;
        document.getElementById('cidadeResult').textContent = data.endereco.cidade;
        document.getElementById('codigoPostalResult').textContent = data.endereco.codigoPostal;

        // Informações adicionais
        document.getElementById('tipoTarifaResult').textContent = data.informacoesAdicionais.tipoTarifa;
        document.getElementById('fornecedorResult').textContent = data.informacoesAdicionais.fornecedorEnergia;
        document.getElementById('contratoAtivoResult').textContent = data.informacoesAdicionais.contratoAtivo ? 'Sim' : 'Não';

        // Consumo
        const consumoResult = document.getElementById('consumoResult');
        consumoResult.innerHTML = '';
        
        data.consumo.forEach(item => {
            const consumoItem = document.createElement('div');
            consumoItem.className = 'consumo-item';
            consumoItem.innerHTML = `
                <p><strong>Consumo:</strong> ${item.kWhConsumido} kWh</p>
                <p><strong>Custo Total:</strong> €${item.custoTotal.toFixed(2)}</p>
                <p><strong>Data da Leitura:</strong> ${new Date(item.dataLeitura).toLocaleDateString()}</p>
            `;
            consumoResult.appendChild(consumoItem);
        });
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ConsumoUI();
}); 