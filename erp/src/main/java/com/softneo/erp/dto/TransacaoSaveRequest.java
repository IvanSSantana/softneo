package com.softneo.erp.dto;

import java.math.BigDecimal;

public record TransacaoSaveRequest(
        Long id,
        Long produtoId,
        Long clienteId,
        Long vendedorId,
        Boolean tipo,
        Integer quantidade,
        BigDecimal precoUnitario
) {}
