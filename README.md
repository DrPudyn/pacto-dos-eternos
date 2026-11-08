# Pacto dos Eternos

Cópia privada dos arquivos do projeto em 25/10/2026. Consulte [CONTEXTO-DO-PROJETO.md](CONTEXTO-DO-PROJETO.md) para o contexto do proprietário e dos projetos e os demais documentos para as funcionalidades específicas.

## Executar localmente

Com Node.js instalado, execute na raiz:

```sh
node servidor-compartilhado.cjs
```

Abra http://127.0.0.1:17841. Os dados locais são criados em `dados-compartilhados/`, que não integra o repositório. Esta cópia não transporta contas, senhas ou progresso dos jogadores do servidor original.

Os arquivos preparados do cliente estão em `minihero-offline/`. Para regenerá-los após alterações nos módulos:

```sh
node preparar-offline.cjs
```

Os testes existentes ficam nos arquivos `testar-*.cjs`. Consulte cada teste antes de executar; use estado isolado para testes de persistência. Para mudanças relevantes de jogabilidade, atualize `release-notes.cjs` e regenere os recursos.

## Origem dos recursos

Parte do cliente e dos recursos deriva dos arquivos públicos do Mini Hero, conforme `LEIA-ME.txt`. Os recursos permanecem pertencendo aos respectivos autores. Este repositório privado não atribui autoria exclusiva nem concede uma licença sobre materiais de terceiros.
