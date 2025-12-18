# 🚀 Quick Start - SleepComet Real-Time Monitoring

## Resumo

Este sistema monitora endpoints em tempo real e exibe porcentagens de uptime **exatas** na página de status.

## Como Funciona

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Monitor   │─────▶│  PostgreSQL  │◀─────│   Frontend  │
│  (monitor.ts)│      │ (endpoint_   │      │  (polling   │
│  Verifica   │      │  checks)     │      │  30s)       │
│  a cada 60s │      │              │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
```

## Passo a Passo

### 1. Inicie o Monitor

Em um terminal:

```bash
cd d:\sleepcomet.com\console
npm run monitor
```

Você verá:
```
[2025-12-18T08:23:00.000Z] 🚀 SleepComet Monitor started
[2025-12-18T08:23:00.000Z] ⏱️  Check interval: 60 seconds
[2025-12-18T08:23:00.000Z] ⏳ Request timeout: 10 seconds
```

### 2. (Opcional) Inicie o Flakey App para Testes

Em outro terminal:

```bash
cd d:\sleepcomet.com\flakey-app-next
npm run dev
```

### 3. Adicione um Endpoint

No console (http://localhost:3000):

1. Vá para **Endpoints**
2. Clique em **Add Endpoint**
3. Preencha:
   - **Nome**: `Flakey App Test`
   - **URL**: `http://localhost:3000/api/health`
4. Clique em **Save**

### 4. Adicione o Endpoint a uma Status Page

1. Vá para **Status Pages**
2. Clique em uma status page existente (ou crie uma nova)
3. Adicione o endpoint `Flakey App Test`
4. Salve

### 5. Veja o Monitor Trabalhando

No terminal do monitor, você verá:

```
[2025-12-18T08:23:00.000Z] 🔍 Checking 1 endpoint(s)...
[2025-12-18T08:23:01.000Z] ✅ Flakey App Test: http://localhost:3000/api/health - UP (234ms) - Uptime: 100.00%
[2025-12-18T08:23:05.000Z] 💤 Sleeping for 60 seconds...
```

Após alguns minutos (o flakey app alterna entre UP/DOWN):

```
[2025-12-18T08:25:00.000Z] ❌ Flakey App Test: http://localhost:3000/api/health - DOWN (10000ms) - Uptime: 66.67%
[2025-12-18T08:26:00.000Z] ✅ Flakey App Test: http://localhost:3000/api/health - UP (123ms) - Uptime: 60.00%
[2025-12-18T08:27:00.000Z] ❌ Flakey App Test: http://localhost:3000/api/health - DOWN (10000ms) - Uptime: 57.14%
```

### 6. Veja no Frontend

Acesse a página de status pública:

```
http://localhost:3000/status/[seu-slug]
```

Você verá:

```
┌─────────────────────────────────────────────────────────┐
│ Flakey App Test                    Outage (52.38%)      │
│ ▓▓▓▓▓▓▓▓░░░░▓▓▓▓░░░░▓▓▓▓░░░░▓▓▓▓                        │
└─────────────────────────────────────────────────────────┘
```

A porcentagem atualiza automaticamente a cada 30 segundos! 🎉

## Cálculo da Porcentagem

O uptime é calculado com base em **todos os checks dos últimos 90 dias**:

```typescript
Uptime % = (Checks UP / Total Checks) × 100
```

**Exemplo com Flakey App:**
- O app fica UP por 10s e DOWN por 10s (ciclo de 20s)
- Monitor verifica a cada 60s
- Após várias verificações, o uptime converge para ~50%

## Comandos Úteis

### Ver logs do monitor
```bash
# Se rodando com PM2
pm2 logs sleepcomet-monitor

# Se rodando com systemd
sudo journalctl -u sleepcomet-monitor -f
```

### Parar o monitor
```bash
# Ctrl+C no terminal

# Ou com PM2
pm2 stop sleepcomet-monitor

# Ou com systemd
sudo systemctl stop sleepcomet-monitor
```

### Ver histórico de checks no banco
```bash
psql $DATABASE_URL -c "
  SELECT 
    endpoint_id, 
    checked_at, 
    is_up, 
    response_time_ms 
  FROM endpoint_checks 
  ORDER BY checked_at DESC 
  LIMIT 10;
"
```

## Produção

Para rodar em produção, use PM2:

```bash
pm2 start "npm run monitor" --name sleepcomet-monitor
pm2 save
pm2 startup
```

Isso garante que o monitor:
- ✅ Inicia automaticamente após reboot
- ✅ Reinicia automaticamente se crashar
- ✅ Mantém logs organizados

## Troubleshooting

### Monitor não encontra endpoints

Certifique-se de que você criou endpoints no console e os adicionou a uma status page.

### Porcentagem sempre 100%

- O monitor precisa de tempo para coletar dados
- Aguarde pelo menos 2-3 verificações (2-3 minutos)
- Verifique se o endpoint está realmente falhando às vezes

### Frontend não atualiza

- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique se o monitor está rodando
- Verifique se há erros no console do navegador

## Arquitetura

```
monitor.ts
├── checkEndpoint()          # Faz requisição HTTP
├── recordCheck()            # Salva resultado no DB
├── calculateUptime()        # Calcula % baseado em histórico
└── updateEndpointStatus()   # Atualiza status e uptime

Frontend (page.tsx)
├── useEffect()              # Polling a cada 30s
├── fetchData()              # Busca dados da API
└── render()                 # Exibe status e uptime%
```

## Próximos Passos

1. ✅ Monitor rodando
2. ✅ Endpoints sendo verificados
3. ✅ Uptime sendo calculado
4. ✅ Frontend mostrando porcentagem
5. 🎯 Configure seus endpoints reais!

---

**Dúvidas?** Veja `MONITOR.md` para documentação completa.
