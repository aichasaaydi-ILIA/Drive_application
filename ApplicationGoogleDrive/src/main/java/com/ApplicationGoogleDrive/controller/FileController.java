package com.ApplicationGoogleDrive.controller;

import com.ApplicationGoogleDrive.model.File;
import com.ApplicationGoogleDrive.model.User;
import com.ApplicationGoogleDrive.model.AccessRequest;
import com.ApplicationGoogleDrive.service.FileService;
import com.ApplicationGoogleDrive.service.AccessRequestService;
import com.ApplicationGoogleDrive.service.UserService;
import com.ApplicationGoogleDrive.repository.FileRepository;
import com.ApplicationGoogleDrive.repository.AccessRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileService fileService;

    @Autowired
    private AccessRequestService accessRequestService;

    @Autowired
    private UserService userService;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    private final Path rootLocation = Paths.get("uploads");

    // Upload un fichier
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPublic", defaultValue = "false") boolean isPublic,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            File savedFile = fileService.saveFile(file, description, isPublic, currentUser);
            return ResponseEntity.ok(savedFile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not upload the file: " + e.getMessage()));
        }
    }

    // Obtenir mes fichiers
    @GetMapping("/my-files")
    public ResponseEntity<List<File>> getMyFiles(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByEmail(userDetails.getUsername());
        List<File> files = fileService.getFilesByOwner(currentUser);
        return ResponseEntity.ok(files);
    }

    // Fichiers publics
    @GetMapping("/public")
    public ResponseEntity<List<File>> getPublicFiles() {
        List<File> files = fileService.getPublicFiles();
        return ResponseEntity.ok(files);
    }

    // Fichiers visibles (publics + mes fichiers + fichiers avec accès approuvé)
    @GetMapping("/visible")
    public ResponseEntity<List<File>> getVisibleFiles(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetails != null ?
                userService.findByEmail(userDetails.getUsername()) : null;
        List<File> files = fileService.getVisibleFiles(currentUser);
        return ResponseEntity.ok(files);
    }

    // Fichiers privés d'autres utilisateurs (pour demander l'accès)
    @GetMapping("/for-request")
    public ResponseEntity<?> getFilesForAccessRequest(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            List<Map<String, Object>> files = fileService.getAllOthersPrivateFilesWithStatus(currentUser);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Télécharger un fichier
    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable("id") Long fileId,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            byte[] fileContent = fileService.getFileContent(fileId, currentUser);
            File file = fileService.getFileWithAccessCheck(fileId, currentUser);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", file.getFileName());
            headers.setContentLength(fileContent.length);

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Prévisualiser un fichier
    @GetMapping("/preview/{id}")
    public ResponseEntity<byte[]> previewFile(@PathVariable("id") Long fileId,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User currentUser = userDetails != null ?
                    userService.findByEmail(userDetails.getUsername()) : null;

            File file = fileRepository.findById(fileId).orElse(null);
            if (file == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Vérifier l'accès
            if (currentUser == null && !file.isPublic()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            if (currentUser != null) {
                fileService.getFileWithAccessCheck(fileId, currentUser);
            }

            byte[] fileContent = Files.readAllBytes(rootLocation.resolve(file.getFilePath()));

            HttpHeaders headers = new HttpHeaders();
            if (file.getFileType() != null) {
                if (file.getFileType().contains("pdf")) {
                    headers.setContentType(MediaType.APPLICATION_PDF);
                } else if (file.getFileType().startsWith("image")) {
                    headers.setContentType(MediaType.parseMediaType(file.getFileType()));
                } else {
                    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                }
            } else {
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            }

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Demander l'accès à un fichier privé
    @PostMapping("/{id}/request-access")
    public ResponseEntity<?> requestAccess(
            @PathVariable("id") Long fileId,
            @RequestParam(value = "message", required = false) String message,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            AccessRequest request = accessRequestService.createRequest(currentUser, fileId, message);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Access request sent successfully");
            response.put("request", request);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Vérifier si l'utilisateur a accès à un fichier
    @GetMapping("/{id}/check-access")
    public ResponseEntity<?> checkAccess(
            @PathVariable("id") Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userDetails != null ?
                    userService.findByEmail(userDetails.getUsername()) : null;

            boolean hasAccess = fileService.canUserViewFile(fileId, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("hasAccess", hasAccess);
            response.put("fileId", fileId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("hasAccess", false, "fileId", fileId));
        }
    }

    // Vérifier si l'utilisateur peut demander l'accès à un fichier
    @GetMapping("/{id}/can-request")
    public ResponseEntity<?> canRequestAccess(
            @PathVariable("id") Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            boolean canRequest = fileService.canUserRequestAccess(fileId, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("canRequest", canRequest);
            response.put("fileId", fileId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("canRequest", false, "fileId", fileId));
        }
    }

    // Vérifier si l'utilisateur a déjà demandé l'accès
    @GetMapping("/{id}/has-requested")
    public ResponseEntity<?> hasRequestedAccess(
            @PathVariable("id") Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            boolean hasRequested = accessRequestService.hasRequestedAccess(fileId, currentUser.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("hasRequested", hasRequested);
            response.put("fileId", fileId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("hasRequested", false, "fileId", fileId));
        }
    }

    // Supprimer un fichier
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            fileService.deleteFile(id, currentUser);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Obtenir les informations d'un fichier spécifique
    @GetMapping("/{id}")
    public ResponseEntity<?> getFileInfo(
            @PathVariable("id") Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User currentUser = userDetails != null ?
                    userService.findByEmail(userDetails.getUsername()) : null;

            File file = fileRepository.findById(fileId)
                    .orElseThrow(() -> new RuntimeException("File not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", file.getId());
            response.put("fileName", file.getFileName());
            response.put("description", file.getDescription());
            response.put("isPublic", file.isPublic());
            response.put("owner", file.getOwner().getEmail());
            response.put("ownerName", file.getOwner().getFirstName() + " " + file.getOwner().getLastName());
            response.put("uploadedAt", file.getUploadedAt());
            response.put("fileType", file.getFileType());
            response.put("fileSize", file.getFileSize());

            // Ajouter des informations sur l'accès
            if (currentUser != null) {
                response.put("isOwner", file.getOwner().getId().equals(currentUser.getId()));
                response.put("hasAccess", fileService.canUserViewFile(fileId, currentUser));
                response.put("canRequest", fileService.canUserRequestAccess(fileId, currentUser));

                // Vérifier le statut de la demande
                accessRequestRepository.findByFileIdAndRequesterId(fileId, currentUser.getId())
                        .ifPresent(request -> {
                            response.put("requestStatus", request.getStatus().toString());
                            response.put("requestId", request.getId());
                            response.put("requestMessage", request.getMessage());
                        });
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint de debug pour voir les demandes
    @GetMapping("/debug/requests/{fileId}")
    public ResponseEntity<?> debugRequests(@PathVariable Long fileId) {
        try {
            File file = fileRepository.findById(fileId)
                    .orElseThrow(() -> new RuntimeException("File not found"));

            List<AccessRequest> requests = accessRequestRepository.findByFileId(fileId);

            Map<String, Object> response = new HashMap<>();
            response.put("fileId", fileId);
            response.put("fileName", file.getFileName());
            response.put("owner", file.getOwner().getEmail());
            response.put("isPublic", file.isPublic());
            response.put("requestsCount", requests.size());
            response.put("requests", requests);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint pour voir toutes les demandes
    @GetMapping("/debug/all-requests")
    public ResponseEntity<?> getAllRequests() {
        try {
            List<AccessRequest> allRequests = accessRequestRepository.findAll();

            Map<String, Object> response = new HashMap<>();
            response.put("totalRequests", allRequests.size());
            response.put("requests", allRequests);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/others-private-with-status")
    public ResponseEntity<?> getOthersPrivateFilesWithStatus(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User currentUser = userService.findByEmail(userDetails.getUsername());
            List<Map<String, Object>> filesWithStatus = fileService.getAllOthersPrivateFilesWithStatus(currentUser);
            return ResponseEntity.ok(filesWithStatus);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error fetching private files: " + e.getMessage()));
        }
    }


}