# Refúgio dos Eternos

Menu de ilha flutuante implementado em `refuge-client.js` e `refuge.css`.

- Ilha com transparência real sobre céu separado; flutuação de 9 segundos.
- Camada de nuvens com deslocamento de 75 segundos.
- Canvas em 836×471 para correntes, portal, magia, lava, lanternas e ondulação das bandeiras. Desenho limitado a 20 quadros por segundo; pausa em abas ocultas e enquanto outro modo está aberto. Respeita a preferência do sistema por movimento reduzido.
- Destinos usam as ações originais. Invocações inclui heróis, armas e fusão; Forjas inclui ajudante e desmontagem; Bazar inclui loja e mercado.
- Seis interiores próprios: treinamento, forja, mercado, altar do ranking, torre cósmica e invocações. Revelações de heróis e armas usam o novo salão.
- Artes em `assets/refuge-*.png`; prompts de origem em `previas-refugio/`.
- Build: `node preparar-offline.cjs`.

Verificação: navegação no navegador em perfil isolado, seis ambientes, abertura e revelação de uma arma, imagens carregadas, ausência de cortes na forja e de erros no console. Todos os novos arquivos públicos responderam HTTP 200 no servidor principal. Nenhuma alteração de saves ou regras de progressão.

## Transições de navegação

`screen-transitions.js` e `screen-transitions.css` centralizam o fade nas trocas de áreas, menus de destino e retornos. O controlador cobre a tela antes de executar a navegação, aguarda carregadores conhecidos, imagens, cenários e fontes, e então revela o destino. A Masmorra preserva seu controlador específico na entrada; mensagens do mapa usam o fade geral para retornar ou entrar nas regiões. Início de combate e novo time da Torre também usam o controlador. Confirmações de compras e seleção individual de arma não são rotas de navegação. Durante o fade, cliques adicionais são bloqueados; preferências por movimento reduzido são respeitadas. Verificados Heróis, Fusão, Torre e retornos no navegador, sem erros.
