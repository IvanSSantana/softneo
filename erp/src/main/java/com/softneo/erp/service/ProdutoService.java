package com.softneo.erp.service;

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
  public Produto save(Produto produto) {
    return produtoRepository.save(produto);
  }

  @Transactional
  public Produto update(long id, Produto dadosAtualizados) {
    Produto produtoExistente = this.findById(id);

    produtoExistente.setNome(dadosAtualizados.getNome());
    produtoExistente.setDescricao(dadosAtualizados.getDescricao());
    produtoExistente.setPreco(dadosAtualizados.getPreco());
    produtoExistente.setQuantidade(dadosAtualizados.getQuantidade());

    return produtoRepository.save(produtoExistente);
  }

  @Transactional
  public void delete(long id) {
    Produto produto = this.findById(id);
    produtoRepository.delete(produto);
  }
}