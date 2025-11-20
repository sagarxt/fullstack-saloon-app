package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.customer.CustomerDetailResponse;
import com.loyalty_program_app.backend.dto.customer.CustomerResponse;
import com.loyalty_program_app.backend.service.impl.AdminCustomerServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/customers")
@RequiredArgsConstructor
public class AdminCustomerController {

    private final AdminCustomerServiceImpl customerService;

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> getAll() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(customerService.getCustomer(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<CustomerDetailResponse> getCustomerDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(customerService.getCustomerDetail(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<CustomerResponse>> search(
            @RequestParam String keyword
    ) {
        return ResponseEntity.ok(customerService.searchCustomers(keyword));
    }


}
