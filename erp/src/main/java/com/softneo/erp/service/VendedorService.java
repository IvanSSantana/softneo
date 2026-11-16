package com.softneo.erp.service;

import com.softneo.erp.dto.VendedorSaveRequest;
import com.softneo.erp.model.Vendedor;
import com.softneo.erp.repository.VendedorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VendedorService {

  private final VendedorRepository vendedorRepository;

  public VendedorService(VendedorRepository vendedorRepository) {
    this.vendedorRepository = vendedorRepository;
  }

  public List<Vendedor> findAll() {
    return vendedorRepository.findAll();
  }

  public Vendedor findById(long id) {
    return vendedorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException(
                    "Vendedor não encontrado com o ID: " + id
            ));
  }

  @Transactional
  public Vendedor save(VendedorSaveRequest vendedorRequest) {
    Vendedor vendedor = new Vendedor();

    vendedor.setNome(vendedorRequest.nome());

    return vendedorRepository.save(vendedor);
  }

  @Transactional
  public Vendedor update(long id, VendedorSaveRequest dadosAtualizados) {
    Vendedor vendedorExistente = this.findById(id);

    vendedorExistente.setNome(dadosAtualizados.nome());

    return vendedorRepository.save(vendedorExistente);
  }

  @Transactional
  public void delete(long id) {
    Vendedor vendedor = this.findById(id);
    vendedorRepository.delete(vendedor);
  }
}