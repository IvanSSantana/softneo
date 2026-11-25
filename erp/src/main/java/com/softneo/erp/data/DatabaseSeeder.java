package com.softneo.erp.data;

import com.softneo.erp.dto.requests.ClienteSaveRequest;
import com.softneo.erp.dto.requests.ItemTransacaoSaveRequest;
import com.softneo.erp.dto.requests.ProdutoSaveRequest;
import com.softneo.erp.dto.requests.TransacaoSaveRequest;
import com.softneo.erp.dto.requests.VendedorSaveRequest;
import com.softneo.erp.repository.ClienteRepository;
import com.softneo.erp.repository.ProdutoRepository;
import com.softneo.erp.repository.TransacaoRepository;
import com.softneo.erp.repository.VendedorRepository;
import com.softneo.erp.service.ClienteService;
import com.softneo.erp.service.ProdutoService;
import com.softneo.erp.service.TransacaoService;
import com.softneo.erp.service.VendedorService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
@ConditionalOnProperty(
        prefix = "softneo.seeder",
        name = "enabled",
        havingValue = "true"
)
public class DatabaseSeeder implements CommandLineRunner {

  private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);
  private static final ZoneId FUSO_HORARIO_ERP = ZoneId.of("America/Sao_Paulo");

  private final ProdutoService produtoService;
  private final ClienteService clienteService;
  private final VendedorService vendedorService;
  private final TransacaoService transacaoService;

  private final ProdutoRepository produtoRepository;
  private final ClienteRepository clienteRepository;
  private final VendedorRepository vendedorRepository;
  private final TransacaoRepository transacaoRepository;

  public DatabaseSeeder(
          ProdutoService produtoService,
          ClienteService clienteService,
          VendedorService vendedorService,
          TransacaoService transacaoService,
          ProdutoRepository produtoRepository,
          ClienteRepository clienteRepository,
          VendedorRepository vendedorRepository,
          TransacaoRepository transacaoRepository
  ) {
    this.produtoService = produtoService;
    this.clienteService = clienteService;
    this.vendedorService = vendedorService;
    this.transacaoService = transacaoService;
    this.produtoRepository = produtoRepository;
    this.clienteRepository = clienteRepository;
    this.vendedorRepository = vendedorRepository;
    this.transacaoRepository = transacaoRepository;
  }

  @Override
  @Transactional
  public void run(String... args) {
    if (bancoJaPossuiDados()) {
      log.info("Seeder ignorado: já existem dados nas tabelas principais.");
      return;
    }

    log.info("Iniciando carga de dados de demonstração do SoftNeo...");

    Long notebook = criarProduto(
            "Notebook Acer Aspire 5",
            "Notebook para trabalho e estudo, 8 GB RAM e SSD 512 GB.",
            "3599.90",
            10
    );

    Long mouse = criarProduto(
            "Mouse Logitech M190",
            "Mouse sem fio de tamanho padrão, conexão USB.",
            "89.90",
            40
    );

    Long teclado = criarProduto(
            "Teclado Mecânico Redragon Kumara",
            "Teclado mecânico compacto com iluminação.",
            "249.90",
            18
    );

    Long monitor = criarProduto(
            "Monitor LG 24 polegadas",
            "Monitor Full HD de 24 polegadas.",
            "1099.90",
            12
    );

    Long headset = criarProduto(
            "Headset HyperX Cloud Stinger 2",
            "Headset com microfone integrado para chamadas e jogos.",
            "329.90",
            16
    );

    Long mariana = criarCliente("Mariana Oliveira");
    Long carlos = criarCliente("Carlos Henrique Almeida");
    Long mercado = criarCliente("Mercado Bom Preço Ltda.");

    Long ana = criarVendedor("Ana Paula Souza");
    Long rafael = criarVendedor("Rafael Martins");
    Long distribuidora = criarVendedor("Tech Distribuidora Ltda.");

    criarTransacao(
            mercado, distribuidora, false, 29,
            item(notebook, 4, "3100.00"),
            item(mouse, 15, "55.00"),
            item(teclado, 8, "150.00")
    );

    criarTransacao(
            mariana, ana, true, 24,
            item(notebook, 1, "3799.90"),
            item(mouse, 4, "89.90")
    );

    criarTransacao(
            carlos, rafael, true, 21,
            item(teclado, 2, "229.90"),
            item(monitor, 1, "1099.90")
    );

    criarTransacao(
            mercado, distribuidora, false, 18,
            item(monitor, 5, "780.00"),
            item(headset, 8, "240.00")
    );

    criarTransacao(
            mariana, ana, true, 14,
            item(notebook, 2, "3899.90"),
            item(teclado, 3, "249.90"),
            item(headset, 2, "329.90")
    );

    criarTransacao(
            carlos, rafael, true, 10,
            item(mouse, 6, "99.90"),
            item(monitor, 2, "1199.90")
    );

    criarTransacao(
            mercado, distribuidora, false, 7,
            item(notebook, 3, "3150.00"),
            item(mouse, 10, "58.90"),
            item(headset, 5, "235.00")
    );

    criarTransacao(
            mariana, ana, true, 4,
            item(notebook, 2, "3999.90"),
            item(mouse, 8, "104.90"),
            item(teclado, 4, "269.90")
    );

    criarTransacao(
            mercado, distribuidora, false, 2,
            item(teclado, 10, "155.00"),
            item(monitor, 4, "790.00")
    );

    criarTransacao(
            carlos, rafael, true, 0,
            item(monitor, 3, "1299.90"),
            item(headset, 3, "359.90"),
            item(notebook, 1, "4099.90")
    );

    log.info("Seeder concluído: 5 produtos, 3 clientes, 3 vendedores e 10 transações.");
  }

  private boolean bancoJaPossuiDados() {
    return produtoRepository.count() > 0
            || clienteRepository.count() > 0
            || vendedorRepository.count() > 0
            || transacaoRepository.count() > 0;
  }

  private Long criarProduto(
          String nome,
          String descricao,
          String preco,
          int quantidade
  ) {
    return produtoService.save(
            new ProdutoSaveRequest(
                    nome,
                    descricao,
                    new BigDecimal(preco),
                    quantidade
            )
    ).id();
  }

  private Long criarCliente(String nome) {
    return clienteService.save(new ClienteSaveRequest(nome)).getId();
  }

  private Long criarVendedor(String nome) {
    return vendedorService.save(new VendedorSaveRequest(nome)).getId();
  }

  private void criarTransacao(
          Long clienteId,
          Long vendedorId,
          boolean tipo,
          long diasAtras,
          ItemTransacaoSaveRequest... itens
  ) {
    var resposta = transacaoService.save(
            new TransacaoSaveRequest(
                    tipo,
                    clienteId,
                    vendedorId,
                    List.of(itens)
            )
    );

    Instant dataTransacao = LocalDate.now(FUSO_HORARIO_ERP)
            .minusDays(diasAtras)
            .atTime(10, 0)
            .atZone(FUSO_HORARIO_ERP)
            .toInstant();

    transacaoRepository.findById(resposta.id())
            .orElseThrow(() -> new IllegalStateException(
                    "Transação recém-criada não foi encontrada: " + resposta.id()
            ))
            .setDataTransacao(dataTransacao);
  }

  private static ItemTransacaoSaveRequest item(
          Long produtoId,
          int quantidade,
          String precoUnitario
  ) {
    return new ItemTransacaoSaveRequest(
            produtoId,
            quantidade,
            new BigDecimal(precoUnitario)
    );
  }
}
