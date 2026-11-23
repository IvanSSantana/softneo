package com.softneo.erp.dto.requests;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ItemTransacaoSaveRequest(

        @NotNull(message = "O produto é obrigatório.")
        @Positive(message = "O ID do produto deve ser positivo.")
        Long produtoId,

        @NotNull(message = "A quantidade é obrigatória.")
        @Positive(message = "A quantidade deve ser maior que zero.")
        Integer quantidade,

        @NotNull(message = "O preço unitário é obrigatório.")
        @DecimalMin(value = "0.01", message = "O preço deve ser maior que zero.")
        @Digits(
                integer = 10,
                fraction = 2,
                message = "O preço unitário deve ter até 10 dígitos inteiros e 2 decimais."
        )
        BigDecimal precoUnitario

) {}