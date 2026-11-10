package com.softneo.erp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Table(name = "transacao")
public class Transacao {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long id;

  @ManyToOne(fetch = FetchType.LAZY) // FetchType a ser revisto Lazy ou Eager
  @JoinColumn(name = "produto_id", nullable = false)
  private Produto produto;

  @Column(nullable = false)
  private Boolean tipo;

  @Column(nullable = false)
  private int quantidade = 1;

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
