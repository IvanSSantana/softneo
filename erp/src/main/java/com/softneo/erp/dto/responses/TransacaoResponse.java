package com.softneo.erp.dto.responses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record TransacaoResponse(
        Long id,
        Boolean tipo,
        Long clienteId,
        String clienteNome,
        Long vendedorId,
        String vendedorNome,
        Instant dataTransacao,
        BigDecimal total,
        List<ItemTransacaoResponse> itens
) {}