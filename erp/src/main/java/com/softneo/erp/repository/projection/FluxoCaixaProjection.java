package com.softneo.erp.repository.projection;

import java.math.BigDecimal;
import java.time.Instant;

public interface FluxoCaixaProjection {

  Instant getDataTransacao();

  Boolean getTipo();

  BigDecimal getTotal();
}