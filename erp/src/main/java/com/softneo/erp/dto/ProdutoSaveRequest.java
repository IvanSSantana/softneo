package com.softneo.erp.dto;

public record ProdutoSaveRequest(
        String nome,
        String descricao,
        String preco,
        int quantidade
) {}