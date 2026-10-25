# Edson — perfil e contexto dos projetos

Atualizado em 25 de outubro de 2026. Documento de continuidade elaborado a partir das conversas e dos arquivos locais dos projetos. Não é um currículo: formação, especialidade profissional e outros dados biográficos não foram confirmados para este documento.

## Sobre mim e minha forma de trabalhar

Desenvolvo produtos digitais com apoio de inteligência artificial, com atenção especial à informação médica, experiências de jogos e ferramentas práticas. Quero transformar ideias em funcionalidades utilizáveis, com fluxos completos e resultados que possam ser verificados.

Prefiro continuar os projetos existentes, com mudanças objetivas e incrementais. Valorizo explicações em português, clareza sobre o que está pronto e transparência sobre limitações. Uma prévia local, uma versão compilada e um serviço publicado são etapas diferentes.

Em conteúdo médico, considero essenciais as fontes identificadas, a fidelidade ao material original e a apresentação das limitações da evidência. Não quero informações clínicas, diagnósticos ou identificadores inventados. Nos jogos, priorizo experiência de uso, evolução das funcionalidades, equilíbrio e explicação clara das mudanças para os jogadores.

## Evidências Médicas

### Propósito

Organizar o acesso a literatura científica e documentos de sociedades médicas, inicialmente em Cardiologia e Endocrinologia e Metabologia. O produto ajuda a encontrar e consultar as fontes originais; a ordenação dos resultados não deve ser apresentada como uma avaliação automática da qualidade da evidência.

### Funcionalidades presentes nos arquivos

- Consulta ao PubMed, com temas e filtros de período, tipo de estudo, acesso e ordenação.
- Consulta de títulos, resumos e referências, com links para a publicação original.
- Catálogo de documentos da SBC e da SBEM, organizado por temas e com indicação de escopo.
- Cadastro, login por código, perfil, preferências e favoritos.
- Código de administração com WebAuthn e mecanismos de consentimento e métricas.

Os títulos e resumos do PubMed devem permanecer no idioma original. Há regras de busca e mapeamentos locais de conceitos; isso não significa tradução automática dos artigos. A faixa visual de especialidades foi removida em uma etapa anterior, preservando o seletor de especialidade.

### Base técnica e continuidade

O projeto utiliza TypeScript, React, componentes de Next.js/Vinext, Vite, Tailwind, Drizzle e integração com Cloudflare D1/Wrangler. O repositório contém o código, o arquivo de dependências, migrações e scripts. O requisito declarado é Node.js 22.13 ou superior.

Para instalar as dependências, consultar `package.json` e os scripts de instalação. `npm run dev` inicia a prévia e `npm run build` produz o build. A configuração do banco e das variáveis de ambiente deve seguir `PROJETO.md`, os arquivos de exemplo e as migrações existentes.

O histórico das conversas registra uma publicação anterior pelo Sites. A disponibilidade atual desse site não foi verificada nesta tarefa. Algumas descrições em `PROJETO.md` ainda se referem a etapas locais antigas. A cópia no GitHub não publica o site nem configura serviços de e-mail, banco ou autenticação. O cadastro e uso real da chave física WebAuthn precisam de validação operacional; a presença do código não comprova que esse fluxo esteja pronto em produção.

## Pacto dos Eternos

### Propósito e experiência

Jogo de navegador desenvolvido na pasta originalmente chamada `PROJETINHO NFT`. Os arquivos atuais incluem heróis, progressão, equipamentos, forjas, campanha PvE, combate ATB, torre, bestiário, refúgio, pactos, mercado, festival, ranking, bots e comunicação entre jogadores.

A implementação possui cliente em JavaScript/CSS, servidor Node.js e módulos CommonJS, além de scripts de preparação de recursos e testes. Há versões de execução local e compartilhada, com persistência própria no servidor.

### Executar e continuar

- O servidor compartilhado é iniciado com `node servidor-compartilhado.cjs`, na raiz do projeto, e usa por padrão `http://127.0.0.1:17841`.
- `preparar-offline.cjs` recompõe os recursos do cliente a partir dos arquivos e módulos do projeto. Há recursos preparados em `minihero-offline`.
- Dados persistidos de jogadores ficam em `dados-compartilhados` e devem ser protegidos e copiados separadamente antes de intervenções no servidor.
- Alterações relevantes em bots, jogabilidade, balanceamento e competitividade devem ser explicadas em Novidades, por meio de `release-notes.cjs`, com regeneração dos recursos do cliente quando necessária.
- Os testes `testar-*.cjs` e verificações `qa-*.cjs` devem ser escolhidos conforme a alteração. Testes que mexam em estado devem usar dados isolados.

O `LEIA-ME.txt` registra que parte do cliente, imagens e sons veio dos arquivos públicos do Mini Hero, com adaptações locais. O projeto preserva essa identificação de origem e os direitos dos respectivos autores. O nome antigo da pasta não comprova uma integração operacional com NFTs, carteiras ou transações reais.

## Organização no GitHub

Conta confirmada nesta tarefa: **DrPudyn**.

Repositórios criados e confirmados como privados em 25/10/2026:

- Evidências Médicas: https://github.com/DrPudyn/evidencias-medicas
- Pacto dos Eternos: https://github.com/DrPudyn/pacto-dos-eternos

As cópias representam os arquivos atuais selecionados, com um novo histórico inicial de Git. Não incluem o histórico antigo, credenciais locais, bancos de usuários/jogadores, backups, logs, dependências instaladas ou estado das ferramentas. No jogo, os recursos preparados necessários ao cliente são preservados. No site, os builds e caches são regeneráveis e ficam fora do repositório.

Este documento também acompanha os dois projetos como `CONTEXTO-DO-PROJETO.md`. A privacidade e os commits enviados foram confirmados pela API do GitHub. O teste existente de chat do jogo passou usando contas fictícias e dados temporários isolados. Não foi realizada uma nova validação completa do site ou de todas as funcionalidades do jogo nesta tarefa. Os projetos locais originais permanecem no local de trabalho existente.

## Princípios para as próximas etapas

1. Continuar o projeto existente e preservar funcionalidades fora do escopo da mudança.
2. Verificar o fluxo que o usuário realmente utiliza, além de compilar o código.
3. Não colocar chaves, senhas ou dados de usuários no Git, mesmo em repositórios privados.
4. Distinguir funcionalidades implementadas, testes realizados e funcionamento confirmado em produção.
5. Manter documentação e notas de atualização coerentes com o estado real de cada produto.
