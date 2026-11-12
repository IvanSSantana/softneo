package com.softneo.erp.service;

import com.softneo.erp.dto.TransacaoSaveRequest;
import com.softneo.erp.model.Cliente;
import com.softneo.erp.model.Produto;
import com.softneo.erp.model.Transacao;

import com.softneo.erp.model.Vendedor;
import com.softneo.erp.repository.TransacaoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransacaoService {

  private final TransacaoRepository transacaoRepository;
  private final ProdutoService produtoService;
  private final ClienteService clienteService;
  private final VendedorService vendedorService;

  public TransacaoService(
          TransacaoRepository transacaoRepository,
          ProdutoService produtoService,
          ClienteService clienteService,
          VendedorService vendedorService
  ) {
    this.transacaoRepository = transacaoRepository;
    this.produtoService = produtoService;
    this.clienteService = clienteService;
    this.vendedorService = vendedorService;
  }

  public List<Transacao> findAll() {
    return transacaoRepository.findAll();
  }

  public Transacao findById(long id) {
    return transacaoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException(
                    "Transação não encontrada com o ID: " + id
            ));
  }

  @Transactional
  public Transacao save(TransacaoSaveRequest transacaoRequest) {

    this.validarDados(transacaoRequest);

    Produto produto = produtoService.findById(transacaoRequest.produtoId());
    Cliente cliente = clienteService.findById(transacaoRequest.clienteId());
    Vendedor vendedor = vendedorService.findById(transacaoRequest.vendedorId());

    Transacao transacao = new Transacao(
            produto,
            cliente,
            vendedor,
            transacaoRequest.tipo(),
            transacaoRequest.quantidade(),
            transacaoRequest.precoUnitario()
    );

    return transacaoRepository.save(transacao);
  }

  @Transactional
  public Transacao update(long id, TransacaoSaveRequest dadosAtualizados) {

    this.validarDados(dadosAtualizados);

    Transacao transacaoExistente = this.findById(id);

    Produto produto = produtoService.findById(dadosAtualizados.produtoId());
    Cliente cliente = clienteService.findById(dadosAtualizados.clienteId());
    Vendedor vendedor = vendedorService.findById(dadosAtualizados.vendedorId());

    transacaoExistente.setProduto(produto);
    transacaoExistente.setCliente(cliente);
    transacaoExistente.setVendedor(vendedor);
    transacaoExistente.setTipo(dadosAtualizados.tipo());
    transacaoExistente.setQuantidade(dadosAtualizados.quantidade());
    transacaoExistente.setPrecoUnitario(dadosAtualizados.precoUnitario());

    return transacaoRepository.save(transacaoExistente);
  }

  @Transactional
  public void delete(long id) {
    Transacao transacao = this.findById(id);
    transacaoRepository.delete(transacao);
  }

  private void validarDados(TransacaoSaveRequest transacao) {

    if (transacao.tipo() == null) {
      throw new IllegalArgumentException("O tipo da transação é obrigatório.");
    }

    if (transacao.quantidade() <= 0) {
      throw new IllegalArgumentException(
              "A quantidade da transação deve ser maior que zero."
      );
    }

    if (transacao.precoUnitario() == null) {
      throw new IllegalArgumentException(
              "O preço unitário da transação é obrigatório."
      );
    }

  }

}