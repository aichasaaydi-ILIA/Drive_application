package com.ApplicationGoogleDrive.service;

import com.ApplicationGoogleDrive.model.*;
import com.ApplicationGoogleDrive.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FileService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    private final Path rootLocation = Paths.get("uploads");

    @Transactional
    public File saveFile(MultipartFile file, String description, boolean isPublic, User owner) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

        if (!Files.exists(rootLocation)) {
            Files.createDirectories(rootLocation);
        }

        Files.copy(file.getInputStream(), rootLocation.resolve(uniqueFilename));

        File fileEntity = new File();
        fileEntity.setFileName(originalFilename);
        fileEntity.setFileType(file.getContentType());
        fileEntity.setFilePath(uniqueFilename);
        fileEntity.setFileSize(file.getSize());
        fileEntity.setDescription(description);
        fileEntity.setPublic(isPublic);
        fileEntity.setOwner(owner);

        return fileRepository.save(fileEntity);
    }

    public List<File> getFilesByOwner(User owner) {
        return fileRepository.findByOwner(owner);
    }

    public List<File> getPublicFiles() {
        return fileRepository.findByIsPublicTrue();
    }

    // Fichiers privés d'autres utilisateurs (pour demander l'accès)
    public List<File> getOthersPrivateFiles(User currentUser) {
        return fileRepository.findAllOthersPrivateFiles(currentUser.getId());
    }

    public List<File> getVisibleFiles(User user) {
        if (user == null) {
            return getPublicFiles();
        }
        return fileRepository.findVisibleFiles(user.getId());
    }

    public File getFileWithAccessCheck(Long fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + fileId));

        if (user == null) {
            if (file.isPublic()) {
                return file;
            } else {
                throw new RuntimeException("Access denied. This file is private.");
            }
        }

        if (file.getOwner().getId().equals(user.getId())) {
            return file;
        }

        if (file.isPublic()) {
            return file;
        }

        boolean hasAccess = checkUserAccessToFile(fileId, user.getId());
        if (hasAccess) {
            return file;
        }

        throw new RuntimeException("Access denied. You need to request access to this file.");
    }

    public boolean checkUserAccessToFile(Long fileId, Long userId) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (file.getOwner().getId().equals(userId) || file.isPublic()) {
            return true;
        }

        return accessRequestRepository.findByFileIdAndRequesterId(fileId, userId)
                .map(request -> request.getStatus() == AccessRequest.RequestStatus.APPROVED)
                .orElse(false);
    }

    public byte[] getFileContent(Long fileId, User user) throws IOException {
        File file = getFileWithAccessCheck(fileId, user);
        Path filePath = rootLocation.resolve(file.getFilePath());

        if (!Files.exists(filePath)) {
            throw new RuntimeException("File not found on disk");
        }

        return Files.readAllBytes(filePath);
    }

    @Transactional
    public void deleteFile(Long fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You are not the owner of this file");
        }

        try {
            List<AccessRequest> requests = accessRequestRepository.findByFile(file);
            accessRequestRepository.deleteAll(requests);
            Files.deleteIfExists(rootLocation.resolve(file.getFilePath()));
            fileRepository.delete(file);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + e.getMessage());
        }
    }

    public boolean canUserViewFile(Long fileId, User user) {
        try {
            getFileWithAccessCheck(fileId, user);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean canUserRequestAccess(Long fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (file.getOwner().getId().equals(user.getId())) {
            return false;
        }

        if (file.isPublic()) {
            return false;
        }

        Optional<AccessRequest> existingRequest = accessRequestRepository
                .findByFileIdAndRequesterId(fileId, user.getId());

        if (existingRequest.isPresent()) {
            AccessRequest request = existingRequest.get();
            if (request.getStatus() == AccessRequest.RequestStatus.PENDING) {
                return false;
            }
            if (request.getStatus() == AccessRequest.RequestStatus.APPROVED) {
                return false;
            }
            if (request.getStatus() == AccessRequest.RequestStatus.REJECTED) {
                return true;
            }
        }

        return true;
    }

    // NOUVELLE MÉTHODE: Obtenir les fichiers privés d'autres utilisateurs avec statut
    public List<Map<String, Object>> getAllOthersPrivateFilesWithStatus(User currentUser) {
        List<File> allOthersPrivateFiles = fileRepository.findAllOthersPrivateFiles(currentUser.getId());
        List<Map<String, Object>> filesWithStatus = new ArrayList<>();

        for (File file : allOthersPrivateFiles) {
            Map<String, Object> fileInfo = new HashMap<>();
            fileInfo.put("id", file.getId());
            fileInfo.put("fileName", file.getFileName());
            fileInfo.put("description", file.getDescription());
            fileInfo.put("fileSize", file.getFileSize());
            fileInfo.put("fileType", file.getFileType());
            fileInfo.put("uploadedAt", file.getUploadedAt());
            fileInfo.put("ownerEmail", file.getOwner().getEmail());
            fileInfo.put("ownerName", file.getOwner().getFirstName() + " " + file.getOwner().getLastName());
            fileInfo.put("isPublic", false);
            fileInfo.put("isOwner", false);

            // Vérifier le statut de la demande
            Optional<AccessRequest> existingRequest = accessRequestRepository
                    .findByFileIdAndRequesterId(file.getId(), currentUser.getId());

            if (existingRequest.isPresent()) {
                AccessRequest request = existingRequest.get();
                fileInfo.put("hasRequested", true);
                fileInfo.put("requestStatus", request.getStatus().toString());
                fileInfo.put("requestId", request.getId());
                fileInfo.put("requestMessage", request.getMessage());
                fileInfo.put("requestedAt", request.getRequestedAt());

                if (request.getStatus() == AccessRequest.RequestStatus.APPROVED) {
                    fileInfo.put("hasAccess", true);
                    fileInfo.put("canDownload", true);
                    fileInfo.put("canRequest", false);
                } else if (request.getStatus() == AccessRequest.RequestStatus.PENDING) {
                    fileInfo.put("hasAccess", false);
                    fileInfo.put("canDownload", false);
                    fileInfo.put("canRequest", false);
                } else {
                    fileInfo.put("hasAccess", false);
                    fileInfo.put("canDownload", false);
                    fileInfo.put("canRequest", true);
                }
            } else {
                fileInfo.put("hasRequested", false);
                fileInfo.put("hasAccess", false);
                fileInfo.put("canDownload", false);
                fileInfo.put("canRequest", true);
                fileInfo.put("requestStatus", "NO_REQUEST");
            }

            filesWithStatus.add(fileInfo);
        }

        return filesWithStatus;
    }

    // Méthode pour voir les fichiers disponibles pour demande d'accès
    public List<File> getFilesForAccessRequest(User currentUser) {
        return fileRepository.findOthersPrivateFiles(currentUser.getId());
    }
}