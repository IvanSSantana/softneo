# SoftNeo ERP — Frontend

Frontend sem framework, utilizando HTML semântico, CSS e JavaScript (ES modules).

## Executar

1. Inicie a API Spring Boot em `http://localhost:8080`.
2. Abra esta pasta no VS Code.
3. Inicie `index.html` com o Live Server.
4. Acesse `http://localhost:5500`.

A URL base da API fica no início de `app.js`:

```js
const API_BASE_URL = "http://localhost:8080/api/v1";
```

A API deve permitir CORS para `http://localhost:5500` e, se necessário, `http://127.0.0.1:5500` nos endpoints utilizados.

## Funcionalidades

- Produtos: listar, pesquisar por nome, cadastrar, editar e excluir.
- Clientes: listar, cadastrar, editar e excluir.
- Vendedores: listar, cadastrar, editar e excluir.
- Transações: registrar compras ou vendas com vários produtos, listar, editar e excluir.
- Atualização da listagem de estoque após registrar, editar ou excluir uma transação.
- Fluxo: gráfico de fluxo de caixa com filtros semanal, mensal e anual.
- Atualização do fluxo de caixa quando uma transação é criada, editada ou excluída enquanto a tela de fluxo está aberta.

## Rota consumida pelo gráfico

```http
GET /api/v1/indicadores/fluxo-caixa?periodo=MES&dataReferencia=2026-11-24T12:00:00Z
```

Valores aceitos para `periodo`: `SEMANA`, `MES` e `ANO`.

O backend recebe `dataReferencia` como `Instant` e interpreta o período no fuso `America/Sao_Paulo`. O frontend envia meio-dia UTC da data escolhida para evitar mudança de dia durante a conversão.

O gráfico espera a resposta com `periodo`, `inicio`, `fim`, `totalEntradas`, `totalSaidas`, `saldo` e `pontos`. Cada ponto contém `data`, `textoExibicao` (ou `rotulo`, por compatibilidade), `entradas`, `saidas` e `saldo`.

## Chart.js

O projeto utiliza Chart.js 4.6.2 pelo CDN jsDelivr. É necessária conexão com a internet para carregar a biblioteca.

## Ícones SVG

O HTML mantém as referências aos arquivos `svgs/phoenix-logo.svg`, `svgs/phoenix-box.svg` e `svgs/phoenix-venda.svg` fornecidos no projeto. Copie sua pasta `svgs/` para junto de `index.html`; ela não foi incluída porque não estava no anexo atual.

## Observação sobre os captions das tabelas

Os textos de identificação das tabelas continuam fora dos elementos `<table>`, conforme a estrutura solicitada, mas foram representados por `<p class="table-caption">`. O elemento HTML `<caption>` é reservado para uso dentro de uma tabela.
