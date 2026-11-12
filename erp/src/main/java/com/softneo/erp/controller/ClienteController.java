package com.softneo.erp.controller;

import com.softneo.erp.model.Cliente;
import com.softneo.erp.service.ClienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clientes")
public class ClienteController {

  private final ClienteService clienteService;

  public ClienteController(ClienteService clienteService) { this.clienteService = clienteService; }

  @GetMapping
  public ResponseEntity<List<Cliente>> findAll() {
    List<Cliente> clientes = clienteService.findAll();
    return ResponseEntity.ok(clientes);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Cliente> findById(@PathVariable long id) {
    Cliente cliente = clienteService.findById(id);
    return ResponseEntity.ok(cliente);
  }

  @PostMapping
  public ResponseEntity<Cliente> create(@RequestBody Cliente student) {
    Cliente novoCliente = clienteService.save(student);
    return ResponseEntity.status(HttpStatus.CREATED).body(novoCliente);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Cliente> update(@PathVariable Long id, @RequestBody Cliente student) {
    Cliente clienteAtualizado = clienteService.update(id, student);
    return ResponseEntity.ok(clienteAtualizado);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    clienteService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
