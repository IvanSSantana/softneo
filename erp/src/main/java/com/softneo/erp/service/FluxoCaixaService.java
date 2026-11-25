
package com.softneo.erp.service;

import com.softneo.erp.dto.responses.FluxoCaixaPontoResponse;
import com.softneo.erp.dto.responses.FluxoCaixaResponse;
import com.softneo.erp.enums.PeriodoFluxoCaixaGrafico;
import com.softneo.erp.repository.TransacaoRepository;
import com.softneo.erp.repository.projection.FluxoCaixaProjection;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class FluxoCaixaService {

  private static final Locale LOCALE = Locale.forLanguageTag("pt-BR");
  private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");

  private final TransacaoRepository transacaoRepository;

  public FluxoCaixaService(TransacaoRepository transacaoRepository) {
    this.transacaoRepository = transacaoRepository;
  }

  @Transactional(readOnly = true)
  public FluxoCaixaResponse findCashFlow(
          PeriodoFluxoCaixaGrafico periodo,
          Instant dataReferencia
  ) {

    Instant inicio = calcularInicio(periodo, dataReferencia);

    Instant fim = calcularFim(periodo, inicio);

    List<FluxoCaixaProjection> transacoes =
            transacaoRepository.findCashFlowData(
                    inicio,
                    fim
            );

    Map<Instant, ValoresFluxo> agrupamento =
            inicializarAgrupamentoPorData(periodo, inicio, fim);

    for (FluxoCaixaProjection transacao : transacoes) {

      Instant data = transacao.getDataTransacao();

      Instant dataGrupo = obterDataGrupo(periodo, data);

      ValoresFluxo valores = agrupamento.get(dataGrupo);

      if (valores == null) {
        continue;
      }

      BigDecimal total = transacao.getTotal() != null
              ? transacao.getTotal()
              : BigDecimal.ZERO;

      if (transacao.getTipo() == true) {
        valores.entradas = valores.entradas.add(total);
      }

      else if (transacao.getTipo() == false) {
        valores.saidas = valores.saidas.add(total);
      }

      else {
        throw new IllegalStateException(
                "Foi encontrada uma transação sem tipo definido."
        );
      }
    }

    List<FluxoCaixaPontoResponse> pontos = agrupamento.entrySet()
            .stream()
            .map(entry -> {

              Instant data = entry.getKey();

              BigDecimal entradas = entry.getValue().entradas;
              BigDecimal saidas = entry.getValue().saidas;

              BigDecimal saldo = entradas.subtract(saidas);

              return new FluxoCaixaPontoResponse(
                      data,
                      gerarRotulo(periodo, data),
                      entradas,
                      saidas,
                      saldo
              );
            })
            .toList();

    BigDecimal totalEntradas = pontos.stream()
            .map(FluxoCaixaPontoResponse::entradas)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal totalSaidas = pontos.stream()
            .map(FluxoCaixaPontoResponse::saidas)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal saldo = totalEntradas.subtract(totalSaidas);

    return new FluxoCaixaResponse(
            periodo,
            inicio,
            fim,
            totalEntradas,
            totalSaidas,
            saldo,
            pontos
    );
  }

  private Instant calcularInicio(
          PeriodoFluxoCaixaGrafico periodo,
          Instant referencia
  ) {

    ZonedDateTime data = referencia.atZone(ZONE_ID);

    ZonedDateTime inicio = switch (periodo) {

      case SEMANA -> data
              .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
              .truncatedTo(ChronoUnit.DAYS);

      case MES -> data
              .withDayOfMonth(1)
              .truncatedTo(ChronoUnit.DAYS);

      case ANO -> data
              .withDayOfYear(1)
              .truncatedTo(ChronoUnit.DAYS);
    };

    return inicio.toInstant();
  }

  private Instant calcularFim(
          PeriodoFluxoCaixaGrafico periodo,
          Instant inicio
  ) {

    ZonedDateTime inicioLocal = inicio.atZone(ZONE_ID);

    ZonedDateTime fim = switch (periodo) {
      case SEMANA -> inicioLocal.plusWeeks(1);
      case MES -> inicioLocal.plusMonths(1);
      case ANO -> inicioLocal.plusYears(1);
    };

    return fim.toInstant();
  }

  private Map<Instant, ValoresFluxo> inicializarAgrupamentoPorData(
          PeriodoFluxoCaixaGrafico periodo,
          Instant inicio,
          Instant fim
  ) {

    Map<Instant, ValoresFluxo> agrupamentoPorData = new LinkedHashMap<>();

    ZonedDateTime atual = inicio.atZone(ZONE_ID);
    ZonedDateTime limite = fim.atZone(ZONE_ID);

    while (atual.isBefore(limite)) {

      agrupamentoPorData.put(atual.toInstant(), new ValoresFluxo());

      atual = periodo == PeriodoFluxoCaixaGrafico.ANO
              ? atual.plusMonths(1)
              : atual.plusDays(1);
    }

    return agrupamentoPorData;
  }

  private Instant obterDataGrupo(
          PeriodoFluxoCaixaGrafico periodo,
          Instant data
  ) {

    ZonedDateTime dataLocal = data
            .atZone(ZONE_ID)
            .truncatedTo(ChronoUnit.DAYS);

    if (periodo == PeriodoFluxoCaixaGrafico.ANO) {
      dataLocal = dataLocal.withDayOfMonth(1);
    }

    return dataLocal.toInstant();
  }

  private String gerarRotulo(
          PeriodoFluxoCaixaGrafico periodo,
          Instant data
  ) {

    ZonedDateTime dataLocal = data.atZone(ZONE_ID);

    return switch (periodo) {

      case SEMANA -> dataLocal
              .format(DateTimeFormatter.ofPattern("EEE", LOCALE))
              .toUpperCase(LOCALE);

      case MES -> dataLocal.format(
              DateTimeFormatter.ofPattern("dd")
      );

      case ANO -> dataLocal
              .format(DateTimeFormatter.ofPattern("MMM", LOCALE))
              .replace(".", "")
              .toUpperCase(LOCALE);
    };
  }

  private static class ValoresFluxo {
    private BigDecimal entradas = BigDecimal.ZERO;
    private BigDecimal saidas = BigDecimal.ZERO;
  }
}
