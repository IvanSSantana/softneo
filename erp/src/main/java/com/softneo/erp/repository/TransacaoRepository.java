package com.softneo.erp.repository;

import com.softneo.erp.model.Transacao;
import com.softneo.erp.repository.projection.FluxoCaixaProjection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TransacaoRepository extends JpaRepository<Transacao, Long> {

  @EntityGraph(attributePaths = {
          "cliente",
          "vendedor",
          "itens",
          "itens.produto"
  })
  List<Transacao> findAllByOrderByDataTransacaoDesc();

  @Override
  @EntityGraph(attributePaths = {
          "cliente",
          "vendedor",
          "itens",
          "itens.produto"
  })
  Optional<Transacao> findById(Long id);

  @Query("""
    SELECT
        t.dataTransacao AS dataTransacao,
        t.tipo AS tipo,
        SUM(i.quantidade * i.precoUnitario) AS total
    FROM Transacao t
    JOIN t.itens i
    WHERE t.dataTransacao >= :inicio
      AND t.dataTransacao < :fim
    GROUP BY t.dataTransacao, t.tipo
    ORDER BY t.dataTransacao
    """)
  List<FluxoCaixaProjection> findCashFlowData(
          @Param("inicio") Instant inicio,
          @Param("fim") Instant fim
  );
}