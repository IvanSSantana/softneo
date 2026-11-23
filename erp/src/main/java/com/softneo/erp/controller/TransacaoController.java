package com.softneo.erp.controller;

import com.softneo.erp.dto.requests.TransacaoSaveRequest;
import com.softneo.erp.dto.responses.TransacaoResponse;
import com.softneo.erp.service.TransacaoService;

import jakarta.validation.Valid;

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
    public ResponseEntity<List<TransacaoResponse>> findAll() {
        return ResponseEntity.ok(transacaoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransacaoResponse> findById(@PathVariable long id) {
        return ResponseEntity.ok(transacaoService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TransacaoResponse> create(
            @Valid @RequestBody TransacaoSaveRequest request
    ) {
        TransacaoResponse response = transacaoService.save(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransacaoResponse> update(
            @PathVariable long id,
            @Valid @RequestBody TransacaoSaveRequest request
    ) {
        return ResponseEntity.ok(
                transacaoService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        transacaoService.delete(id);

        return ResponseEntity.noContent().build();
    }
}