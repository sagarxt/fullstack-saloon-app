package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.dto.reward.RewardRequest;
import com.loyalty_program_app.backend.service.impl.AdminRewardServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rewards")
@RequiredArgsConstructor
public class AdminRewardController {

    private final AdminRewardServiceImpl service;

    @GetMapping
    public Object getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Object getOne(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    public Object create(@RequestBody RewardRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public Object update(@PathVariable UUID id, @RequestBody RewardRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
