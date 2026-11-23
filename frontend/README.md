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

A API precisa permitir CORS para `http://localhost:5500` e, se necessário, `http://127.0.0.1:5500` nos endpoints de produtos, clientes, vendedores e transações.

## Funcionalidades

- Produtos: listar, pesquisar por nome, cadastrar, editar e excluir.
- Clientes: listar, cadastrar, editar e excluir.
- Vendedores: listar, cadastrar, editar e excluir.
- Transações: registrar compras ou vendas com vários produtos, listar, editar e excluir.
- Atualização da listagem de estoque após registrar, editar ou excluir uma transação.
- Sem dashboards nesta versão; esses indicadores permanecem no backlog.

## Contrato de transação esperado

O frontend envia uma única requisição por operação, agrupando os itens:

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
    },
    {
      "produtoId": 20,
      "quantidade": 3,
      "precoUnitario": 8.50
    }
  ]
}
```

- `tipo: true`: venda (reduz o estoque).
- `tipo: false`: compra (aumenta o estoque).
- O mesmo produto não é repetido no formulário; ao adicioná-lo novamente, a quantidade é somada e o preço já cadastrado para o item é mantido.
- O total exibido no formulário é uma prévia local. O histórico utiliza `total` retornado pelo backend.

## Formato de resposta esperado

O frontend espera que cada `TransacaoResponse` tenha `id`, `tipo`, `clienteId`, `clienteNome`, `vendedorId`, `vendedorNome`, `dataTransacao`, `total` e `itens`. Cada item deve conter `id`, `produtoId`, `produtoNome`, `quantidade`, `precoUnitario` e `subtotal`.

## Ícones SVG

O HTML mantém as referências aos arquivos `svgs/phoenix-logo.svg`, `svgs/phoenix-box.svg` e `svgs/phoenix-venda.svg` que você incluiu nas suas páginas. Coloque sua pasta `svgs/` junto de `index.html` ao copiar o projeto, caso ela não esteja no ZIP.
