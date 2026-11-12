package com.softneo.erp.repository;

import com.softneo.erp.model.Vendedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendedorRepository extends JpaRepository<Vendedor, Long> {

  List<Vendedor> findByNomeContainingIgnoreCase(String nome);
}