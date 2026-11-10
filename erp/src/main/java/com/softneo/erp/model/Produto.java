package com.softneo.erp.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Table(name = "produto")
public class Produto {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long id;

  @Column(nullable = false, length = 100)
  private String nome;

  @Column(nullable = true, length = 255)
  private String descricao;

  @Column(nullable = false, precision = 10, scale = 2)
  private String preco;

  @Column(nullable = false)
  private int quantidade = 0;
}
