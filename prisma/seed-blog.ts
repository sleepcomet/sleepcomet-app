import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding blog posts...");

  // Create tags first
  const tags = await Promise.all([
    prisma.blogTag.upsert({
      where: { slug: "uptime" },
      update: {},
      create: { name: "Uptime", slug: "uptime" },
    }),
    prisma.blogTag.upsert({
      where: { slug: "monitoring" },
      update: {},
      create: { name: "Monitoring", slug: "monitoring" },
    }),
    prisma.blogTag.upsert({
      where: { slug: "sre" },
      update: {},
      create: { name: "SRE", slug: "sre" },
    }),
    prisma.blogTag.upsert({
      where: { slug: "devops" },
      update: {},
      create: { name: "DevOps", slug: "devops" },
    }),
    prisma.blogTag.upsert({
      where: { slug: "alertas" },
      update: {},
      create: { name: "Alertas", slug: "alertas" },
    }),
    prisma.blogTag.upsert({
      where: { slug: "observabilidade" },
      update: {},
      create: { name: "Observabilidade", slug: "observabilidade" },
    }),
    prisma.blogTag.upsert({
      where: { slug: "metricas" },
      update: {},
      create: { name: "Métricas", slug: "metricas" },
    }),
    prisma.blogTag.upsert({
      where: { slug: "incidentes" },
      update: {},
      create: { name: "Incidentes", slug: "incidentes" },
    }),
    prisma.blogTag.upsert({
      where: { slug: "performance" },
      update: {},
      create: { name: "Performance", slug: "performance" },
    }),
  ]);

  console.log("✅ Tags created");

  // Article 1: Comprehensive guide on uptime monitoring
  const post1 = await prisma.blogPost.upsert({
    where: { slug: "guia-completo-monitoramento-uptime" },
    update: {},
    create: {
      slug: "guia-completo-monitoramento-uptime",
      title: "Guia Completo de Monitoramento de Uptime: Da Teoria à Prática",
      excerpt:
        "Aprenda tudo sobre monitoramento de uptime: desde conceitos fundamentais até implementação prática. Descubra como garantir 99.99% de disponibilidade e evitar downtime inesperado.",
      content: `
        <h2>Introdução</h2>
        <p>O monitoramento de uptime é a espinha dorsal de qualquer operação digital moderna. Neste guia completo, vamos explorar desde os conceitos fundamentais até estratégias avançadas de implementação.</p>
        
        <h2>O que é Uptime?</h2>
        <p>Uptime é a métrica que mede o tempo em que um sistema, serviço ou aplicação está operacional e acessível aos usuários. É geralmente expresso como uma porcentagem do tempo total.</p>
        
        <h3>Entendendo os "Noves"</h3>
        <p>A disponibilidade é frequentemente expressa em "noves". Veja o que cada nível significa em termos práticos:</p>
        <ul>
          <li><strong>99% (dois noves)</strong>: 3.65 dias de downtime por ano</li>
          <li><strong>99.9% (três noves)</strong>: 8.76 horas de downtime por ano</li>
          <li><strong>99.99% (quatro noves)</strong>: 52.56 minutos de downtime por ano</li>
          <li><strong>99.999% (cinco noves)</strong>: 5.26 minutos de downtime por ano</li>
        </ul>
        
        <h2>Por que o Uptime é Crítico?</h2>
        
        <h3>1. Impacto Financeiro</h3>
        <p>Cada minuto de downtime tem um custo direto. Estudos mostram que:</p>
        <ul>
          <li>E-commerce perde em média <strong>R$ 5.600 por minuto</strong> de downtime</li>
          <li>Empresas de médio porte podem perder até <strong>R$ 50.000 por hora</strong></li>
          <li>Grandes corporações podem ter perdas superiores a <strong>R$ 500.000 por hora</strong></li>
        </ul>
        
        <h3>2. Reputação da Marca</h3>
        <p>Um único incidente de downtime pode:</p>
        <ul>
          <li>Diminuir a confiança do cliente em até 40%</li>
          <li>Resultar em perda permanente de 25% dos usuários afetados</li>
          <li>Gerar cobertura negativa nas redes sociais</li>
        </ul>
        
        <h3>3. SEO e Rankings</h3>
        <p>Google e outros mecanismos de busca penalizam sites com baixa disponibilidade, afetando diretamente seu posicionamento nos resultados de busca.</p>
        
        <h2>Tipos de Monitoramento</h2>
        
        <h3>Monitoramento Sintético</h3>
        <p>Simulação de interações de usuários reais através de scripts automatizados. Ideal para:</p>
        <ul>
          <li>Verificação de endpoints HTTP/HTTPS</li>
          <li>Testes de fluxos críticos (login, checkout, etc.)</li>
          <li>Validação de APIs</li>
        </ul>
        
        <h3>Monitoramento Real User Monitoring (RUM)</h3>
        <p>Coleta dados de usuários reais navegando em sua aplicação. Fornece insights sobre:</p>
        <ul>
          <li>Performance real percebida pelos usuários</li>
          <li>Problemas específicos de região ou dispositivo</li>
          <li>Comportamento do usuário durante incidentes</li>
        </ul>
        
        <h2>Implementando Monitoramento Efetivo</h2>
        
        <h3>1. Defina o que Monitorar</h3>
        <p>Não monitore tudo, monitore o que importa:</p>
        <ul>
          <li><strong>Endpoints críticos</strong>: Homepage, API principal, checkout</li>
          <li><strong>Serviços de terceiros</strong>: Payment gateways, CDNs, APIs externas</li>
          <li><strong>Infraestrutura</strong>: Servidores, bancos de dados, load balancers</li>
        </ul>
        
        <h3>2. Escolha Intervalos Adequados</h3>
        <p>O intervalo de verificação deve balancear custo e detecção rápida:</p>
        <ul>
          <li><strong>Crítico</strong>: 1-2 minutos (checkout, APIs de pagamento)</li>
          <li><strong>Importante</strong>: 5 minutos (homepage, APIs principais)</li>
          <li><strong>Normal</strong>: 10-15 minutos (páginas secundárias)</li>
        </ul>
        
        <h3>3. Monitore de Múltiplas Localizações</h3>
        <p>Problemas podem ser regionais. Monitore de pelo menos 3 localizações geográficas diferentes para:</p>
        <ul>
          <li>Detectar problemas de DNS regional</li>
          <li>Identificar latência específica de região</li>
          <li>Evitar falsos positivos</li>
        </ul>
        
        <h2>Configurando Alertas Inteligentes</h2>
        
        <h3>Evite Alert Fatigue</h3>
        <p>Alertas demais = alertas ignorados. Implemente:</p>
        
        <h4>Escalação Gradual</h4>
        <pre><code>1ª falha: Log silencioso
2ª falha consecutiva: Alerta Slack
3ª falha: Email + SMS
4ª falha: Chamada telefônica + PagerDuty</code></pre>
        
        <h4>Agrupamento de Alertas</h4>
        <p>Se múltiplos serviços falham simultaneamente, agrupe em um único alerta indicando possível problema de infraestrutura.</p>
        
        <h3>Defina Thresholds Realistas</h3>
        <p>Baseie seus limites em dados históricos:</p>
        <ul>
          <li><strong>Tempo de resposta</strong>: P95 + 50% de margem</li>
          <li><strong>Taxa de erro</strong>: Média histórica + 2 desvios padrão</li>
          <li><strong>Uptime</strong>: Abaixo do SLA definido</li>
        </ul>
        
        <h2>Respondendo a Incidentes</h2>
        
        <h3>Tenha um Runbook</h3>
        <p>Documente procedimentos para cada tipo de incidente:</p>
        <ol>
          <li>Verificação inicial (é real ou falso positivo?)</li>
          <li>Comunicação (stakeholders, usuários)</li>
          <li>Investigação (logs, métricas, traces)</li>
          <li>Mitigação (rollback, failover, scaling)</li>
          <li>Resolução e post-mortem</li>
        </ol>
        
        <h3>Comunicação Durante Incidentes</h3>
        <p>Transparência é fundamental:</p>
        <ul>
          <li>Atualize sua status page em até 5 minutos</li>
          <li>Forneça ETAs realistas (ou não forneça)</li>
          <li>Comunique progresso a cada 30 minutos</li>
          <li>Seja honesto sobre a causa e impacto</li>
        </ul>
        
        <h2>Métricas Além do Uptime</h2>
        
        <h3>MTTR (Mean Time To Recovery)</h3>
        <p>Tempo médio para recuperação de um incidente. Meta: < 30 minutos para incidentes críticos.</p>
        
        <h3>MTTD (Mean Time To Detection)</h3>
        <p>Tempo médio para detectar um problema. Meta: < 5 minutos.</p>
        
        <h3>MTBF (Mean Time Between Failures)</h3>
        <p>Tempo médio entre falhas. Quanto maior, melhor. Meta: > 30 dias.</p>
        
        <h2>Ferramentas e Stack Tecnológico</h2>
        
        <h3>Monitoramento de Uptime</h3>
        <ul>
          <li><strong>SleepComet</strong>: Monitoramento sintético com alertas inteligentes</li>
          <li><strong>Pingdom</strong>: Monitoramento global com RUM</li>
          <li><strong>UptimeRobot</strong>: Opção gratuita para começar</li>
        </ul>
        
        <h3>Observabilidade</h3>
        <ul>
          <li><strong>Datadog</strong>: Plataforma completa de observabilidade</li>
          <li><strong>New Relic</strong>: APM e monitoramento de infraestrutura</li>
          <li><strong>Grafana + Prometheus</strong>: Stack open-source</li>
        </ul>
        
        <h2>Melhores Práticas</h2>
        
        <h3>1. Automatize Tudo</h3>
        <p>Desde detecção até resposta inicial. Quanto menos intervenção manual, melhor.</p>
        
        <h3>2. Teste Seus Alertas</h3>
        <p>Simule incidentes mensalmente para garantir que alertas funcionam e equipes sabem responder.</p>
        
        <h3>3. Faça Post-Mortems Blameless</h3>
        <p>Foque no processo, não nas pessoas. Cada incidente é uma oportunidade de aprendizado.</p>
        
        <h3>4. Monitore Seus Monitores</h3>
        <p>Use um serviço secundário para verificar se seu monitoramento principal está funcionando.</p>
        
        <h3>5. Documente Tudo</h3>
        <p>Runbooks, post-mortems, configurações. Documentação salva vidas (e carreiras).</p>
        
        <h2>Conclusão</h2>
        <p>Monitoramento de uptime não é apenas sobre manter sistemas online - é sobre garantir a melhor experiência possível para seus usuários, proteger sua receita e construir confiança na sua marca.</p>
        
        <p>Comece pequeno, monitore o essencial, e expanda gradualmente. O importante é começar hoje, não esperar pelo sistema perfeito.</p>
        
        <blockquote>
          <p>"Você não pode melhorar o que não mede. E você não pode medir o que não monitora."</p>
        </blockquote>
        
        <h2>Próximos Passos</h2>
        <ol>
          <li>Identifique seus 5 endpoints mais críticos</li>
          <li>Configure monitoramento básico com intervalos de 5 minutos</li>
          <li>Defina alertas para Slack ou email</li>
          <li>Crie uma status page pública</li>
          <li>Documente seu primeiro runbook</li>
        </ol>
        
        <p>Quer começar agora? <a href="https://sleepcomet.com">Experimente o SleepComet gratuitamente</a> e tenha seu monitoramento funcionando em menos de 5 minutos.</p>
      `,
      category: "Engenharia",
      published: true,
      featured: true,
      readingTime: 12,
      publishedAt: new Date("2024-12-28"),
    },
  });

  await prisma.blogPostTag.createMany({
    data: [
      { postId: post1.id, tagId: tags[0].id }, // uptime
      { postId: post1.id, tagId: tags[1].id }, // monitoring
      { postId: post1.id, tagId: tags[2].id }, // sre
      { postId: post1.id, tagId: tags[4].id }, // alertas
    ],
    skipDuplicates: true,
  });

  // Article 2: SRE and incident management
  const post2 = await prisma.blogPost.upsert({
    where: { slug: "gestao-incidentes-sre" },
    update: {},
    create: {
      slug: "gestao-incidentes-sre",
      title: "Gestão de Incidentes: Como Equipes SRE de Elite Respondem a Crises",
      excerpt:
        "Aprenda as estratégias e práticas que equipes de SRE do Google, Netflix e Amazon usam para gerenciar incidentes de forma eficiente e transformar crises em oportunidades de aprendizado.",
      content: `
        <h2>Introdução</h2>
        <p>Incidentes acontecem. Não importa quão boa seja sua engenharia, quão robusta seja sua infraestrutura, ou quantos testes você execute - em algum momento, algo vai dar errado. A diferença entre equipes medianas e equipes de elite não está em evitar incidentes completamente, mas em como respondem a eles.</p>
        
        <h2>A Filosofia SRE de Gestão de Incidentes</h2>
        
        <p>Site Reliability Engineering (SRE), conceito criado pelo Google, traz uma abordagem sistemática e baseada em dados para gestão de incidentes. Os princípios fundamentais são:</p>
        
        <h3>1. Aceite que Falhas São Inevitáveis</h3>
        <p>Em vez de buscar zero falhas (impossível), foque em:</p>
        <ul>
          <li>Reduzir o <strong>impacto</strong> das falhas</li>
          <li>Diminuir o <strong>tempo de recuperação</strong></li>
          <li>Aprender com cada incidente</li>
        </ul>
        
        <h3>2. Error Budget: Seu Melhor Amigo</h3>
        <p>Se seu SLA é 99.9%, você tem 0.1% de "budget" para falhas. Isso significa:</p>
        <ul>
          <li>43.2 minutos de downtime permitido por mês</li>
          <li>Espaço para experimentação e deploys</li>
          <li>Métrica clara para balancear velocidade vs. estabilidade</li>
        </ul>
        
        <blockquote>
          <p>"Se você não está gastando seu error budget, você está sendo muito conservador e perdendo oportunidades de inovação."</p>
        </blockquote>
        
        <h2>Anatomia de um Incidente</h2>
        
        <h3>Fase 1: Detecção (MTTD)</h3>
        <p>O relógio começa a contar no momento em que o problema ocorre, não quando você descobre.</p>
        
        <h4>Como Melhorar a Detecção:</h4>
        <ul>
          <li><strong>Monitoramento Proativo</strong>: Não espere usuários reportarem</li>
          <li><strong>Alertas Baseados em Sintomas</strong>: Alerte sobre impacto ao usuário, não sobre métricas técnicas isoladas</li>
          <li><strong>Canary Deployments</strong>: Detecte problemas em 1% do tráfego antes de afetar 100%</li>
        </ul>
        
        <h3>Fase 2: Resposta Inicial (Primeiros 5 Minutos)</h3>
        <p>Os primeiros minutos são críticos. Sua resposta deve ser:</p>
        
        <ol>
          <li><strong>Confirmar o incidente</strong> (30 segundos)
            <ul>
              <li>É real ou falso positivo?</li>
              <li>Qual o impacto atual?</li>
            </ul>
          </li>
          <li><strong>Declarar severidade</strong> (30 segundos)
            <ul>
              <li>SEV-1: Impacto crítico, todos os usuários</li>
              <li>SEV-2: Impacto significativo, subset de usuários</li>
              <li>SEV-3: Impacto menor, funcionalidade degradada</li>
            </ul>
          </li>
          <li><strong>Mobilizar equipe</strong> (2 minutos)
            <ul>
              <li>Incident Commander (IC)</li>
              <li>Communications Lead</li>
              <li>Technical Leads</li>
            </ul>
          </li>
          <li><strong>Comunicar stakeholders</strong> (2 minutos)
            <ul>
              <li>Atualizar status page</li>
              <li>Notificar management (SEV-1)</li>
            </ul>
          </li>
        </ol>
        
        <h3>Fase 3: Mitigação vs. Resolução</h3>
        
        <p>Entenda a diferença crucial:</p>
        
        <h4>Mitigação (Objetivo: Restaurar Serviço)</h4>
        <ul>
          <li>Rollback para versão anterior</li>
          <li>Failover para região secundária</li>
          <li>Desabilitar feature problemática</li>
          <li>Escalar recursos temporariamente</li>
        </ul>
        
        <h4>Resolução (Objetivo: Fix Permanente)</h4>
        <ul>
          <li>Identificar root cause</li>
          <li>Implementar fix definitivo</li>
          <li>Adicionar testes para prevenir regressão</li>
          <li>Atualizar documentação</li>
        </ul>
        
        <p><strong>Regra de Ouro:</strong> Sempre priorize mitigação sobre resolução durante um incidente ativo. Você pode investigar a causa raiz depois que o serviço estiver restaurado.</p>
        
        <h2>Estrutura de Resposta a Incidentes</h2>
        
        <h3>Papéis e Responsabilidades</h3>
        
        <h4>Incident Commander (IC)</h4>
        <p>O maestro da orquestra. Responsabilidades:</p>
        <ul>
          <li>Coordenar resposta geral</li>
          <li>Tomar decisões de alto nível</li>
          <li>Delegar tarefas específicas</li>
          <li>Manter visão holística do incidente</li>
          <li><strong>NÃO</strong> fazer trabalho técnico direto</li>
        </ul>
        
        <h4>Communications Lead</h4>
        <p>A voz do incidente. Responsabilidades:</p>
        <ul>
          <li>Atualizar status page a cada 15-30 minutos</li>
          <li>Comunicar com stakeholders internos</li>
          <li>Preparar comunicados externos se necessário</li>
          <li>Documentar timeline do incidente</li>
        </ul>
        
        <h4>Technical Leads</h4>
        <p>Os solucionadores de problemas. Responsabilidades:</p>
        <ul>
          <li>Investigar causa raiz</li>
          <li>Implementar mitigações</li>
          <li>Reportar descobertas ao IC</li>
          <li>Executar comandos e mudanças</li>
        </ul>
        
        <h2>Ferramentas Essenciais</h2>
        
        <h3>War Room Virtual</h3>
        <p>Centralize comunicação em um único canal:</p>
        <ul>
          <li><strong>Slack/Teams</strong>: Canal dedicado #incident-YYYYMMDD-description</li>
          <li><strong>Zoom/Meet</strong>: Bridge call para SEV-1</li>
          <li><strong>Google Docs</strong>: Timeline e notas compartilhadas</li>
        </ul>
        
        <h3>Runbooks Automatizados</h3>
        <p>Documente procedimentos comuns:</p>
        
        <pre><code>## Runbook: Database Connection Pool Exhausted

### Symptoms
- API latency > 5s
- Database connection errors in logs
- Alert: "DB connection pool at 95%"

### Quick Mitigation
1. Restart application servers (rolling restart)
2. Increase connection pool size temporarily
   \`kubectl set env deployment/api DB_POOL_SIZE=200\`

### Investigation
1. Check for connection leaks: \`SELECT * FROM pg_stat_activity\`
2. Review recent deploys
3. Check for N+1 queries in APM

### Resolution
1. Fix connection leak in code
2. Add connection pool monitoring
3. Set up alert for pool usage > 80%</code></pre>
        
        <h2>Comunicação Durante Incidentes</h2>
        
        <h3>Status Page Updates</h3>
        
        <h4>Primeira Atualização (5 minutos)</h4>
        <pre><code>🔴 Investigating - API Response Times

We are investigating elevated API response times affecting 
some users. Our team is actively working on this issue.

Posted: 14:05 UTC
Next update: 14:20 UTC</code></pre>
        
        <h4>Atualização de Progresso (20 minutos)</h4>
        <pre><code>🟡 Identified - API Response Times

We have identified the issue as a database connection pool 
exhaustion. We are implementing a fix now.

Impact: ~30% of API requests experiencing 5-10s delays
Workaround: Retry failed requests

Posted: 14:20 UTC
Next update: 14:35 UTC</code></pre>
        
        <h4>Resolução (45 minutos)</h4>
        <pre><code>🟢 Resolved - API Response Times

The issue has been resolved. All systems are operating normally.

Root cause: Database connection pool exhaustion due to 
connection leak introduced in v2.3.1 deployment.

Total duration: 45 minutes
Impact: 30% of users experienced 5-10s API delays

A detailed post-mortem will be published within 48 hours.

Posted: 14:45 UTC</code></pre>
        
        <h2>Post-Mortem: Transformando Crises em Aprendizado</h2>
        
        <h3>Estrutura de Post-Mortem Blameless</h3>
        
        <h4>1. Resumo Executivo</h4>
        <ul>
          <li>O que aconteceu (1-2 frases)</li>
          <li>Impacto (usuários afetados, duração, receita perdida)</li>
          <li>Root cause (técnico mas acessível)</li>
        </ul>
        
        <h4>2. Timeline Detalhada</h4>
        <pre><code>14:00 - Deploy v2.3.1 para produção
14:03 - Primeiros erros de timeout em logs
14:05 - Alert: Database connection pool at 95%
14:07 - Incident declarado (SEV-2)
14:10 - IC e Communications Lead mobilizados
14:15 - Identificado connection leak no código
14:20 - Rollback iniciado
14:25 - Rollback completo, serviço restaurado
14:45 - Incidente resolvido</code></pre>
        
        <h4>3. Root Cause Analysis</h4>
        <p>Use os "5 Porquês":</p>
        <ol>
          <li><strong>Por que o serviço ficou lento?</strong> Pool de conexões esgotado</li>
          <li><strong>Por que o pool esgotou?</strong> Conexões não sendo fechadas</li>
          <li><strong>Por que não estavam sendo fechadas?</strong> Bug no código de cleanup</li>
          <li><strong>Por que o bug passou?</strong> Falta de teste de integração</li>
          <li><strong>Por que não tínhamos o teste?</strong> Não era parte do nosso checklist de PR</li>
        </ol>
        
        <h4>4. Action Items</h4>
        <p>Cada item deve ter:</p>
        <ul>
          <li>Descrição clara</li>
          <li>Owner responsável</li>
          <li>Deadline</li>
          <li>Prioridade (P0, P1, P2)</li>
        </ul>
        
        <pre><code>[ ] P0: Adicionar teste de integração para connection cleanup
    Owner: @joao
    Deadline: 2024-12-30

[ ] P1: Implementar circuit breaker para database connections
    Owner: @maria
    Deadline: 2025-01-05

[ ] P2: Adicionar checklist de testes de integração ao PR template
    Owner: @pedro
    Deadline: 2025-01-10</code></pre>
        
        <h2>Métricas de Sucesso</h2>
        
        <h3>Lagging Indicators (O que aconteceu)</h3>
        <ul>
          <li><strong>MTTR</strong>: Mean Time To Recovery - Meta: < 30 min</li>
          <li><strong>MTTD</strong>: Mean Time To Detection - Meta: < 5 min</li>
          <li><strong>Incident Frequency</strong>: Incidentes por mês - Tendência: Decrescente</li>
        </ul>
        
        <h3>Leading Indicators (Prevenção)</h3>
        <ul>
          <li><strong>Post-Mortem Completion Rate</strong>: Meta: 100%</li>
          <li><strong>Action Item Completion</strong>: Meta: > 90% em 30 dias</li>
          <li><strong>Runbook Coverage</strong>: % de incidentes com runbook - Meta: > 80%</li>
        </ul>
        
        <h2>Cultura de Incidentes Saudável</h2>
        
        <h3>Blameless Post-Mortems</h3>
        <p>Nunca culpe indivíduos. Sempre foque em:</p>
        <ul>
          <li>Processos que falharam</li>
          <li>Sistemas que permitiram o erro</li>
          <li>Oportunidades de melhoria</li>
        </ul>
        
        <blockquote>
          <p>"Se você punir pessoas por erros honestos, elas vão parar de reportar problemas e começar a escondê-los."</p>
        </blockquote>
        
        <h3>Celebre Boas Respostas</h3>
        <p>Reconheça publicamente:</p>
        <ul>
          <li>Detecção rápida de problemas</li>
          <li>Comunicação clara durante incidentes</li>
          <li>Post-mortems bem escritos</li>
          <li>Implementação de melhorias preventivas</li>
        </ul>
        
        <h2>Conclusão</h2>
        
        <p>Gestão de incidentes eficaz não é sobre evitar problemas - é sobre construir sistemas e equipes resilientes que podem responder rapidamente, aprender continuamente, e melhorar constantemente.</p>
        
        <p>Lembre-se:</p>
        <ul>
          <li>Incidentes são oportunidades de aprendizado, não falhas</li>
          <li>Comunicação clara salva mais tempo que investigação rápida</li>
          <li>Mitigação primeiro, resolução depois</li>
          <li>Post-mortems blameless constroem confiança</li>
          <li>Automatize tudo que for repetitivo</li>
        </ul>
        
        <p>Comece hoje: documente seu primeiro runbook, configure alertas inteligentes, e prepare sua equipe para o próximo incidente. Porque ele vai acontecer - e quando acontecer, você estará pronto.</p>
      `,
      category: "SRE",
      published: true,
      featured: true,
      readingTime: 15,
      publishedAt: new Date("2024-12-26"),
    },
  });

  await prisma.blogPostTag.createMany({
    data: [
      { postId: post2.id, tagId: tags[2].id }, // sre
      { postId: post2.id, tagId: tags[7].id }, // incidentes
      { postId: post2.id, tagId: tags[4].id }, // alertas
      { postId: post2.id, tagId: tags[3].id }, // devops
    ],
    skipDuplicates: true,
  });

  // Article 3: Observability and metrics
  const post3 = await prisma.blogPost.upsert({
    where: { slug: "observabilidade-moderna-metricas-logs-traces" },
    update: {},
    create: {
      slug: "observabilidade-moderna-metricas-logs-traces",
      title: "Observabilidade Moderna: Métricas, Logs e Traces Trabalhando Juntos",
      excerpt:
        "Descubra como implementar observabilidade completa em seus sistemas usando os três pilares fundamentais: métricas, logs e traces distribuídos. Guia prático com exemplos reais.",
      content: `
        <h2>Introdução</h2>
        <p>Monitoramento tradicional responde "está funcionando?". Observabilidade responde "por que não está funcionando?" e "como podemos melhorar?". Neste guia, vamos explorar como implementar observabilidade completa usando os três pilares fundamentais.</p>
        
        <h2>Os Três Pilares da Observabilidade</h2>
        
        <h3>1. Métricas: O Que Está Acontecendo</h3>
        <p>Métricas são valores numéricos agregados ao longo do tempo. Elas respondem:</p>
        <ul>
          <li>Quantas requisições por segundo?</li>
          <li>Qual a latência média?</li>
          <li>Quantos erros estamos tendo?</li>
        </ul>
        
        <h4>Tipos de Métricas</h4>
        
        <p><strong>Counters (Contadores)</strong></p>
        <ul>
          <li>Sempre crescem (ou resetam)</li>
          <li>Exemplo: Total de requisições, total de erros</li>
          <li>Use para: Taxa de eventos (requests/sec, errors/min)</li>
        </ul>
        
        <p><strong>Gauges (Medidores)</strong></p>
        <ul>
          <li>Podem subir ou descer</li>
          <li>Exemplo: CPU usage, memória, conexões ativas</li>
          <li>Use para: Valores instantâneos</li>
        </ul>
        
        <p><strong>Histograms (Histogramas)</strong></p>
        <ul>
          <li>Distribuição de valores</li>
          <li>Exemplo: Latência de requisições</li>
          <li>Use para: Percentis (P50, P95, P99)</li>
        </ul>
        
        <h4>Métricas Essenciais (Golden Signals)</h4>
        
        <p>Google SRE define 4 sinais dourados que todo serviço deve monitorar:</p>
        
        <ol>
          <li><strong>Latency</strong>: Tempo para processar requisições
            <pre><code>http_request_duration_seconds{
  method="GET",
  endpoint="/api/users",
  status="200"
} 0.045</code></pre>
          </li>
          <li><strong>Traffic</strong>: Volume de demanda
            <pre><code>http_requests_total{
  method="GET",
  endpoint="/api/users"
} 15420</code></pre>
          </li>
          <li><strong>Errors</strong>: Taxa de falhas
            <pre><code>http_requests_total{
  method="POST",
  endpoint="/api/orders",
  status="500"
} 23</code></pre>
          </li>
          <li><strong>Saturation</strong>: Quão "cheio" está o sistema
            <pre><code>database_connections_active 45
database_connections_max 50
# Saturation: 90%</code></pre>
          </li>
        </ol>
        
        <h3>2. Logs: O Que Aconteceu</h3>
        <p>Logs são registros de eventos discretos. Eles fornecem contexto detalhado sobre o que aconteceu em um momento específico.</p>
        
        <h4>Structured Logging</h4>
        <p>Sempre use logs estruturados (JSON) em vez de texto livre:</p>
        
        <p><strong>❌ Ruim:</strong></p>
        <pre><code>User john@example.com logged in from 192.168.1.1 at 2024-12-29 14:30:00</code></pre>
        
        <p><strong>✅ Bom:</strong></p>
        <pre><code>{
  "timestamp": "2024-12-29T14:30:00Z",
  "level": "info",
  "event": "user_login",
  "user_id": "usr_123",
  "email": "john@example.com",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "session_id": "sess_abc123"
}</code></pre>
        
        <h4>Níveis de Log Apropriados</h4>
        
        <ul>
          <li><strong>ERROR</strong>: Algo falhou e requer atenção
            <pre><code>{
  "level": "error",
  "error": "DatabaseConnectionError",
  "message": "Failed to connect to database",
  "retry_count": 3,
  "database_host": "db-primary.internal"
}</code></pre>
          </li>
          <li><strong>WARN</strong>: Algo inesperado mas não crítico
            <pre><code>{
  "level": "warn",
  "message": "API rate limit approaching",
  "current_rate": 950,
  "limit": 1000,
  "user_id": "usr_456"
}</code></pre>
          </li>
          <li><strong>INFO</strong>: Eventos importantes do negócio
            <pre><code>{
  "level": "info",
  "event": "order_created",
  "order_id": "ord_789",
  "amount": 99.90,
  "user_id": "usr_123"
}</code></pre>
          </li>
          <li><strong>DEBUG</strong>: Informações detalhadas para debugging
            <pre><code>{
  "level": "debug",
  "function": "calculateDiscount",
  "input": {"cart_total": 150.00, "user_tier": "gold"},
  "output": {"discount": 15.00}
}</code></pre>
          </li>
        </ul>
        
        <h4>Correlation IDs</h4>
        <p>Sempre inclua IDs de correlação para rastrear requisições através de múltiplos serviços:</p>
        
        <pre><code>{
  "timestamp": "2024-12-29T14:30:00Z",
  "trace_id": "abc123",      // Mesmo para toda a requisição
  "span_id": "def456",       // Único para este serviço
  "parent_span_id": "xyz789", // Span do serviço anterior
  "service": "payment-api",
  "message": "Processing payment"
}</code></pre>
        
        <h3>3. Traces: Como Aconteceu</h3>
        <p>Traces distribuídos mostram o caminho completo de uma requisição através de múltiplos serviços.</p>
        
        <h4>Anatomia de um Trace</h4>
        
        <pre><code>Trace ID: abc123 (Total: 245ms)
│
├─ Span: API Gateway (45ms)
│  ├─ HTTP GET /api/orders/123
│  └─ Tags: http.method=GET, http.status=200
│
├─ Span: Order Service (120ms)
│  ├─ Get order from database (30ms)
│  ├─ Call Inventory Service (60ms)
│  │  └─ Span: Inventory Service (55ms)
│  │     ├─ Check stock availability
│  │     └─ Tags: inventory.sku=PROD-123
│  └─ Call Payment Service (30ms)
│     └─ Span: Payment Service (25ms)
│        ├─ Validate payment method
│        └─ Tags: payment.method=credit_card
│
└─ Span: Response (80ms)
   └─ Serialize and return JSON</code></pre>
        
        <h4>Implementando Distributed Tracing</h4>
        
        <p>Exemplo usando OpenTelemetry (Node.js):</p>
        
        <pre><code>import { trace } from '@opentelemetry/api';

async function processOrder(orderId) {
  const tracer = trace.getTracer('order-service');
  
  return tracer.startActiveSpan('process-order', async (span) => {
    try {
      span.setAttribute('order.id', orderId);
      
      // Get order
      const order = await tracer.startActiveSpan('get-order', async (childSpan) => {
        const result = await db.getOrder(orderId);
        childSpan.setAttribute('db.query', 'SELECT * FROM orders WHERE id = ?');
        childSpan.end();
        return result;
      });
      
      // Check inventory
      await tracer.startActiveSpan('check-inventory', async (childSpan) => {
        await inventoryService.checkStock(order.items);
        childSpan.setAttribute('inventory.items_count', order.items.length);
        childSpan.end();
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      return order;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}</code></pre>
        
        <h2>Integrando os Três Pilares</h2>
        
        <h3>Cenário Real: Debugging de Latência Alta</h3>
        
        <h4>1. Métricas Detectam o Problema</h4>
        <pre><code>Alert: P95 latency > 2s
Service: order-api
Time: 14:30 UTC</code></pre>
        
        <h4>2. Traces Identificam o Gargalo</h4>
        <pre><code>Trace analysis shows:
- Total request time: 2.3s
- Time in database query: 1.8s (78%)
- Query: SELECT * FROM orders WHERE user_id = ?</code></pre>
        
        <h4>3. Logs Fornecem Contexto</h4>
        <pre><code>{
  "timestamp": "2024-12-29T14:30:15Z",
  "level": "warn",
  "trace_id": "abc123",
  "message": "Slow query detected",
  "query_time_ms": 1800,
  "query": "SELECT * FROM orders WHERE user_id = ?",
  "rows_scanned": 150000,
  "rows_returned": 50
}</code></pre>
        
        <h4>4. Solução Identificada</h4>
        <p>Falta índice na coluna <code>user_id</code>. Após criar o índice:</p>
        <ul>
          <li>Query time: 1800ms → 15ms</li>
          <li>P95 latency: 2.3s → 120ms</li>
          <li>Database CPU: 80% → 20%</li>
        </ul>
        
        <h2>Ferramentas e Stack</h2>
        
        <h3>Stack Open Source</h3>
        <ul>
          <li><strong>Métricas</strong>: Prometheus + Grafana</li>
          <li><strong>Logs</strong>: Loki + Grafana</li>
          <li><strong>Traces</strong>: Jaeger ou Tempo</li>
        </ul>
        
        <h3>Stack Comercial</h3>
        <ul>
          <li><strong>Datadog</strong>: Plataforma completa (métricas + logs + traces)</li>
          <li><strong>New Relic</strong>: APM com observabilidade integrada</li>
          <li><strong>Honeycomb</strong>: Especializado em traces e análise</li>
        </ul>
        
        <h2>Melhores Práticas</h2>
        
        <h3>1. Comece com os Golden Signals</h3>
        <p>Não tente monitorar tudo de uma vez. Comece com:</p>
        <ul>
          <li>Latência (P50, P95, P99)</li>
          <li>Taxa de requisições</li>
          <li>Taxa de erros</li>
          <li>Saturação de recursos</li>
        </ul>
        
        <h3>2. Use Sampling Inteligente</h3>
        <p>Para traces, não capture 100% das requisições:</p>
        <ul>
          <li><strong>Head-based sampling</strong>: 1-10% de todas as requisições</li>
          <li><strong>Tail-based sampling</strong>: 100% de erros e requisições lentas</li>
        </ul>
        
        <h3>3. Defina SLOs Baseados em Observabilidade</h3>
        <pre><code>SLO: 99.9% das requisições devem ter latência < 500ms

Medição:
- Métrica: http_request_duration_seconds
- Agregação: P99 por janela de 5 minutos
- Threshold: 0.5s
- Error budget: 43.2 minutos/mês</code></pre>
        
        <h3>4. Automatize Análise de Traces</h3>
        <p>Configure alertas para padrões anormais:</p>
        <ul>
          <li>Spans com duração > 2x a média</li>
          <li>Aumento súbito em spans de erro</li>
          <li>Novos tipos de erro não vistos antes</li>
        </ul>
        
        <h2>Armadilhas Comuns</h2>
        
        <h3>1. Log Overload</h3>
        <p>❌ Não faça:</p>
        <pre><code>// Logging em loop
for (const item of items) {
  logger.debug('Processing item', { item });
}</code></pre>
        
        <p>✅ Faça:</p>
        <pre><code>logger.debug('Processing items', { 
  count: items.length,
  sample: items.slice(0, 3) 
});</code></pre>
        
        <h3>2. Métricas de Alta Cardinalidade</h3>
        <p>❌ Não use user IDs como labels:</p>
        <pre><code>http_requests{user_id="usr_123"} // Milhões de séries temporais!</code></pre>
        
        <p>✅ Use categorias:</p>
        <pre><code>http_requests{user_tier="premium"} // Poucas séries temporais</code></pre>
        
        <h3>3. Traces Sem Contexto</h3>
        <p>❌ Spans genéricos:</p>
        <pre><code>span.name = "database_query"</code></pre>
        
        <p>✅ Spans descritivos:</p>
        <pre><code>span.name = "get_user_orders"
span.setAttribute("user.id", userId)
span.setAttribute("db.table", "orders")
span.setAttribute("db.operation", "SELECT")</code></pre>
        
        <h2>Conclusão</h2>
        
        <p>Observabilidade não é apenas sobre coletar dados - é sobre ter os dados certos, no formato certo, quando você precisa deles. Os três pilares trabalham juntos:</p>
        
        <ul>
          <li><strong>Métricas</strong> dizem que há um problema</li>
          <li><strong>Traces</strong> mostram onde está o problema</li>
          <li><strong>Logs</strong> explicam por que há um problema</li>
        </ul>
        
        <p>Comece pequeno, itere rapidamente, e sempre pergunte: "Se algo der errado às 3h da manhã, eu tenho os dados necessários para debugar?"</p>
        
        <h2>Próximos Passos</h2>
        <ol>
          <li>Implemente structured logging em seus serviços</li>
          <li>Configure métricas básicas (Golden Signals)</li>
          <li>Adicione distributed tracing em um serviço crítico</li>
          <li>Crie dashboards que correlacionem métricas, logs e traces</li>
          <li>Defina SLOs baseados em dados observáveis</li>
        </ol>
        
        <p>Quer começar com monitoramento de uptime? <a href="https://sleepcomet.com">Experimente o SleepComet</a> e tenha visibilidade completa em minutos.</p>
      `,
      category: "Engenharia",
      published: true,
      featured: true,
      readingTime: 18,
      publishedAt: new Date("2024-12-24"),
    },
  });

  await prisma.blogPostTag.createMany({
    data: [
      { postId: post3.id, tagId: tags[5].id }, // observabilidade
      { postId: post3.id, tagId: tags[6].id }, // metricas
      { postId: post3.id, tagId: tags[1].id }, // monitoring
      { postId: post3.id, tagId: tags[2].id }, // sre
    ],
    skipDuplicates: true,
  });

  console.log("✅ Blog posts created");
  console.log("🎉 Seeding completed!");
  console.log("\nCreated posts:");
  console.log("1. Guia Completo de Monitoramento de Uptime");
  console.log("2. Gestão de Incidentes: Como Equipes SRE de Elite Respondem a Crises");
  console.log("3. Observabilidade Moderna: Métricas, Logs e Traces Trabalhando Juntos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
