package com.softneo.erp.dto.requests;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProdutoSaveRequest(
        @NotBlank(message = "O nome do produto é obrigatório.")
        @Size(max = 100, message = "O nome do produto deve ter no máximo 100 caracteres.")
        String nome,

        @Size(max = 255, message = "A descrição do produto deve ter no máximo 255 caracteres.")
        String descricao,

        @NotNull(message = "O preço é obrigatório.")
        @DecimalMin(value = "0.01", message = "O preço deve ser maior que zero.")
        @Digits(integer = 10, fraction = 2, message = "O preço deve ter até 10 dígitos inteiros e 2 decimais.")
        BigDecimal preco,

        @NotNull(message = "A quantidade é obrigatória.")
        @PositiveOrZero(message = "A quantidade não pode ser negativa.")
        Integer quantidade
) {}