package com.softneo.erp.dto.responses;

import java.math.BigDecimal;
import java.time.Instant;

public record FluxoCaixaPontoResponse(
        Instant data,
        String rotulo,
        BigDecimal entradas,
        BigDecimal saidas,
        BigDecimal saldo
) {}