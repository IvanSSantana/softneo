package com.softneo.erp.service;

import com.softneo.erp.dto.requests.ItemTransacaoSaveRequest;
import com.softneo.erp.dto.requests.TransacaoSaveRequest;
import com.softneo.erp.dto.responses.ItemTransacaoResponse;
import com.softneo.erp.dto.responses.TransacaoResponse;

import com.softneo.erp.model.Cliente;
import com.softneo.erp.model.ItemTransacao;
import com.softneo.erp.model.Produto;
import com.softneo.erp.model.Transacao;
import com.softneo.erp.model.Vendedor;

import com.softneo.erp.repository.TransacaoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
  public List<TransacaoResponse> findAll() {

    return transacaoRepository.findAllByOrderByDataTransacaoDesc()
            .stream()
            .map(this::toResponse)
            .toList();
  }

  @Transactional(readOnly = true)
  public TransacaoResponse findById(long id) {
    return toResponse(findEntityById(id));
  }

  @Transactional
  public TransacaoResponse save(TransacaoSaveRequest request) {

    Map<Long, Produto> produtos = loadProductsFromDb(request.itens());

    Cliente cliente = clienteService.findById(request.clienteId());
    Vendedor vendedor = vendedorService.findById(request.vendedorId());

    Transacao transacao = new Transacao(
            cliente,
            vendedor,
            request.tipo(),
            Instant.now()
    );

    for (ItemTransacaoSaveRequest itemRequest : request.itens()) {

      Produto produto = produtos.get(itemRequest.produtoId());

      updateInventory(
              produto,
              calculateInventoryImpact(
                      request.tipo(),
                      itemRequest.quantidade()
              )
      );

      transacao.addItem(
              new ItemTransacao(
                      produto,
                      itemRequest.quantidade(),
                      itemRequest.precoUnitario()
              )
      );
    }

    Transacao transacaoDb = transacaoRepository.save(transacao);

    return toResponse(transacaoDb);
  }

  @Transactional
  public TransacaoResponse update(
          long id,
          TransacaoSaveRequest request
  ) {

    Transacao transacaoDb = findEntityById(id);

    Map<Long, Produto> produtos = loadProductsFromDb(request.itens());

    for (ItemTransacao itemAntigo : transacaoDb.getItens()) {

      Produto produto = itemAntigo.getProduto();

      produtos.putIfAbsent(produto.getId(), produto);
    }

    Map<Long, Integer> inventoryImpacts = new HashMap<>();

    for (ItemTransacao itemAntigo : transacaoDb.getItens()) {

      Long produtoId = itemAntigo.getProduto().getId();

      int impactoAnterior = calculateInventoryImpact(
              transacaoDb.getTipo(),
              itemAntigo.getQuantidade()
      );

      addInventoryImpact(
              inventoryImpacts,
              produtoId,
              -impactoAnterior
      );
    }

    for (ItemTransacaoSaveRequest itemNovo : request.itens()) {

      int impactoNovo = calculateInventoryImpact(
              request.tipo(),
              itemNovo.quantidade()
      );

      addInventoryImpact(
              inventoryImpacts,
              itemNovo.produtoId(),
              impactoNovo
      );
    }

    for (Map.Entry<Long, Integer> impacts : inventoryImpacts.entrySet()) {

      Produto produto = produtos.get(impacts.getKey());

      updateInventory(produto, impacts.getValue());
    }

    transacaoDb.setCliente(
            clienteService.findById(request.clienteId())
    );

    transacaoDb.setVendedor(
            vendedorService.findById(request.vendedorId())
    );

    transacaoDb.setTipo(request.tipo());

    transacaoDb.clearItens();

    for (ItemTransacaoSaveRequest itemRequest : request.itens()) {

      Produto produto = produtos.get(itemRequest.produtoId());

      transacaoDb.addItem(
              new ItemTransacao(
                      produto,
                      itemRequest.quantidade(),
                      itemRequest.precoUnitario()
              )
      );
    }

    return toResponse(transacaoRepository.save(transacaoDb));
  }

  @Transactional
  public void delete(long id) {

    Transacao transacao = findEntityById(id);

    for (ItemTransacao item : transacao.getItens()) {

      int impacto = calculateInventoryImpact(
              transacao.getTipo(),
              item.getQuantidade()
      );

      updateInventory(
              item.getProduto(),
              -impacto
      );
    }

    transacaoRepository.delete(transacao);
  }

  private Transacao findEntityById(long id) {

    return transacaoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException(
                    "Transação não encontrada com o ID: " + id
            ));
  }

  private Map<Long, Produto> loadProductsFromDb(
          List<ItemTransacaoSaveRequest> itens
  ) {

    Map<Long, Produto> produtos = new LinkedHashMap<>();

    for (ItemTransacaoSaveRequest item : itens) {

      Long produtoId = item.produtoId();

      if (produtos.containsKey(produtoId)) {
        throw new IllegalArgumentException(
                "O produto de ID " + produtoId
                        + " foi informado mais de uma vez."
        );
      }

      produtos.put(
              produtoId,
              produtoService.findEntityById(produtoId)
      );
    }

    return produtos;
  }

  private int calculateInventoryImpact(
          Boolean tipo,
          int quantidade
  ) {

    if (tipo == null) {
      throw new IllegalArgumentException(
              "O tipo da transação é obrigatório."
      );
    }

    return tipo ? -quantidade : quantidade;
  }

  private void addInventoryImpact(
          Map<Long, Integer> inventoryImpacts,
          Long produtoId,
          int impacto
  ) {

    inventoryImpacts.merge(
            produtoId,
            impacto,
            Integer::sum
    );
  }

  private void updateInventory(
          Produto produto,
          int impacto
  ) {

    int estoqueFinal = produto.getQuantidade() + impacto;

    if (estoqueFinal < 0) {
      throw new IllegalArgumentException(
              "Estoque insuficiente para o produto: "
                      + produto.getNome()
                      + ". Estoque disponível: "
                      + produto.getQuantidade()
      );
    }

    produto.setQuantidade(estoqueFinal);
  }

  private ItemTransacaoResponse toItemResponse(ItemTransacao item) {

    BigDecimal subtotal = item.getPrecoUnitario()
            .multiply(BigDecimal.valueOf(item.getQuantidade()));

    return new ItemTransacaoResponse(
            item.getId(),
            item.getProduto().getId(),
            item.getProduto().getNome(),
            item.getQuantidade(),
            item.getPrecoUnitario(),
            subtotal
    );
  }

  private TransacaoResponse toResponse(Transacao transacao) {

    List<ItemTransacaoResponse> itensResponse = transacao.getItens()
            .stream()
            .map(this::toItemResponse)
            .toList();

    BigDecimal total = itensResponse.stream()
            .map(ItemTransacaoResponse::subtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    return new TransacaoResponse(
            transacao.getId(),
            transacao.getTipo(),
            transacao.getCliente().getId(),
            transacao.getCliente().getNome(),
            transacao.getVendedor().getId(),
            transacao.getVendedor().getNome(),
            transacao.getDataTransacao(),
            total,
            itensResponse
    );
  }
}