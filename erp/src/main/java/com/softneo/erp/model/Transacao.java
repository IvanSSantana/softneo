package com.softneo.erp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "transacao")
@Getter
@Setter
@NoArgsConstructor
public class Transacao {

  public Transacao(
          Cliente cliente,
          Vendedor vendedor,
          Boolean tipo,
          Instant dataTransacao
  ) {
    this.cliente = cliente;
    this.vendedor = vendedor;
    this.tipo = tipo;
    this.dataTransacao = dataTransacao;
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "cliente_id", nullable = false)
  private Cliente cliente;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "vendedor_id", nullable = false)
  private Vendedor vendedor;

  // true = venda | false = compra
  @Column(nullable = false)
  private Boolean tipo;

  @Column(name = "data_transacao", nullable = false, updatable = false)
  private Instant dataTransacao;

  @OneToMany(
          mappedBy = "transacao",
          cascade = CascadeType.ALL,
          orphanRemoval = true
  )
  @OrderBy("id ASC")
  private List<ItemTransacao> itens = new ArrayList<>();

  public void addItem(ItemTransacao item) {
    itens.add(item);
    item.setTransacao(this);
  }

  public void clearItens() {
    for (ItemTransacao item : itens) {
      item.setTransacao(null);
    }

    itens.clear();
  }
}