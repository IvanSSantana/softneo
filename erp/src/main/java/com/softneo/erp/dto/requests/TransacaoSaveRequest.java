package com.softneo.erp.dto.requests;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record TransacaoSaveRequest(
        @NotNull(message = "O produto é obrigatório.")
        Long produtoId,

        @NotNull(message = "O cliente é obrigatório.")
        Long clienteId,

        @NotNull(message = "O vendedor é obrigatório.")
        Long vendedorId,

        @NotNull(message = "O tipo da transação é obrigatório.")
        Boolean tipo,

        @NotNull(message = "A quantidade é obrigatória.")
        @Positive(message = "A quantidade deve ser maior que zero.")
        Integer quantidade,

        @NotNull(message = "O preço unitário é obrigatório.")
        @DecimalMin(value = "0.01", message = "O preço unitário deve ser maior que zero.")
        @Digits(integer = 10, fraction = 2, message = "O preço unitário deve ter até 10 dígitos inteiros e 2 decimais.")
        BigDecimal precoUnitario
) {}