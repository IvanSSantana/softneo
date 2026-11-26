package com.softneo.erp.controller;

import com.softneo.erp.dto.responses.FluxoCaixaResponse;
import com.softneo.erp.enums.PeriodoFluxoCaixaGrafico;
import com.softneo.erp.service.FluxoCaixaService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@CrossOrigin(origins = {
        "http://localhost:5500",
        "http://127.0.0.1:5500"
})
@RestController
@RequestMapping("/api/v1/indicadores")
public class EstatisticaController {

  private final FluxoCaixaService fluxoCaixaService;

  public EstatisticaController(FluxoCaixaService fluxoCaixaService) {
    this.fluxoCaixaService = fluxoCaixaService;
  }

  @GetMapping("/fluxo-caixa")
  public FluxoCaixaResponse findCashFlow(

          @RequestParam
          PeriodoFluxoCaixaGrafico periodo,

          @RequestParam
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          Instant dataReferencia

  ) {
    return fluxoCaixaService.findCashFlow(
            periodo,
            dataReferencia
    );
  }
}
