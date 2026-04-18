package com.ApplicationGoogleDrive.controller;

import com.ApplicationGoogleDrive.model.AccessRequest;
import com.ApplicationGoogleDrive.model.User;
import com.ApplicationGoogleDrive.service.AccessRequestService;
import com.ApplicationGoogleDrive.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:4200")
public class AccessRequestController {

    @Autowired
    private AccessRequestService accessRequestService;

    @Autowired
    private UserService userService;

    // Obtenir les demandes reçues
    @GetMapping("/received")
    public ResponseEntity<List<AccessRequest>> getReceivedRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userService.findByEmail(userDetails.getUsername());
        List<AccessRequest> requests = accessRequestService.getRequestsByOwner(currentUser);
        return ResponseEntity.ok(requests);
    }

    // Obtenir les demandes envoyées
    @GetMapping("/sent")
    public ResponseEntity<List<AccessRequest>> getSentRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userService.findByEmail(userDetails.getUsername());
        List<AccessRequest> requests = accessRequestService.getRequestsByRequester(currentUser);
        return ResponseEntity.ok(requests);
    }

    // Mettre à jour le statut d'une demande
    @PutMapping("/{requestId}")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable Long requestId,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            AccessRequest.RequestStatus requestStatus =
                    AccessRequest.RequestStatus.valueOf(status.toUpperCase());

            AccessRequest updatedRequest = accessRequestService.updateRequestStatus(
                    requestId, currentUser, requestStatus);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Request updated successfully");
            response.put("request", updatedRequest);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid status: " + status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Supprimer une demande
    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> deleteRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            accessRequestService.deleteRequest(requestId, currentUser);

            return ResponseEntity.ok(Map.of("message", "Request deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}