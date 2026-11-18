package com.softneo.erp.service;

import com.softneo.erp.dto.requests.ProdutoSaveRequest;
import com.softneo.erp.dto.responses.ProdutoResponse;
import com.softneo.erp.model.Produto;
import com.softneo.erp.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class ProdutoService {

  private final ProdutoRepository produtoRepository;

  public ProdutoService(ProdutoRepository produtoRepository) {
    this.produtoRepository = produtoRepository;
  }

  @Transactional(readOnly = true)
  public List<ProdutoResponse> findAll() {
    return produtoRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
  }

  @Transactional(readOnly = true)
  public ProdutoResponse findById(long id) {
    Produto produto = findProdutoEntityById(id);
    return toResponse(produto);
  }

  Produto findEntityById(long id) {
    return produtoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException(
                    "Produto não encontrado com o ID: " + id
            ));
  }

  @Transactional(readOnly = true)
  public List<ProdutoResponse> findByNome(String nome) {
    if (nome == null || nome.isBlank()) {
      throw new IllegalArgumentException("O nome para pesquisa não pode ser vazio.");
    }

    String nomeNormalizado = nome.trim().toUpperCase(Locale.ROOT);

    List<Produto> produtos = produtoRepository.findByNomeNormalizadoContaining(nomeNormalizado).orElse(null);

    if (produtos == null) return null;

    return produtos
            .stream()
            .map(entity -> this.toResponse(entity))
            .toList();
  }

  @Transactional
  public ProdutoResponse save(ProdutoSaveRequest produtoRequest) {
    Produto produto = new Produto();

    produto.setNome(produtoRequest.nome());
    produto.setDescricao(produtoRequest.descricao());
    produto.setPreco(produtoRequest.preco());
    produto.setQuantidade(produtoRequest.quantidade());

    Produto produtoSalvo = produtoRepository.save(produto);

    return toResponse(produtoSalvo);
  }

  @Transactional
  public ProdutoResponse update(long id, ProdutoSaveRequest dadosAtualizados) {
    Produto produtoExistente = findProdutoEntityById(id);

    produtoExistente.setNome(dadosAtualizados.nome());
    produtoExistente.setDescricao(dadosAtualizados.descricao());
    produtoExistente.setPreco(dadosAtualizados.preco());
    produtoExistente.setQuantidade(dadosAtualizados.quantidade());

    Produto produtoAtualizado = produtoRepository.save(produtoExistente);

    return toResponse(produtoAtualizado);
  }

  @Transactional
  public void delete(long id) {
    Produto produto = findProdutoEntityById(id);
    produtoRepository.delete(produto);
  }

  private Produto findProdutoEntityById(long id) {
    return produtoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException(
                    "Produto não encontrado com o ID: " + id
            ));
  }

  private ProdutoResponse toResponse(Produto produto) {
    return new ProdutoResponse(
            produto.getId(),
            produto.getNome(),
            produto.getDescricao(),
            produto.getPreco(),
            produto.getQuantidade()
    );
  }
}