package com.softneo.erp.controller;

import com.softneo.erp.model.Vendedor;
import com.softneo.erp.service.VendedorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vendedores")
public class VendedorController {

  private final VendedorService vendedorService;

  public VendedorController(VendedorService vendedorService) {
    this.vendedorService = vendedorService;
  }

  @GetMapping
  public ResponseEntity<List<Vendedor>> findAll() {
    List<Vendedor> vendedores = vendedorService.findAll();
    return ResponseEntity.ok(vendedores);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Vendedor> findById(@PathVariable long id) {
    Vendedor vendedor = vendedorService.findById(id);
    return ResponseEntity.ok(vendedor);
  }

  @PostMapping
  public ResponseEntity<Vendedor> create(@RequestBody Vendedor vendedor) {
    Vendedor novoVendedor = vendedorService.save(vendedor);

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(novoVendedor);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Vendedor> update(
          @PathVariable Long id,
          @RequestBody Vendedor vendedor
  ) {
    Vendedor vendedorAtualizado = vendedorService.update(id, vendedor);
    return ResponseEntity.ok(vendedorAtualizado);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    vendedorService.delete(id);
    return ResponseEntity.noContent().build();
  }
}