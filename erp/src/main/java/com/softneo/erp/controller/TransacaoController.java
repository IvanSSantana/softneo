package com.softneo.erp.controller;

import com.softneo.erp.dto.TransacaoSaveRequest;
import com.softneo.erp.model.Transacao;
import com.softneo.erp.service.TransacaoService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transacoes")
public class TransacaoController {

    private final TransacaoService transacaoService;

    public TransacaoController(TransacaoService transacaoService) {
        this.transacaoService = transacaoService;
    }

    @GetMapping
    public ResponseEntity<List<Transacao>> findAll() {
        List<Transacao> transacoes = transacaoService.findAll();
        return ResponseEntity.ok(transacoes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transacao> findById(@PathVariable long id) {
        Transacao transacao = transacaoService.findById(id);
        return ResponseEntity.ok(transacao);
    }

    @PostMapping
    public ResponseEntity<Transacao> create(
            @RequestBody TransacaoSaveRequest transacaoRequest
    ) {
        Transacao novaTransacao = transacaoService.save(transacaoRequest);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(novaTransacao);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transacao> update(
            @PathVariable Long id,
            @RequestBody TransacaoSaveRequest transacaoRequest
    ) {
        Transacao transacaoAtualizada =
                transacaoService.update(id, transacaoRequest);

        return ResponseEntity.ok(transacaoAtualizada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transacaoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}