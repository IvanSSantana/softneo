package com.softneo.erp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter @Setter @NoArgsConstructor
@Table(name = "transacao")
public class Transacao {

  public Transacao(
          Produto produto,
          Cliente cliente,
          Vendedor vendedor,
          Boolean tipo,
          Integer quantidade,
          BigDecimal precoUnitario
          ) {
      this.produto = produto;
      this.cliente = cliente;
      this.vendedor = vendedor;
      this.tipo = tipo;
      this.quantidade = quantidade;
      this.precoUnitario = precoUnitario;
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY) // FetchType a ser revisto Lazy ou Eager
  @JoinColumn(name = "produto_id", nullable = false)
  private Produto produto;

  @Column(nullable = false)
  private Boolean tipo;

  @Column(nullable = false)
  private Integer quantidade = 1;

  @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
  private BigDecimal precoUnitario;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "cliente_id")
  private Cliente cliente;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "vendedor_id")
  private Vendedor vendedor;

  @Column(name = "data_transacao", nullable = false, insertable = false, updatable = false)
  private Instant dataTransacao;
}
