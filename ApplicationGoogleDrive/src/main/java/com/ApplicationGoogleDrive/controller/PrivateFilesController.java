package com.ApplicationGoogleDrive.controller;

import com.ApplicationGoogleDrive.model.File;
import com.ApplicationGoogleDrive.model.User;
import com.ApplicationGoogleDrive.model.AccessRequest;
import com.ApplicationGoogleDrive.service.FileService;
import com.ApplicationGoogleDrive.service.UserService;
import com.ApplicationGoogleDrive.repository.FileRepository;
import com.ApplicationGoogleDrive.repository.AccessRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/private-files")
@CrossOrigin(origins = "*")
public class PrivateFilesController {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private FileService fileService;

    // Afficher tous les fichiers privés d'autres utilisateurs
    @GetMapping("/others")
    public ResponseEntity<?> getOthersPrivateFiles(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            List<Map<String, Object>> filesList = fileService.getAllOthersPrivateFilesWithStatus(currentUser);
            return ResponseEntity.ok(filesList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error fetching private files: " + e.getMessage()));
        }
    }

    // Obtenir les détails d'un fichier privé spécifique
    @GetMapping("/{fileId}")
    public ResponseEntity<?> getPrivateFileDetails(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            File file = fileRepository.findById(fileId)
                    .orElseThrow(() -> new RuntimeException("File not found"));

            // Vérifier si c'est un fichier privé
            if (file.isPublic()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "This file is public, no need to request access"));
            }

            // Vérifier si l'utilisateur n'est pas le propriétaire
            if (file.getOwner().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "This is your own file"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", file.getId());
            response.put("fileName", file.getFileName());
            response.put("description", file.getDescription());
            response.put("fileSize", file.getFileSize());
            response.put("fileType", file.getFileType());
            response.put("uploadedAt", file.getUploadedAt());
            response.put("ownerEmail", file.getOwner().getEmail());
            response.put("ownerName", file.getOwner().getFirstName() + " " + file.getOwner().getLastName());
            response.put("isPublic", false);
            response.put("isOwner", false);

            // Vérifier l'état de la demande
            Optional<AccessRequest> existingRequest = accessRequestRepository
                    .findByFileIdAndRequesterId(fileId, currentUser.getId());

            if (existingRequest.isPresent()) {
                AccessRequest request = existingRequest.get();
                response.put("hasRequested", true);
                response.put("requestStatus", request.getStatus().toString());
                response.put("requestId", request.getId());
                response.put("requestMessage", request.getMessage());
                response.put("requestedAt", request.getRequestedAt());
                response.put("respondedAt", request.getRespondedAt());

                if (request.getStatus() == AccessRequest.RequestStatus.APPROVED) {
                    response.put("hasAccess", true);
                    response.put("canDownload", true);
                    response.put("canRequest", false);
                } else if (request.getStatus() == AccessRequest.RequestStatus.PENDING) {
                    response.put("hasAccess", false);
                    response.put("canDownload", false);
                    response.put("canRequest", false);
                } else {
                    response.put("hasAccess", false);
                    response.put("canDownload", false);
                    response.put("canRequest", true);
                }
            } else {
                response.put("hasRequested", false);
                response.put("hasAccess", false);
                response.put("canDownload", false);
                response.put("canRequest", true);
                response.put("requestStatus", "NO_REQUEST");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Vérifier rapidement si un fichier est disponible pour demande d'accès
    @GetMapping("/{fileId}/quick-check")
    public ResponseEntity<?> quickCheckFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            File file = fileRepository.findById(fileId)
                    .orElseThrow(() -> new RuntimeException("File not found"));

            Map<String, Object> response = new HashMap<>();

            // Si c'est le fichier de l'utilisateur
            if (file.getOwner().getId().equals(currentUser.getId())) {
                response.put("isOwner", true);
                response.put("canRequest", false);
                response.put("message", "This is your own file");
                return ResponseEntity.ok(response);
            }

            // Si le fichier est public
            if (file.isPublic()) {
                response.put("isPublic", true);
                response.put("canRequest", false);
                response.put("message", "This file is public");
                return ResponseEntity.ok(response);
            }

            // Vérifier les demandes existantes
            Optional<AccessRequest> existingRequest = accessRequestRepository
                    .findByFileIdAndRequesterId(fileId, currentUser.getId());

            if (existingRequest.isPresent()) {
                AccessRequest request = existingRequest.get();
                response.put("hasRequested", true);
                response.put("requestStatus", request.getStatus().toString());

                if (request.getStatus() == AccessRequest.RequestStatus.APPROVED) {
                    response.put("hasAccess", true);
                    response.put("canRequest", false);
                    response.put("message", "Your access request has been approved");
                } else if (request.getStatus() == AccessRequest.RequestStatus.PENDING) {
                    response.put("hasAccess", false);
                    response.put("canRequest", false);
                    response.put("message", "Your request is pending approval");
                } else {
                    response.put("hasAccess", false);
                    response.put("canRequest", true);
                    response.put("message", "Your previous request was rejected. You can request again");
                }
            } else {
                response.put("hasRequested", false);
                response.put("hasAccess", false);
                response.put("canRequest", true);
                response.put("message", "You can request access to this file");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}