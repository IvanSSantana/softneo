package com.softneo.erp.service;

import com.softneo.erp.dto.requests.TransacaoSaveRequest;
import com.softneo.erp.model.Cliente;
import com.softneo.erp.model.Produto;
import com.softneo.erp.model.Transacao;
import com.softneo.erp.model.Vendedor;
import com.softneo.erp.repository.TransacaoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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

  @Transactional(readOnly = true)
  public List<Transacao> findAll() {
    return transacaoRepository.findAll();
  }

  @Transactional(readOnly = true)
  public Transacao findById(long id) {
    return transacaoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException(
                    "Transação não encontrada com o ID: " + id
            ));
  }

  @Transactional
  public Transacao save(TransacaoSaveRequest transacaoRequest) {

    validarDados(transacaoRequest);

    Produto produto = produtoService.findEntityById(
            transacaoRequest.produtoId()
    );

    Cliente cliente = clienteService.findById(
            transacaoRequest.clienteId()
    );

    Vendedor vendedor = vendedorService.findById(
            transacaoRequest.vendedorId()
    );

    int impactoEstoque = calcularImpactoEstoque(
            transacaoRequest.tipo(),
            transacaoRequest.quantidade()
    );

    int novoEstoque = produto.getQuantidade() + impactoEstoque;

    validarEstoque(produto, novoEstoque);

    produto.setQuantidade(novoEstoque);

    Transacao transacao = new Transacao(
            produto,
            cliente,
            vendedor,
            transacaoRequest.tipo(),
            transacaoRequest.quantidade(),
            transacaoRequest.precoUnitario(),
            Instant.now()
    );

    return transacaoRepository.save(transacao);
  }

  @Transactional
  public Transacao update(long id, TransacaoSaveRequest dadosAtualizados) {

    validarDados(dadosAtualizados);

    Transacao transacaoExistente = findById(id);

    Produto produtoAnterior = transacaoExistente.getProduto();

    Produto produtoNovo = produtoService.findEntityById(
            dadosAtualizados.produtoId()
    );

    Cliente cliente = clienteService.findById(
            dadosAtualizados.clienteId()
    );

    Vendedor vendedor = vendedorService.findById(
            dadosAtualizados.vendedorId()
    );

    int impactoAnterior = calcularImpactoEstoque(
            transacaoExistente.getTipo(),
            transacaoExistente.getQuantidade()
    );

    int impactoNovo = calcularImpactoEstoque(
            dadosAtualizados.tipo(),
            dadosAtualizados.quantidade()
    );

    if (produtoAnterior.getId() == produtoNovo.getId()) {
      int estoqueFinal = produtoNovo.getQuantidade()
              - impactoAnterior
              + impactoNovo;

      validarEstoque(produtoNovo, estoqueFinal);

      produtoNovo.setQuantidade(estoqueFinal);

    } else {

      int estoqueAnteriorFinal = produtoAnterior.getQuantidade()
              - impactoAnterior;

      int estoqueNovoFinal = produtoNovo.getQuantidade()
              + impactoNovo;

      validarEstoque(produtoAnterior, estoqueAnteriorFinal);
      validarEstoque(produtoNovo, estoqueNovoFinal);

      produtoAnterior.setQuantidade(estoqueAnteriorFinal);
      produtoNovo.setQuantidade(estoqueNovoFinal);
    }

    transacaoExistente.setProduto(produtoNovo);
    transacaoExistente.setCliente(cliente);
    transacaoExistente.setVendedor(vendedor);
    transacaoExistente.setTipo(dadosAtualizados.tipo());
    transacaoExistente.setQuantidade(dadosAtualizados.quantidade());
    transacaoExistente.setPrecoUnitario(dadosAtualizados.precoUnitario());

    return transacaoRepository.save(transacaoExistente);
  }

  @Transactional
  public void delete(long id) {

    Transacao transacao = findById(id);

    Produto produto = transacao.getProduto();

    int impactoEstoque = calcularImpactoEstoque(
            transacao.getTipo(),
            transacao.getQuantidade()
    );

    int estoqueFinal = produto.getQuantidade() - impactoEstoque;

    validarEstoque(produto, estoqueFinal);

    produto.setQuantidade(estoqueFinal);

    transacaoRepository.delete(transacao);
  }

  private int calcularImpactoEstoque(Boolean tipo, int quantidade) {
    return tipo ? -quantidade : quantidade;
  }

  private void validarEstoque(Produto produto, int estoqueFinal) {

    if (estoqueFinal < 0) {
      throw new IllegalArgumentException(
              "Estoque insuficiente para o produto: "
                      + produto.getNome()
                      + ". Estoque disponível: "
                      + produto.getQuantidade()
      );
    }
  }

  private void validarDados(TransacaoSaveRequest transacao) {

    if (transacao.produtoId() == null) {
      throw new IllegalArgumentException(
              "O produto informado é inválido."
      );
    }

    if (transacao.clienteId() == null) {
      throw new IllegalArgumentException(
              "O cliente informado é inválido."
      );
    }

    if (transacao.vendedorId() == null) {
      throw new IllegalArgumentException(
              "O vendedor informado é inválido."
      );
    }

    if (transacao.tipo() == null) {
      throw new IllegalArgumentException(
              "O tipo da transação é obrigatório."
      );
    }

    if (transacao.quantidade() == null || transacao.quantidade() <= 0) {
      throw new IllegalArgumentException(
              "A quantidade da transação deve ser maior que zero."
      );
    }

    if (transacao.precoUnitario() == null || transacao.precoUnitario().signum() <= 0) {
      throw new IllegalArgumentException(
              "O preço unitário deve ser maior que zero."
      );
    }
  }
}