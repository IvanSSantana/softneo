package com.softneo.erp.dto.responses;

import java.math.BigDecimal;

public record ProdutoResponse(
   Long id,
   String nome,
   String descricao,
   BigDecimal preco,
   Integer quantidade
) {}
