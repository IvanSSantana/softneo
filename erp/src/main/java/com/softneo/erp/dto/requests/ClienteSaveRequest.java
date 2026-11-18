package com.softneo.erp.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteSaveRequest(
        @NotBlank(message = "O nome do cliente é obrigatório.")
        @Size(min = 3, max = 100, message = "O nome do cliente deve ter entre 3 e 100 caracteres.")
        String nome
) {}