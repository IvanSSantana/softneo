package com.softneo.erp.service;

import com.softneo.erp.model.Cliente;
import com.softneo.erp.repository.ClienteRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public class ClienteService {

  private final ClienteRepository clienteRepository;

  public ClienteService(ClienteRepository clienteRepository) {
    this.clienteRepository = clienteRepository;
  }

  public List<Cliente> findAll() {
    return clienteRepository.findAll();
  }

  public Cliente findById(long id) {
    return clienteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado com o ID: " + id ));
  }

  @Transactional
  public Cliente save(Cliente cliente) {
    return clienteRepository.save(cliente);
  }

  @Transactional
  public Cliente update(long id, Cliente dadosAtualizados) {
    Cliente clienteExistente = this.findById(id);

    clienteExistente.setNome(dadosAtualizados.getNome());

    return clienteRepository.save(clienteExistente);
  }

  @Transactional
  public void delete(Long id) {
    Cliente cliente = this.findById(id);
    clienteRepository.delete(cliente);
  }
}
