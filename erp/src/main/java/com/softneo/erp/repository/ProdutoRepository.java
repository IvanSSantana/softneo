package com.softneo.erp.repository;

import com.softneo.erp.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {
  Optional<List<Produto>> findByNomeNormalizadoContaining(String nome);
}