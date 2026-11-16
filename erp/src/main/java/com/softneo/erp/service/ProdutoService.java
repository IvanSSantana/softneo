package com.softneo.erp.service;

import com.softneo.erp.dto.ProdutoSaveRequest;
import com.softneo.erp.model.Produto;
import com.softneo.erp.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProdutoService {

  private final ProdutoRepository produtoRepository;

  public ProdutoService(ProdutoRepository produtoRepository) {
    this.produtoRepository = produtoRepository;
  }

  public List<Produto> findAll() {
    return produtoRepository.findAll();
  }

  public Produto findById(long id) {
    return produtoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException(
                    "Produto não encontrado com o ID: " + id
            ));
  }

  @Transactional
  public Produto save(ProdutoSaveRequest produtoRequest) {
    Produto produto = new Produto();

    produto.setNome(produtoRequest.nome());
    produto.setDescricao(produtoRequest.descricao());
    produto.setPreco(produtoRequest.preco());
    produto.setQuantidade(produtoRequest.quantidade());

    return produtoRepository.save(produto);
  }

  @Transactional
  public Produto update(long id, ProdutoSaveRequest dadosAtualizados) {
    Produto produtoExistente = this.findById(id);

    produtoExistente.setNome(dadosAtualizados.nome());
    produtoExistente.setDescricao(dadosAtualizados.descricao());
    produtoExistente.setPreco(dadosAtualizados.preco());
    produtoExistente.setQuantidade(dadosAtualizados.quantidade());

    return produtoRepository.save(produtoExistente);
  }

  @Transactional
  public void delete(long id) {
    Produto produto = this.findById(id);
    produtoRepository.delete(produto);
  }
}