package com.softneo.erp.dto.responses;

import com.softneo.erp.enums.PeriodoFluxoCaixaGrafico;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record FluxoCaixaResponse(
        PeriodoFluxoCaixaGrafico periodo,
        Instant inicio,
        Instant fim,
        BigDecimal totalEntradas,
        BigDecimal totalSaidas,
        BigDecimal saldo,
        List<FluxoCaixaPontoResponse> pontos
) {}