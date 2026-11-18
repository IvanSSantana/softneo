package com.softneo.erp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.regex.Pattern;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Table(name = "produto")
public class Produto {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long id;

  @Column(nullable = false, length = 100)
  private String nome;

  @Column(name = "nome_normalizado", nullable = false)
  private String nomeNormalizado;

  @PrePersist
  @PreUpdate
  public void atualizarCamposNormalizados() {
      this.nomeNormalizado = normalizar(this.nome);
  }

  private String normalizar(String texto) {
    String nomeNormalizado = Normalizer.normalize(texto, Normalizer.Form.NFD);

    Pattern pattern = Pattern.compile("\\p{M}+");
    return pattern.matcher(nomeNormalizado)
            .replaceAll("")
            .toUpperCase()
            .trim();
  }

  @Column(nullable = true, length = 255)
  private String descricao;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal preco;

  @Column(nullable = false)
  private Integer quantidade = 0;
}
