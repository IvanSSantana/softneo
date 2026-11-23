package com.softneo.erp.repository;

import com.softneo.erp.model.Transacao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

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

  @EntityGraph(attributePaths = {
          "cliente",
          "vendedor",
          "itens",
          "itens.produto"
  })
  Optional<Transacao> findById(Long id);
}