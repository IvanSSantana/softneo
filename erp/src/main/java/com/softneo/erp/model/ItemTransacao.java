package com.softneo.erp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(
    name = "item_transacao",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_item_transacao_produto",
            columnNames = {"transacao_id", "produto_id"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
public class ItemTransacao {

    public ItemTransacao(
            Produto produto,
            Integer quantidade,
            BigDecimal precoUnitario
    ) {
        this.produto = produto;
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transacao_id", nullable = false)
    private Transacao transacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;
}