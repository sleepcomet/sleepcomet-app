# SleepComet Monitor

Monitor TypeScript que verifica todos os endpoints e calcula porcentagens de uptime precisas em tempo real.

## Funcionalidades

- ✅ **Monitoramento contínuo** - Verifica todos os endpoints a cada 60 segundos
- 📊 **Cálculo preciso de uptime** - Baseado nos últimos 90 dias de histórico
- 💾 **Armazenamento de histórico** - Todas as verificações são salvas no banco de dados
- ⚡ **TypeScript nativo** - Usa Prisma e fetch API nativa
- 🔄 **Tempo real** - Frontend atualiza automaticamente a cada 30 segundos

## Como o Uptime é Calculado

O monitor calcula o uptime com base na fórmula:

```
Uptime % = (Checks UP / Total Checks) × 100
```

**Exemplo:**
- Total de checks nos últimos 90 dias: 1000
- Checks com status UP: 985
- Uptime = (985 / 1000) × 100 = **98.50%**

## Instalação

As dependências já estão instaladas no projeto. O monitor usa:
- `@prisma/client` - Para acesso ao banco de dados
- `tsx` - Para executar TypeScript diretamente

## Como Executar

### Desenvolvimento

```bash
npm run monitor
```

### Produção (com PM2)

```bash
pm2 start "npm run monitor" --name sleepcomet-monitor
pm2 save
pm2 startup
```

### Produção (com systemd)

Crie `/etc/systemd/system/sleepcomet-monitor.service`:

```ini
[Unit]
Description=SleepComet Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/sleepcomet.com/console
Environment="DATABASE_URL=postgresql://..."
ExecStart=/usr/bin/npm run monitor
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ative e inicie:

```bash
sudo systemctl enable sleepcomet-monitor
sudo systemctl start sleepcomet-monitor
sudo systemctl status sleepcomet-monitor
```

## Estrutura do Banco de Dados

O monitor cria automaticamente a tabela `endpoint_checks`:

```sql
CREATE TABLE endpoint_checks (
    id SERIAL PRIMARY KEY,
    endpoint_id VARCHAR(255) NOT NULL,
    checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_up BOOLEAN NOT NULL,
    response_time_ms FLOAT NOT NULL
);

CREATE INDEX idx_endpoint_checks_endpoint_id 
ON endpoint_checks(endpoint_id, checked_at DESC);
```

## Logs

O monitor exibe logs detalhados:

```
[2025-12-18T08:23:00.000Z] 🚀 SleepComet Monitor started
[2025-12-18T08:23:00.000Z] ⏱️  Check interval: 60 seconds
[2025-12-18T08:23:00.000Z] ⏳ Request timeout: 10 seconds
--------------------------------------------------------------------------------
[2025-12-18T08:23:00.000Z] 🔍 Checking 2 endpoint(s)...
[2025-12-18T08:23:01.000Z] ✅ API Health: https://api.example.com/health - UP (234ms) - Uptime: 99.85%
[2025-12-18T08:23:05.000Z] ❌ Flakey App: http://localhost:3000/api/health - DOWN (10000ms) - Uptime: 50.00%
[2025-12-18T08:23:05.000Z] 💤 Sleeping for 60 seconds...
--------------------------------------------------------------------------------
```

## Configurações

Você pode ajustar as configurações no arquivo `monitor.ts`:

```typescript
const CHECK_INTERVAL = 60000  // Intervalo entre verificações (ms)
const REQUEST_TIMEOUT = 10000 // Timeout para requisições (ms)
```

## Critérios de Status

Um endpoint é considerado **UP** quando:
- Retorna status HTTP 2xx, 3xx ou 4xx
- Responde dentro do timeout (10 segundos)

Um endpoint é considerado **DOWN** quando:
- Timeout (não responde em 10 segundos)
- Erro de conexão
- Retorna status HTTP 5xx

## Frontend em Tempo Real

O frontend (`/status/[slug]`) atualiza automaticamente:
- **Polling**: A cada 30 segundos
- **Exibição**: Mostra a porcentagem de uptime ao lado do status
- **Formato**: `Operational (99.85%)`

## Testando com o Flakey App

Para testar o sistema de monitoramento:

1. **Inicie o flakey-app-next**:
   ```bash
   cd ../flakey-app-next
   npm run dev
   ```

2. **Adicione o endpoint no console**:
   - URL: `http://localhost:3000/api/health`
   - Nome: `Flakey App Test`

3. **Inicie o monitor**:
   ```bash
   npm run monitor
   ```

4. **Observe os logs**:
   - A cada 60 segundos, o monitor verifica o endpoint
   - O flakey app alterna entre UP (10s) e DOWN (10s)
   - Após alguns minutos, você verá o uptime convergir para ~50%

5. **Veja no frontend**:
   - Acesse a página de status
   - A porcentagem de uptime será exibida em tempo real
   - Exemplo: `Outage (48.33%)` ou `Operational (51.67%)`

## Troubleshooting

### Monitor não conecta ao banco de dados

Verifique se `DATABASE_URL` está correta no `.env`:

```bash
cat .env | grep DATABASE_URL
```

### Endpoints sempre aparecem como DOWN

- Verifique se as URLs dos endpoints estão corretas
- Teste manualmente: `curl -v <endpoint-url>`
- Aumente o `REQUEST_TIMEOUT` se necessário

### Frontend não atualiza

- Verifique se o monitor está rodando: `ps aux | grep monitor`
- Verifique os logs do monitor
- Limpe o cache do navegador

### Erro "Table endpoint_checks does not exist"

O monitor cria a tabela automaticamente na primeira execução. Se houver erro:

```bash
# Execute manualmente no PostgreSQL
psql $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS endpoint_checks (
    id SERIAL PRIMARY KEY,
    endpoint_id VARCHAR(255) NOT NULL,
    checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_up BOOLEAN NOT NULL,
    response_time_ms FLOAT NOT NULL
);"
```

## Versão Python

Se preferir usar Python, há também um `monitor.py` disponível. Veja `requirements.txt` para dependências.

```bash
pip install -r requirements.txt
python monitor.py
```
