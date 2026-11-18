package com.softneo.erp.controller;

import com.softneo.erp.dto.requests.ProdutoSaveRequest;
import com.softneo.erp.dto.responses.ProdutoResponse;
import com.softneo.erp.model.Produto;
import com.softneo.erp.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = {
        "http://localhost:5500",
        "http://127.0.0.1:5500"
})
@RestController
@RequestMapping("/api/v1/produtos")
public class ProdutoController {

  private final ProdutoService produtoService;

  public ProdutoController(ProdutoService produtoService) {
    this.produtoService = produtoService;
  }

  @GetMapping
  public ResponseEntity<List<ProdutoResponse>> findAll(
          @RequestParam(required = false) String nome
  ) {
    if (nome != null) {
      List<ProdutoResponse> produtos = produtoService.findByNome(nome);

      if (produtos == null) return ResponseEntity.notFound().build();
      return ResponseEntity.ok(produtos);
    }

    List<ProdutoResponse> produtos = produtoService.findAll();
    return ResponseEntity.ok(produtos);
  }

  @GetMapping("/{id}")
  public ResponseEntity<ProdutoResponse> findById(@PathVariable long id) {
    ProdutoResponse produto = produtoService.findById(id);
    return ResponseEntity.ok(produto);
  }

  @PostMapping
  public ResponseEntity<ProdutoResponse> create(@Valid @RequestBody ProdutoSaveRequest produto) {
    ProdutoResponse novoProduto = produtoService.save(produto);

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(novoProduto);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ProdutoResponse> update(
          @PathVariable Long id,
          @Valid @RequestBody ProdutoSaveRequest produto
  ) {
    ProdutoResponse produtoAtualizado = produtoService.update(id, produto);
    return ResponseEntity.ok(produtoAtualizado);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    produtoService.delete(id);
    return ResponseEntity.noContent().build();
  }
}