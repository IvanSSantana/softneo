package com.softneo.erp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VendedorSaveRequest(
        @NotBlank(message = "O nome do vendedor é obrigatório.")
        @Size(min = 3, max = 100, message = "O nome do vendedor deve ter entre 3 e 100 caracteres.")
        String nome
) {}