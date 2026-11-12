package com.softneo.erp.controller;

import com.softneo.erp.model.Produto;
import com.softneo.erp.service.ProdutoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/produtos")
public class ProdutoController {

  private final ProdutoService produtoService;

  public ProdutoController(ProdutoService produtoService) {
    this.produtoService = produtoService;
  }

  @GetMapping
  public ResponseEntity<List<Produto>> findAll() {
    List<Produto> produtos = produtoService.findAll();
    return ResponseEntity.ok(produtos);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Produto> findById(@PathVariable long id) {
    Produto produto = produtoService.findById(id);
    return ResponseEntity.ok(produto);
  }

  @PostMapping
  public ResponseEntity<Produto> create(@RequestBody Produto produto) {
    Produto novoProduto = produtoService.save(produto);

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(novoProduto);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Produto> update(
          @PathVariable Long id,
          @RequestBody Produto produto
  ) {
    Produto produtoAtualizado = produtoService.update(id, produto);
    return ResponseEntity.ok(produtoAtualizado);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    produtoService.delete(id);
    return ResponseEntity.noContent().build();
  }
}