package com.softneo.erp.dto.requests;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record TransacaoSaveRequest(

        @NotNull(message = "O tipo da transação é obrigatório.")
        Boolean tipo,

        @NotNull(message = "O cliente é obrigatório.")
        @Positive(message = "O ID do cliente deve ser positivo.")
        Long clienteId,

        @NotNull(message = "O vendedor é obrigatório.")
        @Positive(message = "O ID do vendedor deve ser positivo.")
        Long vendedorId,

        @NotEmpty(message = "A transação deve possuir pelo menos um produto.")
        List<@NotNull @Valid ItemTransacaoSaveRequest> itens

) {}