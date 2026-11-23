package com.softneo.erp.dto.responses;

import java.math.BigDecimal;

public record ItemTransacaoResponse(
        Long id,
        Long produtoId,
        String produtoNome,
        Integer quantidade,
        BigDecimal precoUnitario,
        BigDecimal subtotal
) {}