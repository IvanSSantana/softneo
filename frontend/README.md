# SoftNeo ERP — Frontend modularizado

Frontend em HTML, CSS e JavaScript puro, utilizando ES Modules. Não requer React, Vite, npm ou bundler.

## Estrutura

```text
softneo-frontend/
├── index.html
├── styles.css
├── README.md
└── js/
    ├── app.js
    ├── api/
    │   └── api-client.js
    ├── shared/
    │   ├── dom.js
    │   ├── formatters.js
    │   ├── navigation.js
    │   └── state.js
    └── features/
        ├── products/
        │   └── products.js
        ├── people/
        │   └── people.js
        ├── transactions/
        │   └── transactions.js
        └── indicators/
            └── cash-flow.js
```

## Executar

1. Inicie a API Spring Boot em `http://localhost:8080`.
2. Coloque a pasta `svgs/` (com `phoenix-logo.svg`, `phoenix-box.svg` e `phoenix-venda.svg`) ao lado de `index.html`.
3. Abra a pasta no VS Code e inicie o `index.html` com o Live Server.
4. Acesse o endereço do Live Server, normalmente `http://localhost:5500`.

A URL da API pode ser alterada em `js/api/api-client.js`, na constante `API_BASE_URL`.

O frontend usa módulos ES nativos do navegador. Por isso, execute através de um servidor HTTP (como Live Server); não abra o arquivo diretamente com `file://`.

## Chart.js

O módulo `js/features/indicators/cash-flow.js` carrega Chart.js 4.6.1 sob demanda, quando a área de indicadores é aberta. É necessário acesso à internet para baixar a biblioteca pelo jsDelivr.

## Responsabilidades dos módulos

- `js/app.js`: inicializa as funcionalidades e conecta os eventos de navegação.
- `js/api/api-client.js`: concentra as requisições HTTP e o tratamento de erros da API.
- `js/shared/state.js`: mantém um único objeto de estado compartilhado pelos módulos.
- `js/shared/dom.js`: contém funções pequenas e reutilizáveis para manipular o DOM.
- `js/shared/formatters.js`: centraliza formatação de valores e datas.
- `js/shared/navigation.js`: alterna a visibilidade das seções principais.
- `js/features/products/products.js`: CRUD e pesquisa de produtos.
- `js/features/people/people.js`: CRUD de clientes e vendedores.
- `js/features/transactions/transactions.js`: transações com múltiplos itens.
- `js/features/indicators/cash-flow.js`: consulta e gráfico de fluxo de caixa.

## Contratos esperados da API

### Transações

O frontend envia:

```json
{
  "tipo": true,
  "clienteId": 1,
  "vendedorId": 1,
  "itens": [
    {
      "produtoId": 10,
      "quantidade": 2,
      "precoUnitario": 15.90
    }
  ]
}
```

- `tipo: true`: venda.
- `tipo: false`: compra.
- Cada `TransacaoResponse` deve conter `id`, `tipo`, `clienteId`, `clienteNome`, `vendedorId`, `vendedorNome`, `dataTransacao`, `total` e `itens`.
- Cada item deve conter `produtoId`, `produtoNome`, `quantidade`, `precoUnitario` e `subtotal`.

### Fluxo de caixa

O frontend consome:

```http
GET /api/v1/indicadores/fluxo-caixa?periodo=MES&dataReferencia=2026-11-24T12:00:00Z
```

O parâmetro `dataReferencia` é enviado como ISO 8601, compatível com `Instant` no Controller. O JSON esperado contém `periodo`, `inicio`, `fim`, `totalEntradas`, `totalSaidas`, `saldo` e `pontos`. Cada ponto deve conter `data`, `textoExibicao` (ou o legado `rotulo`), `entradas`, `saidas` e `saldo`.

## Observações

- O frontend não altera o estoque diretamente. Depois de criar, editar ou excluir uma transação, ele recarrega produtos e transações; o backend continua responsável pelas regras de estoque.
- A tela de indicadores atualiza o fluxo de caixa ao ser aberta e após operações de transação, caso esteja visível.
- Os textos visualmente apresentados acima das tabelas permanecem como parágrafos `p.table-caption` fora de `table`, conforme a versão atual do HTML.
- O CORS do backend deve permitir a origem utilizada pelo Live Server, por exemplo `http://localhost:5500` ou `http://127.0.0.1:5500`.
